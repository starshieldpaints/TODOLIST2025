// // RegisterScreen.js
// import React, { useState } from 'react';
// import {
//     View,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     StyleSheet,
//     ActivityIndicator,
//     Alert,
//     ScrollView,
//     KeyboardAvoidingView,
//     Platform,
// } from 'react-native';
// import auth from '@react-native-firebase/auth';
// import firestore from '@react-native-firebase/firestore';
// import { useNavigation } from '@react-navigation/native';
// import { useTheme } from '../../hooks/useTheme';


// const RegisterScreen = () => {
//     const navigation = useNavigation();
//     const theme = useTheme();

//     const [name, setName] = useState('');
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [confirmPassword, setConfirmPassword] = useState('');
//     const [loading, setLoading] = useState(false);

//     const handleRegister = async () => {
//         // ---- Validation ----
//         if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
//             return Alert.alert('Error', 'All fields are required');
//         }

//         // Simple email regex
//         const emailRegex = /\S+@\S+\.\S+/;
//         if (!emailRegex.test(email)) {
//             return Alert.alert('Invalid Email', 'Please enter a valid email address');
//         }

//         if (password.length < 6) {
//             return Alert.alert('Invalid Password', 'Password must be at least 6 characters');
//         }

//         if (password !== confirmPassword) {
//             return Alert.alert('Password Mismatch', 'Passwords do not match');
//         }

//         setLoading(true);

//         try {
//             // Create user in Firebase Auth
//             const userCredential = await auth().createUserWithEmailAndPassword(email, password);
//             const uid = userCredential.user.uid;

//             // Save user in Firestore with default structure
//             await firestore().collection('users').doc(uid).set({
//                 uid,
//                 email,
//                 name: name.trim(),
//                 role: 'user',
//                 notificationPreferences: { push: false, email: false },
//                 createdAt: firestore.FieldValue.serverTimestamp(),
//             });

//             Alert.alert('Success', 'Account created successfully!');
//             navigation.replace('verification', { uid }); // Redirect to verify
//         } catch (error) {
//             // ---- Firebase specific error handling ----
//             let errorMessage = 'Failed to register. Please try again.';
//             switch (error.code) {
//                 case 'auth/email-already-in-use':
//                     errorMessage = 'This email is already in use. Try logging in.';
//                     break;
//                 case 'auth/invalid-email':
//                     errorMessage = 'Invalid email address';
//                     break;
//                 case 'auth/weak-password':
//                     errorMessage = 'Password is too weak. Use at least 6 characters.';
//                     break;
//                 default:
//                     errorMessage = error.message;
//             }
//             Alert.alert('Registration Failed', errorMessage);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <KeyboardAvoidingView
//             style={{ flex: 1, backgroundColor: theme.colors.background }}
//             behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//         >
//             <ScrollView contentContainerStyle={styles.container}>
//                 <Text style={[styles.title, { color: theme.colors.text }]}>Create Account</Text>

//                 <TextInput
//                     placeholder="Full Name"
//                     placeholderTextColor={theme.colors.text}
//                     value={name}
//                     onChangeText={setName}
//                     style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary, color: theme.colors.text }]}
//                 />

//                 <TextInput
//                     placeholder="Email"
//                     placeholderTextColor={theme.colors.text}
//                     value={email}
//                     onChangeText={setEmail}
//                     style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary, color: theme.colors.text }]}
//                     keyboardType="email-address"
//                     autoCapitalize="none"
//                 />

//                 <TextInput
//                     placeholder="Password"
//                     placeholderTextColor={theme.colors.text}
//                     value={password}
//                     onChangeText={setPassword}
//                     style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary, color: theme.colors.text }]}
//                     secureTextEntry
//                 />

//                 <TextInput
//                     placeholder="Confirm Password"
//                     placeholderTextColor={theme.colors.text}
//                     value={confirmPassword}
//                     onChangeText={setConfirmPassword}
//                     style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary, color: theme.colors.text }]}
//                     secureTextEntry
//                 />

//                 <TouchableOpacity
//                     style={[styles.button, { backgroundColor: '#FF0000' }]}
//                     onPress={handleRegister}
//                     disabled={loading}
//                 >
//                     {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
//                 </TouchableOpacity>

