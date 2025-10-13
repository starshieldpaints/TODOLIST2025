// import React, { useState } from 'react';
// import {
//     View,
//     ScrollView,
//     KeyboardAvoidingView,
//     Platform,
//     StyleSheet,
//     Alert,
// } from 'react-native';
// import {
//     TextInput,
//     Button,
//     Text,
//     ActivityIndicator,
//     useTheme as usePaperTheme,
// } from 'react-native-paper';
// import auth from '@react-native-firebase/auth';
// import firestore from '@react-native-firebase/firestore';
// import { useNavigation } from '@react-navigation/native';
// import { useTheme } from '../../hooks/useTheme';

// const RegisterScreen = () => {
//     const navigation = useNavigation();
//     const customTheme = useTheme();
//     const paperTheme = usePaperTheme();

//     // State for form step control
//     const [currentStep, setCurrentStep] = useState(1);

//     // State for Basic Details
//     const [name, setName] = useState('');
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [confirmPassword, setConfirmPassword] = useState('');

//     // ✨ NEW STATE for Password Visibility
//     const [showPassword, setShowPassword] = useState(false);
//     const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//     // State for Address Details (rest of state omitted for brevity)
//     const [addressLine, setAddressLine] = useState('');
//     const [city, setCity] = useState('');
//     const [state, setState] = useState('');
//     const [country, setCountry] = useState('');

//     const [loading, setLoading] = useState(false);
//     const theme = useTheme()

//     // --- Validation and Navigation for Step 1 (omitted for brevity) ---
//     const handleContinue = () => {
//         // ... (validation logic remains the same)
//         if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
//             return Alert.alert('Error', 'All basic fields are required');
//         }
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
//         setCurrentStep(2);
//     };

//     // --- Final Submission for Step 2 (omitted for brevity) ---
//     // --- Final Submission for Step 2 ---
//     const handleFinalRegister = async () => {
//         // 🛑 CRITICAL FIX: Add validation for Step 2 fields here.
//         if (!addressLine.trim() || !city.trim() || !state.trim() || !country.trim()) {
//             return Alert.alert('Error', 'All address fields are required');
//         }

//         setLoading(true);

//         try {
//             // 1. Create user in Firebase Auth
//             const userCredential = await auth().createUserWithEmailAndPassword(email, password);
//             const uid = userCredential.user.uid;

//             // 2. Save user and ALL details in Firestore
//             await firestore().collection('users').doc(uid).set({
//                 uid,
//                 email: email.trim(),
//                 name: name.trim(),
//                 role: 'user',
//                 notificationPreferences: { push: false, email: false },
//                 address: {
//                     addressLine: addressLine.trim(),
//                     city: city.trim(),
//                     state: state.trim(),
//                     country: country.trim(),
//                 },
//                 createdAt: firestore.FieldValue.serverTimestamp(),
//             });

//             Alert.alert('Success', 'Account created successfully!');
//             // Ensure 'verification' is a valid route name in your navigator
//             navigation.replace('verification', { uid });
//         } catch (error) {
//             // Error handling
//             let errorMessage = 'Failed to register. Please try again.';
//             if (error.code === 'auth/email-already-in-use') {
//                 errorMessage = 'This email is already in use. Try logging in.';
//             } else if (error.code === 'auth/invalid-email') {
//                 errorMessage = 'Invalid email address';
//             } else if (error.code === 'auth/weak-password') {
//                 errorMessage = 'Password is too weak. Use at least 6 characters.';
//             } else {
//                 // Log the error for better debugging
//                 console.error("Registration Error:", error);
//                 errorMessage = error.message;
//             }
//             Alert.alert('Registration Failed', errorMessage);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // --- Render Logic based on Step ---
//     const renderContent = () => {
//         if (currentStep === 1) {
//             return (
//                 <View style={styles.contentContainer}>
//                     <Text variant="titleLarge" style={styles.stepTitle}>Step 1: Basic Details</Text>

//                     <TextInput
//                         label="Full Name"
//                         value={name}
//                         onChangeText={setName}
//                         mode="outlined"
//                         style={styles.input}
//                     />

