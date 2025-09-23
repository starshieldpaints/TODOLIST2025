
import React, { useState, useEffect, useContext } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Text, Button, Switch, Divider, Avatar } from "react-native-paper";
import { ThemeContext } from "../../context/ThemeContext";
import LinearGradient from "react-native-linear-gradient";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import messaging from "@react-native-firebase/messaging";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ProfileScreen({ navigation }) {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const user = auth().currentUser;

    const [name, setName] = useState("");
    const [pushNotifications, setPushNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = firestore()
            .collection("users")
            .doc(user.uid)
            .onSnapshot(
                (doc) => {
                    const data = doc.data();
                    if (data) {
                        setName(data.name || "");
                        setPushNotifications(data.notificationPreferences?.push ?? true);
                        setEmailNotifications(data.notificationPreferences?.email ?? true);
                    }
                    setLoading(false);
                },
                (error) => {
                    console.error("Error fetching profile:", error);
                    setLoading(false);
                }
            );

        return () => unsubscribe();
    }, [user]);

    // const togglePushNotifications = async (value) => {
    //     setPushNotifications(value);
    //     if (value) {
    //         await messaging().requestPermission();
    //         await messaging().subscribeToTopic("general");
    //     } else {
    //         await messaging().unsubscribeFromTopic("general");
    //     }
    // };

    const togglePushNotifications = async (value) => {
        if (!user) return;

        try {
            const userDocRef = firestore().collection('users').doc(user.uid);
            const userDoc = await userDocRef.get();
            const preferences = userDoc.exists ? userDoc.data().notificationPreferences || {} : {};
            let savedTokens = userDoc.exists ? userDoc.data().fcmTokens || [] : [];

            if (value) {
                // Request permission first
                const authStatus = await messaging().requestPermission();
                const enabled =
                    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

                if (!enabled) {
                    Alert.alert('Permission Denied', 'You denied push notifications.');
                    setPushNotifications(false);
                    return;
                }

                // Get FCM token
                const fcmToken = await messaging().getToken();

                if (!savedTokens.includes(fcmToken)) {
                    savedTokens.push(fcmToken);
                }

                await userDocRef.set(
                    {
                        fcmTokens: savedTokens,
                        notificationPreferences: { ...preferences, push: true },
                    },
                    { merge: true }
                );

                Alert.alert('Push Enabled', 'You will now receive push notifications!');
                setPushNotifications(true);

            } else {
                // Remove token from Firestore
                const fcmToken = await messaging().getToken();
                savedTokens = savedTokens.filter(token => token !== fcmToken);

                await userDocRef.set(
                    {
                        fcmTokens: savedTokens,
                        notificationPreferences: { ...preferences, push: false },
                    },
                    { merge: true }
                );

                // Optionally unsubscribe from topics
                await messaging().unsubscribeFromTopic('general');

                Alert.alert('Push Disabled', 'Push notifications have been turned off.');
                setPushNotifications(false);
            }

        } catch (error) {
            console.error('Error toggling push notifications:', error);
            Alert.alert('Error', 'Failed to update push notification settings.');
            setPushNotifications(!value); // revert switch state
        }
    };


    const toggleEmailNotifications = (value) => setEmailNotifications(value);

    const handleSave = async () => {
        if (!user) return;
        try {
            await firestore().collection("users").doc(user.uid).update({
                name,
                notificationPreferences: { push: pushNotifications, email: emailNotifications },
            });
            Alert.alert("Success", "Profile updated successfully!");
        } catch (error) {
            console.error("Error saving profile:", error);
            Alert.alert("Error", "Failed to save profile.");
        }
    };

    const handleLogout = async () => {
        try {
            await auth().signOut();
            navigation.replace("login");
        } catch (error) {
            Alert.alert("Logout Failed", error.message);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <Text style={{ color: theme.colors.text }}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <LinearGradient
                colors={theme.dark ? ["#121212", "#1F1F1F"] : ["#FFFFFF", "#F4F4F4"]}
                style={styles.container}
            >
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

                        {/* Header */}
                        <View style={styles.headerContainer}>
                            <Avatar.Icon
                                size={80}
                                icon="account-circle-outline"
                                style={{ backgroundColor: theme.colors.primary }}
                            />
                            <Text style={[styles.header, { color: theme.colors.primary }]}>Profile Settings</Text>
                        </View>

                        {/* Name Section */}
                        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                <Icon name="account" size={18} /> Name
                            </Text>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                style={[
                                    styles.input,
                                    { backgroundColor: theme.dark ? "#1F1F1F" : "#fff", color: theme.colors.text, borderColor: theme.colors.border },
                                ]}
                                placeholder="Enter your name"
                                placeholderTextColor={theme.dark ? "#AAAAAA" : "#888"}
                            />
                        </View>

                        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />

                        {/* Notifications Section */}
                        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                <Icon name="bell-outline" size={18} /> Notifications
                            </Text>
                            <View style={styles.row}>
                                <Text style={{ color: theme.colors.text, fontSize: 16 }}>Push Notifications</Text>
                                <Switch value={pushNotifications} onValueChange={togglePushNotifications} color={theme.colors.primary} />
                            </View>
                            <View style={styles.row}>
                                <Text style={{ color: theme.colors.text, fontSize: 16 }}>Email Notifications</Text>
                                <Switch value={emailNotifications} onValueChange={toggleEmailNotifications} color={theme.colors.primary} />
                            </View>
                        </View>

                        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />

                        {/* Appearance Section */}
                        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                <Icon name="palette-outline" size={18} /> Appearance
                            </Text>
                            <View style={styles.row}>
                                <Text style={{ color: theme.colors.text, fontSize: 16 }}>Dark Mode</Text>
                                <Switch value={theme.dark} onValueChange={toggleTheme} color={theme.colors.primary} />
                            </View>
                        </View>

                        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />

                        {/* Buttons */}
                        <Button
                            mode="contained"
                            onPress={handleSave}
                            buttonColor={theme.colors.primary}
                            textColor={theme.colors.text}
                            style={styles.saveButton}
                            icon="content-save-outline"
                        >
                            Save Changes
                        </Button>

                        <Button
                            mode="outlined"
                            onPress={handleLogout}
                            textColor={theme.colors.primary}
                            style={[styles.saveButton, { marginTop: 15 }]}
                            icon="logout-variant"
                        >
                            Logout
                        </Button>

                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContainer: { padding: 20, paddingBottom: 40 },
    headerContainer: { alignItems: "center", marginBottom: 30 },
    header: { fontSize: 28, fontWeight: "bold", marginTop: 10 },
    section: {
        marginBottom: 25,
        borderRadius: 16,
        padding: 15,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    divider: { marginVertical: 15, height: 1 },
    saveButton: { marginTop: 20, borderRadius: 12, paddingVertical: 10 },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
