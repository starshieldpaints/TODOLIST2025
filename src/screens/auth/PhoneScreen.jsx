// import React, { useState, useContext } from 'react';
// import {
//     View,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     ActivityIndicator,
//     KeyboardAvoidingView,
//     Platform,
//     ScrollView,
//     StyleSheet,
//     Alert,
// } from 'react-native';
// import auth from '@react-native-firebase/auth';
// import firestore from '@react-native-firebase/firestore';
// import { useNavigation } from '@react-navigation/native';
// import { ThemeContext } from '../../context/ThemeContext';

// const COLLECTIONS = { USERS: 'users' };
// const USER_ROLES = { USER: 'user', ADMIN: 'admin', SUPERADMIN: 'superadmin' };
// const DEFAULT_ADMIN_ID = 'MWtoCbA37jWTJKYa6yUsdDpIdd43';

// export default function PhoneAuthScreen() {
//     const { theme } = useContext(ThemeContext); // 🔹 Use theme
//     const navigation = useNavigation();

//     const [step, setStep] = useState('phone');
//     const [loading, setLoading] = useState(false);
//     const [phoneNumber, setPhoneNumber] = useState('');
//     const [confirmation, setConfirmation] = useState(null);
//     const [otp, setOtp] = useState('');
//     const [userName, setUserName] = useState('');

//     const sendOtp = async () => {
//         if (!phoneNumber.trim()) return Alert.alert('Error', 'Enter your phone number');
//         setLoading(true);
//         try {
//             const confirm = await auth().signInWithPhoneNumber(`+91${phoneNumber}`);
//             setConfirmation(confirm);
//             setStep('otp');
//         } catch (err) {
//             console.error(err);
//             Alert.alert('Error', err.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const verifyOtp = async () => {
//         if (!otp.trim()) return Alert.alert('Error', 'Enter OTP');
//         setLoading(true);
//         try {
//             const credential = await confirmation.confirm(otp);
//             const firebaseUser = credential.user;
//             const userDoc = await firestore().collection(COLLECTIONS.USERS).doc(firebaseUser.uid).get();
//             if (userDoc.exists) {
//                 const { role } = userDoc.data();
//                 redirectByRole(role);
//             } else {
//                 setStep('name');
//             }
//         } catch (err) {
//             console.error(err);
//             Alert.alert('Error', 'Invalid OTP');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const saveUser = async () => {
//         if (!userName.trim()) return Alert.alert('Error', 'Enter your name');
//         setLoading(true);
//         try {
//             const firebaseUser = auth().currentUser;
//             if (!firebaseUser) return Alert.alert('Error', 'User not found');

//             const userData = {
//                 uid: firebaseUser.uid,
//                 email: firebaseUser.email || '',
//                 role: USER_ROLES.USER,
//                 name: userName.trim(),
//                 adminId: DEFAULT_ADMIN_ID,
//                 notificationPreferences: { push: true, email: false },
//                 createdAt: firestore.FieldValue.serverTimestamp(),
//                 phone: firebaseUser.phoneNumber,
//             };

//             await firestore().collection(COLLECTIONS.USERS).doc(firebaseUser.uid).set(userData);
//             redirectByRole(USER_ROLES.USER);
//         } catch (err) {
//             console.error(err);
//             Alert.alert('Error', 'Failed to save user');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const redirectByRole = (role) => {
//         switch (role) {
//             case USER_ROLES.USER:
//                 navigation.reset({ index: 0, routes: [{ name: 'user' }] });
//                 break;
//             case USER_ROLES.ADMIN:
//                 navigation.reset({ index: 0, routes: [{ name: 'admin' }] });
//                 break;
//             case USER_ROLES.SUPERADMIN:
//                 navigation.reset({ index: 0, routes: [{ name: 'superAdmin' }] });
//                 break;
//             default:
//                 navigation.reset({ index: 0, routes: [{ name: 'phoneAuth' }] });
//         }
//     };

//     return (
//         <KeyboardAvoidingView
//             style={[styles.container, { backgroundColor: theme.colors.background }]}
//             behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//         >
//             <ScrollView contentContainerStyle={styles.scrollContainer}>
//                 <View style={[styles.box, { backgroundColor: theme.colors.card }]}>
//                     <Text style={[styles.title, { color: '#FF0000' }]}>Task Manager</Text>
//                     <Text style={[styles.subtitle, { color: '#88C540' }]}>Login / Signup with Phone</Text>

