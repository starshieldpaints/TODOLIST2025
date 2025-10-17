import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import {
    TextInput,
    Button,
    Text,
    useTheme as usePaperTheme,
} from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme'; // your custom hook

const ForgotPasswordScreen = () => {
    const navigation = useNavigation();
    const customTheme = useTheme();
    const paperTheme = usePaperTheme();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePasswordReset = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email.');
            return;
        }

        setLoading(true);
        try {
            await auth().sendPasswordResetEmail(email.trim());
            Alert.alert(
                'Check your email',
                'If an account exists for that email, you will receive a reset link.'
            );
            navigation.goBack(); // return to login screen
        } catch (error) {
            console.error(error);
            switch (error.code) {
                case 'auth/invalid-email':
                    Alert.alert('Error', 'Invalid email format.');
                    break;
                case 'auth/user-not-found':
                    Alert.alert('Error', 'No user found with that email.');
                    break;
                default:
                    Alert.alert('Error', 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.fullScreen, { backgroundColor: customTheme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.container}>
                <Text style={styles.title}>Reset Password</Text>

                <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                />

                <Button
                    mode="contained"
                    onPress={handlePasswordReset}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                >
                    Send Reset Link
                </Button>

                <Button
                    mode="text"
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    labelStyle={{ fontSize: 14 }}
                >
                    Back to Login
                </Button>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    fullScreen: { flex: 1 },
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 32,
        textAlign: 'center',
    },
    input: {
        marginBottom: 16,
    },
    button: {
        borderRadius: 12,
        marginTop: 8,
    },
    buttonContent: {
        paddingVertical: 6,
    },
    backButton: {
        alignSelf: 'center',
        marginTop: 16,
    },
});

export default ForgotPasswordScreen;
