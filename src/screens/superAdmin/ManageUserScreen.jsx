import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    Pressable,
    StyleSheet,
    Dimensions,
    Alert,
    ActivityIndicator,
    TextInput,
    Platform,
}
    from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Searchbar,
    Portal,
    Modal,
} from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../../context/ThemeContext';
import DatePicker from 'react-native-date-picker';
import { useFocusEffect } from '@react-navigation/native';

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import ViewUserTasksModal from "./components/ViewUserTasksModal"
const useScreenWidth = () => {
    const screenWidth = Dimensions.get('window').width;
    return screenWidth;
};
const handleMakeAdmin = async (userToPromote, setUsers, setAdmins, setIsLoading, handleDismiss) => {

    if (!userToPromote || userToPromote.role?.toLowerCase() !== 'user') {
        Alert.alert("Error", "Invalid user selected for promotion, or user is already an admin.");
        return;
    }

    Alert.alert(
        'Confirm Promotion',
        `Are you sure you want to promote ${userToPromote.name} to Admin?`,
        [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Promote',
                style: 'destructive',
                onPress: async () => {
                    setIsLoading(true);
                    try {

                        await firestore().collection('users').doc(userToPromote.uid).update({
                            role: 'admin',

                            adminId: null
                        });

                        setUsers(prevUsers => prevUsers.filter(u => u.uid !== userToPromote.uid));

                        setAdmins(prevAdmins => [
                            ...prevAdmins,
                            { ...userToPromote, role: 'admin', adminId: null }
                        ]);

                        Alert.alert('Success', `${userToPromote.name} is now an administrator! 🎉`);
                        handleDismiss();

                    } catch (error) {

                        console.error("Error promoting user to admin:", error);
                        Alert.alert('Error', 'Failed to update user role. Check Firebase permissions.');
                    } finally {
                        setIsLoading(false);
                    }
                },
            },
        ]
    );
};

const ActionButton = ({ icon, label, onPress, color = 'blue', disabled = false, screenWidth, theme }) => (

    <Pressable
        onPress={disabled ? null : onPress}
        disabled={disabled}
        style={({ pressed }) => [
            styles.actionButton,
            {
                backgroundColor: pressed && !disabled ? color + '33' : theme.colors.card,
                borderColor: disabled ? theme.colors.textSecondary + '66' : color,
                width: (screenWidth / 3) - 32,
                marginHorizontal: 8,
                opacity: disabled ? 0.5 : (pressed ? 0.8 : 1)
            }
        ]}
    >
        <Ionicons name={icon} size={12 * (screenWidth / 375)} color={disabled ? theme.colors.text + '99' : color} style={{ marginRight: 2 }} />
        <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={[
                styles.actionButtonText,
                { color: disabled ? theme.colors.text + '99' : color, fontSize: 10 * (screenWidth / 375) }
            ]}
        >
            {label}
        </Text>
    </Pressable>
);