//                     {step === 'phone' && (
//                         <>
//                             <TextInput
//                                 style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.primary, color: theme.colors.text }]}
//                                 value={phoneNumber}
//                                 onChangeText={setPhoneNumber}
//                                 placeholder="Enter phone number"
//                                 placeholderTextColor={theme.colors.border}
//                                 keyboardType="phone-pad"
//                                 maxLength={10}
//                             />
//                             <TouchableOpacity style={[styles.button, { backgroundColor: '#FF0000' }]} onPress={sendOtp} disabled={loading}>
//                                 {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Send OTP</Text>}
//                             </TouchableOpacity>
//                         </>
//                     )}

//                     {step === 'otp' && (
//                         <>
//                             <TextInput
//                                 style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.primary, color: theme.colors.text }]}
//                                 value={otp}
//                                 onChangeText={setOtp}
//                                 placeholder="Enter OTP"
//                                 placeholderTextColor={theme.colors.border}
//                                 keyboardType="number-pad"
//                                 maxLength={6}
//                             />
//                             <TouchableOpacity style={[styles.button, { backgroundColor: '#FF0000' }]} onPress={verifyOtp} disabled={loading}>
//                                 {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
//                             </TouchableOpacity>
//                         </>
//                     )}

//                     {step === 'name' && (
//                         <>
//                             <TextInput
//                                 style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.primary, color: theme.colors.text }]}
//                                 value={userName}
//                                 onChangeText={setUserName}
//                                 placeholder="Enter your name"
//                                 placeholderTextColor={theme.colors.border}
//                             />
//                             <TouchableOpacity style={[styles.button, { backgroundColor: '#FF0000' }]} onPress={saveUser} disabled={loading}>
//                                 {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Complete Registration</Text>}
//                             </TouchableOpacity>
//                         </>
//                     )}
//                 </View>
//             </ScrollView>
//         </KeyboardAvoidingView>
//     );
// }

// const styles = StyleSheet.create({
//     container: { flex: 1 },
//     scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
//     box: { borderRadius: 12, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 5 },
//     title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
//     subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
//     input: { borderWidth: 1, borderRadius: 8, padding: 16, marginBottom: 16 },
//     button: { borderRadius: 8, padding: 16, alignItems: 'center' },
//     buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
// });












// import React, { useState, useContext, useRef, useEffect } from 'react';
// import {
//     View,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     ActivityIndicator,
//     KeyboardAvoidingView,
//     Platform,
//     ScrollView,
//     StyleSheet,
//     Alert,
//     Dimensions,
// } from 'react-native';
// import auth from '@react-native-firebase/auth';
// import firestore from '@react-native-firebase/firestore';
// import { useNavigation } from '@react-navigation/native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { ThemeContext } from '../../context/ThemeContext';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// // --- Constants ---
// const { width } = Dimensions.get('window');
// const COLLECTIONS = { USERS: 'users' };
// const USER_ROLES = { USER: 'user', ADMIN: 'admin', SUPERADMIN: 'superadmin' };
// const DEFAULT_ADMIN_ID = 'MWtoCbA37jWTJKYa6yUsdDpIdd43';
// const OTP_LENGTH = 6; // Define OTP length for validation and display

// export default function PhoneAuthScreen() {
//     const { theme } = useContext(ThemeContext);
//     const navigation = useNavigation();
//     const insets = useSafeAreaInsets();

//     const [step, setStep] = useState('phone');
//     const [loading, setLoading] = useState(false);
//     const [phoneNumber, setPhoneNumber] = useState('');
//     const [confirmation, setConfirmation] = useState(null);
//     const [otp, setOtp] = useState('');
//     const [userName, setUserName] = useState('');

//     const otpInputRef = useRef(null); // Ref to manually focus OTP input

//     const primaryColor = theme.colors.primary || '#4A90E2';
//     const accentColor = theme.colors.accent || '#88C540';
//     const cardColor = theme.dark ? theme.colors.card : '#FFFFFF';
//     const textColor = theme.colors.text;
//     const textSecondaryColor = theme.colors.textSecondary;

