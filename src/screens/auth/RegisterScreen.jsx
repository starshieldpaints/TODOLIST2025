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
//     const [currentStep, setCurrentStep] = useState(1);
//     const [name, setName] = useState('');
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [confirmPassword, setConfirmPassword] = useState('');
//     const [addressLine, setAddressLine] = useState('');
//     const [city, setCity] = useState('');
//     const [state, setState] = useState('');
//     const [country, setCountry] = useState('');
//     const [department, setDepartment] = useState('');
//     const [showPassword, setShowPassword] = useState(false);
//     const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const theme = useTheme()

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
//     const handleContinueToStep3 = () => {
//         if (!addressLine.trim() || !city.trim() || !state.trim() || !country.trim()) {
//             return Alert.alert('Error', 'All address fields are required');
//         }
//         setCurrentStep(3);
//     }
//     const handleFinalRegister = async () => {
//         if (!department.trim()) {
//             return Alert.alert('Error', 'Please select your department.');
//         }
//         setLoading(true);
//         try {
//             const userCredential = await auth().createUserWithEmailAndPassword(email, password);
//             const uid = userCredential.user.uid;
//             const trimmedDepartment = department.trim();
//             await firestore().collection('users').doc(uid).set({
//                 uid,
//                 email: email.trim(),
//                 name: name.trim(),
//                 role: 'user',
//                 department: trimmedDepartment,
//                 notificationPreferences: { push: false, email: false },
//                 address: {
//                     addressLine: addressLine.trim(),
//                     city: city.trim(),
//                     state: state.trim(),
//                     country: country.trim(),
//                 },
//                 createdAt: firestore.FieldValue.serverTimestamp(),
//             });
//             await firestore().collection('departments').doc(trimmedDepartment).set({
//                 users: firestore.FieldValue.arrayUnion(uid),
//                 name: trimmedDepartment,
//             }, { merge: true });

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
//     const renderContent = () => {
//         if (currentStep === 1) {
//             return (
//                 <View style={styles.contentContainer}>
//                     <Text variant="titleLarge" style={styles.stepTitle}>Basic Details</Text>
//                     <TextInput label="Full Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
//                     <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
//                     <TextInput
//                         label="Password" value={password} onChangeText={setPassword} mode="outlined" secureTextEntry={!showPassword} style={styles.input}
//                         right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(prev => !prev)} />}
//                     />
//                     <TextInput
//                         label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} mode="outlined" secureTextEntry={!showConfirmPassword} style={styles.input}
//                         right={<TextInput.Icon icon={showConfirmPassword ? 'eye-off' : 'eye'} onPress={() => setShowConfirmPassword(prev => !prev)} />}
//                     />
//                     <Button
//                         mode="contained" onPress={handleContinueToStep2} loading={loading} style={styles.button} contentStyle={styles.buttonContent}
//                     >
//                         Continue
//                     </Button>
//                 </View>
//             );
//         } else if (currentStep === 2) {
//             return (
//                 <View style={styles.contentContainer}>
//                     <Text variant="titleLarge" style={styles.stepTitle}> Address Details</Text>

//                     <TextInput label="Address Line" value={addressLine} onChangeText={setAddressLine} mode="outlined" style={styles.input} />
//                     <TextInput label="City" value={city} onChangeText={setCity} mode="outlined" style={styles.input} />
//                     <TextInput label="State" value={state} onChangeText={setState} mode="outlined" style={styles.input} />
//                     <TextInput label="Country" value={country} onChangeText={setCountry} mode="outlined" style={styles.input} />

//                     <View style={styles.buttonRow}>
//                         <Button
//                             mode="outlined" onPress={() => setCurrentStep(1)} disabled={loading} style={[styles.backButton, { borderColor: paperTheme.colors.primary }]} contentStyle={styles.buttonContent}
//                         >
//                             Back
//                         </Button>

//                         <Button
//                             mode="contained" onPress={handleContinueToStep3} loading={loading} style={[styles.button, { flex: 1, marginLeft: 10 }]} contentStyle={styles.buttonContent}
//                         >
//                             Continue
//                         </Button>
//                     </View>
//                 </View>
//             );
//         } else if (currentStep === 3) {
//             return (
//                 <View style={styles.contentContainer}>
//                     <Text variant="titleLarge" style={styles.stepTitle}>Department</Text>
//                     <Text variant="bodyLarge" style={{ marginBottom: 10 }}>
//                         Select your Department:
//                     </Text>

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
//                             mode="outlined" onPress={() => setCurrentStep(2)} disabled={loading} style={[styles.backButton, { borderColor: paperTheme.colors.primary }]} contentStyle={styles.buttonContent}
//                         >
//                             Back
//                         </Button>