const AdminPickerModal = ({
    isVisible,
    onDismiss,
    admins,
    currentUser,
    theme,
    setUsers,
    setIsLoading,
    currentAdminId
}) => {

    const handleAdminSelection = async (newAdmin) => {
        if (newAdmin.uid === currentAdminId) {
            Alert.alert("No Change", `${newAdmin.name} is already the assigned admin.`);
            onDismiss();
            return;
        }

        setIsLoading(true);
        try {

            await firestore().collection('users').doc(currentUser.uid).update({
                adminId: newAdmin.uid
            });

            setUsers(prevUsers =>
                prevUsers.map(u =>

                    u.uid === currentUser.uid ? { ...u, adminId: newAdmin.uid } : u
                )
            );

            Alert.alert('Success', `Admin for ${currentUser.name} successfully changed to ${newAdmin.name}.`);
            onDismiss();
        } catch (error) {
            console.error("Error changing admin:", error);
            Alert.alert('Error', 'Failed to change admin. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderAdminItem = ({ item }) => (

        <Pressable
            onPress={() => handleAdminSelection(item)}
            style={({ pressed }) => [
                styles.adminListItem,
                {
                    backgroundColor: item.uid === currentAdminId ? theme.colors.primary + '22' : theme.colors.background,
                    opacity: pressed ? 0.7 : 1,
                    borderColor: theme.colors.border,
                }
            ]}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                    name={item.uid === currentAdminId ? "checkmark-circle-outline" : "person-circle-outline"}
                    size={24}
                    color={item.uid === currentAdminId ? theme.colors.text : theme.colors.text}
                    style={{ marginRight: 10 }}
                />
                <View>
                    <Text style={[styles.adminName, { color: theme.colors.text }]}>
                        {item.name || item.email || item.phone || 'Admin Name'}
                    </Text>
                    <Text style={[styles.adminRole, { color: theme.colors.text }]}>
                        ({item.role})
                    </Text>
                </View>
            </View>
        </Pressable>
    );

    return (
        <Portal>
            <Modal
                visible={isVisible}
                onDismiss={onDismiss}
                contentContainerStyle={[styles.paperModalContainer, { backgroundColor: theme.colors.card, maxHeight: '80%' }]}
            >
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                    {currentAdminId ? `Select New Admin for ${currentUser?.name}` : `Assign Admin to ${currentUser?.name}`}
                </Text>
                {admins.length === 0 ? (
                    <Text style={[styles.adminEmptyText, { color: theme.colors.textSecondary }]}>
                        No administrators found.
                    </Text>
                ) : (
                    <FlatList
                        data={admins}
                        renderItem={renderAdminItem}
                        keyExtractor={item => item.uid}
                        style={{ flexGrow: 0 }}
                        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.colors.border + '55', marginVertical: 4 }} />}
                    />
                )}
                <Pressable
                    onPress={onDismiss}
                    style={[styles.modalButton, { marginTop: 20, }]}
                >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                </Pressable>
            </Modal>
        </Portal>
    );
};