//     // Auto-focus OTP input when stepping to OTP screen
//     useEffect(() => {
//         if (step === 'otp') {
//             const timer = setTimeout(() => {
//                 otpInputRef.current?.focus();
//             }, 100);
//             return () => clearTimeout(timer);
//         }
//     }, [step]);

//     // --- Authentication Functions ---
//     const sendOtp = async () => {
//         const cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
//         if (cleanedNumber.length !== 10) return Alert.alert('Invalid Number', 'Please enter a 10-digit phone number.');

//         setLoading(true);
//         try {
//             const fullNumber = `+91${cleanedNumber}`;
//             const confirm = await auth().signInWithPhoneNumber(fullNumber);
//             setConfirmation(confirm);
//             setStep('otp');
//             Alert.alert('OTP Sent', `OTP has been sent to ${fullNumber}.`);
//         } catch (err) {
//             console.error(err);
//             Alert.alert('Authentication Error', err.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const verifyOtp = async () => {
//         if (otp.trim().length !== OTP_LENGTH) return Alert.alert('Error', `Please enter the ${OTP_LENGTH}-digit OTP.`);
//         setLoading(true);

//         try {
//             const credential = await confirmation.confirm(otp);
//             const firebaseUser = credential.user;

//             // Fetch the user document
//             const userDoc = await firestore().collection(COLLECTIONS.USERS).doc(firebaseUser.uid).get();

//             if (userDoc.exists) {
//                 const userData = userDoc.data();

//                 // ⭐️ FIX APPLIED HERE: Robust check for userData and userData.role ⭐️
//                 if (userData && userData.role) {
//                     const { role } = userData;
//                     redirectByRole(role);
//                 } else {
//                     // Document exists but is empty or corrupt (missing role), treat as new user flow
//                     console.warn("User document exists but is missing 'role' or data is empty.", userData);
//                     setStep('name');
//                 }
//             } else {
//                 // User document does not exist, proceed to registration step
//                 setStep('name');
//             }

//         } catch (err) {
//             console.error("OTP Verification Error:", err);
//             Alert.alert('Verification Failed', 'The OTP is invalid or has expired. Please try again.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const saveUser = async () => {
//         if (!userName.trim()) return Alert.alert('Error', 'Please enter your name.');
//         setLoading(true);
//         try {
//             const firebaseUser = auth().currentUser;
//             if (!firebaseUser) {
//                 setLoading(false);
//                 return Alert.alert('Error', 'Authentication session lost. Please restart the process.');
//             }

//             const userData = {
//                 uid: firebaseUser.uid,
//                 email: firebaseUser.email || null,
//                 role: USER_ROLES.USER,
//                 name: userName.trim(),
//                 adminId: DEFAULT_ADMIN_ID,
//                 notificationPreferences: { push: true, email: false },
//                 createdAt: firestore.FieldValue.serverTimestamp(),
//                 phone: firebaseUser.phoneNumber,
//             };

//             await firestore().collection(COLLECTIONS.USERS).doc(firebaseUser.uid).set(userData);
//             redirectByRole(USER_ROLES.USER);
//         } catch (err) {
//             console.error(err);
//             Alert.alert('Registration Error', 'Failed to complete registration. Please try again.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const redirectByRole = (role) => {
//         switch (role) {
//             case USER_ROLES.USER:
//                 navigation.reset({ index: 0, routes: [{ name: 'user' }] });
//                 break;
//             case USER_ROLES.ADMIN:
//                 navigation.reset({ index: 0, routes: [{ name: 'admin' }] });
//                 break;
//             case USER_ROLES.SUPERADMIN:
//                 navigation.reset({ index: 0, routes: [{ name: 'superadmin' }] });
//                 break;
//             default:
//                 navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
//         }
//     };

//     // Helper to generate the visual OTP boxes
//     const renderOtpInputs = () => {
//         const digits = otp.split('');
//         const inputs = Array(OTP_LENGTH).fill(0).map((_, index) => {
//             const isActive = index === digits.length;
//             const isFilled = index < digits.length;