//                 <View style={styles.footer}>
//                     <Text style={[styles.footerText, { color: theme.colors.text }]}>Already have an account? </Text>
//                     <TouchableOpacity onPress={() => navigation.navigate('login')}>
//                         <Text style={[styles.footerText, { color: theme.colors.primary }]}>Login</Text>
//                     </TouchableOpacity>
//                 </View>

//                 <TouchableOpacity onPress={() => navigation.navigate('phoneAuth')} style={styles.phoneButton}>
//                     <Text style={[styles.phoneButtonText, { color: theme.colors.primary,borderColor:theme.colors.border}]}>Continue with Phone</Text>
//                 </TouchableOpacity>
//             </ScrollView>
//         </KeyboardAvoidingView>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
//     title: { fontSize: 32, fontWeight: 'bold', marginBottom: 40, textAlign: 'center' },
//     input: { height: 50, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1 },
//     button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
//     buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
//     footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
//     footerText: { fontSize: 14 },
//     phoneButton: { marginTop: 24, alignItems: 'center' },
//     phoneButtonText: { fontSize: 16, fontWeight: '600' },
// });

// export default RegisterScreen;














import React, { useState } from 'react';
import {
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Alert,
} from 'react-native';
import {
    TextInput,
    Button,
    Text,
    ActivityIndicator,
    useTheme as usePaperTheme,
} from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';