//                     <TextInput
//                         label="Email"
//                         value={email}
//                         onChangeText={setEmail}
//                         mode="outlined"
//                         keyboardType="email-address"
//                         autoCapitalize="none"
//                         style={styles.input}
//                     />

//                     {/* ✨ UPDATED PASSWORD FIELD */}
//                     <TextInput
//                         label="Password"
//                         value={password}
//                         onChangeText={setPassword}
//                         mode="outlined"
//                         // Toggle secureTextEntry based on state
//                         secureTextEntry={!showPassword}
//                         style={styles.input}
//                         // Add the right-side eye button
//                         right={
//                             <TextInput.Icon
//                                 // Set icon based on state
//                                 icon={showPassword ? 'eye-off' : 'eye'}
//                                 // Toggle state on press
//                                 onPress={() => setShowPassword(prev => !prev)}
//                             />
//                         }
//                     />

//                     {/* ✨ UPDATED CONFIRM PASSWORD FIELD */}
//                     <TextInput
//                         label="Confirm Password"
//                         value={confirmPassword}
//                         onChangeText={setConfirmPassword}
//                         mode="outlined"
//                         // Toggle secureTextEntry based on state
//                         secureTextEntry={!showConfirmPassword}
//                         style={styles.input}
//                         // Add the right-side eye button
//                         right={
//                             <TextInput.Icon
//                                 // Set icon based on state
//                                 icon={showConfirmPassword ? 'eye-off' : 'eye'}
//                                 // Toggle state on press
//                                 onPress={() => setShowConfirmPassword(prev => !prev)}
//                             />
//                         }
//                     />

//                     <Button
//                         mode="contained"
//                         onPress={handleContinue}
//                         loading={loading}
//                         style={styles.button}
//                         contentStyle={styles.buttonContent}
//                     >
//                         Continue
//                     </Button>
//                 </View>
//             );
//         } else if (currentStep === 2) {
//             // ... (Address step rendering remains the same)
//             return (
//                 <View style={styles.contentContainer}>
//                     <Text variant="titleLarge" style={styles.stepTitle}>Step 2: Address Details</Text>

//                     <TextInput
//                         label="Address Line"
//                         value={addressLine}
//                         onChangeText={setAddressLine}
//                         mode="outlined"
//                         style={styles.input}
//                     />

//                     <TextInput
//                         label="City"
//                         value={city}
//                         onChangeText={setCity}
//                         mode="outlined"
//                         style={styles.input}
//                     />

//                     <TextInput
//                         label="State"
//                         value={state}
//                         onChangeText={setState}
//                         mode="outlined"
//                         style={styles.input}
//                     />

//                     <TextInput
//                         label="Country"
//                         value={country}
//                         onChangeText={setCountry}
//                         mode="outlined"
//                         style={styles.input}
//                     />

//                     <View style={styles.buttonRow}>
//                         <Button
//                             mode="outlined"
//                             onPress={() => setCurrentStep(1)}
//                             disabled={loading}
//                             style={[styles.backButton, { borderColor: paperTheme.colors.primary }]}
//                             contentStyle={styles.buttonContent}
//                         >
//                             Back
//                         </Button>

//                         <Button
//                             mode="contained"
//                             onPress={handleFinalRegister}
//                             loading={loading}
//                             style={[styles.button, { flex: 1, marginLeft: 10 }]}
//                             contentStyle={styles.buttonContent}
//                         >
//                             {loading ? <ActivityIndicator color="#fff" /> : 'Sign Up'}
//                         </Button>
//                     </View>
//                 </View>
//             );
//         }
//     };

//     return (
//         <KeyboardAvoidingView
//             style={[styles.fullScreen, { backgroundColor: customTheme.colors.background }]}
//             behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//         >
//             <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
//                 <Text style={styles.screenTitle}>Create Account</Text>

//                 {renderContent()}

