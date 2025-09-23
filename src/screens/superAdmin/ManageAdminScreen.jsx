import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    FlatList,
    Pressable,
    StyleSheet,
    Modal,
    TextInput,
    Alert,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Hook for responsive scaling
const useScreenWidth = () => {
    const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
    useEffect(() => {
        const onChange = ({ window }) => setScreenWidth(window.width);
        const sub = Dimensions.addEventListener('change', onChange);
        return () => sub.remove();
    }, []);
    return screenWidth;
};

const ManageAdminScreen = () => {
    const { theme } = useContext(ThemeContext);
    const screenWidth = useScreenWidth();
    const scale = screenWidth / 375;

    const [admins, setAdmins] = useState([]);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');

    // Fetch all admins
    useEffect(() => {
        const unsubscribe = firestore()
            .collection('users')
            .where('role', '==', 'admin')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAdmins(data);
            });

        return () => unsubscribe();
    }, []);

    // Open edit modal
    const handleEdit = (admin) => {
        setSelectedAdmin(admin);
        setEditName(admin.name);
        setEditEmail(admin.email);
        setEditModalVisible(true);
    };

    // Save edits
    const saveEdit = async () => {
        if (!selectedAdmin) return;
        try {
            await firestore().collection('users').doc(selectedAdmin.id).update({
                name: editName,
                email: editEmail,
            });
            setEditModalVisible(false);
            setSelectedAdmin(null);
            setEditName('');
            setEditEmail('');
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to update admin.');
        }
    };

    // Delete admin
    const deleteAdmin = (adminId) => {
        Alert.alert(
            'Delete Admin',
            'Are you sure you want to delete this admin?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await firestore().collection('users').doc(adminId).delete();
                        } catch (err) {
                            console.error(err);
                            Alert.alert('Error', 'Failed to delete admin.');
                        }
                    },
                },
            ]
        );
    };

    // Render a single admin
    const renderAdminItem = ({ item }) => (
        <View style={[styles.adminCard, { backgroundColor: theme.colors.card, padding: 16 * scale, borderRadius: 12 * scale }]}>
            <View style={styles.adminHeader}>
                <Text style={[styles.adminName, { color: theme.colors.text, fontSize: 16 * scale }]}>{item.name}</Text>
                <Text style={[styles.adminEmail, { color: theme.colors.text, fontSize: 14 * scale }]}>{item.email}</Text>
            </View>
            <View style={styles.adminActions}>
                <Pressable
                    style={[styles.actionButton, { backgroundColor: '#3498db' }]}
                    onPress={() => handleEdit(item)}
                >
                    <Ionicons name="create-outline" size={20 * scale} color="#fff" />
                </Pressable>
                <Pressable
                    style={[styles.actionButton, { backgroundColor: '#e74c3c' }]}
                    onPress={() => deleteAdmin(item.id)}
                >
                    <Ionicons name="trash-outline" size={20 * scale} color="#fff" />
                </Pressable>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
            <FlatList
                data={admins}
                renderItem={renderAdminItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={50 * scale} color="#ccc" />
                        <Text style={[styles.emptyText, { color: theme.colors.text, fontSize: 16 * scale }]}>
                            No admins found
                        </Text>
                    </View>
                }
            />

            {/* Edit Admin Modal */}
            <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
                <View style={styles.modalBackground}>
                    <View style={[styles.modalContainer, { backgroundColor: theme.colors.card, padding: 20 * scale, borderRadius: 12 * scale }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: 16 * scale }]}>Edit Admin</Text>
                        <TextInput
                            placeholder="Name"
                            placeholderTextColor="#888"
                            style={[styles.input, { color: theme.colors.text, fontSize: 14 * scale, padding: 12 * scale, borderRadius: 8 * scale }]}
                            value={editName}
                            onChangeText={setEditName}
                        />
                        <TextInput
                            placeholder="Email"
                            placeholderTextColor="#888"
                            style={[styles.input, { color: theme.colors.text, fontSize: 14 * scale, padding: 12 * scale, borderRadius: 8 * scale, marginTop: 10 * scale }]}
                            value={editEmail}
                            onChangeText={setEditEmail}
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 * scale }}>
                            <Pressable style={[styles.modalButton, { backgroundColor: '#bdc3c7', flex: 1, marginRight: 6 * scale }]} onPress={() => setEditModalVisible(false)}>
                                <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Cancel</Text>
                            </Pressable>
                            <Pressable style={[styles.modalButton, { backgroundColor: '#3498db', flex: 1, marginLeft: 6 * scale }]} onPress={saveEdit}>
                                <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Save</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    adminCard: {
        marginVertical: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    adminHeader: {
        marginBottom: 12,
    },
    adminName: {
        fontWeight: '700',
    },
    adminEmail: {
        fontWeight: '400',
        color: '#7f8c8d',
    },
    adminActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionButton: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginHorizontal: 4,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
    },
    emptyText: {
        marginTop: 16,
        textAlign: 'center',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {},
    modalTitle: {
        fontWeight: 'bold',
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
    },
    modalButton: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default ManageAdminScreen;
