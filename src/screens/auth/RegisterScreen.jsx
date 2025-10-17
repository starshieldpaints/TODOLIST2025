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
    // 💡 ADDED: State for phone number
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [addressLine, setAddressLine] = useState('');
    const [department, setDepartment] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
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

    useEffect(() => {
        const fetchCountries = async () => {
            if (!GEONAMES_USER || GEONAMES_USER === 'YOUR_GEONAMES_USERNAME') {
                Alert.alert('Setup Required', 'Please set your GeoNames username in the code.');
                return;
            }
            setLoadingCountries(true);
            try {
                // 🌍 FIX 1: Use HTTPS secure endpoint for country info
                const response = await fetch(`https://secure.geonames.org/countryInfoJSON?username=${GEONAMES_USER}`);
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
                    // 🌍 FIX 2: Use HTTPS secure endpoint for states/regions
                    const response = await fetch(`https://secure.geonames.org/childrenJSON?geonameId=${selectedCountry.geonameId}&username=${GEONAMES_USER}`);
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
                    // 🌍 FIX 3: Use HTTPS secure endpoint for cities
                    const response = await fetch(`https://secure.geonames.org/childrenJSON?geonameId=${selectedState.geonameId}&username=${GEONAMES_USER}`);
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
        // 💡 UPDATED: Added phoneNumber validation
        if (!name.trim() || !email.trim() || !phoneNumber.trim() || !password.trim() || !confirmPassword.trim()) {
            return Alert.alert('Error', 'All basic fields are required');
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            return Alert.alert('Invalid Email', 'Please enter a valid email address');
        }
        // Basic phone number validation (can be enhanced)
        if (!/^\+?[0-9\s-]{7,15}$/.test(phoneNumber.trim())) {
            return Alert.alert('Invalid Phone Number', 'Please enter a valid phone number (7-15 digits, optional +).');
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

            // 💡 UPDATED: Added phoneNumber to the Firestore document
            await firestore().collection('users').doc(uid).set({
                uid,
                email: email.trim(),
                name: name.trim(),
                phoneNumber: phoneNumber.trim(), // 👈 ADDED HERE
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
                    {/* 💡 ADDED: Phone number input field */}
                    <TextInput
                        label="Phone Number"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        mode="outlined"
                        keyboardType="phone-pad"
                        style={styles.input}
                        // Suggesting a placeholder for clarity on format
                        placeholder="+91 "
                    />
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

const dynamicStyles = (customTheme, paperTheme) => {
    return StyleSheet.create({
        fullScreen: { flex: 1, backgroundColor: customTheme.colors.background },
        container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
        contentContainer: { width: '100%' },
        screenTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: customTheme.colors.text },
        stepTitle: { fontSize: 26, fontWeight: '600', marginBottom: 20, textAlign: 'center', color: customTheme.colors.text },
        promptText: { marginBottom: 10, fontSize: 16, color: customTheme.colors.text },
        footerText: { fontSize: 14, color: customTheme.colors.text },
        input: { marginBottom: 16 },
        disabledInput: {
            backgroundColor: customTheme.dark ? '#2c2c2e' : '#f0f0f0',
        },
        button: { borderRadius: 12, elevation: 4 },
        buttonContent: { paddingVertical: 4 },
        buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
        backButton: {
            flex: 0.5,
            borderRadius: 12,
            borderColor: paperTheme.colors.primary,
        },
        departmentContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, gap: 8 },
        departmentChip: {
            borderRadius: 20,
            borderWidth: 1,
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