//                 <View style={styles.footer}>
//                     <Text style={styles.footerText}>Already have an account? </Text>
//                     <Button
//                         mode="elevated"
//                         onPress={() => navigation.navigate('login')}
//                         compact
//                         labelStyle={{ fontSize: 14,paddingInline:12 }}
//                     >
//                         Login
//                     </Button>
//                 </View>

//                 <Button
//                     mode="outlined"
//                     onPress={() => navigation.navigate('phoneAuth')}
//                     style={styles.phoneButton}
//                     labelStyle={styles.phoneButtonText}
                    
//                 >
//                     Continue with Phone
//                 </Button>
//             </ScrollView>
//         </KeyboardAvoidingView>
//     );
// };

// const styles = StyleSheet.create({
//     fullScreen: { flex: 1 },
//     container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
//     contentContainer: { width: '100%' },
//     screenTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
//     stepTitle: { fontSize: 22, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
//     input: { marginBottom: 16 },
//     button: { borderRadius: 12, elevation: 4 },
//     buttonContent: { paddingVertical: 4 },
//     buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
//     backButton: { flex: 0.5, borderRadius: 12 },
//     footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
//     footerText: { fontSize: 14 },
//     phoneButton: { marginTop: 10, alignSelf: 'stretch',borderRadius:12 },
//     phoneButtonText: { fontSize: 16, fontWeight: '600', textDecorationLine: 'none' },
// });

// export default RegisterScreen;
















// import React, { useState } from 'react';
// import {
//     View,
//     ScrollView,
//     KeyboardAvoidingView,
//     Platform,
//     StyleSheet,
//     Alert,
// } from 'react-native';
// import {
//     TextInput,
//     Button,
//     Text,
//     ActivityIndicator,
//     useTheme as usePaperTheme,
// } from 'react-native-paper';
// import auth from '@react-native-firebase/auth';
// import firestore from '@react-native-firebase/firestore';
// import { useNavigation } from '@react-navigation/native';
// import { useTheme } from '../../hooks/useTheme';

// // Define the available departments for the user to select
// const DEPARTMENT_OPTIONS = [
//     'IT & Technology',
//     'Human Resources',
//     'Finance',
//     'Marketing',
//     'Sales',
//     'Operations',
// ];

// const RegisterScreen = () => {
//     const navigation = useNavigation();
//     const customTheme = useTheme();
//     const paperTheme = usePaperTheme();

//     // State for form step control
//     const [currentStep, setCurrentStep] = useState(1);

//     // State for Basic Details
//     const [name, setName] = useState('');
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [confirmPassword, setConfirmPassword] = useState('');

//     // State for Address Details
//     const [addressLine, setAddressLine] = useState('');
//     const [city, setCity] = useState('');
//     const [state, setState] = useState('');
//     const [country, setCountry] = useState('');

//     // ✨ NEW STATE: Department Details for Step 3
//     const [department, setDepartment] = useState('');

//     // State for UI
//     const [showPassword, setShowPassword] = useState(false);
//     const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const theme = useTheme()

//     // ----------------------------------------------------
//     // --- Step Navigation Handlers ---
//     // ----------------------------------------------------

//     // --- Validation and Navigation for Step 1 -> 2 ---
//     const handleContinueToStep2 = () => {
//         if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
//             return Alert.alert('Error', 'All basic fields are required');
//         }
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
//         setCurrentStep(2);
//     };

//     // --- Validation and Navigation for Step 2 -> 3 ---
//     const handleContinueToStep3 = () => {
//         if (!addressLine.trim() || !city.trim() || !state.trim() || !country.trim()) {
//             return Alert.alert('Error', 'All address fields are required');
//         }
//         setCurrentStep(3);
//     }

//     // ----------------------------------------------------
//     // --- Final Submission Handler (Now in Step 3) ---
//     // ----------------------------------------------------

//     const handleFinalRegister = async () => {
//         // Validation for Step 3 fields
//         if (!department.trim()) {
//             return Alert.alert('Error', 'Please select your department.');
//         }

//         setLoading(true);

