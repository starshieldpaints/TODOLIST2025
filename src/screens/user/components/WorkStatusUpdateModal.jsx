import React, { useState, useEffect, useContext } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Modal, ActivityIndicator, Alert, Image } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../../../context/ThemeContext';

const useScreenWidth = () => Dimensions.get('window').width;

const WORK_STATUSES = [
    { label: 'Work from Home', value: 'wfh', icon: 'home-outline' },
    { label: 'Office', value: 'office', icon: 'business-outline' },
    { label: 'Field', value: 'field', icon: 'navigate-outline' },
];

const WorkStatusUpdateModal = ({ isVisible, onClose, currentWorkStatus }) => {
    const { theme } = useContext(ThemeContext);
    const screenWidth = useScreenWidth();
    const scale = screenWidth / 375;
    const currentUserId = auth().currentUser?.uid;

    const [selectedStatus, setSelectedStatus] = useState(currentWorkStatus || 'wfh');
    const [fieldImageUri, setFieldImageUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    useEffect(() => {
        if (isVisible) {

            setSelectedStatus(currentWorkStatus || 'wfh');
            setFieldImageUri(null);
            setStep(1);
        }
    }, [isVisible, currentWorkStatus]);

    const selectPhoto = () => {
        const options = {
            mediaType: 'photo',
            quality: 0.5,
            saveToPhotos: false,
        };

        Alert.alert(
            "Upload Field Photo",
            "Choose a method to upload your field picture.",
            [
                { text: "Take Photo", onPress: () => launchCamera(options, handleImageResponse) },
                { text: "Choose from Gallery", onPress: () => launchImageLibrary(options, handleImageResponse) },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const handleImageResponse = (response) => {
        if (response.didCancel) {
            console.log('User cancelled image picker');
        } else if (response.errorCode) {
            console.error('ImagePicker Error: ', response.errorMessage);
            Alert.alert("Error", `Failed to get image: ${response.errorMessage}`);
        } else if (response.assets && response.assets.length > 0) {
            const uri = response.assets[0].uri;
            setFieldImageUri(uri);
        }
    };

    const uploadImage = async (uri, userId) => {
        if (!uri) return null;

        const timestamp = new Date().getTime();
        const filename = `users/${userId}/field_images/${timestamp}.jpg`;
        const storageRef = storage().ref(filename);

        const task = storageRef.putFile(uri);

        try {
            await task;
            const downloadURL = await storageRef.getDownloadURL();

            return {
                url: downloadURL,
                path: filename,
                uploadedAt: firestore.FieldValue.serverTimestamp(),
            };
        } catch (e) {
            console.error("Image upload failed:", e);
            throw new Error("Failed to upload image. Please check permissions and network.");
        }
    };

    const handleSubmit = async () => {
        if (!currentUserId || loading) return;
        setLoading(true);

        try {
            let imageInfo = null;
            const userDocRef = firestore().collection('users').doc(currentUserId);

            if (selectedStatus === 'field') {
                if (!fieldImageUri) {
                    Alert.alert("Error", "Please upload a field photo to set your status as 'Field'.");
                    setLoading(false);
                    return;
                }

                imageInfo = await uploadImage(fieldImageUri, currentUserId);
            }

            const updatePayload = {
                workStatus: selectedStatus,
                workStatusUpdatedAt: firestore.FieldValue.serverTimestamp(),
            };

            if (selectedStatus === 'field' && imageInfo) {

                updatePayload.fieldImage = imageInfo;
            } else {

                updatePayload.fieldImage = firestore.FieldValue.delete();
            }

            await userDocRef.update(updatePayload);

            Alert.alert("Success", `Work status updated to ${selectedStatus.toUpperCase()}!`);
            onClose();

        } catch (e) {
            console.error("Work status update failed:", e);
            Alert.alert("Error", e.message || "Failed to update work status. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const renderStatusSelection = () => (
        <View>
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: 18 * scale }]}>
                Update Work Status
            </Text>
            <Text style={{ color: theme.colors.text, marginTop: 8 * scale, fontSize: 14 * scale, marginBottom: 12 * scale, fontWeight: '500' }}>
                Where are you working from today?
            </Text>

            {WORK_STATUSES.map(status => (
                <Pressable
                    key={status.value}
                    onPress={() => setSelectedStatus(status.value)}
                    style={[
                        styles.statusOption,
                        {
                            borderColor: selectedStatus === status.value ? theme.colors.primary : theme.colors.border,
                            backgroundColor: selectedStatus === status.value ? theme.colors.primary + '20' : theme.colors.card,
                            padding: 12 * scale,
                            borderRadius: 10 * scale,
                            marginBottom: 8 * scale,
                        }
                    ]}
                >
                    <Ionicons
                        name={status.icon}
                        size={24 * scale}
                        color={selectedStatus === status.value ? theme.colors.primary : theme.colors.text}
                        style={{ marginRight: 10 * scale }}
                    />
                    <Text
                        style={[
                            styles.statusText,
                            {
                                color: selectedStatus === status.value ? theme.colors.primary : theme.colors.text,
                                fontSize: 16 * scale,
                                fontWeight: '600'
                            }
                        ]}
                    >
                        {status.label}
                    </Text>
                </Pressable>
            ))}

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 * scale }}>
                <Pressable style={[styles.modalButton, { backgroundColor: '#bdc3c7', flex: 1, marginRight: 6 * scale }]} onPress={onClose}>
                    <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Cancel</Text>
                </Pressable>
                <Pressable
                    style={[styles.modalButton, { backgroundColor: theme.colors.primary, flex: 1, marginLeft: 6 * scale }]}
                    onPress={() => {
                        if (selectedStatus === 'field') {
                            setStep(2);
                        } else {
                            handleSubmit();
                        }
                    }}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>
                            {selectedStatus === 'field' ? ' Upload Photo' : 'Update Status'}
                        </Text>
                    )}
                </Pressable>
            </View>
        </View>
    );

    const renderPhotoUpload = () => (
        <View>
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: 18 * scale }]}>
                Field Photo Required
            </Text>
            <Text style={{ color: theme.colors.text, marginTop: 8 * scale, fontSize: 14 * scale, marginBottom: 16 * scale, fontWeight: '500' }}>
                Please take a photo to verify your location for 'Field' status.
            </Text>

            <Pressable
                style={[styles.photoButton, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary, borderWidth: 1, padding: 20 * scale, borderRadius: 10 * scale, }]}
                onPress={selectPhoto}
                disabled={loading}
            >
                <Ionicons name="camera-outline" size={30 * scale} color={theme.colors.primary} />
                <Text style={{ color: theme.colors.primary, fontSize: 16 * scale, fontWeight: '600', marginTop: 8 * scale }}>
                    {fieldImageUri ? 'Change Photo' : 'Take or Select Photo'}
                </Text>
            </Pressable>

            {fieldImageUri && (
                <View style={{ marginTop: 16 * scale, alignItems: 'center' }}>
                    <Image source={{ uri: fieldImageUri }} style={{ width: 100 * scale, height: 100 * scale, borderRadius: 8 * scale }} />
                    <Text style={{ color: 'green', marginTop: 4 * scale, fontSize: 12 * scale }}>Photo selected!</Text>
                </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 * scale }}>
                <Pressable
                    style={[styles.modalButton, { backgroundColor: '#bdc3c7', flex: 1, marginRight: 6 * scale }]}
                    onPress={() => setStep(1)}
                    disabled={loading}
                >
                    <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Back</Text>
                </Pressable>
                <Pressable
                    style={[styles.modalButton, { backgroundColor: theme.colors.primary, flex: 1, marginLeft: 6 * scale }]}
                    onPress={handleSubmit}
                    disabled={loading || !fieldImageUri}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>
                            Submit Status
                        </Text>
                    )}
                </Pressable>
            </View>
        </View>
    );

    return (
        <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalBackground}>
                <View style={[styles.modalContainer, { backgroundColor: theme.colors.card, padding: 20 * scale, borderRadius: 12 * scale }]}>
                    {step === 1 ? renderStatusSelection() : renderPhotoUpload()}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContainer: {
        width: '85%',
        maxWidth: 400
    },
    modalTitle: {
        fontWeight: 'bold',
        marginBottom: 8
    },
    statusOption: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
    },
    statusText: {
        marginLeft: 8,
        fontWeight: '600',
    },
    photoButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButton: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: 'bold'
    },
});

export default WorkStatusUpdateModal;