//             return (
//                 <View
//                     key={index}
//                     style={[
//                         styles.otpDigit,
//                         {
//                             borderColor: isActive ? primaryColor : (isFilled ? accentColor : theme.colors.border),
//                             backgroundColor: isActive ? theme.colors.card : theme.colors.background
//                         }
//                     ]}
//                 >
//                     <Text style={[styles.otpText, { color: textColor }]}>
//                         {digits[index] || ''}
//                     </Text>
//                 </View>
//             );
//         });

//         return (
//             <View style={styles.otpVisualInput}>
//                 {inputs}
//                 {/* The actual TextInput is positioned absolutely on top */}
//                 <TextInput
//                     ref={otpInputRef}
//                     style={styles.hiddenInput}
//                     value={otp}
//                     onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH))}
//                     keyboardType="number-pad"
//                     maxLength={OTP_LENGTH}
//                     editable={!loading}
//                     autoFocus={step === 'otp'}
//                     caretHidden={true} // Hide the cursor
//                 />
//             </View>
//         );
//     };

//     // --- Render Content based on Step ---
//     const renderContent = () => {
//         switch (step) {
//             case 'phone':
//                 return (
//                     <>
//                         <Text style={[styles.label, { color: textSecondaryColor }]}>Enter your 10-digit phone number</Text>
//                         <View style={[styles.inputGroup, { backgroundColor: cardColor, borderColor: theme.colors.border }]}>
//                             <Text style={[styles.countryCode, { color: textColor, borderRightColor: theme.colors.border }]}>+91</Text>
//                             <TextInput
//                                 style={[styles.input, { color: textColor }]}
//                                 value={phoneNumber}
//                                 onChangeText={setPhoneNumber}
//                                 placeholder="88888 88888"
//                                 placeholderTextColor={theme.colors.placeholder}
//                                 keyboardType="phone-pad"
//                                 maxLength={10}
//                                 editable={!loading}
//                             />
//                         </View>
//                     </>
//                 );
//             case 'otp':
//                 return (
//                     <>
//                         <Text style={[styles.label, styles.centerText, { color: textSecondaryColor }]}>
//                             We've sent a {OTP_LENGTH}-digit code to **+91{phoneNumber}**
//                         </Text>

//                         {/* Custom OTP Grid (Replacing external library) */}
//                         {renderOtpInputs()}

//                         <TouchableOpacity style={styles.resendButton} onPress={() => Alert.alert('Resend Code', 'Functionality to resend code goes here.')} disabled={loading}>
//                             <Text style={[styles.resendText, { color: accentColor }]}>Resend Code in 0:59</Text>
//                         </TouchableOpacity>
//                         <TouchableOpacity style={styles.resendButton} onPress={() => setStep('phone')} disabled={loading}>
//                             <Text style={[styles.changeText, { color: textSecondaryColor }]}>Change Phone Number?</Text>
//                         </TouchableOpacity>
//                     </>
//                 );
//             case 'name':
//                 return (
//                     <>
//                         <Text style={[styles.label, styles.centerText, { color: textSecondaryColor }]}>
//                             Welcome! What should we call you?
//                         </Text>
//                         <TextInput
//                             style={[styles.inputGroup, styles.input, { backgroundColor: cardColor, borderColor: theme.colors.border, color: textColor, paddingHorizontal: 15, width: '100%', }]}
//                             value={userName}
//                             onChangeText={setUserName}
//                             placeholder="Your Full Name"
//                             placeholderTextColor={theme.colors.placeholder}
//                             keyboardType="default"
//                             editable={!loading}
//                         />
//                     </>
//                 );
//             default:
//                 return null;
//         }
//     };

//     const getButtonAction = () => {
//         switch (step) {
//             case 'phone': return sendOtp;
//             case 'otp': return verifyOtp;
//             case 'name': return saveUser;
//             default: return () => { };
//         }
//     };

//     const getButtonText = () => {
//         switch (step) {
//             case 'phone': return 'Send OTP';
//             case 'otp': return 'Verify & Continue';
//             case 'name': return 'Complete Profile';
//             default: return 'Next';
//         }
//     };