//         try {
//             // 1. Create user in Firebase Auth
//             const userCredential = await auth().createUserWithEmailAndPassword(email, password);
//             const uid = userCredential.user.uid;

//             // 2. Save user and ALL details in Firestore
//             await firestore().collection('users').doc(uid).set({
//                 uid,
//                 email: email.trim(),
//                 name: name.trim(),
//                 role: 'user',
//                 // ✨ ADDED: Department field
//                 department: department.trim(),
//                 notificationPreferences: { push: false, email: false },
//                 address: {
//                     addressLine: addressLine.trim(),
//                     city: city.trim(),
//                     state: state.trim(),
//                     country: country.trim(),
//                 },
//                 createdAt: firestore.FieldValue.serverTimestamp(),
//             });

//             Alert.alert('Success', 'Account created successfully!');
//             navigation.replace('verification', { uid });
//         } catch (error) {
//             let errorMessage = 'Failed to register. Please try again.';
//             if (error.code === 'auth/email-already-in-use') {
//                 errorMessage = 'This email is already in use. Try logging in.';
//             } else if (error.code === 'auth/invalid-email') {
//                 errorMessage = 'Invalid email address';
//             } else if (error.code === 'auth/weak-password') {
//                 errorMessage = 'Password is too weak. Use at least 6 characters.';
//             } else {
//                 console.error("Registration Error:", error);
//                 errorMessage = error.message;
//             }
//             Alert.alert('Registration Failed', errorMessage);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // ----------------------------------------------------
//     // --- Render Logic based on Step ---
//     // ----------------------------------------------------

//     const renderContent = () => {
//         if (currentStep === 1) {
//             return (
//                 <View style={styles.contentContainer}>
//                     <Text variant="titleLarge" style={styles.stepTitle}>Step 1: Basic Details</Text>
//                     {/* ... (Step 1 TextInputs remain here) ... */}
//                     <TextInput
//                         label="Full Name"
//                         value={name}
//                         onChangeText={setName}
//                         mode="outlined"
//                         style={styles.input}
//                     />

//                     <TextInput
//                         label="Email"
//                         value={email}
//                         onChangeText={setEmail}
//                         mode="outlined"
//                         keyboardType="email-address"
//                         autoCapitalize="none"
//                         style={styles.input}
//                     />
//                     <TextInput
//                         label="Password"
//                         value={password}
//                         onChangeText={setPassword}
//                         mode="outlined"
//                         secureTextEntry={!showPassword}
//                         style={styles.input}
//                         right={
//                             <TextInput.Icon
//                                 icon={showPassword ? 'eye-off' : 'eye'}
//                                 onPress={() => setShowPassword(prev => !prev)}
//                             />
//                         }
//                     />

//                     <TextInput
//                         label="Confirm Password"
//                         value={confirmPassword}
//                         onChangeText={setConfirmPassword}
//                         mode="outlined"
//                         secureTextEntry={!showConfirmPassword}
//                         style={styles.input}
//                         right={
//                             <TextInput.Icon
//                                 icon={showConfirmPassword ? 'eye-off' : 'eye'}
//                                 onPress={() => setShowConfirmPassword(prev => !prev)}
//                             />
//                         }
//                     />
//                     <Button
//                         mode="contained"
//                         onPress={handleContinueToStep2} // UPDATED handler
//                         loading={loading}
//                         style={styles.button}
//                         contentStyle={styles.buttonContent}
//                     >
//                         Continue
//                     </Button>
//                 </View>
//             );
//         } else if (currentStep === 2) {
//             return (
//                 <View style={styles.contentContainer}>
//                     <Text variant="titleLarge" style={styles.stepTitle}>Step 2: Address Details</Text>

//                     <TextInput
//                         label="Address Line"
//                         value={addressLine}
//                         onChangeText={setAddressLine}
//                         mode="outlined"
//                         style={styles.input}
//                     />

//                     <TextInput
//                         label="City"
//                         value={city}
//                         onChangeText={setCity}
//                         mode="outlined"
//                         style={styles.input}
//                     />

