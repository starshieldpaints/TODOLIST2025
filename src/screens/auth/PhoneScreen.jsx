import React, { useState, useContext } from 'react';
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
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../../context/ThemeContext';

const COLLECTIONS = { USERS: 'users' };
const USER_ROLES = { USER: 'user', ADMIN: 'admin', SUPERADMIN: 'superadmin' };
const DEFAULT_ADMIN_ID = 'MWtoCbA37jWTJKYa6yUsdDpIdd43';

export default function PhoneAuthScreen() {
    const { theme } = useContext(ThemeContext); // 🔹 Use theme
    const navigation = useNavigation();

    const [step, setStep] = useState('phone');
    const [loading, setLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [confirmation, setConfirmation] = useState(null);
    const [otp, setOtp] = useState('');
    const [userName, setUserName] = useState('');

    const sendOtp = async () => {
        if (!phoneNumber.trim()) return Alert.alert('Error', 'Enter your phone number');
        setLoading(true);
        try {
            const confirm = await auth().signInWithPhoneNumber(`+91${phoneNumber}`);
            setConfirmation(confirm);
            setStep('otp');
        } catch (err) {
            console.error(err);
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async () => {
        if (!otp.trim()) return Alert.alert('Error', 'Enter OTP');
        setLoading(true);
        try {
            const credential = await confirmation.confirm(otp);
            const firebaseUser = credential.user;
            const userDoc = await firestore().collection(COLLECTIONS.USERS).doc(firebaseUser.uid).get();
            if (userDoc.exists) {
                const { role } = userDoc.data();
                redirectByRole(role);
            } else {
                setStep('name');
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const saveUser = async () => {
        if (!userName.trim()) return Alert.alert('Error', 'Enter your name');
        setLoading(true);
        try {
            const firebaseUser = auth().currentUser;
            if (!firebaseUser) return Alert.alert('Error', 'User not found');

            const userData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                role: USER_ROLES.USER,
                name: userName.trim(),
                adminId: DEFAULT_ADMIN_ID,
                notificationPreferences: { push: true, email: false },
                createdAt: firestore.FieldValue.serverTimestamp(),
                phone: firebaseUser.phoneNumber,
            };

            await firestore().collection(COLLECTIONS.USERS).doc(firebaseUser.uid).set(userData);
            redirectByRole(USER_ROLES.USER);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to save user');
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
                navigation.reset({ index: 0, routes: [{ name: 'phoneAuth' }] });
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={[styles.box, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.title, { color: '#FF0000' }]}>Task Manager</Text>
                    <Text style={[styles.subtitle, { color: '#88C540' }]}>Login / Signup with Phone</Text>

                    {step === 'phone' && (
                        <>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.primary, color: theme.colors.text }]}
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                placeholder="Enter phone number"
                                placeholderTextColor={theme.colors.border}
                                keyboardType="phone-pad"
                                maxLength={10}
                            />
                            <TouchableOpacity style={[styles.button, { backgroundColor: '#FF0000' }]} onPress={sendOtp} disabled={loading}>
                                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Send OTP</Text>}
                            </TouchableOpacity>
                        </>
                    )}

                    {step === 'otp' && (
                        <>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.primary, color: theme.colors.text }]}
                                value={otp}
                                onChangeText={setOtp}
                                placeholder="Enter OTP"
                                placeholderTextColor={theme.colors.border}
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                            <TouchableOpacity style={[styles.button, { backgroundColor: '#FF0000' }]} onPress={verifyOtp} disabled={loading}>
                                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
                            </TouchableOpacity>
                        </>
                    )}

                    {step === 'name' && (
                        <>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.primary, color: theme.colors.text }]}
                                value={userName}
                                onChangeText={setUserName}
                                placeholder="Enter your name"
                                placeholderTextColor={theme.colors.border}
                            />
                            <TouchableOpacity style={[styles.button, { backgroundColor: '#FF0000' }]} onPress={saveUser} disabled={loading}>
                                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Complete Registration</Text>}
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    box: { borderRadius: 12, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 5 },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
    input: { borderWidth: 1, borderRadius: 8, padding: 16, marginBottom: 16 },
    button: { borderRadius: 8, padding: 16, alignItems: 'center' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