//     return (
//         <KeyboardAvoidingView
//             style={[styles.container, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom }]}
//             behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//             keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
//         >
//             <ScrollView
//                 contentContainerStyle={styles.scrollContainer}
//                 keyboardShouldPersistTaps="handled"
//                 showsVerticalScrollIndicator={false}
//             >
//                 {/* Visual Element */}
//                 <View style={styles.visualContainer}>
//                     <Ionicons name="finger-print-outline" size={80} color={primaryColor} />
//                 </View>

//                 {/* Text Header */}
//                 <View style={styles.headerContainer}>
//                     <Text style={[styles.title, { color: textColor }]}>
//                         {step === 'phone' && 'Welcome Back'}
//                         {step === 'otp' && 'One-Time Passcode'}
//                         {step === 'name' && 'Profile Setup'}
//                     </Text>
//                     <Text style={[styles.subtitle, { color: textSecondaryColor }]}>
//                         {step === 'phone' && 'Log in or sign up with your phone number.'}
//                         {step === 'otp' && 'Please check your SMS for the code.'}
//                         {step === 'name' && 'Just one more step to start using the app!'}
//                     </Text>
//                 </View>

//                 {/* Main Content Card */}
//                 <View style={[styles.contentWrapper]}>
//                     {renderContent()}
//                 </View>

//             </ScrollView>

//             {/* Floating/Fixed Bottom Button */}
//             <View style={[styles.floatingButtonContainer, { paddingBottom: insets.bottom + 20 }]}>
//                 <TouchableOpacity
//                     style={[styles.button, { backgroundColor: primaryColor, opacity: loading ? 0.7 : 1 }]}
//                     onPress={getButtonAction()}
//                     disabled={loading}
//                 >
//                     {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>{getButtonText()}</Text>}
//                 </TouchableOpacity>
//             </View>
//         </KeyboardAvoidingView>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//     },
//     scrollContainer: {
//         flexGrow: 1,
//         paddingHorizontal: 25,
//         paddingTop: 50,
//         paddingBottom: 120,
//     },
//     visualContainer: {
//         alignItems: 'center',
//         marginBottom: 30,
//     },
//     headerContainer: {
//         marginBottom: 40,
//     },
//     title: {
//         fontSize: 32,
//         fontWeight: '800',
//         textAlign: 'center',
//         marginBottom: 8,
//     },
//     subtitle: {
//         fontSize: 16,
//         fontWeight: '500',
//         textAlign: 'center',
//     },
//     contentWrapper: {
//         width: '100%',
//         alignItems: 'center',
//     },
//     label: {
//         fontSize: 16,
//         marginBottom: 10,
//         fontWeight: '600',
//     },
//     centerText: {
//         textAlign: 'center',
//     },
//     inputGroup: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         borderWidth: 1,
//         borderRadius: 12,
//         marginBottom: 20,
//         height: 60,
//         width: '100%',
//     },
//     countryCode: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         marginHorizontal: 15,
//         borderRightWidth: 1,
//         paddingRight: 15,
//     },
//     input: {
//         flex: 1,
//         fontSize: 18,
//         height: '100%',
//         padding: 0,
//     },
//     // --- Custom OTP Grid Styles ---
//     otpVisualInput: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         marginVertical: 30,
//         height: 60,
//         position: 'relative',
//     },
//     otpDigit: {
//         width: 45,
//         height: 60,
//         borderRadius: 10,
//         borderWidth: 2,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     otpText: {
//         fontSize: 24,
//         fontWeight: '700',
//     },
//     hiddenInput: {
//         position: 'absolute',
//         top: 0,
//         bottom: 0,
//         left: 0,
//         right: 0,
//         opacity: 0, // Make the actual input invisible
//         fontSize: 1,
//         height: '100%',
//     },
//     // --- End Custom OTP Grid Styles ---
//     floatingButtonContainer: {
//         position: 'absolute',
//         bottom: 0,
//         left: 0,
//         right: 0,
//         backgroundColor: 'transparent',
//         paddingHorizontal: 25,
//         paddingTop: 10,
//     },
//     button: {
//         borderRadius: 12,
//         padding: 18,
//         alignItems: 'center',
//         justifyContent: 'center',
//         height: 60,
//     },
//     buttonText: {
//         color: '#FFFFFF',
//         fontSize: 18,
//         fontWeight: '700',
//     },
//     resendButton: {
//         padding: 5,
//         marginTop: 5,
//         alignItems: 'center',
//     },
//     resendText: {
//         fontSize: 16,
//         fontWeight: '700',
//     },
//     changeText: {
//         fontSize: 14,
//         fontWeight: '500',
//         marginTop: 10,
//     }
// });