//                     <TextInput
//                         label="State"
//                         value={state}
//                         onChangeText={setState}
//                         mode="outlined"
//                         style={styles.input}
//                     />

//                     <TextInput
//                         label="Country"
//                         value={country}
//                         onChangeText={setCountry}
//                         mode="outlined"
//                         style={styles.input}
//                     />

//                     <View style={styles.buttonRow}>
//                         <Button
//                             mode="outlined"
//                             onPress={() => setCurrentStep(1)}
//                             disabled={loading}
//                             style={[styles.backButton, { borderColor: paperTheme.colors.primary }]}
//                             contentStyle={styles.buttonContent}
//                         >
//                             Back
//                         </Button>

//                         <Button
//                             mode="contained"
//                             onPress={handleContinueToStep3} // UPDATED handler
//                             loading={loading}
//                             style={[styles.button, { flex: 1, marginLeft: 10 }]}
//                             contentStyle={styles.buttonContent}
//                         >
//                             Continue
//                         </Button>
//                     </View>
//                 </View>
//             );
//         } else if (currentStep === 3) {
//             return (
//                 <View style={styles.contentContainer}>
//                     <Text variant="titleLarge" style={styles.stepTitle}>Step 3: Department</Text>
//                     <Text variant="bodyLarge" style={{ marginBottom: 10 }}>
//                         Select your Department:
//                     </Text>

//                     {/* Department Selection using Buttons/Chips for simplicity and visibility */}
//                     <View style={styles.departmentContainer}>
//                         {DEPARTMENT_OPTIONS.map((dept) => (
//                             <Button
//                                 key={dept}
//                                 mode={department === dept ? "contained" : "outlined"}
//                                 onPress={() => setDepartment(dept)}
//                                 style={[
//                                     styles.departmentChip,
//                                     {
//                                         backgroundColor: department === dept ? paperTheme.colors.primary : paperTheme.colors.surface,
//                                         borderColor: paperTheme.colors.primary,
//                                     }
//                                 ]}
//                                 labelStyle={{
//                                     color: department === dept ? paperTheme.colors.onPrimary : paperTheme.colors.primary,
//                                 }}
//                             >
//                                 {dept}
//                             </Button>
//                         ))}
//                     </View>

//                     <View style={styles.buttonRow}>
//                         <Button
//                             mode="outlined"
//                             onPress={() => setCurrentStep(2)}
//                             disabled={loading}
//                             style={[styles.backButton, { borderColor: paperTheme.colors.primary }]}
//                             contentStyle={styles.buttonContent}
//                         >
//                             Back
//                         </Button>

//                         <Button
//                             mode="contained"
//                             onPress={handleFinalRegister} // FINAL SUBMISSION
//                             loading={loading}
//                             style={[styles.button, { flex: 1, marginLeft: 10 }]}
//                             contentStyle={styles.buttonContent}
//                         >
//                             {loading ? <ActivityIndicator color="#fff" /> : 'Sign Up'}
//                         </Button>
//                     </View>
//                 </View>
//             );
//         }
//     };

//     return (
//         <KeyboardAvoidingView
//             style={[styles.fullScreen, { backgroundColor: customTheme.colors.background }]}
//             behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//         >
//             <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
//                 <Text style={styles.screenTitle}>Create Account</Text>

//                 {renderContent()}

//                 <View style={styles.footer}>
//                     <Text style={styles.footerText}>Already have an account? </Text>
//                     <Button
//                         mode="elevated"
//                         onPress={() => navigation.navigate('login')}
//                         compact
//                         labelStyle={{ fontSize: 14, paddingInline: 12 }}
//                     >
//                         Login
//                     </Button>
//                 </View>

//                 <Button
//                     mode="outlined"
//                     onPress={() => navigation.navigate('phoneAuth')}
//                     style={styles.phoneButton}
//                     labelStyle={styles.phoneButtonText}
//                 >
//                     Continue with Phone
//                 </Button>
//             </ScrollView>
//         </KeyboardAvoidingView>
//     );
// };

// // ... (Styles remain the same, but add new styles)

