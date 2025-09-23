import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme'; // your theme hook

const LoginScreen = () => {
    const navigation = useNavigation();
    const theme = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }
        setLoading(true);
        try {
            const userCredential = await auth().signInWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;

            const userDoc = await firestore().collection('users').doc(uid).get();
            if (!userDoc.exists) {
                Alert.alert('Error', 'User not found');
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
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Task Manager App</Text>

            <TextInput
                placeholder="Email"
                placeholderTextColor={theme.colors.text}
                value={email}
                onChangeText={setEmail}
                style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.primary }]}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                placeholder="Password"
                placeholderTextColor={theme.colors.text}
                value={password}
                onChangeText={setPassword}
                style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.primary }]}
                secureTextEntry
            />

            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={handleLogin}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.colors.text }]}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('register')}>
                    <Text style={[styles.footerText, { color: theme.colors.primary }]}>Sign Up</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('phoneAuth')} style={styles.phoneButton}>
                <Text style={[styles.phoneButtonText, { color: theme.colors.primary }]}>Continue with Phone</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 40,
        textAlign: 'center',
    },
    input: {
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    button: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    footerText: {
        fontSize: 14,
    },
    phoneButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    phoneButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default LoginScreen;