//                         <Button
//                             mode="contained" onPress={handleFinalRegister} loading={loading} style={[styles.button, { flex: 1, marginLeft: 10 }]} contentStyle={styles.buttonContent}
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
//             behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
//             <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
//                 <Text style={styles.screenTitle}>Create Account</Text>
//                 {renderContent()}
//                 <View style={styles.footer}>
//                     <Text style={styles.footerText}>Already have an account? </Text>
//                     <Button
//                         mode="elevated"
//                         onPress={() => navigation.navigate('login')}
//                         compact
//                         labelStyle={{ fontSize: 14, paddingInline: 12 }}>
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
//     stepTitle: { fontSize: 26, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
//     input: { marginBottom: 16 },
//     button: { borderRadius: 12, elevation: 4 },
//     buttonContent: { paddingVertical: 4 },
//     buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
//     backButton: { flex: 0.5, borderRadius: 12 },
//     footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
//     footerText: { fontSize: 14 },
//     phoneButton: { marginTop: 10, alignSelf: 'stretch', borderRadius: 12 },
//     phoneButtonText: { fontSize: 16, fontWeight: '600', textDecorationLine: 'none' },

//     // STYLES FOR STEP 3
//     departmentContainer: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         marginBottom: 20,
//         gap: 8,
//     },
//     departmentChip: {
//         marginRight: 8,
//         marginBottom: 8,
//         borderRadius: 20,
//     }
// });

// export default RegisterScreen;













// import React, { useState, useEffect, useMemo } from 'react';
// import {
//     View,
//     ScrollView,
//     KeyboardAvoidingView,
//     Platform,
//     StyleSheet,
//     Alert,
//     Modal,
//     TouchableOpacity,
//     FlatList,
//     Pressable,
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
// const GEONAMES_USER = 'starshield';



// const DEPARTMENT_OPTIONS = [
//     'IT & Technology',
//     'Human Resources',
//     'Finance',
//     'Marketing',
//     'Sales',
//     'Operations',
//     'Manufacturing',
//     'R & D'

// ];

// // Reusable component for the clickable text input that opens the modal
// const SelectorInput = ({ label, value, onPress, disabled = false }) => (
//     <TouchableOpacity onPress={onPress} disabled={disabled}>
//         <View pointerEvents="none">
//             <TextInput
//                 label={label}
//                 value={value}
//                 mode="outlined"
//                 editable={false}
//                 style={[styles.input, ]}
//                 right={<TextInput.Icon icon="chevron-down" />}
//             />
//         </View>
//     </TouchableOpacity>
// );

// const RegisterScreen = () => {
    
//     const navigation = useNavigation();
//     const customTheme = useTheme();
//     const paperTheme = usePaperTheme();
//     const [currentStep, setCurrentStep] = useState(1);
//     const [name, setName] = useState('');
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [confirmPassword, setConfirmPassword] = useState('');
//     const [showPassword, setShowPassword] = useState(false);
//     const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//     const [addressLine, setAddressLine] = useState('');
//     const [selectedCountry, setSelectedCountry] = useState(null);
//     const [selectedState, setSelectedState] = useState(null);
//     const [selectedCity, setSelectedCity] = useState(null);

//     // Step 3 State
//     const [department, setDepartment] = useState('');

//     // Global State
//     const [loading, setLoading] = useState(false);

//     // Geodata and Modal State
//     const [countries, setCountries] = useState([]);
//     const [states, setStates] = useState([]);
//     const [cities, setCities] = useState([]);
//     const [loadingCountries, setLoadingCountries] = useState(false);
//     const [loadingStates, setLoadingStates] = useState(false);
//     const [loadingCities, setLoadingCities] = useState(false);
//     const [isModalVisible, setModalVisible] = useState(false);
//     const [modalType, setModalType] = useState(null); // 'country', 'state', or 'city'
//     const [searchTerm, setSearchTerm] = useState('');

