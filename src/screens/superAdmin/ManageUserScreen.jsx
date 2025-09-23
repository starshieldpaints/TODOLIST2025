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

const ManageUserScreen = () => {
    const { theme } = useContext(ThemeContext);
    const screenWidth = useScreenWidth();
    const scale = screenWidth / 375;

    const [users, setUsers] = useState([]);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editAdmin, setEditAdmin] = useState('');

    // Fetch all users
    useEffect(() => {
        const unsubscribe = firestore()
            .collection('users')
            .where('role', '==', 'user')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUsers(data);
            });

        return () => unsubscribe();
    }, []);

    // Open edit modal
    const handleEdit = (user) => {
        setSelectedUser(user);
        setEditName(user.name);
        setEditEmail(user.email);
        setEditAdmin(user.adminId || '');
        setEditModalVisible(true);
    };

    // Save edits
    const saveEdit = async () => {
        if (!selectedUser) return;
        try {
            await firestore().collection('users').doc(selectedUser.id).update({
                name: editName,
                email: editEmail,
                adminId: editAdmin,
            });
            setEditModalVisible(false);
            setSelectedUser(null);
            setEditName('');
            setEditEmail('');
            setEditAdmin('');
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to update user.');
        }
    };

    // Delete user
    const deleteUser = (userId) => {
        Alert.alert(
            'Delete User',
            'Are you sure you want to delete this user?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await firestore().collection('users').doc(userId).delete();
                        } catch (err) {
                            console.error(err);
                            Alert.alert('Error', 'Failed to delete user.');
                        }
                    },
                },
            ]
        );
    };

    // Render single user
    const renderUserItem = ({ item }) => (
        <View style={[styles.userCard, { backgroundColor: theme.colors.card, padding: 16 * scale, borderRadius: 12 * scale }]}>
            <View style={styles.userHeader}>
                <Text style={[styles.userName, { color: theme.colors.text, fontSize: 16 * scale }]}>{item.name}</Text>
                <Text style={[styles.userEmail, { color: theme.colors.text, fontSize: 14 * scale }]}>{item.email}</Text>
                {item.adminId ? (
                    <Text style={[styles.userAdmin, { color: theme.colors.text, fontSize: 12 * scale }]}>Admin: {item.adminId}</Text>
                ) : (
                    <Text style={[styles.userAdmin, { color: theme.colors.text, fontSize: 12 * scale, fontStyle: 'italic' }]}>
                        No Admin Assigned
                    </Text>
                )}
            </View>
            <View style={styles.userActions}>
                <Pressable
                    style={[styles.actionButton, { backgroundColor: '#3498db' }]}
                    onPress={() => handleEdit(item)}
                >
                    <Ionicons name="create-outline" size={20 * scale} color="#fff" />
                </Pressable>
                <Pressable
                    style={[styles.actionButton, { backgroundColor: '#e74c3c' }]}
                    onPress={() => deleteUser(item.id)}
                >
                    <Ionicons name="trash-outline" size={20 * scale} color="#fff" />
                </Pressable>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
            <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={50 * scale} color="#ccc" />
                        <Text style={[styles.emptyText, { color: theme.colors.text, fontSize: 16 * scale }]}>
                            No users found
                        </Text>
                    </View>
                }
            />

            {/* Edit User Modal */}
            <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
                <View style={styles.modalBackground}>
                    <View style={[styles.modalContainer, { backgroundColor: theme.colors.card, padding: 20 * scale, borderRadius: 12 * scale }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: 16 * scale }]}>Edit User</Text>
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
                        <TextInput
                            placeholder="Assigned Admin ID"
                            placeholderTextColor="#888"
                            style={[styles.input, { color: theme.colors.text, fontSize: 14 * scale, padding: 12 * scale, borderRadius: 8 * scale, marginTop: 10 * scale }]}
                            value={editAdmin}
                            onChangeText={setEditAdmin}
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
    userCard: {
        marginVertical: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    userHeader: {
        marginBottom: 12,
    },
    userName: {
        fontWeight: '700',
    },
    userEmail: {
        fontWeight: '400',
        color: '#7f8c8d',
    },
    userAdmin: {
        marginTop: 4,
        fontWeight: '400',
    },
    userActions: {
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

export default ManageUserScreen;