import React, { useState, useContext, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Alert,
    Dimensions,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
// Note: You must wrap your app root with <SafeAreaProvider> to use useSafeAreaInsets
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from '../../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

// --- Constants ---
const { width } = Dimensions.get('window');
const COLLECTIONS = { USERS: 'users' };
const USER_ROLES = { USER: 'user', ADMIN: 'admin', SUPERADMIN: 'superadmin' };

const OTP_LENGTH = 6;

export default function PhoneAuthScreen() {
    const { theme } = useContext(ThemeContext);
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [step, setStep] = useState('phone');
    const [loading, setLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [confirmation, setConfirmation] = useState(null);
    const [otp, setOtp] = useState('');
    const [userName, setUserName] = useState('');

    const otpInputRef = useRef(null);

    const primaryColor = theme.colors.primary || '#4A90E2'; // Modern Blue
    const accentColor = theme.colors.accent || '#88C540';   // Green Accent
    const cardColor = theme.dark ? theme.colors.card : '#FFFFFF';
    const textColor = theme.colors.text;
    const textSecondaryColor = theme.colors.textSecondary;

    // Auto-focus OTP input when stepping to OTP screen
    useEffect(() => {
        if (step === 'otp') {
            const timer = setTimeout(() => {
                otpInputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [step]);

    // --- Authentication Functions ---
    const sendOtp = async () => {
        const cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
        if (cleanedNumber.length !== 10) return Alert.alert('Invalid Number', 'Please enter a 10-digit phone number.');

        setLoading(true);
        try {
            // NOTE: Replace +91 with a country picker for global use
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

            // Fetch the user document
            const userDoc = await firestore().collection(COLLECTIONS.USERS).doc(firebaseUser.uid).get();

            if (userDoc.exists) {
                const userData = userDoc.data();

                // ⭐️ CORRECTED FIX: Safely check for data and role existence ⭐️
                if (userData && userData.role) {
                    const { role } = userData;
                    redirectByRole(role);
                } else {
                    // Document exists but is empty or missing role. Default to registration.
                    console.warn("User document exists but is missing 'role'. Proceeding to setup.");
                    setStep('name');
                }
            } else {
                // User document does not exist, proceed to new user registration
                setStep('name');
            }

        } catch (err) {
            console.error("OTP Verification Error:", err);
            Alert.alert('Verification Failed', 'The OTP is invalid or has expired. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const saveUser = async () => {
        if (!userName.trim()) return Alert.alert('Error', 'Please enter your name.');
        setLoading(true);
        try {
            const firebaseUser = auth().currentUser;
            if (!firebaseUser) {
                setLoading(false);
                return Alert.alert('Error', 'Authentication session lost. Please restart the process.');
            }

            const userData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || null,
                role: USER_ROLES.USER,
                name: userName.trim(),
                notificationPreferences: { push: true, email: false },
                createdAt: firestore.FieldValue.serverTimestamp(),
                phone: firebaseUser.phoneNumber,
            };

            await firestore().collection(COLLECTIONS.USERS).doc(firebaseUser.uid).set(userData);
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

    // Helper to generate the visual OTP boxes (Custom Grid)
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
                {/* Hidden TextInput overlaid to handle actual input */}
                <TextInput
                    ref={otpInputRef}
                    style={styles.hiddenInput}
                    value={otp}
                    onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH))}
                    keyboardType="number-pad"
                    maxLength={OTP_LENGTH}
                    editable={!loading}
                    autoFocus={step === 'otp'}
                    caretHidden={true} // Hide the cursor
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
                        <Text style={[styles.label, { color: textSecondaryColor }]}>Enter your 10-digit phone number</Text>
                        <View style={[styles.inputGroup, { backgroundColor: cardColor, borderColor: theme.colors.border }]}>
                            <Text style={[styles.countryCode, { color: textColor, borderRightColor: theme.colors.border }]}>+91</Text>
                            <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                placeholder="88888 88888"
                                placeholderTextColor={theme.colors.placeholder}
                                keyboardType="phone-pad"
                                maxLength={10}
                                editable={!loading}
                            />
                        </View>
                    </>
                );
            case 'otp':
                return (
                    <>
                        <Text style={[styles.label, styles.centerText, { color: textSecondaryColor }]}>
                            We've sent a {OTP_LENGTH}-digit code to **+91{phoneNumber}**
                        </Text>

                        {renderOtpInputs()}

                        <TouchableOpacity style={styles.resendButton} onPress={() => Alert.alert('Resend Code', 'Functionality to resend code goes here.')} disabled={loading}>
                            <Text style={[styles.resendText, { color: accentColor }]}>Resend Code in 0:59</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.resendButton} onPress={() => setStep('phone')} disabled={loading}>
                            <Text style={[styles.changeText, { color: textSecondaryColor }]}>Change Phone Number?</Text>
                        </TouchableOpacity>
                    </>
                );
            case 'name':
                return (
                    <>
                        <Text style={[styles.label, styles.centerText, { color: textSecondaryColor }]}>
                            Welcome! What should we call you?
                        </Text>
                        {/* Modernized Name Input */}
                        <View style={[styles.inputGroup, { backgroundColor: cardColor, borderColor: theme.colors.border, paddingHorizontal: 0 }]}>
                            <Ionicons
                                name="person-outline"
                                size={20}
                                color={theme.colors.textSecondary}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { color: textColor, paddingHorizontal: 15 }]}
                                value={userName}
                                onChangeText={setUserName}
                                placeholder="Your Full Name"
                                placeholderTextColor={theme.colors.placeholder}
                                keyboardType="default"
                                autoFocus={true}
                                editable={!loading}
                            />
                        </View>
                    </>
                );
            default:
                return null;
        }
    };

    // Helper functions for the main action button
    const getButtonAction = () => {
        switch (step) {
            case 'phone': return sendOtp;
            case 'otp': return verifyOtp;
            case 'name': return saveUser;
            default: return () => { };
        }
    };

    const getButtonText = () => {
        switch (step) {
            case 'phone': return 'Send OTP';
            case 'otp': return 'Verify & Continue';
            case 'name': return 'Complete Profile';
            default: return 'Next';
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

                {/* Text Header */}
                <View style={styles.headerContainer}>
                    <Text style={[styles.title, { color: textColor }]}>
                        {step === 'phone' && 'Welcome Back'}
                        {step === 'otp' && 'One-Time Passcode'}
                        {step === 'name' && 'Profile Setup'}
                    </Text>
                    <Text style={[styles.subtitle, { color: textSecondaryColor }]}>
                        {step === 'phone' && 'Log in or sign up with your phone number.'}
                        {step === 'otp' && 'Please check your SMS for the code.'}
                        {step === 'name' && 'Just one more step to start using the app!'}
                    </Text>
                </View>

                {/* Main Content */}
                <View style={[styles.contentWrapper]}>
                    {renderContent()}
                </View>

            </ScrollView>

            {/* Floating/Fixed Bottom Button */}
            <View style={[styles.floatingButtonContainer, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: primaryColor, opacity: loading ? 0.7 : 1 }]}
                    onPress={getButtonAction()}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>{getButtonText()}</Text>}
                </TouchableOpacity>
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
        paddingBottom: 120, // Space for the floating button
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
        fontSize: 16,
        marginBottom: 10,
        fontWeight: '600',
    },
    centerText: {
        textAlign: 'center',
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 20,
        height: 60,
        width: '100%',
    },
    countryCode: {
        fontSize: 18,
        fontWeight: 'bold',
        marginHorizontal: 15,
        borderRightWidth: 1,
        paddingRight: 15,
    },
    inputIcon: {
        marginLeft: 15,
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 18,
        height: '100%',
        padding: 0,
    },
    // --- Custom OTP Grid Styles ---
    otpVisualInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 30,
        height: 60,
        position: 'relative',
    },
    otpDigit: {
        width: 45,
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
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        opacity: 0,
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
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    resendButton: {
        padding: 5,
        marginTop: 5,
        alignItems: 'center',
    },
    resendText: {
        fontSize: 16,
        fontWeight: '700',
    },
    changeText: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 10,
    }
});