//     // Fetch countries on component mount
//     useEffect(() => {
//         const fetchCountries = async () => {
//             if (!GEONAMES_USER || GEONAMES_USER === 'YOUR_GEONAMES_USERNAME') {
//                 Alert.alert('Setup Required', 'Please set your GeoNames username in the code.');
//                 return;
//             }
//             setLoadingCountries(true);
//             try {
//                 const response = await fetch(`http://api.geonames.org/countryInfoJSON?username=${GEONAMES_USER}`);
//                 const data = await response.json();
//                 if (data.geonames) {
//                     const formattedCountries = data.geonames.map(c => ({ name: c.countryName, geonameId: c.geonameId }));
//                     setCountries(formattedCountries);
//                 }
//             } catch (error) {
//                 console.error("Failed to fetch countries:", error);
//                 Alert.alert('Error', 'Could not load country data.');
//             } finally {
//                 setLoadingCountries(false);
//             }
//         };
//         fetchCountries();
//     }, []);

//     // Fetch states when a country is selected
//     useEffect(() => {
//         if (selectedCountry?.geonameId) {
//             const fetchStates = async () => {
//                 setLoadingStates(true);
//                 setStates([]);
//                 setCities([]);
//                 setSelectedState(null);
//                 setSelectedCity(null);
//                 try {
//                     const response = await fetch(`http://api.geonames.org/childrenJSON?geonameId=${selectedCountry.geonameId}&username=${GEONAMES_USER}`);
//                     const data = await response.json();
//                     if (data.geonames) {
//                         const formattedStates = data.geonames.map(s => ({ name: s.name, geonameId: s.geonameId }));
//                         setStates(formattedStates);
//                     }
//                 } catch (error) {
//                     console.error("Failed to fetch states:", error);
//                     Alert.alert('Error', 'Could not load state data.');
//                 } finally {
//                     setLoadingStates(false);
//                 }
//             };
//             fetchStates();
//         }
//     }, [selectedCountry]);

//     // Fetch cities when a state is selected
//     useEffect(() => {
//         if (selectedState?.geonameId) {
//             const fetchCities = async () => {
//                 setLoadingCities(true);
//                 setCities([]);
//                 setSelectedCity(null);
//                 try {
//                     const response = await fetch(`http://api.geonames.org/childrenJSON?geonameId=${selectedState.geonameId}&username=${GEONAMES_USER}`);
//                     const data = await response.json();
//                     if (data.geonames) {
//                         const formattedCities = data.geonames.map(c => ({ name: c.name, geonameId: c.geonameId }));
//                         setCities(formattedCities);
//                     }
//                 } catch (error) {
//                     console.error("Failed to fetch cities:", error);
//                     Alert.alert('Error', 'Could not load city data.');
//                 } finally {
//                     setLoadingCities(false);
//                 }
//             };
//             fetchCities();
//         }
//     }, [selectedState]);

//     // --- Modal Helper Functions ---
//     const openModal = (type) => {
//         setSearchTerm('');
//         setModalType(type);
//         setModalVisible(true);
//     };

//     const handleSelect = (item) => {
//         if (modalType === 'country') {
//             setSelectedCountry(item);
//         } else if (modalType === 'state') {
//             setSelectedState(item);
//         } else if (modalType === 'city') {
//             setSelectedCity(item);
//         }
//         setModalVisible(false);
//     };

//     // Memoized filtered data for the modal's list
//     const modalData = useMemo(() => {
//         let data = [];
//         if (modalType === 'country') data = countries;
//         if (modalType === 'state') data = states;
//         if (modalType === 'city') data = cities;

//         if (searchTerm) {
//             return data.filter(item =>
//                 item.name.toLowerCase().includes(searchTerm.toLowerCase())
//             );
//         }
//         return data;
//     }, [modalType, countries, states, cities, searchTerm]);

//     const isLoadingModalData = (
//         (modalType === 'country' && loadingCountries) ||
//         (modalType === 'state' && loadingStates) ||
//         (modalType === 'city' && loadingCities)
//     );

//     // --- Navigation and Registration Handlers ---
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

//     const handleContinueToStep3 = () => {
//         if (!addressLine.trim() || !selectedCity || !selectedState || !selectedCountry) {
//             return Alert.alert('Error', 'All address fields are required');
//         }
//         setCurrentStep(3);
//     }

