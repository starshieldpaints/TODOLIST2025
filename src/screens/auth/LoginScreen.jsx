import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Alert,
    KeyboardAvoidingView, // Added for better keyboard handling
    Platform,
    ScrollView, // Added for scroll capability
} from 'react-native';
import {
    TextInput,
    Button,
    Text, // Using RNP Text component
    ActivityIndicator,
    useTheme as usePaperTheme, // For Paper-specific colors if needed
} from 'react-native-paper'; // 👈 Import Paper components
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme'; // your custom theme hook

const LoginScreen = () => {
    const navigation = useNavigation();
    const customTheme = useTheme(); // Your custom theme for background
    const paperTheme = usePaperTheme(); // RNP theme for component styling

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // 💡 Added state for password visibility (matching register screen)
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }
        setLoading(true);
        try {
            const userCredential = await auth().signInWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;

            const userDoc = await firestore().collection('users').doc(uid).get();
            if (!userDoc.exists) {
                Alert.alert('Error', 'User not found. Try signing up.');
                // ⚠️ IMPORTANT: Sign out user if doc is missing to prevent half-login state
                await auth().signOut();
                setLoading(false);
                return;
            }

            const { role } = userDoc.data();

            switch (role) {
                case 'user':
                    navigation.replace('user');
                    break;
                case 'admin':
                    navigation.replace('admin');
                    break;
                case 'superadmin':
                    navigation.replace('superAdmin');
                    break;
                default:
                    Alert.alert('Error', 'Role not recognized');
            }
        } catch (error) {
            let errorMessage = 'Login Failed. Please check your credentials.';
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                errorMessage = 'Invalid email or password.';
            }
            Alert.alert('Login Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.fullScreen, { backgroundColor: customTheme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

                {/* Replaced Text with RNP Text, applying screenTitle style */}
                <Text style={styles.screenTitle}>Welcome Back</Text>

                {/* Replaced native TextInput with RNP TextInput */}
                <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                {/* Replaced native TextInput with RNP TextInput and added eye toggle */}
                <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    style={styles.input}
                    right={
                        <TextInput.Icon
                            icon={showPassword ? 'eye-off' : 'eye'}
                            onPress={() => setShowPassword(prev => !prev)}
                        />
                    }
                />

                {/* Replaced TouchableOpacity with RNP Button */}
                <Button
                    mode="contained"
                    onPress={handleLogin}
                    loading={loading}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                    disabled={loading}
                >
                    

                     Login
                </Button>

                {/* Added Forgot Password button (common UX) 
                    and used RNP Button in text mode.
                */}
                <Button
                    mode="text"
                    onPress={() => navigation.navigate('forgotPassword')}
                    style={styles.forgotPasswordButton}
                    labelStyle={styles.forgotPasswordButtonText}
                    compact
                >
                    Forgot Password?
                </Button>

                <View style={styles.footer}>
                    {/* Used RNP Text */}
                    <Text style={styles.footerText}>Don't have an account? </Text>

                    {/* Replaced TouchableOpacity with RNP Button in text mode */}
                    <Button
                        mode="elevated"
                        onPress={() => navigation.navigate('register')}
                        compact
                        labelStyle={{ fontSize: 14, paddingInline:8 }}
                    >
                        Sign Up
                    </Button>
                </View>

                {/* Replaced TouchableOpacity with RNP Button in outlined mode */}
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
    screenTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 40,
        textAlign: 'center'
    },
    input: { marginBottom: 16 },
    button: { borderRadius: 12, elevation: 4, marginTop: 16 },
    buttonContent: { paddingVertical: 4 },
    forgotPasswordButton: { alignSelf: 'flex-end' },
    forgotPasswordButtonText: { fontSize: 14, fontWeight: '500' },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
    footerText: { fontSize: 14 },
    phoneButton: { marginTop: 24, alignSelf: 'stretch', borderRadius: 12 },
    phoneButtonText: { fontSize: 16, fontWeight: '600' },
});

export default LoginScreen;