// const styles = StyleSheet.create({
//     fullScreen: { flex: 1 },
//     container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
//     contentContainer: { width: '100%' },
//     screenTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
//     stepTitle: { fontSize: 22, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
//     input: { marginBottom: 16 },
//     button: { borderRadius: 12, elevation: 4 },
//     buttonContent: { paddingVertical: 4 },
//     buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
//     backButton: { flex: 0.5, borderRadius: 12 },
//     footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
//     footerText: { fontSize: 14 },
//     phoneButton: { marginTop: 10, alignSelf: 'stretch', borderRadius: 12 },
//     phoneButtonText: { fontSize: 16, fontWeight: '600', textDecorationLine: 'none' },

//     // ✨ NEW STYLES FOR STEP 3
//     departmentContainer: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         marginBottom: 20,
//         gap: 8, // Using gap for modern styling
//     },
//     departmentChip: {
//         marginRight: 8,
//         marginBottom: 8,
//         borderRadius: 20,
//     }
// });

// export default RegisterScreen;













import React, { useState } from 'react'; // <-- CORRECTED: useState comes from 'react'
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

// Define the available departments for the user to select
const DEPARTMENT_OPTIONS = [
    'IT & Technology',
    'Human Resources',
    'Finance',
    'Marketing',
    'Sales',
    'Operations',
];

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

    // State for Address Details
    const [addressLine, setAddressLine] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');

    // ✨ NEW STATE: Department Details for Step 3
    const [department, setDepartment] = useState('');

    // State for UI
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const theme = useTheme()

    // ----------------------------------------------------
    // --- Step Navigation Handlers ---
    // ----------------------------------------------------

    // --- Validation and Navigation for Step 1 -> 2 ---
    const handleContinueToStep2 = () => {
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

    // --- Validation and Navigation for Step 2 -> 3 ---
    const handleContinueToStep3 = () => {
        if (!addressLine.trim() || !city.trim() || !state.trim() || !country.trim()) {
            return Alert.alert('Error', 'All address fields are required');
        }
        setCurrentStep(3);
    }

    // ----------------------------------------------------
    // --- Final Submission Handler (Now in Step 3) ---
    // ----------------------------------------------------

    const handleFinalRegister = async () => {
        // Step 3 Validation
        if (!department.trim()) {
            return Alert.alert('Error', 'Please select your department.');
        }

        setLoading(true);

        try {
            // 1. Create user in Firebase Auth
            const userCredential = await auth().createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;

            const trimmedDepartment = department.trim();

            // 2. Save user and ALL details in Firestore (users collection)
            await firestore().collection('users').doc(uid).set({
                uid,
                email: email.trim(),
                name: name.trim(),
                role: 'user',
                department: trimmedDepartment, // ADDED: Department field
                notificationPreferences: { push: false, email: false },
                address: {
                    addressLine: addressLine.trim(),
                    city: city.trim(),
                    state: state.trim(),
                    country: country.trim(),
                },
                createdAt: firestore.FieldValue.serverTimestamp(),
            });

            // 3. CRITICAL STEP: Add user UID to the departments collection
            // The department name is used as the document ID (e.g., 'IT & Technology')
            await firestore().collection('departments').doc(trimmedDepartment).set({
                // Atomically add the UID to the 'users' array field
                users: firestore.FieldValue.arrayUnion(uid),
                name: trimmedDepartment,
            }, { merge: true }); // Use merge:true to only update the 'users' array field

            Alert.alert('Success', 'Account created successfully!');
            navigation.replace('verification', { uid });
        } catch (error) {
            let errorMessage = 'Failed to register. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already in use. Try logging in.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Use at least 6 characters.';
            } else {
                console.error("Registration Error:", error);
                errorMessage = error.message;
            }
            Alert.alert('Registration Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ----------------------------------------------------
    // --- Render Logic based on Step ---
    // ----------------------------------------------------

    const renderContent = () => {
        if (currentStep === 1) {
            return (
                <View style={styles.contentContainer}>
                    <Text variant="titleLarge" style={styles.stepTitle}>Step 1: Basic Details</Text>
                    <TextInput label="Full Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
                    <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
                    <TextInput
                        label="Password" value={password} onChangeText={setPassword} mode="outlined" secureTextEntry={!showPassword} style={styles.input}
                        right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(prev => !prev)} />}
                    />
                    <TextInput
                        label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} mode="outlined" secureTextEntry={!showConfirmPassword} style={styles.input}
                        right={<TextInput.Icon icon={showConfirmPassword ? 'eye-off' : 'eye'} onPress={() => setShowConfirmPassword(prev => !prev)} />}
                    />
                    <Button
                        mode="contained" onPress={handleContinueToStep2} loading={loading} style={styles.button} contentStyle={styles.buttonContent}
                    >
                        Continue
                    </Button>
                </View>
            );
        } else if (currentStep === 2) {
            return (
                <View style={styles.contentContainer}>
                    <Text variant="titleLarge" style={styles.stepTitle}>Step 2: Address Details</Text>

                    <TextInput label="Address Line" value={addressLine} onChangeText={setAddressLine} mode="outlined" style={styles.input} />
                    <TextInput label="City" value={city} onChangeText={setCity} mode="outlined" style={styles.input} />
                    <TextInput label="State" value={state} onChangeText={setState} mode="outlined" style={styles.input} />
                    <TextInput label="Country" value={country} onChangeText={setCountry} mode="outlined" style={styles.input} />

                    <View style={styles.buttonRow}>
                        <Button
                            mode="outlined" onPress={() => setCurrentStep(1)} disabled={loading} style={[styles.backButton, { borderColor: paperTheme.colors.primary }]} contentStyle={styles.buttonContent}
                        >
                            Back
                        </Button>

                        <Button
                            mode="contained" onPress={handleContinueToStep3} loading={loading} style={[styles.button, { flex: 1, marginLeft: 10 }]} contentStyle={styles.buttonContent}
                        >
                            Continue
                        </Button>
                    </View>
                </View>
            );
        } else if (currentStep === 3) {
            return (
                <View style={styles.contentContainer}>
                    <Text variant="titleLarge" style={styles.stepTitle}>Step 3: Department</Text>
                    <Text variant="bodyLarge" style={{ marginBottom: 10 }}>
                        Select your Department:
                    </Text>

                    <View style={styles.departmentContainer}>
                        {DEPARTMENT_OPTIONS.map((dept) => (
                            <Button
                                key={dept}
                                mode={department === dept ? "contained" : "outlined"}
                                onPress={() => setDepartment(dept)}
                                style={[
                                    styles.departmentChip,
                                    {
                                        backgroundColor: department === dept ? paperTheme.colors.primary : paperTheme.colors.surface,
                                        borderColor: paperTheme.colors.primary,
                                    }
                                ]}
                                labelStyle={{
                                    color: department === dept ? paperTheme.colors.onPrimary : paperTheme.colors.primary,
                                }}
                            >
                                {dept}
                            </Button>
                        ))}
                    </View>

                    <View style={styles.buttonRow}>
                        <Button
                            mode="outlined" onPress={() => setCurrentStep(2)} disabled={loading} style={[styles.backButton, { borderColor: paperTheme.colors.primary }]} contentStyle={styles.buttonContent}
                        >
                            Back
                        </Button>

                        <Button
                            mode="contained" onPress={handleFinalRegister} loading={loading} style={[styles.button, { flex: 1, marginLeft: 10 }]} contentStyle={styles.buttonContent}
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
                        labelStyle={{ fontSize: 14, paddingInline: 12 }}
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
    phoneButton: { marginTop: 10, alignSelf: 'stretch', borderRadius: 12 },
    phoneButtonText: { fontSize: 16, fontWeight: '600', textDecorationLine: 'none' },

    // STYLES FOR STEP 3
    departmentContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        gap: 8,
    },
    departmentChip: {
        marginRight: 8,
        marginBottom: 8,
        borderRadius: 20,
    }
});

export default RegisterScreen;