//     const handleFinalRegister = async () => {
//         if (!department.trim()) {
//             return Alert.alert('Error', 'Please select your department.');
//         }
//         setLoading(true);
//         try {
//             const userCredential = await auth().createUserWithEmailAndPassword(email, password);
//             const uid = userCredential.user.uid;
//             const trimmedDepartment = department.trim();
//             await firestore().collection('users').doc(uid).set({
//                 uid,
//                 email: email.trim(),
//                 name: name.trim(),
//                 role: 'user',
//                 department: trimmedDepartment,
//                 notificationPreferences: { push: false, email: false },
//                 address: {
//                     addressLine: addressLine.trim(),
//                     city: selectedCity.name,
//                     state: selectedState.name,
//                     country: selectedCountry.name,
//                 },
//                 createdAt: firestore.FieldValue.serverTimestamp(),
//             });
//             await firestore().collection('departments').doc(trimmedDepartment).set({
//                 users: firestore.FieldValue.arrayUnion(uid),
//                 name: trimmedDepartment,
//             }, { merge: true });

//             Alert.alert('Success', 'Account created successfully!');
//             navigation.replace('verification', { uid });
//         } catch (error) {
//             let errorMessage = 'Failed to register. Please try again.';
//             if (error.code === 'auth/email-already-in-use') {
//                 errorMessage = 'This email is already in use. Try logging in.';
//             } else {
//                 console.error("Registration Error:", error);
//                 errorMessage = error.message;
//             }
//             Alert.alert('Registration Failed', errorMessage);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const renderContent = () => {
//         if (currentStep === 1) {
//             return (
//                 <View style={styles.contentContainer}>
//                     <Text variant="titleLarge" style={styles.stepTitle}>Basic Details</Text>
//                     <TextInput label="Full Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
//                     <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
//                     <TextInput
//                         label="Password" value={password} onChangeText={setPassword} mode="outlined" secureTextEntry={!showPassword} style={styles.input}
//                         right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(p => !p)} />}
//                     />
//                     <TextInput
//                         label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} mode="outlined" secureTextEntry={!showConfirmPassword} style={styles.input}
//                         right={<TextInput.Icon icon={showConfirmPassword ? 'eye-off' : 'eye'} onPress={() => setShowConfirmPassword(p => !p)} />}
//                     />
//                     <Button mode="contained" onPress={handleContinueToStep2} style={styles.button} contentStyle={styles.buttonContent}>
//                         Continue
//                     </Button>
//                 </View>
//             );
//         } else if (currentStep === 2) {
//             return (
//                 <View style={styles.contentContainer}>
//                     <Text variant="titleLarge" style={styles.stepTitle}>Address Details</Text>
//                     <TextInput label="Address Line" value={addressLine} onChangeText={setAddressLine} mode="outlined" style={styles.input} />
//                     <SelectorInput
//                         label="Country"
//                         value={selectedCountry?.name || ''}
//                         onPress={() => openModal('country')}
//                     />
//                     <SelectorInput
//                         label="State"
//                         value={selectedState?.name || ''}
//                         onPress={() => openModal('state')}
//                         disabled={!selectedCountry || loadingStates}
//                     />
//                     <SelectorInput
//                         label="City"
//                         value={selectedCity?.name || ''}
//                         onPress={() => openModal('city')}
//                         disabled={!selectedState || loadingCities}
//                     />
//                     <View style={styles.buttonRow}>
//                         <Button mode="outlined" onPress={() => setCurrentStep(1)} style={[styles.backButton, { borderColor: paperTheme.colors.primary }]} contentStyle={styles.buttonContent}>
//                             Back
//                         </Button>
//                         <Button mode="contained" onPress={handleContinueToStep3} style={[styles.button, { flex: 1, marginLeft: 10 }]} contentStyle={styles.buttonContent}>
//                             Continue
//                         </Button>
//                     </View>
//                 </View>
//             );
//         } else if (currentStep === 3) {
//             return (
//                 <View style={styles.contentContainer}>
//                     <Text variant="titleLarge" style={styles.stepTitle}>Department</Text>
//                     <Text variant="bodyLarge" style={{ marginBottom: 10 }}>Select your Department:</Text>
//                     <View style={styles.departmentContainer}>
//                         {DEPARTMENT_OPTIONS.map((dept) => (
//                             <Button key={dept} mode={department === dept ? "contained" : "outlined"} onPress={() => setDepartment(dept)} style={styles.departmentChip}
//                                 color={department === dept ? paperTheme.colors.onPrimary : paperTheme.colors.primary}
//                             >
//                                 {dept}
//                             </Button>
//                         ))}
//                     </View>
//                     <View style={styles.buttonRow}>
//                         <Button mode="outlined" onPress={() => setCurrentStep(2)} style={[styles.backButton, { borderColor: paperTheme.colors.primary }]} contentStyle={styles.buttonContent}>
//                             Back
//                         </Button>
//                         <Button mode="contained" onPress={handleFinalRegister} loading={loading} style={[styles.button, { flex: 1, marginLeft: 10 }]} contentStyle={styles.buttonContent}>
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
//             behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
//             <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
//                 <Text style={styles.screenTitle}>Create Account</Text>
//                 {renderContent()}
//                 <View style={styles.footer}>
//                     <Text style={styles.footerText}>Already have an account? </Text>
//                     <Button mode="elevated" onPress={() => navigation.navigate('login')} compact labelStyle={{ fontSize: 14, paddingInline: 12 }}>
//                         Login
//                     </Button>
//                 </View>
//                 <Button mode="outlined" onPress={() => navigation.navigate('phoneAuth')} style={styles.phoneButton} labelStyle={styles.phoneButtonText}>
//                     Continue with Phone
//                 </Button>
//             </ScrollView>

