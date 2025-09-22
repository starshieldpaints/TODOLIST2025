// RegisterScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';

const DEFAULT_ADMIN_ID = 'MWtoCbA37jWTJKYa6yUsdDpIdd43';

const RegisterScreen = () => {
    const navigation = useNavigation();
    const theme = useTheme();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        // ---- Validation ----
        if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            return Alert.alert('Error', 'All fields are required');
        }

        // Simple email regex
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

        setLoading(true);

        try {
            // Create user in Firebase Auth
            const userCredential = await auth().createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;

            // Save user in Firestore with default structure
            await firestore().collection('users').doc(uid).set({
                uid,
                email,
                name: name.trim(),
                role: 'user',
                adminId: DEFAULT_ADMIN_ID,
                notificationPreferences: { push: true, email: false },
                createdAt: firestore.FieldValue.serverTimestamp(),
            });

            Alert.alert('Success', 'Account created successfully!');
            navigation.replace('verification', { uid }); // Redirect to verify
        } catch (error) {
            // ---- Firebase specific error handling ----
            let errorMessage = 'Failed to register. Please try again.';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already in use. Try logging in.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak. Use at least 6 characters.';
                    break;
                default:
                    errorMessage = error.message;
            }
            Alert.alert('Registration Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: theme.colors.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Create Account</Text>

                <TextInput
                    placeholder="Full Name"
                    placeholderTextColor={theme.colors.text}
                    value={name}
                    onChangeText={setName}
                    style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary, color: theme.colors.text }]}
                />

                <TextInput
                    placeholder="Email"
                    placeholderTextColor={theme.colors.text}
                    value={email}
                    onChangeText={setEmail}
                    style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary, color: theme.colors.text }]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TextInput
                    placeholder="Password"
                    placeholderTextColor={theme.colors.text}
                    value={password}
                    onChangeText={setPassword}
                    style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary, color: theme.colors.text }]}
                    secureTextEntry
                />

                <TextInput
                    placeholder="Confirm Password"
                    placeholderTextColor={theme.colors.text}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary, color: theme.colors.text }]}
                    secureTextEntry
                />

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#FF0000' }]}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.colors.text }]}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('login')}>
                        <Text style={[styles.footerText, { color: theme.colors.primary }]}>Login</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('phoneAuth')} style={styles.phoneButton}>
                    <Text style={[styles.phoneButtonText, { color: theme.colors.primary,borderColor:theme.colors.border}]}>Continue with Phone</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    title: { fontSize: 32, fontWeight: 'bold', marginBottom: 40, textAlign: 'center' },
    input: { height: 50, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1 },
    button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
    footerText: { fontSize: 14 },
    phoneButton: { marginTop: 24, alignItems: 'center' },
    phoneButtonText: { fontSize: 16, fontWeight: '600' },
});

export default RegisterScreen;