const UserCardDisplay = ({
    item,
    theme,
    screenWidth,
    admins,
    setUsers,
    setTaskModalData,
    openAdminOptionsModal,
    openChangeAdminModal,
    setSelectedUserForAdminAction,
    setIsLoading,
    openViewTasksModal, // ✅ receives from parent
}) => {
    const scale = screenWidth / 375;
    const iconSize = 14 * scale;

    const assignedAdmin = admins.find(admin => admin.uid === item.adminId);
    const assignedAdminName = assignedAdmin ? assignedAdmin.name : 'No Admin';
    const isAssigned = !!item.adminId;

    const adminContactIcon = assignedAdmin?.email
        ? "mail-outline"
        : assignedAdmin?.phone
            ? "call-outline"
            : "alert-circle-outline";
    const adminContactText = assignedAdmin?.email || assignedAdmin?.phone || "No contact info";
    const adminContactColor =
        assignedAdmin?.email || assignedAdmin?.phone ? theme.colors.primary : theme.colors.text;

    const handleAssignTask = () => {
        setTaskModalData({ isVisible: true, user: item });
    };

    const handleAdminAction = (userItem) => {
        setSelectedUserForAdminAction(userItem);

        if (isAssigned) {
            openAdminOptionsModal();
        } else {
            openChangeAdminModal();
        }
    };

    const handleDeleteUser = (userItem) => {
        Alert.alert(
            'Confirm Deletion',
            `Are you sure you want to delete user ${userItem.name}? This action is irreversible.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            await firestore().collection('users').doc(userItem.uid).delete();
                            setUsers(prevUsers => prevUsers.filter(u => u.uid !== userItem.uid));
                            Alert.alert('Success', `User ${userItem.name} has been deleted from the database.`);
                        } catch (error) {
                            console.error("Error deleting user:", error);
                            Alert.alert('Error', 'Failed to delete user. Please check Firebase permissions and rules.');
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const adminActionLabel = isAssigned ? "Options" : "Assign";
    const adminActionIcon = isAssigned ? "people-outline" : "person-add-outline";

    return (
        <View style={{ marginBottom: 16 }}>
            <Pressable
                onPress={() => openViewTasksModal(item)} // ✅ Corrected reference
                style={[
                    styles.userCard,
                    {
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                        padding: 16 * scale,
                        borderRadius: 12 * scale,
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                    },
                ]}
            >
                <View style={styles.cardHeader}>
                    <Text
                        style={[
                            styles.userName,
                            { color: theme.colors.text, fontSize: 16 * scale },
                        ]}
                    >
                        {item.name || 'Unknown User'}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Pressable
                            onPress={() => openViewTasksModal(item)} // ✅ fixed duplicate call
                            style={[
                                styles.viewTasksButton,
                                {
                                    backgroundColor: theme.colors.background + '22',
                                    borderColor: theme.colors.border,
                                },
                            ]}
                        >
                            <Ionicons
                                name="eye-outline"
                                size={14 * scale}
                                color={theme.colors.border}
                            />
                            <Text
                                style={[
                                    styles.viewTasksText,
                                    { color: theme.colors.text },
                                ]}
                            >
                                View Tasks
                            </Text>
                        </Pressable>

                       
                    </View>
                </View>

                <View style={styles.emailRow}>
                    <Ionicons
                        name="mail-outline"
                        size={iconSize}
                        color={theme.colors.text}
                        style={{ marginRight: 5 }}
                    />
                    <Text
                        style={[
                            styles.userContactText,
                            {
                                color: theme.colors.text,
                                fontSize: iconSize,
                                opacity: 0.7,
                            },
                        ]}
                    >
                        {item.email || item.phone || 'Email Not Found'}
                    </Text>
                </View>

                <View
                    style={[
                        styles.infoRow,
                        {
                            borderTopColor: theme.dark
                                ? theme.colors.border + '66'
                                : theme.colors.border,
                            flexDirection: 'column',
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.infoPill,
                            {
                                backgroundColor: theme.colors.background,
                                marginBottom: 8,
                            },
                        ]}
                    >
                        <Ionicons
                            name="person-circle-outline"
                            size={iconSize}
                            color={theme.colors.primary}
                        />
                        <Text
                            style={[
                                styles.infoText,
                                { color: theme.colors.text, fontSize: 13 * scale },
                            ]}
                        >
                            <Text style={{ fontWeight: 'bold' }}>Admin:</Text>{' '}
                            {assignedAdminName}
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.infoPill,
                            { backgroundColor: theme.colors.background },
                        ]}
                    >
                        <Ionicons
                            name={adminContactIcon}
                            size={iconSize}
                            color={adminContactColor}
                        />
                        <Text
                            style={[
                                styles.infoText,
                                {
                                    color: theme.colors.text,
                                    fontSize: 13 * scale,
                                    fontStyle:
                                        adminContactText === 'No contact info'
                                            ? 'italic'
                                            : 'normal',
                                },
                            ]}
                        >
                            <Text style={{ fontWeight: 'bold' }}>Contact:</Text>{' '}
                            {adminContactText}
                        </Text>
                    </View>
                </View>
            </Pressable>

            <View
                style={[
                    styles.actionRow,
                    {
                        backgroundColor: theme.colors.card,
                        borderTopColor: theme.colors.border,
                    },
                ]}
            >
                <ActionButton
                    icon="briefcase-outline"
                    label="ADD Task"
                    onPress={handleAssignTask}
                    color="#f39c12"
                    screenWidth={screenWidth}
                    theme={theme}
                />

                <ActionButton
                    icon={adminActionIcon}
                    label={adminActionLabel}
                    onPress={() => handleAdminAction(item)}
                    color="#2ecc71"
                    screenWidth={screenWidth}
                    theme={theme}
                />

                <ActionButton
                    icon="trash-outline"
                    label="Delete"
                    onPress={() => handleDeleteUser(item)}
                    color={theme.colors.notification}
                    screenWidth={screenWidth}
                    theme={theme}
                />
            </View>
        </View>
    );
};


const ManageUsersScreenUI = () => {
    const { theme } = useContext(ThemeContext);
    const screenWidth = useScreenWidth();
    const scale = screenWidth / 375;
    const [viewTasksModal, setViewTasksModal] = useState({
        isVisible: false,
        user: null,
    });

    const [currentUserId, setCurrentUserId] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [taskModalData, setTaskModalData] = useState({
        isVisible: false,
        user: null,
    });
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const initialDeadline = new Date();
    initialDeadline.setDate(initialDeadline.getDate() + 1);
    const [taskDeadline, setTaskDeadline] = useState(initialDeadline);
    const [datePickerVisible, setDatePickerVisible] = useState(false);

    const [selectedUserForAdminAction, setSelectedUserForAdminAction] = useState(null);
    const [adminOptionsModalVisible, setAdminOptionsModalVisible] = useState(false);
    const [changeAdminModalVisible, setChangeAdminModalVisible] = useState(false);

    const fetchUsersData = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = auth().currentUser;
            if (!user) {
                Alert.alert("Authentication Error", "No authenticated user found.");
                setCurrentUserId(null);
                return;
            }

            setCurrentUserId(user.uid);

            const usersSnapshot = await firestore().collection('users').get();

            const allUsersData = usersSnapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data(),
            }));

            const regularUsers = allUsersData.filter(u =>
                u.role && u.role.toLowerCase() === 'user'
            );

            const adminList = allUsersData.filter(u =>
                u.role && (u.role.toLowerCase() === 'admin' || u.role.toLowerCase() === 'superadmin')
            );

            setUsers(regularUsers);
            setAdmins(adminList);

        } catch (error) {
            console.error("Error fetching users from Firebase:", error);
            Alert.alert("Error", "Failed to load user data. Check your Firebase connection and rules.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchUsersData();

            return () => {

            };
        }, [fetchUsersData])
    );

    const filteredUsers = users.filter(user =>
        (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const onConfirmDeadline = (date) => {
        setDatePickerVisible(false);
        if (date > new Date()) {
            setTaskDeadline(date);
        } else {
            Alert.alert("Invalid Time", "The selected date/time must be in the future.");
            setTaskDeadline(initialDeadline);
        }
    };

    const onCancelDeadline = () => {
        setDatePickerVisible(false);
    };

    const showPicker = () => {
        if (!isSubmitting) {
            setDatePickerVisible(true);
        }
    };

    const handleModalSubmit = async () => {
        if (!taskTitle || !taskDescription || !taskModalData.user) {
            Alert.alert("Error", "Please fill out all fields.");
            return;
        }

        if (taskDeadline <= new Date()) {
            Alert.alert("Invalid Deadline", "The deadline must be in the future.");
            return;
        }

        if (!currentUserId) {
            Alert.alert("Error", "Assignment failed: Current user ID not available.");
            return;
        }

        setIsSubmitting(true);

        const assignedToUid = taskModalData.user.uid;
        const now = firestore.Timestamp.now();

        const newTask = {
            title: taskTitle,
            description: taskDescription,
            deadline: taskDeadline,
            assignedBy: currentUserId,
            assignedTo: assignedToUid,
            createdAt: now,
            updatedAt: now,
            status: "pending",
        };

        try {
            const docRef = await firestore().collection('tasks').add(newTask);

            Alert.alert("Success", `Task assigned to ${taskModalData.user.name}! (Doc ID: ${docRef.id})`);
            handleModalDismiss();

            await fetchUsersData();

        } catch (error) {
            console.error("Error saving task to Firebase:", error);
            Alert.alert("Error", "Failed to assign task. Check Firebase rules/permissions.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleModalDismiss = () => {
        setTaskTitle('');
        setTaskDescription('');
        setTaskDeadline(initialDeadline);
        setTaskModalData({ isVisible: false, user: null });
        setDatePickerVisible(false);
    };

    const handleAdminOptionsDismiss = () => {
        setAdminOptionsModalVisible(false);
        setSelectedUserForAdminAction(null);
    };

    const openAdminOptionsModal = () => {
        setAdminOptionsModalVisible(true);
    };

    const handleChangeAdminClick = () => {
        setAdminOptionsModalVisible(false);
        setChangeAdminModalVisible(true);
    };

    const handleRemoveAdminClick = () => {
        setAdminOptionsModalVisible(false);
        const userItem = selectedUserForAdminAction;
        if (userItem) {
            const assignedAdminName = (admins.find(admin => admin.uid === userItem.adminId)?.name) || 'Admin';

            Alert.alert(
                'Confirm Removal',
                `Are you sure you want to remove ${assignedAdminName} as the admin for ${userItem.name}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: async () => {
                            setIsLoading(true);
                            try {
                                await firestore().collection('users').doc(userItem.uid).update({ adminId: null });

                                await fetchUsersData();
                                Alert.alert('Success', `Admin successfully removed for ${userItem.name}.`);
                            } catch (error) {
                                console.error("Error removing admin:", error);
                                Alert.alert('Error', 'Failed to remove admin. Please check permissions.');
                            } finally {
                                setIsLoading(false);
                                setSelectedUserForAdminAction(null);
                            }
                        },
                    },
                ]
            );
        }
    };

    const handleAdminPickerDismiss = () => {
        setChangeAdminModalVisible(false);
    };

    if (isLoading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={{ color: theme.colors.textSecondary, marginTop: 10 }}>Loading user data...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <Portal.Host>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
                <Text style={[styles.pageTitle, { color: theme.colors.text, fontSize: 24 * scale, marginBottom: 10 }]}>
                    Manage Users
                </Text>

                <Searchbar
                    placeholder="Search Users..."
                    onChangeText={setSearchTerm}
                    value={searchTerm}
                    style={[styles.searchBarList, { backgroundColor: theme.colors.card, marginHorizontal: 16, marginBottom: 16 }]}
                    inputStyle={{ color: theme.colors.text }}
                    iconColor={theme.colors.textSecondary}
                />

                <FlatList
                    data={filteredUsers}
                    renderItem={({ item }) => (
                        <UserCardDisplay
                            item={item}
                            theme={theme}
                            screenWidth={screenWidth}
                            admins={admins}
                            setUsers={setUsers}
                            setTaskModalData={setTaskModalData}
                            openAdminOptionsModal={openAdminOptionsModal}
                            openChangeAdminModal={handleChangeAdminClick}
                            setSelectedUserForAdminAction={setSelectedUserForAdminAction}
                            setIsLoading={setIsLoading}
                            openViewTasksModal={(user) => setViewTasksModal({ isVisible: true, user })}
                        />
                    )}
                    style={{ marginBottom: 50 }}
                    keyExtractor={item => item.uid}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="person-outline" size={50 * scale} color={theme.colors.textSecondary} />
                            <Text style={{ color: theme.colors.textSecondary, marginTop: 10 * scale }}>
                                No users found.
                            </Text>
                        </View>
                    }

                />
            </SafeAreaView>

            <Modal
                visible={taskModalData.isVisible}
                onDismiss={handleModalDismiss}
                contentContainerStyle={[styles.paperModalContainer, { backgroundColor: theme.colors.card }]}
            >
                {taskModalData.user && (
                    <View>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                            Assign Task to {taskModalData.user.name}
                        </Text>

                        <TextInput
                            style={[styles.modalInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
                            placeholder="Task Title"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={taskTitle}
                            onChangeText={setTaskTitle}
                            editable={!isSubmitting}
                        />
                        <TextInput
                            style={[styles.modalInput, styles.modalInputMultiline, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
                            placeholder="Description"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={taskDescription}
                            onChangeText={setTaskDescription}
                            multiline={true}
                            numberOfLines={4}
                            editable={!isSubmitting}
                        />

                        <Text style={[styles.modalLabel, { color: theme.colors.textSecondary }]}>Deadline</Text>

                        <Pressable
                            style={[styles.datePickerButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, opacity: isSubmitting ? 0.6 : 1 }]}
                            onPress={showPicker}
                            disabled={isSubmitting}
                        >
                            <Text style={[styles.datePickerText, { color: theme.colors.text }]}>
                                {taskDeadline.toLocaleDateString()} at {taskDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </Pressable>

                        <DatePicker
                            modal
                            open={datePickerVisible}
                            date={taskDeadline}
                            mode="datetime"
                            minimumDate={new Date()}
                            onConfirm={onConfirmDeadline}
                            onCancel={onCancelDeadline}
                            theme={theme.dark ? 'dark' : 'light'}
                        />

                        <View style={styles.modalButtonRow}>
                            <Pressable
                                style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: theme.colors.notification }]}
                                onPress={handleModalDismiss}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, styles.modalButtonSubmit, { backgroundColor: theme.colors.primary }]}
                                onPress={handleModalSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text style={styles.modalButtonText}>Assign Task</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                )}
            </Modal>

            { }
            <Portal>
                <Modal
                    visible={adminOptionsModalVisible && !!selectedUserForAdminAction}
                    onDismiss={handleAdminOptionsDismiss}
                    contentContainerStyle={[styles.paperModalContainer, { backgroundColor: theme.colors.card, width: '80%', padding: 0 }]}
                >
                    <View style={styles.adminModalOption}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: 18, marginBottom: 10, padding: 10 }]}>
                            Admin Options for {selectedUserForAdminAction?.name || 'User'}
                        </Text>
                        <Pressable style={styles.adminModalOptionButton} onPress={handleChangeAdminClick}>
                            <Ionicons name="swap-horizontal-outline" size={24} color={theme.colors.primary} />
                            <Text style={[styles.adminModalOptionText, { color: theme.colors.primary }]}>Change Admin</Text>
                        </Pressable>
                        <Pressable style={styles.adminModalOptionButton} onPress={handleRemoveAdminClick}>
                            <Ionicons name="person-remove-outline" size={24} color={theme.colors.notification} />
                            <Text style={[styles.adminModalOptionText, { color: theme.colors.notification }]}>Remove Admin</Text>
                        </Pressable>
                        <Pressable style={styles.adminModalOptionButton} onPress={() => handleMakeAdmin(selectedUserForAdminAction, setUsers, setAdmins, setIsLoading, handleAdminOptionsDismiss)}>
                            <Ionicons name="person-add-outline" size={24} color={theme.colors.notification} />
                            <Text style={[styles.adminModalOptionText, { color: theme.colors.notification }]}>Make Admin</Text>
                        </Pressable>
                    </View>
                </Modal>
            </Portal>

            <AdminPickerModal
                isVisible={changeAdminModalVisible && !!selectedUserForAdminAction}
                onDismiss={handleAdminPickerDismiss}
                admins={admins.filter(a => a.uid !== selectedUserForAdminAction?.uid)}
                currentUser={selectedUserForAdminAction}
                theme={theme}
                setUsers={setUsers}
                setIsLoading={setIsLoading}
                currentAdminId={selectedUserForAdminAction?.adminId}
            />
            <ViewUserTasksModal
                isVisible={viewTasksModal.isVisible}
                onDismiss={() => setViewTasksModal({ isVisible: false, user: null })}
                user={viewTasksModal.user}
                theme={theme}
            />

        </Portal.Host>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pageTitle: {
        fontWeight: 'bold',
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    searchBarList: {
        borderRadius: 10,
        elevation: 1,
    },
    userCard: {
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    viewTasksButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
    },
    viewTasksText: {
        fontSize: 10,
        fontWeight: '600',
        marginLeft: 4,
    },

    userName: {
        fontWeight: '900',
        flexShrink: 1,
        marginRight: 10,
    },
    roleBadge: {
        borderRadius: 15,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    roleText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    emailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    userContactText: {
        flexShrink: 1,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 10,
        marginTop: 10,
        borderTopWidth: 1,
    },
    infoPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 20,
        flex: 1,
        marginHorizontal: 4,
        justifyContent: 'flex-start',
    },
    infoText: {
        marginLeft: 5,
        fontWeight: '600',
        flexShrink: 1,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#ccc',
        marginTop: -1,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,

    },
    actionButtonText: {
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    emptyContainer: {
        marginTop: 50,
        alignItems: 'center',
        padding: 20,
    },
    paperModalContainer: {
        padding: 20,
        marginHorizontal: 20,
        borderRadius: 10,
        alignSelf: 'center',
        width: '90%',
        maxWidth: 500,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalInput: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    modalInputMultiline: {
        height: 100,
        paddingTop: 15,
    },
    modalLabel: {
        fontSize: 12,
        marginBottom: 5,
    },
    datePickerButton: {
        padding: 15,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 20,
        alignItems: 'center',
    },
    datePickerText: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalButtonCancel: {
        marginRight: 10,
        backgroundColor: '#7f8c8d',
    },
    modalButtonSubmit: {
        marginLeft: 10,
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    adminModalOption: {
        paddingVertical: 10,
    },
    adminModalOptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    adminModalOptionText: {
        marginLeft: 15,
        fontSize: 16,
        fontWeight: '600',
    },
    adminListItem: {
        padding: 12,
        borderBottomWidth: 1,
    },
    adminEmptyText: {
        textAlign: 'center',
        paddingVertical: 20,
    }
});

export default ManageUsersScreenUI;