//             <Modal
//                 visible={isModalVisible}
//                 animationType="slide"
//                 onRequestClose={() => setModalVisible(false)}
//             >
//                 <View style={styles.modalContainer}>
//                     <View style={styles.modalHeader}>
//                         <Text style={styles.modalTitle}>Select {modalType}</Text>
//                         <Button onPress={() => setModalVisible(false)}>Close</Button>
//                     </View>
//                     <TextInput
//                         label={`Search ${modalType}...`}
//                         value={searchTerm}
//                         onChangeText={setSearchTerm}
//                         mode="outlined"
//                         style={styles.searchInput}
//                     />
//                     {isLoadingModalData ? (
//                         <ActivityIndicator style={{ marginTop: 20 }} size="large" />
//                     ) : (
//                         <FlatList
//                             data={modalData}
//                             keyExtractor={(item) => item.geonameId.toString()}
//                             renderItem={({ item }) => (
//                                 <Pressable style={styles.listItem} onPress={() => handleSelect(item)}>
//                                     <Text style={styles.listItemText}>{item.name}</Text>
//                                 </Pressable>
//                             )}
//                             ListEmptyComponent={<Text style={styles.emptyText}>No results found.</Text>}
//                         />
//                     )}
//                 </View>
//             </Modal>
//         </KeyboardAvoidingView>
//     );
// };

// const styles = StyleSheet.create({
//     fullScreen: { flex: 1 },
//     container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
//     contentContainer: { width: '100%' },
//     screenTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
//     stepTitle: { fontSize: 26, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
//     input: { marginBottom: 16 },
//     disabledInput: { backgroundColor: '#f0f0f0' },
//     button: { borderRadius: 12, elevation: 4 },
//     buttonContent: { paddingVertical: 4 },
//     buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
//     backButton: { flex: 0.5, borderRadius: 12 },
//     footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
//     footerText: { fontSize: 14 },
//     phoneButton: { marginTop: 10, alignSelf: 'stretch', borderRadius: 12 },
//     phoneButtonText: { fontSize: 16, fontWeight: '600' },
//     departmentContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, gap: 8 },
//     departmentChip: { borderRadius: 20 },
//     // Modal Styles
//     modalContainer: { flex: 1, paddingTop: 50, paddingHorizontal: 20,backgroundColor:"" },
//     modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
//     modalTitle: { fontSize: 22, fontWeight: 'bold' },
//     searchInput: { marginBottom: 10 },
//     listItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
//     listItemText: { fontSize: 18 },
//     emptyText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: 'gray' },
// });

// export default RegisterScreen;













import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Alert,
    Modal,
    TouchableOpacity,
    FlatList,
    Pressable,
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
import { useTheme } from '../../hooks/useTheme'; // Your custom theme hook

// IMPORTANT: Replace with your actual GeoNames username
const GEONAMES_USER = 'starshield';

const DEPARTMENT_OPTIONS = [
    'IT & Technology', 'Human Resources', 'Finance', 'Marketing', 'Sales', 'Operations',
];

