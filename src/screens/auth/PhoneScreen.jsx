import React, { useState, useContext, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert, // Keep native Alert for simplicity
    Dimensions,
} from 'react-native';
// 💡 Import React Native Paper components
import {
    TextInput,
    Button,
    Text,
    ActivityIndicator,
    useTheme as usePaperTheme, // To access RNP theme defaults if needed
} from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from '../../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

// --- Constants ---
const { width } = Dimensions.get('window');
const COLLECTIONS = { USERS: 'users' };
const USER_ROLES = { USER: 'user', ADMIN: 'admin', SUPERADMIN: 'superadmin' };
const OTP_LENGTH = 6;

export default function PhoneAuthScreen() {
    const { theme } = useContext(ThemeContext); // Custom theme hook
    const paperTheme = usePaperTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [step, setStep] = useState('phone');
    const [loading, setLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [confirmation, setConfirmation] = useState(null);
    const [otp, setOtp] = useState('');
    const [userName, setUserName] = useState('');
    // ⬇️ UPDATED STATES FOR ONBOARDING
    const [userEmail, setUserEmail] = useState('');
    const [addressLine, setAddressLine] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');

    const otpInputRef = useRef(null);

    // Color definitions using both custom and RNP theme fallback
    const primaryColor = theme.colors.primary || paperTheme.colors.primary;
    const accentColor = theme.colors.accent || paperTheme.colors.accent;
    const textColor = theme.colors.text || paperTheme.colors.onSurface;
    const textSecondaryColor = theme.colors.textSecondary || paperTheme.colors.onSurfaceVariant;


    // Auto-focus OTP input when stepping to OTP screen
    useEffect(() => {
        if (step === 'otp') {
            const timer = setTimeout(() => {
                otpInputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [step]);

    // --- Authentication Functions (Logic remains mostly the same) ---
    const sendOtp = async () => {
        const cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
        if (cleanedNumber.length !== 10) return Alert.alert('Invalid Number', 'Please enter a 10-digit phone number.');

        setLoading(true);
        try {
            const fullNumber = `+91${cleanedNumber}`;
            const confirm = await auth().signInWithPhoneNumber(fullNumber);
            setConfirmation(confirm);
            setStep('otp');
            Alert.alert('OTP Sent', `OTP has been sent to ${fullNumber}.`);
        } catch (err) {
            console.error(err);
            Alert.alert('Authentication Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async () => {
        if (otp.trim().length !== OTP_LENGTH) return Alert.alert('Error', `Please enter the ${OTP_LENGTH}-digit OTP.`);
        setLoading(true);

        try {
            const credential = await confirmation.confirm(otp);
            const firebaseUser = credential.user;
            const userDoc = await firestore().collection(COLLECTIONS.USERS).doc(firebaseUser.uid).get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                const hasRole = userData && userData.role;
                const hasEmail = userData && userData.email;
                // Check if address is complete (presence of addressLine is a good proxy, but we'll check all fields during saving)
                const hasAddress = userData && userData.address && userData.address.addressLine && userData.address.city && userData.address.state && userData.address.country;

                if (hasRole && hasEmail && hasAddress) {
                    // Existing user with all required fields
                    redirectByRole(userData.role);
                } else if (!hasEmail) {
                    // Existing user missing email
                    setUserEmail(userData?.email || firebaseUser.email || '');
                    setStep('email');
                } else if (!hasAddress) {
                    // Existing user missing address, pre-fill if partial data exists
                    setAddressLine(userData?.address?.addressLine || '');
                    setCity(userData?.address?.city || '');
                    setState(userData?.address?.state || '');
                    setCountry(userData?.address?.country || '');
                    setStep('fullAddress'); // 💡 NEW STEP NAME
                } else if (!hasRole) {
                    // Existing user missing role, proceed to name setup
                    setStep('name');
                }

            } else {
                // New user, proceed to initial setup (name is the first new user step in the original code, but we'll use email first as it's often simpler)
                setStep('email'); // Start new user flow with Email
            }

        } catch (err) {
            console.error("OTP Verification Error:", err);
            Alert.alert('Verification Failed', 'The OTP is invalid or has expired. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ⬇️ FUNCTION: Save Email
    const saveUserEmail = async () => {
        if (!userEmail.trim() || !userEmail.includes('@')) {
            return Alert.alert('Error', 'Please enter a valid email address.');
        }
        setLoading(true);
        try {
            const firebaseUser = auth().currentUser;
            if (!firebaseUser) throw new Error('Authentication session lost.');

            await firestore().collection(COLLECTIONS.USERS).doc(firebaseUser.uid).set(
                { email: userEmail.trim().toLowerCase(), updatedAt: firestore.FieldValue.serverTimestamp() },
                { merge: true }
            );

            // Move to full address collection
            const userDoc = await firestore().collection(COLLECTIONS.USERS).doc(firebaseUser.uid).get();
            const userData = userDoc.data();
            const hasAddress = userData && userData.address && userData.address.addressLine;

            // Check if address is complete before setting state for fullAddress step
            if (!hasAddress) {
                setStep('fullAddress');
            } else {
                // If they have address but not name/role (e.g., they partially onboarded before)
                if (!userData.role) {
                    setStep('name');
                } else {
                    redirectByRole(userData.role);
                }
            }


        } catch (err) {
            console.error("Email Save Error:", err);
            Alert.alert('Update Error', 'Failed to save email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ⬇️ NEW FUNCTION: Save Full Address
    const saveFullAddress = async () => {
        if (!addressLine.trim() || !city.trim() || !state.trim() || !country.trim()) {
            return Alert.alert('Missing Field', 'Please fill in all address fields (Address Line, City, State, Country) to continue.');
        }
        setLoading(true);
        try {
            const firebaseUser = auth().currentUser;
            if (!firebaseUser) throw new Error('Authentication session lost.');

            const addressData = {
                address: {
                    addressLine: addressLine.trim(),
                    city: city.trim(),
                    state: state.trim(),
                    country: country.trim(),
                    // Optionally add geo location here if you collect it later
                },
                updatedAt: firestore.FieldValue.serverTimestamp(),
            };

            await firestore().collection(COLLECTIONS.USERS).doc(firebaseUser.uid).set(
                addressData,
                { merge: true }
            );

            // Now move to name/role setup (original 'name' step logic)
            const userDoc = await firestore().collection(COLLECTIONS.USERS).doc(firebaseUser.uid).get();
            const userData = userDoc.data();

            if (!userData.role) {
                setStep('name'); // Move to name setup
            } else {
                redirectByRole(userData.role); // Finish setup
            }

        } catch (err) {
            console.error("Address Save Error:", err);
            Alert.alert('Update Error', 'Failed to save address. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    // 🔄 MODIFIED FUNCTION: Simplified as email and address are collected before this
    const saveUser = async () => {
        if (!userName.trim()) return Alert.alert('Error', 'Please enter your name.');
        setLoading(true);
        try {
            const firebaseUser = auth().currentUser;
            if (!firebaseUser) {
                setLoading(false);
                return Alert.alert('Error', 'Authentication session lost. Please restart the process.');
            }

            // Fetch existing data (which should now include email and address from previous steps)
            const userDoc = await firestore().collection(COLLECTIONS.USERS).doc(firebaseUser.uid).get();
            const existingData = userDoc.data() || {};

            const userData = {
                uid: firebaseUser.uid,
                email: existingData.email || firebaseUser.email || null,
                address: existingData.address || null,
                role: USER_ROLES.USER, // Default role for new signups
                name: userName.trim(),
                notificationPreferences: existingData.notificationPreferences || { push: false, email: false },
                createdAt: existingData.createdAt || firestore.FieldValue.serverTimestamp(),
                phone: firebaseUser.phoneNumber,
                updatedAt: firestore.FieldValue.serverTimestamp(),
            };

            await firestore().collection(COLLECTIONS.USERS).doc(firebaseUser.uid).set(userData, { merge: true });
            redirectByRole(USER_ROLES.USER);
        } catch (err) {
            console.error(err);
            Alert.alert('Registration Error', 'Failed to complete registration. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const redirectByRole = (role) => {
        switch (role) {
            case USER_ROLES.USER:
                navigation.reset({ index: 0, routes: [{ name: 'user' }] });
                break;
            case USER_ROLES.ADMIN:
                navigation.reset({ index: 0, routes: [{ name: 'admin' }] });
                break;
            case USER_ROLES.SUPERADMIN:
                navigation.reset({ index: 0, routes: [{ name: 'superAdmin' }] });
                break;
            default:
                navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }
    };

    // Helper to generate the visual OTP boxes (Custom Grid) - Unchanged
    const renderOtpInputs = () => {
        const digits = otp.split('');
        const inputs = Array(OTP_LENGTH).fill(0).map((_, index) => {
            const isActive = index === digits.length;
            const isFilled = index < digits.length;

            return (
                <View
                    key={index}
                    style={[
                        styles.otpDigit,
                        {
                            borderColor: isActive ? primaryColor : (isFilled ? accentColor : theme.colors.border),
                            backgroundColor: isActive ? theme.colors.card : theme.colors.background
                        }
                    ]}
                >
                    <Text style={[styles.otpText, { color: textColor }]}>
                        {digits[index] || ''}
                    </Text>
                </View>
            );
        });

        return (
            <View style={styles.otpVisualInput}>
                {inputs}
                {/* Hidden RNP TextInput overlaid to handle actual input */}
                <TextInput
                    ref={otpInputRef}
                    style={styles.hiddenInput}
                    value={otp}
                    onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH))}
                    keyboardType="number-pad"
                    maxLength={OTP_LENGTH}
                    editable={!loading}
                    autoFocus={step === 'otp'}
                    caretHidden={true}
                    mode="flat"
                    underlineColor="transparent"
                    activeUnderlineColor="transparent"
                />
            </View>
        );
    };

    // --- Render Content based on Step ---
    const renderContent = () => {
        switch (step) {
            case 'phone':
                return (
                    <>
                        <Text variant="bodyLarge" style={[styles.label, { color: textSecondaryColor }]}>
                            Enter your 10-digit phone number
                        </Text>
                        <TextInput
                            label="Phone Number"
                            value={phoneNumber}
                            onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, '').slice(0, 10))}
                            mode="outlined"
                            style={styles.rnpInput}
                            keyboardType="phone-pad"
                            maxLength={10}
                            editable={!loading}
                            left={
                                <TextInput.Affix
                                    text="+91"
                                    textStyle={{ color: textColor, fontWeight: 'bold' }}
                                />
                            }
                        />
                    </>
                );
            case 'otp':
                return (
                    <>
                        <Text variant="bodyLarge" style={[styles.label, styles.centerText, { color: textSecondaryColor, marginBottom: 10 }]}>
                            We've sent a {OTP_LENGTH}-digit code to **+91{phoneNumber}**
                        </Text>
                        <Text variant="bodyMedium" style={[styles.centerText, { color: textSecondaryColor, marginBottom: 20 }]}>
                            Please check your SMS.
                        </Text>
                        {renderOtpInputs()}
                        <Button
                            mode="text"
                            onPress={() => Alert.alert('Resend Code', 'Functionality to resend code goes here.')}
                            disabled={loading}
                            style={styles.resendButton}
                            labelStyle={{ color: accentColor, fontWeight: '700' }}
                        >
                            Resend Code in 0:59
                        </Button>
                        <Button
                            mode="text"
                            onPress={() => setStep('phone')}
                            disabled={loading}
                            style={styles.resendButton}
                            labelStyle={{ color: textSecondaryColor, fontSize: 14 }}
                        >
                            Change Phone Number?
                        </Button>
                    </>
                );
            // ⬇️ STEP: Collect Email
            case 'email':
                return (
                    <>
                        <Text variant="bodyLarge" style={[styles.label, styles.centerText, { color: textSecondaryColor }]}>
                            Please provide your email for important updates.
                        </Text>
                        <TextInput
                            label="Email Address"
                            value={userEmail}
                            onChangeText={setUserEmail}
                            mode="outlined"
                            style={styles.rnpInput}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoFocus={true}
                            editable={!loading}
                            left={
                                <TextInput.Icon
                                    icon="email-outline"
                                    color={textSecondaryColor}
                                />
                            }
                        />
                    </>
                );

            // ⬇️ NEW STEP: Collect Full Address
            case 'fullAddress':
                return (
                    <>
                        <Text variant="bodyLarge" style={[styles.label, styles.centerText, { color: textSecondaryColor }]}>
                            Please enter your full address for delivery purposes.
                        </Text>
                        <TextInput
                            label="Address Line (Flat, Street, Area)"
                            value={addressLine}
                            onChangeText={setAddressLine}
                            mode="outlined"
                            style={styles.rnpInput}
                            keyboardType="default"
                            autoFocus={true}
                            editable={!loading}
                            multiline={true}
                            numberOfLines={2}
                        />
                        <View style={styles.inlineInputs}>
                            <TextInput
                                label="City"
                                value={city}
                                onChangeText={setCity}
                                mode="outlined"
                                style={[styles.rnpInput, styles.halfInput]}
                                keyboardType="default"
                                editable={!loading}
                            />
                            <TextInput
                                label="State"
                                value={state}
                                onChangeText={setState}
                                mode="outlined"
                                style={[styles.rnpInput, styles.halfInput]}
                                keyboardType="default"
                                editable={!loading}
                            />
                        </View>
                        <TextInput
                            label="Country"
                            value={country}
                            onChangeText={setCountry}
                            mode="outlined"
                            style={styles.rnpInput}
                            keyboardType="default"
                            editable={!loading}
                        />
                    </>
                );

            case 'name':
                return (
                    <>
                        <Text variant="bodyLarge" style={[styles.label, styles.centerText, { color: textSecondaryColor }]}>
                            Welcome! What should we call you?
                        </Text>
                        <TextInput
                            label="Your Full Name"
                            value={userName}
                            onChangeText={setUserName}
                            mode="outlined"
                            style={styles.rnpInput}
                            keyboardType="default"
                            autoFocus={true}
                            editable={!loading}
                            left={
                                <TextInput.Icon
                                    icon="account-outline"
                                    color={textSecondaryColor}
                                />
                            }
                        />
                    </>
                );
            default:
                return null;
        }
    };

    // 🔄 MODIFIED FUNCTION: Helper functions for the main action button
    const getButtonAction = () => {
        switch (step) {
            case 'phone': return () => sendOtp();
            case 'otp': return () => verifyOtp();
            case 'email': return () => saveUserEmail();
            case 'fullAddress': return () => saveFullAddress(); // 💡 NEW ACTION
            case 'name': return () => saveUser();
            default: return () => { };
        }
    };

    // 🔄 MODIFIED FUNCTION: Helper function for button text
    const getButtonText = () => {
        switch (step) {
            case 'phone': return 'Send OTP';
            case 'otp': return 'Verify & Continue';
            case 'email': return 'Save Email & Continue';
            case 'fullAddress': return 'Save Address & Continue'; // 💡 NEW TEXT
            case 'name': return 'Complete Profile';
            default: return 'Next';
        }
    };

    // 🔄 MODIFIED FUNCTION: Helper function for the main title
    const getTitleText = () => {
        switch (step) {
            case 'phone': return 'Secure Login';
            case 'otp': return 'One-Time Passcode';
            case 'email': return 'Email Collection';
            case 'fullAddress': return 'Shipping Address'; // 💡 NEW TEXT
            case 'name': return 'Profile Setup';
            default: return 'Login';
        }
    };

    // 🔄 MODIFIED FUNCTION: Helper function for the subtitle
    const getSubtitleText = () => {
        switch (step) {
            case 'phone': return 'Log in or sign up with your phone number.';
            case 'otp': return 'Please check your SMS for the code.';
            case 'email': return 'This helps with order confirmations and account security.';
            case 'fullAddress': return 'We need your complete address for delivery services.'; // 💡 NEW TEXT
            case 'name': return 'Just one more step to start using the app!';
            default: return '';
        }
    };


    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Visual Element */}
                <View style={styles.visualContainer}>
                    <Ionicons name="finger-print-outline" size={80} color={primaryColor} />
                </View>

                {/* Text Header - Using RNP Text components */}
                <View style={styles.headerContainer}>
                    <Text variant="headlineLarge" style={[styles.title, { color: textColor }]}>
                        {getTitleText()}
                    </Text>
                    <Text variant="bodyLarge" style={[styles.subtitle, { color: textSecondaryColor }]}>
                        {getSubtitleText()}
                    </Text>
                </View>

                {/* Main Content */}
                <View style={[styles.contentWrapper]}>
                    {renderContent()}
                </View>

            </ScrollView>

            {/* Floating/Fixed Bottom Button - Using RNP Button */}
            <View style={[styles.floatingButtonContainer, { paddingBottom: insets.bottom + 20 }]}>
                <Button
                    mode="contained"
                    onPress={getButtonAction()}
                    loading={loading}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                    disabled={loading}
                    labelStyle={styles.buttonText}
                >
                    {getButtonText()}
                </Button>
                {/* Link to go back to regular Login */}
                <Button
                    mode="text"
                    onPress={() => navigation.navigate('login')}
                    compact
                    style={{ marginTop: 10, alignSelf: 'center' }}
                    labelStyle={{ fontSize: 14 }}
                >
                    Use Email/Password Login
                </Button>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 25,
        paddingTop: 50,
        paddingBottom: 150, // Space for the floating button
    },
    visualContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    headerContainer: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    contentWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    label: {
        marginBottom: 10,
        fontWeight: '600',
        alignSelf: 'flex-start', // Align label left
    },
    centerText: {
        textAlign: 'center',
    },
    // RNP TextInput styling
    rnpInput: {
        width: '100%',
        marginBottom: 20,
    },
    // 💡 NEW STYLE: For side-by-side inputs
    inlineInputs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    halfInput: {
        width: '48%',
        marginBottom: 20,
    },
    // --- Custom OTP Grid Styles (unchanged) ---
    otpVisualInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 30,
        height: 60,
        position: 'relative',
        width: '100%',
    },
    otpDigit: {
        width: width / (OTP_LENGTH + 2), // Dynamic width to fit 6 boxes with padding
        height: 60,
        borderRadius: 10,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    otpText: {
        fontSize: 24,
        fontWeight: '700',
    },
    hiddenInput: {
        // Overlay the entire area to capture input
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        opacity: 0, // Make it invisible
        fontSize: 1,
        height: '100%',
    },
    // --- End Custom OTP Grid Styles ---
    floatingButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 25,
        paddingTop: 10,
    },
    button: {
        borderRadius: 12,
        height: 60,
        justifyContent: 'center',
        elevation: 4,
    },
    buttonContent: {
        paddingVertical: 4,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    resendButton: {
        padding: 5,
        marginTop: 5,
        alignSelf: 'center',
    },
});