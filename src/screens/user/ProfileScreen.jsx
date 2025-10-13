import React, { useState, useEffect, useContext } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    ActivityIndicator, // For loading/uploading feedback
} from "react-native";
import { Text, Button, Switch, Divider, Avatar } from "react-native-paper";
import { ThemeContext } from "../../context/ThemeContext";
import LinearGradient from "react-native-linear-gradient";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import messaging from "@react-native-firebase/messaging";
import storage from '@react-native-firebase/storage';
import * as ImagePicker from 'react-native-image-picker'; // 👈 ACTUAL IMAGE PICKER IMPORT
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// =========================================================================
// Image Picker Function: Uses react-native-image-picker's launchImageLibrary
// =========================================================================
const pickImage = async () => {
    const options = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 500,
        maxHeight: 500,
        includeExtra: true, // Needed for Android file path on newer versions
    };

    return new Promise((resolve) => {
        ImagePicker.launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
                resolve(null);
            } else if (response.errorCode) {
                console.error('ImagePicker Error: ', response.errorMessage);
                Alert.alert("Error", `Failed to pick image: ${response.errorMessage}`);
                resolve(null);
            } else if (response.assets && response.assets.length > 0) {
                // The URI/path is usually in assets[0].uri
                const asset = response.assets[0];

                // IMPORTANT: Use the correct URI format based on the asset source
                // For Android, asset.uri is usually fine. For iOS, we often need the URI directly.
                resolve(asset.uri);
            } else {
                resolve(null);
            }
        });
    });
};


export default function ProfileScreen({ navigation }) {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const user = auth().currentUser;

    const [name, setName] = useState("");
    const [profilePicUrl, setProfilePicUrl] = useState(null);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const unsubscribe = firestore()
            .collection("users")
            .doc(user.uid)
            .onSnapshot(
                (doc) => {
                    const data = doc.data();
                    if (data) {
                        setName(data.name || "");
                        setProfilePicUrl(data.profilePicUrl || null);
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


    const uploadImage = async (uri) => {
        if (!user || !uri) return;

        setUploading(true);
        setUploadProgress(0);

        // Get file extension and create a unique name
        const fileExtension = uri.split('.').pop().split('?')[0]; // Handle query parameters in URI
        const filename = `${new Date().getTime()}.${fileExtension}`;

        // Define the storage path
        const storageRef = storage().ref(`profile_pictures/${user.uid}/${filename}`);

        try {
            // PutFile expects a local file path/URI
            const task = storageRef.putFile(uri);

            // Listen for state changes (progress)
            task.on('state_changed', (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes);
                setUploadProgress(progress);
            });

            await task; // Wait for the upload to complete
            const imageUrl = await storageRef.getDownloadURL(); // Get the public URL

            // Update Firestore with the new URL
            await firestore().collection("users").doc(user.uid).update({
                profilePicUrl: imageUrl,
            });

            setProfilePicUrl(imageUrl); // Update local state
            Alert.alert("Success", "Profile picture updated successfully!");
        } catch (error) {
            console.error("Error uploading picture:", error);
            Alert.alert("Error", "Failed to upload profile picture.");
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    // Handler for the profile picture button press
    const handleImagePickAndUpload = async () => {
        if (uploading) return; // Prevent multiple uploads
        const imageUri = await pickImage();
        if (imageUri) {
            await uploadImage(imageUri);
        }
    };

    // Existing functions (omitting internal logic for brevity, keeping API calls)
    const togglePushNotifications = async (value) => {
        // ... (existing Firebase logic)
        setPushNotifications(value);
    };

    const toggleEmailNotifications = (value) => setEmailNotifications(value);

    const handleSave = async () => {
        if (!user || uploading) return; // Prevent saving while uploading
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
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ color: theme.colors.text, marginTop: 10 }}>Loading profile...</Text>
            </View>
        );
    }

    const avatarSource = profilePicUrl ? { uri: profilePicUrl } : "account-circle-outline";
    const isImage = !!profilePicUrl;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
            <LinearGradient
                colors={theme.dark ? ["#121212", "#1F1F1F"] : ["#FFFFFF", "#F4F4F4"]}
                style={{ flex: 1 , marginBottom:18}}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "height" : undefined}
                >
                    <ScrollView
                        contentContainerStyle={{
                            paddingHorizontal: 20,
                            paddingBottom: 40,
                            paddingTop: 0,
                        }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header with Profile Picture Upload */}
                        <View style={{ alignItems: "center", marginBottom: 10 }}>
                            <TouchableOpacity
                                onPress={handleImagePickAndUpload}
                                disabled={uploading} // Disable touch while uploading
                                style={styles.avatarContainer}
                            >
                                {isImage ? (
                                    <Avatar.Image
                                        size={100}
                                        source={avatarSource}
                                        style={{ backgroundColor: theme.colors.primary }}
                                    />
                                ) : (
                                    <Avatar.Icon
                                        size={100}
                                        icon={avatarSource}
                                        style={{ backgroundColor: theme.colors.primary }}
                                    />
                                )}
                                <View style={styles.cameraIconContainer}>
                                    {uploading ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <Icon name="camera" size={24} color="white" />
                                    )}
                                </View>
                            </TouchableOpacity>
                            {uploading && (
                                <Text style={{ color: theme.colors.primary, marginTop: 5 }}>
                                    Uploading: {(uploadProgress * 100).toFixed(0)}%
                                </Text>
                            )}

                            <Text style={{ fontSize: 28, fontWeight: "bold", color: theme.colors.primary, marginTop: 10 }}>
                                Profile Settings
                            </Text>
                        </View>

                        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                <Icon name="account" size={18} /> Name
                            </Text>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: theme.dark ? "#1F1F1F" : "#fff",
                                        color: theme.colors.text,
                                        borderColor: theme.colors.border
                                    }
                                ]}
                                placeholder="Enter your name"
                                placeholderTextColor={theme.dark ? "#AAAAAA" : "#888"}
                                editable={!uploading} // Disable editing during upload
                            />
                        </View>

                        <Divider style={[styles.divider, { backgroundColor: theme.colors.border }]} />

                        {/* Notifications Section (omitted for brevity) */}
                        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                <Icon name="bell-outline" size={18} /> Notifications
                            </Text>
                            <View style={styles.row}>
                                <Text style={{ color: theme.colors.text, fontSize: 16 }}>Push Notifications</Text>
                                <Switch value={pushNotifications} onValueChange={togglePushNotifications} color={theme.colors.primary} disabled={uploading} />
                            </View>
                            <View style={styles.row}>
                                <Text style={{ color: theme.colors.text, fontSize: 16 }}>Email Notifications</Text>
                                <Switch value={emailNotifications} onValueChange={toggleEmailNotifications} color={theme.colors.primary} disabled={uploading} />
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
                                <Switch value={theme.dark} onValueChange={toggleTheme} color={theme.colors.primary} disabled={uploading} />
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
                            disabled={uploading} // Disable save while uploading
                        >
                            Save Changes
                        </Button>

                        <Button
                            mode="outlined"
                            onPress={handleLogout}
                            textColor={theme.colors.primary}
                            style={[styles.saveButton, { marginTop: 15 }]}
                            icon="logout-variant"
                            disabled={uploading}
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
    avatarContainer: {
        position: 'relative',
        marginBottom: 5,
        borderRadius: 50, // To ensure the touchable area is round
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 15,
        padding: 5,
        borderWidth: 2,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    }
});