const RegisterScreen = () => {
    const navigation = useNavigation();
    const customTheme = useTheme(); // Your custom theme
    const paperTheme = usePaperTheme(); // React Native Paper's theme

    // Create styles dynamically based on the current custom theme
    const styles = dynamicStyles(customTheme, paperTheme);

    // Reusable component for the clickable text input, using dynamic styles
    const SelectorInput = ({ label, value, onPress, disabled = false }) => (
        <TouchableOpacity onPress={onPress} disabled={disabled}>
            <View pointerEvents="none">
                <TextInput
                    label={label}
                    value={value}
                    mode="outlined"
                    editable={false}
                    style={[styles.input, disabled && styles.disabledInput]}
                    // Override Paper's default text color with custom theme
                    theme={{ colors: { text: customTheme.colors.text } }}
                    right={<TextInput.Icon icon="chevron-down" color={customTheme.colors.text} />}
                />
            </View>
        </TouchableOpacity>
    );

    const [currentStep, setCurrentStep] = useState(1);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [addressLine, setAddressLine] = useState('');
    const [department, setDepartment] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Geodata and Modal State
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedState, setSelectedState] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // --- Geonames Fetching Hooks (Unchanged Logic) ---
    useEffect(() => {
        const fetchCountries = async () => {
            if (!GEONAMES_USER || GEONAMES_USER === 'YOUR_GEONAMES_USERNAME') {
                Alert.alert('Setup Required', 'Please set your GeoNames username in the code.');
                return;
            }
            setLoadingCountries(true);
            try {
                const response = await fetch(`http://api.geonames.org/countryInfoJSON?username=${GEONAMES_USER}`);
                const data = await response.json();
                if (data.geonames) {
                    const formattedCountries = data.geonames.map(c => ({ name: c.countryName, geonameId: c.geonameId }));
                    setCountries(formattedCountries);
                }
            } catch (error) {
                console.error("Failed to fetch countries:", error);
                Alert.alert('Error', 'Could not load country data.');
            } finally {
                setLoadingCountries(false);
            }
        };
        fetchCountries();
    }, []);

    useEffect(() => {
        if (selectedCountry?.geonameId) {
            const fetchStates = async () => {
                setLoadingStates(true);
                setStates([]); setCities([]); setSelectedState(null); setSelectedCity(null);
                try {
                    const response = await fetch(`http://api.geonames.org/childrenJSON?geonameId=${selectedCountry.geonameId}&username=${GEONAMES_USER}`);
                    const data = await response.json();
                    if (data.geonames) {
                        const formattedStates = data.geonames.map(s => ({ name: s.name, geonameId: s.geonameId }));
                        setStates(formattedStates);
                    }
                } catch (error) { console.error("Failed to fetch states:", error); }
                finally { setLoadingStates(false); }
            };
            fetchStates();
        }
    }, [selectedCountry]);

    useEffect(() => {
        if (selectedState?.geonameId) {
            const fetchCities = async () => {
                setLoadingCities(true);
                setCities([]); setSelectedCity(null);
                try {
                    const response = await fetch(`http://api.geonames.org/childrenJSON?geonameId=${selectedState.geonameId}&username=${GEONAMES_USER}`);
                    const data = await response.json();
                    if (data.geonames) {
                        const formattedCities = data.geonames.map(c => ({ name: c.name, geonameId: c.geonameId }));
                        setCities(formattedCities);
                    }
                } catch (error) { console.error("Failed to fetch cities:", error); }
                finally { setLoadingCities(false); }
            };
            fetchCities();
        }
    }, [selectedState]);

    // --- Modal and Navigation Handlers (Unchanged Logic) ---
    const openModal = (type) => {
        setSearchTerm(''); setModalType(type); setModalVisible(true);
    };

    const handleSelect = (item) => {
        if (modalType === 'country') setSelectedCountry(item);
        else if (modalType === 'state') setSelectedState(item);
        else if (modalType === 'city') setSelectedCity(item);
        setModalVisible(false);
    };

    const modalData = useMemo(() => {
        let data = [];
        if (modalType === 'country') data = countries;
        if (modalType === 'state') data = states;
        if (modalType === 'city') data = cities;
        if (searchTerm) {
            return data.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return data;
    }, [modalType, countries, states, cities, searchTerm]);

    const isLoadingModalData = (
        (modalType === 'country' && loadingCountries) ||
        (modalType === 'state' && loadingStates) ||
        (modalType === 'city' && loadingCities)
    );

    const handleContinueToStep2 = () => {
        if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            return Alert.alert('Error', 'All basic fields are required');
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
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

    const handleContinueToStep3 = () => {
        if (!addressLine.trim() || !selectedCity || !selectedState || !selectedCountry) {
            return Alert.alert('Error', 'All address fields are required');
        }
        setCurrentStep(3);
    }

    const handleFinalRegister = async () => {
        if (!department.trim()) {
            return Alert.alert('Error', 'Please select your department.');
        }
        setLoading(true);
        try {
            const userCredential = await auth().createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;
            const trimmedDepartment = department.trim();
            await firestore().collection('users').doc(uid).set({
                uid,
                email: email.trim(),
                name: name.trim(),
                role: 'user',
                department: trimmedDepartment,
                notificationPreferences: { push: false, email: false },
                address: {
                    addressLine: addressLine.trim(),
                    city: selectedCity.name,
                    state: selectedState.name,
                    country: selectedCountry.name,
                },
                createdAt: firestore.FieldValue.serverTimestamp(),
            });
            await firestore().collection('departments').doc(trimmedDepartment).set({
                users: firestore.FieldValue.arrayUnion(uid),
                name: trimmedDepartment,
            }, { merge: true });

            Alert.alert('Success', 'Account created successfully!');
            navigation.replace('verification', { uid });
        } catch (error) {
            let errorMessage = 'Failed to register. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already in use. Try logging in.';
            } else {
                console.error("Registration Error:", error);
                errorMessage = error.message;
            }
            Alert.alert('Registration Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (currentStep === 1) {
            return (
                <View style={styles.contentContainer}>
                    <Text variant="titleLarge" style={styles.stepTitle}>Basic Details</Text>
                    <TextInput label="Full Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
                    <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
                    <TextInput label="Password" value={password} onChangeText={setPassword} mode="outlined" secureTextEntry={!showPassword} style={styles.input} right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(p => !p)} />} />
                    <TextInput label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} mode="outlined" secureTextEntry={!showConfirmPassword} style={styles.input} right={<TextInput.Icon icon={showConfirmPassword ? 'eye-off' : 'eye'} onPress={() => setShowConfirmPassword(p => !p)} />} />
                    <Button mode="contained" onPress={handleContinueToStep2} style={styles.button} contentStyle={styles.buttonContent}>
                        Continue
                    </Button>
                </View>
            );
        } else if (currentStep === 2) {
            return (
                <View style={styles.contentContainer}>
                    <Text variant="titleLarge" style={styles.stepTitle}>Address Details</Text>
                    <TextInput label="Address Line" value={addressLine} onChangeText={setAddressLine} mode="outlined" style={styles.input} />
                    <SelectorInput label="Country" value={selectedCountry?.name || ''} onPress={() => openModal('country')} />
                    <SelectorInput label="State" value={selectedState?.name || ''} onPress={() => openModal('state')} disabled={!selectedCountry || loadingStates} />
                    <SelectorInput label="City" value={selectedCity?.name || ''} onPress={() => openModal('city')} disabled={!selectedState || loadingCities} />
                    <View style={styles.buttonRow}>
                        <Button mode="outlined" onPress={() => setCurrentStep(1)} style={styles.backButton} contentStyle={styles.buttonContent} >
                            Back
                        </Button>
                        <Button mode="contained" onPress={handleContinueToStep3} style={[styles.button, { flex: 1, marginLeft: 10 }]} contentStyle={styles.buttonContent}>
                            Continue
                        </Button>
                    </View>
                </View>
            );
        } else if (currentStep === 3) {
            return (
                <View style={styles.contentContainer}>
                    <Text variant="titleLarge" style={styles.stepTitle}>Department</Text>
                    <Text variant="bodyLarge" style={styles.promptText}>Select your Department:</Text>
                    <View style={styles.departmentContainer}>
                        {DEPARTMENT_OPTIONS.map((dept) => (
                            <Button
                                key={dept}
                                mode={department === dept ? "contained" : "outlined"}
                                onPress={() => setDepartment(dept)}
                                style={styles.departmentChip}
                                labelStyle={{
                                    color: department === dept ? paperTheme.colors.onPrimary : paperTheme.colors.primary,
                                }}
                            >
                                {dept}
                            </Button>
                        ))}
                    </View>
                    <View style={styles.buttonRow}>
                        <Button mode="outlined" onPress={() => setCurrentStep(2)} style={styles.backButton} contentStyle={styles.buttonContent} >
                            Back
                        </Button>
                        <Button mode="contained" onPress={handleFinalRegister} loading={loading} style={[styles.button, { flex: 1, marginLeft: 10 }]} contentStyle={styles.buttonContent}>
                            {loading ? <ActivityIndicator color="#fff" /> : 'Sign Up'}
                        </Button>
                    </View>
                </View>
            );
        }
    };

    return (
        <KeyboardAvoidingView style={styles.fullScreen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Text style={styles.screenTitle}>Create Account</Text>
                {renderContent()}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <Button mode="elevated" onPress={() => navigation.navigate('login')} compact labelStyle={{ fontSize: 14, paddingInline: 12 }}>
                        Login
                    </Button>
                </View>
                <Button mode="outlined" onPress={() => navigation.navigate('phoneAuth')} style={styles.phoneButton} labelStyle={styles.phoneButtonText}>
                    Continue with Phone
                </Button>
            </ScrollView>

            <Modal visible={isModalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select {modalType}</Text>
                        <Button onPress={() => setModalVisible(false)}>Close</Button>
                    </View>
                    <TextInput label={`Search ${modalType}...`} value={searchTerm} onChangeText={setSearchTerm} mode="outlined" style={styles.searchInput} />
                    {isLoadingModalData ? (
                        <ActivityIndicator style={{ marginTop: 20 }} size="large" color={customTheme.colors.primary} />
                    ) : (
                        <FlatList
                            data={modalData}
                            keyExtractor={(item) => item.geonameId.toString()}
                            renderItem={({ item }) => (
                                <Pressable style={styles.listItem} onPress={() => handleSelect(item)}>
                                    <Text style={styles.listItemText}>{item.name}</Text>
                                </Pressable>
                            )}
                            ListEmptyComponent={<Text style={styles.emptyText}>No results found.</Text>}
                        />
                    )}
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

// Function to generate dynamic styles based on theme
const dynamicStyles = (customTheme, paperTheme) => {
    return StyleSheet.create({
        // General Container Styles (Use Custom Theme)
        fullScreen: { flex: 1, backgroundColor: customTheme.colors.background },
        container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
        contentContainer: { width: '100%' },

        // Text Styles (Use Custom Theme)
        screenTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: customTheme.colors.text },
        stepTitle: { fontSize: 26, fontWeight: '600', marginBottom: 20, textAlign: 'center', color: customTheme.colors.text },
        promptText: { marginBottom: 10, fontSize: 16, color: customTheme.colors.text },
        footerText: { fontSize: 14, color: customTheme.colors.text },

        // TextInput Styles (Use Custom Theme for background/disabled)
        input: { marginBottom: 16 },
        disabledInput: {
            backgroundColor: customTheme.dark ? '#2c2c2e' : '#f0f0f0',
        },

        // Button Styles (Use Paper Theme defaults for coloring, Custom Theme for structure)
        button: { borderRadius: 12, elevation: 4 }, // Button is contained, uses PaperTheme.colors.primary
        buttonContent: { paddingVertical: 4 },
        buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
        backButton: {
            flex: 0.5,
            borderRadius: 12,
            // Keep the border color consistent with the contained button's color
            borderColor: paperTheme.colors.primary,
        },
        departmentContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, gap: 8 },
        departmentChip: {
            borderRadius: 20,
            borderWidth: 1,
            // Ensure the border color uses Paper's primary color
            borderColor: paperTheme.colors.primary
        },
        phoneButton: { marginTop: 10, alignSelf: 'stretch', borderRadius: 12, borderColor: customTheme.colors.text },
        phoneButtonText: { fontSize: 16, fontWeight: '600', color: customTheme.colors.text },

        footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
        modalContainer: { flex: 1, paddingTop: 50, paddingHorizontal: 20, backgroundColor: customTheme.colors.background },
        modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
        modalTitle: { fontSize: 22, fontWeight: 'bold', color: customTheme.colors.text },
        searchInput: { marginBottom: 10 },
        listItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: customTheme.dark ? '#444' : '#eee' },
        listItemText: { fontSize: 18, color: customTheme.colors.text },
        emptyText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: 'gray' },
    });
};

export default RegisterScreen;