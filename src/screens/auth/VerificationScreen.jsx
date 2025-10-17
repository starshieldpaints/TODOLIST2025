import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    BackHandler,
    Animated,
    Alert,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';

const VerificationScreen = () => {
    const navigation = useNavigation();
    const theme = useTheme();

    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(30);
    const [currentUser, setCurrentUser] = useState(auth().currentUser);

    const progressAnim = useRef(new Animated.Value(0)).current;
    const timerRef = useRef(null);
    const pollRef = useRef(null);
    const emailSentRef = useRef(false);

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => true;
            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [])
    );


    const startResendTimer = useCallback(() => {
        setResendTimer(30);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setResendTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const startProgressBar = useCallback(() => {
        progressAnim.setValue(0);
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 30000,
            useNativeDriver: false,
        }).start();
    }, [progressAnim]);

    useEffect(() => {
        pollRef.current = setInterval(async () => {
            const user = auth().currentUser;
            if (!user) return;

            try {
                await user.reload();
                setCurrentUser(user);

                if (user.emailVerified) {
                    clearInterval(pollRef.current);
                    clearInterval(timerRef.current);
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'user' }],
                    });
                }
            } catch (err) {
                console.error('Email verification poll failed:', err);
            }
        }, 3000);

        return () => {
            clearInterval(pollRef.current);
            clearInterval(timerRef.current);
        };
    }, [navigation]);

    useEffect(() => {
        if (!currentUser || currentUser.emailVerified) return;

        if (!emailSentRef.current) {
            emailSentRef.current = true;
            currentUser
                .sendEmailVerification()
                .then(() => {
                    startResendTimer();
                    startProgressBar();
                })
                .catch(err => {
                    console.error('Failed to send initial email:', err.code, err.message);
                    if (err.code === 'auth/too-many-requests') {
                        Alert.alert(
                            'Too Many Requests',
                            'You have requested too many emails. Please wait a few minutes before trying again.'
                        );
                    }
                });
        }
    }, [currentUser, startResendTimer, startProgressBar]);

    const resendEmail = async () => {
        if (resendTimer > 0 || !currentUser) return;

        setLoading(true);
        try {
            await currentUser.sendEmailVerification();
            startResendTimer();
            startProgressBar();
        } catch (err) {
            console.error('Resend failed:', err.code, err.message);
            if (err.code === 'auth/too-many-requests') {
                Alert.alert(
                    'Too Many Requests',
                    'You have requested too many emails. Please wait a few minutes before trying again.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    if (!currentUser) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: theme.colors.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.container}>
                <View style={[styles.box, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.title, { color: theme.colors.primary }]}>Verify Your Email</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.text }]}>
                        A verification email has been sent to:
                    </Text>
                    <Text style={[styles.emailText, { color: theme.colors.text }]}>{currentUser.email}</Text>

                    <View style={styles.progressContainer}>
                        <Animated.View style={[styles.progressBar, { backgroundColor: theme.colors.primary, width: progressWidth }]} />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.colors.primary, opacity: resendTimer === 0 ? 1 : 0.6 }]}
                        onPress={resendEmail}
                        disabled={resendTimer > 0 || loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{resendTimer === 0 ? 'Resend Email' : `Resend in ${resendTimer}s`}</Text>}
                    </TouchableOpacity>

                    <Text style={[styles.note, { color: theme.colors.text }]}>
                        Please check your inbox and spam folder. Once verified, you’ll be redirected automatically 🚀
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    box: { borderRadius: 12, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 5 },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
    subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 8 },
    emailText: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
    button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    note: { fontSize: 14, textAlign: 'center', marginTop: 24, lineHeight: 20 },
    progressContainer: { height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
    progressBar: { height: 8, borderRadius: 4 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default VerificationScreen;