const RegisterScreen = () => {
    const navigation = useNavigation();
    const customTheme = useTheme();
    const paperTheme = usePaperTheme();

    // State for form step control
    const [currentStep, setCurrentStep] = useState(1);

    // State for Basic Details
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // ✨ NEW STATE for Password Visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // State for Address Details (rest of state omitted for brevity)
    const [addressLine, setAddressLine] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');

    const [loading, setLoading] = useState(false);
    const theme = useTheme()

    // --- Validation and Navigation for Step 1 (omitted for brevity) ---
    const handleContinue = () => {
        // ... (validation logic remains the same)
        if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            return Alert.alert('Error', 'All basic fields are required');
        }
        const emailRegex = /\S+@\S+\.\S+/;
        if (!emailRegex.test(email)) {
            return Alert.alert('Invalid Email', 'Please enter a valid email address');
        }
        if (password.length < 6) {
            return Alert.alert('Invalid Password', 'Password must be at least 6 characters');
        }
        if (password !== confirmPassword) {
            return Alert.alert('Password Mismatch', 'Passwords do not match');
        }
        setCurrentStep(2);
    };

    // --- Final Submission for Step 2 (omitted for brevity) ---
    // --- Final Submission for Step 2 ---
    const handleFinalRegister = async () => {
        // 🛑 CRITICAL FIX: Add validation for Step 2 fields here.
        if (!addressLine.trim() || !city.trim() || !state.trim() || !country.trim()) {
            return Alert.alert('Error', 'All address fields are required');
        }

        setLoading(true);

        try {
            // 1. Create user in Firebase Auth
            const userCredential = await auth().createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;

            // 2. Save user and ALL details in Firestore
            await firestore().collection('users').doc(uid).set({
                uid,
                email: email.trim(),
                name: name.trim(),
                role: 'user',
                notificationPreferences: { push: false, email: false },
                address: {
                    addressLine: addressLine.trim(),
                    city: city.trim(),
                    state: state.trim(),
                    country: country.trim(),
                },
                createdAt: firestore.FieldValue.serverTimestamp(),
            });

            Alert.alert('Success', 'Account created successfully!');
            // Ensure 'verification' is a valid route name in your navigator
            navigation.replace('verification', { uid });
        } catch (error) {
            // Error handling
            let errorMessage = 'Failed to register. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already in use. Try logging in.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Use at least 6 characters.';
            } else {
                // Log the error for better debugging
                console.error("Registration Error:", error);
                errorMessage = error.message;
            }
            Alert.alert('Registration Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // --- Render Logic based on Step ---
    const renderContent = () => {
        if (currentStep === 1) {
            return (
                <View style={styles.contentContainer}>
                    <Text variant="titleLarge" style={styles.stepTitle}>Step 1: Basic Details</Text>

                    <TextInput
                        label="Full Name"
                        value={name}
                        onChangeText={setName}
                        mode="outlined"
                        style={styles.input}
                    />

                    <TextInput
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                    />

                    {/* ✨ UPDATED PASSWORD FIELD */}
                    <TextInput
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        mode="outlined"
                        // Toggle secureTextEntry based on state
                        secureTextEntry={!showPassword}
                        style={styles.input}
                        // Add the right-side eye button
                        right={
                            <TextInput.Icon
                                // Set icon based on state
                                icon={showPassword ? 'eye-off' : 'eye'}
                                // Toggle state on press
                                onPress={() => setShowPassword(prev => !prev)}
                            />
                        }
                    />

                    {/* ✨ UPDATED CONFIRM PASSWORD FIELD */}
                    <TextInput
                        label="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        mode="outlined"
                        // Toggle secureTextEntry based on state
                        secureTextEntry={!showConfirmPassword}
                        style={styles.input}
                        // Add the right-side eye button
                        right={
                            <TextInput.Icon
                                // Set icon based on state
                                icon={showConfirmPassword ? 'eye-off' : 'eye'}
                                // Toggle state on press
                                onPress={() => setShowConfirmPassword(prev => !prev)}
                            />
                        }
                    />

                    <Button
                        mode="contained"
                        onPress={handleContinue}
                        loading={loading}
                        style={styles.button}
                        contentStyle={styles.buttonContent}
                    >
                        Continue
                    </Button>
                </View>
            );
        } else if (currentStep === 2) {
            // ... (Address step rendering remains the same)
            return (
                <View style={styles.contentContainer}>
                    <Text variant="titleLarge" style={styles.stepTitle}>Step 2: Address Details</Text>

                    <TextInput
                        label="Address Line"
                        value={addressLine}
                        onChangeText={setAddressLine}
                        mode="outlined"
                        style={styles.input}
                    />

                    <TextInput
                        label="City"
                        value={city}
                        onChangeText={setCity}
                        mode="outlined"
                        style={styles.input}
                    />

                    <TextInput
                        label="State"
                        value={state}
                        onChangeText={setState}
                        mode="outlined"
                        style={styles.input}
                    />

                    <TextInput
                        label="Country"
                        value={country}
                        onChangeText={setCountry}
                        mode="outlined"
                        style={styles.input}
                    />

                    <View style={styles.buttonRow}>
                        <Button
                            mode="outlined"
                            onPress={() => setCurrentStep(1)}
                            disabled={loading}
                            style={[styles.backButton, { borderColor: paperTheme.colors.primary }]}
                            contentStyle={styles.buttonContent}
                        >
                            Back
                        </Button>

                        <Button
                            mode="contained"
                            onPress={handleFinalRegister}
                            loading={loading}
                            style={[styles.button, { flex: 1, marginLeft: 10 }]}
                            contentStyle={styles.buttonContent}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : 'Sign Up'}
                        </Button>
                    </View>
                </View>
            );
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.fullScreen, { backgroundColor: customTheme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Text style={styles.screenTitle}>Create Account</Text>

                {renderContent()}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <Button
                        mode="elevated"
                        onPress={() => navigation.navigate('login')}
                        compact
                        labelStyle={{ fontSize: 14,paddingInline:12 }}
                    >
                        Login
                    </Button>
                </View>

                <Button
                    mode="outlined"
                    onPress={() => navigation.navigate('phoneAuth')}
                    style={styles.phoneButton}
                    labelStyle={styles.phoneButtonText}
                    
                >
                    Continue with Phone
                </Button>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    fullScreen: { flex: 1 },
    container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    contentContainer: { width: '100%' },
    screenTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    stepTitle: { fontSize: 22, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
    input: { marginBottom: 16 },
    button: { borderRadius: 12, elevation: 4 },
    buttonContent: { paddingVertical: 4 },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    backButton: { flex: 0.5, borderRadius: 12 },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
    footerText: { fontSize: 14 },
    phoneButton: { marginTop: 10, alignSelf: 'stretch',borderRadius:12 },
    phoneButtonText: { fontSize: 16, fontWeight: '600', textDecorationLine: 'none' },
});

export default RegisterScreen;