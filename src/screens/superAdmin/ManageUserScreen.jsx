import React, { useContext, useState, useEffect } from 'react';
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
// 🌟 Use the REAL ThemeContext 🌟
import { ThemeContext } from '../../context/ThemeContext'; // Assuming this path is correct
// 🔄 USING react-native-date-picker 🔄
import DatePicker from 'react-native-date-picker';

// ⚠️ REAL FIREBASE INTEGRATION ⚠️
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
// ----------------------------------------------------------------------


// --- Utilities (Simplified) ---
const useScreenWidth = () => {
    const screenWidth = Dimensions.get('window').width;
    return screenWidth;
};

// --- Standalone Card Components (UI only) ---
const ActionButton = ({ icon, label, onPress, color = 'blue', disabled = false, screenWidth, theme }) => (
    <Pressable
        onPress={disabled ? null : onPress}
        disabled={disabled}
        style={({ pressed }) => [
            styles.actionButton,
            {
                // Theme awareness
                backgroundColor: pressed && !disabled ? color + '33' : theme.colors.card,
                borderColor: disabled ? theme.colors.textSecondary + '66' : color,
                // Adjust width to fit 3 buttons + margins within 16px padding on each side
                width: (screenWidth / 3) - 32, // (screenWidth - 32 padding) / 3 
                marginHorizontal: 8,
                opacity: disabled ? 0.5 : (pressed ? 0.8 : 1)
            }
        ]}
    >
        <Ionicons name={icon} size={12 * (screenWidth / 375)} color={disabled ? theme.colors.textSecondary + '99' : color} style={{ marginRight: 2 }} />
        <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={[
                styles.actionButtonText,
                { color: disabled ? theme.colors.textSecondary + '99' : color, fontSize: 10 * (screenWidth / 375) }
            ]}
        >
            {label}
        </Text>
    </Pressable>
);

// --- Admin Picker/Change Admin Modal Component (Corrected) ---
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
            await firestore().collection('users').doc(currentUser.uid).update({ adminId: newAdmin.uid });
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
                    // Theme awareness
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
                    color={item.uid === currentAdminId ? theme.colors.primary : theme.colors.textSecondary}
                    style={{ marginRight: 10 }}
                />
                <View>
                    <Text style={[styles.adminName, { color: theme.colors.text }]}>
                        {item.name || 'Admin Name'}
                    </Text>
                    <Text style={[styles.adminRole, { color: theme.colors.textSecondary }]}>
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
                // Theme awareness
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
                    style={[styles.modalButton, styles.modalButtonCancel, { marginTop: 20 }]}
                >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                </Pressable>
            </Modal>
        </Portal>
    );
};
// ------------------------------------------------------------------


// --- User Card Component (Corrected) ---
const UserCardDisplay = ({ item, theme, screenWidth, admins, setUsers, setTaskModalData, openAdminOptionsModal, openChangeAdminModal, setSelectedUserForAdminAction, setIsLoading }) => {
    const scale = screenWidth / 375;
    const iconSize = 14 * scale;

    const assignedAdmin = admins.find(admin => admin.uid === item.adminId);
    const assignedAdminName = assignedAdmin ? assignedAdmin.name : 'No Admin';
    const isAssigned = !!item.adminId;

    const adminContactIcon = assignedAdmin?.email ? "mail-outline" : assignedAdmin?.phone ? "call-outline" : "alert-circle-outline";
    const adminContactText = assignedAdmin?.email || assignedAdmin?.phone || "No contact info";
    const adminContactColor = assignedAdmin?.email || assignedAdmin?.phone ? theme.colors.primary : theme.colors.textSecondary; // Using theme primary

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
                    }
                },
            ]
        );
    };

    const adminActionLabel = isAssigned ? "Admin Options" : "Assign Admin";
    const adminActionIcon = isAssigned ? "person-switch-outline" : "person-add-outline";
    const userId = item.uid || item.id;

    return (
        <View style={{ marginBottom: 16 }}>
            <Pressable
                style={[
                    styles.userCard,
                    {
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border, // Using theme border color
                        padding: 16 * scale,
                        borderRadius: 12 * scale,
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                    }
                ]}
            >
                <View style={styles.cardHeader}>
                    <Text style={[styles.userName, { color: theme.colors.text, fontSize: 16 * scale }]}>
                        {item.name || 'Unknown User'}
                    </Text>
                    <View style={[styles.roleBadge, { backgroundColor: theme.colors.primary }]}>
                        <Text style={styles.roleText}>{item.role || 'user'}</Text>
                    </View>
                </View>

                <View style={styles.emailRow}>
                    <Ionicons
                        name="mail-outline"
                        size={iconSize}
                        color={theme.colors.textSecondary}
                        style={{ marginRight: 5 }}
                    />
                    <Text
                        style={[
                            styles.userContactText,
                            { color: theme.colors.text, fontSize: iconSize, opacity: 0.7 }
                        ]}
                    >
                        {item.email || 'Email Not Found'}
                    </Text>
                </View>

                <View style={[styles.infoRow, { borderTopColor: theme.dark ? theme.colors.border + '66' : theme.colors.border, flexDirection: 'column' }]}>
                    <View style={[styles.infoPill, { backgroundColor: theme.dark ? theme.colors.background : theme.colors.background, marginBottom: 8 }]}>
                        <Ionicons name="person-circle-outline" size={iconSize} color={theme.colors.primary} />
                        <Text style={[styles.infoText, { color: theme.colors.text, fontSize: 13 * scale }]}>
                            <Text style={{ fontWeight: 'bold' }}>Admin:</Text> {assignedAdminName}
                        </Text>
                    </View>

                    <View style={[styles.infoPill, { backgroundColor: theme.dark ? theme.colors.background : theme.colors.background }]}>
                        <Ionicons name={adminContactIcon} size={iconSize} color={adminContactColor} />
                        <Text style={[styles.infoText, { color: theme.colors.text, fontSize: 13 * scale, fontStyle: adminContactText === "No contact info" ? 'italic' : 'normal' }]}>
                            <Text style={{ fontWeight: 'bold' }}>Contact:</Text> {adminContactText}
                        </Text>
                    </View>
                </View>
            </Pressable>

            <View style={[styles.actionRow, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
                <ActionButton
                    icon="briefcase-outline"
                    label="ADD Task"
                    onPress={handleAssignTask}
                    color="#f39c12" // Fixed color for task
                    screenWidth={screenWidth}
                    theme={theme}
                />

                <ActionButton
                    icon={adminActionIcon}
                    label={adminActionLabel}
                    onPress={() => handleAdminAction(item)}
                    color="#2ecc71" // Fixed color for admin action
                    screenWidth={screenWidth}
                    theme={theme}
                />

                <ActionButton
                    icon="trash-outline"
                    label="Delete"
                    onPress={() => handleDeleteUser(item)}
                    color={theme.colors.notification} // Using theme notification color (Red)
                    screenWidth={screenWidth}
                    theme={theme}
                />
            </View>
        </View>
    );
};

// --- Main Screen Component (UI wrapper) ---
const ManageUsersScreenUI = () => {
    // 🌟 CORRECTLY USE THEME CONTEXT 🌟
    const { theme } = useContext(ThemeContext);
    const screenWidth = useScreenWidth();
    const scale = screenWidth / 375;

    // --- AUTH STATE ---
    const [currentUserId, setCurrentUserId] = useState(null);

    // --- DATA STATE MANAGEMENT ---
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // --- TASK MODAL STATE ---
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
    // 🌟 State for react-native-date-picker 🌟
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    // -------------------------

    // 🌟 ADMIN MODAL STATE 🌟
    const [selectedUserForAdminAction, setSelectedUserForAdminAction] = useState(null);
    const [adminOptionsModalVisible, setAdminOptionsModalVisible] = useState(false);
    const [changeAdminModalVisible, setChangeAdminModalVisible] = useState(false);
    // -------------------------

    useEffect(() => {
        const user = auth().currentUser;
        if (!user) {
            Alert.alert("Authentication Error", "No authenticated user found.");
            setIsLoading(false);
            return;
        }

        setCurrentUserId(user.uid);

        const fetchUsers = async () => {
            try {
                const usersSnapshot = await firestore().collection('users').get();
                // ... (user filtering logic remains the same) ...
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
        };

        fetchUsers();
    }, []);

    // Filter based on search term
    const filteredUsers = users.filter(user =>
        (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    // 🌟 react-native-date-picker handler 🌟
    const onConfirmDeadline = (date) => {
        setDatePickerVisible(false);
        if (date > new Date()) {
            setTaskDeadline(date);
        } else {
            // You can optionally alert the user if they pick a past time/date
            Alert.alert("Invalid Time", "The selected date/time must be in the future.");
            // Keep the previous valid deadline or reset to a valid one
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
            // ... other fields
        };

        try {
            const docRef = await firestore().collection('tasks').add(newTask);

            Alert.alert("Success", `Task assigned to ${taskModalData.user.name}! (Doc ID: ${docRef.id})`);
            handleModalDismiss();

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
        setDatePickerVisible(false); // Reset picker state
    };

    // ... (Your Admin Modal Handlers remain here) ...
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
                                setUsers(prevUsers =>
                                    prevUsers.map(u =>
                                        u.uid === userItem.uid ? { ...u, adminId: null } : u
                                    )
                                );
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
                <Text style={[styles.pageTitle, { color: theme.colors.text, fontSize: 24 * scale , marginBottom:10 }]}>
                    Manage Users
                </Text>

                <Searchbar
                    placeholder="Search Users..."
                    onChangeText={setSearchTerm}
                    value={searchTerm}
                    // Theme awareness
                    style={[styles.searchBarList, { backgroundColor: theme.colors.card, marginHorizontal: 16, marginBottom: 16 }]}
                    inputStyle={{ color: theme.colors.text }}
                    iconColor={theme.colors.textSecondary}
                />

                <FlatList
                    data={filteredUsers}
                    renderItem={({ item }) => (
                        <UserCardDisplay
                            item={item}
                            theme={theme} // Pass theme explicitly
                            screenWidth={screenWidth}
                            admins={admins}
                            setUsers={setUsers}
                            setTaskModalData={setTaskModalData}
                            openAdminOptionsModal={openAdminOptionsModal}
                            openChangeAdminModal={handleChangeAdminClick}
                            setSelectedUserForAdminAction={setSelectedUserForAdminAction}
                            setIsLoading={setIsLoading}
                        />
                    )}
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

            {/* REACT NATIVE PAPER MODAL for Task Assignment */}
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

                        {/* 🌟 DATE PICKER TRIGGER 🌟 */}
                        <Pressable
                            style={[styles.datePickerButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, opacity: isSubmitting ? 0.6 : 1 }]}
                            onPress={showPicker}
                            disabled={isSubmitting}
                        >
                            <Text style={[styles.datePickerText, { color: theme.colors.text }]}>
                                {taskDeadline.toLocaleDateString()} at {taskDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </Pressable>

                        {/* 🌟 react-native-date-picker COMPONENT 🌟 */}
                        <DatePicker
                            modal
                            open={datePickerVisible}
                            date={taskDeadline}
                            mode="datetime"
                            minimumDate={new Date()}
                            onConfirm={onConfirmDeadline}
                            onCancel={onCancelDeadline}
                            // Theme awareness properties for date-picker
                            theme={theme.dark ? 'dark' : 'light'}
                        />


                        <View style={styles.modalButtonRow}>
                            <Pressable
                                style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: theme.colors.notification }]} // Using theme notification for cancel/destructive
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

            {/* 🌟 1. ADMIN OPTIONS MODAL 🌟 */}
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
                        <Pressable style={[styles.adminModalOptionButton, { borderTopWidth: 1, borderColor: theme.colors.border, marginTop: 10 }]} onPress={handleAdminOptionsDismiss}>
                            <Text style={[styles.adminModalOptionText, { color: theme.colors.textSecondary }]}>Cancel</Text>
                        </Pressable>
                    </View>
                </Modal>
            </Portal>


            {/* 🌟 2. CHANGE ADMIN MODAL (Admin Picker List) 🌟 */}
            {selectedUserForAdminAction && (
                <AdminPickerModal
                    isVisible={changeAdminModalVisible}
                    onDismiss={handleAdminPickerDismiss}
                    admins={admins}
                    currentUser={selectedUserForAdminAction}
                    theme={theme}
                    setUsers={setUsers}
                    setIsLoading={setIsLoading}
                    currentAdminId={selectedUserForAdminAction.adminId}
                />
            )}
        </Portal.Host>
    );
};

// --- Stylesheet (Complete and Corrected) --- 
const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pageTitle: {
        fontWeight: 'bold',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc3',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    userCard: {
        borderWidth: 1,
        borderLeftWidth: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    userName: {
        fontWeight: '700',
        flex: 1,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 15,
        minWidth: 70,
        alignItems: 'center',
    },
    roleText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 10,
        textTransform: 'uppercase',
    },
    emailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    userContactText: {
        fontStyle: 'italic',
        maxWidth: '90%',
    },
    infoRow: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        paddingVertical: 12,
        borderTopWidth: 1,
    },
    infoPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        marginRight: 10,
    },
    infoText: {
        marginLeft: 4,
        fontWeight: '400',
    },
    actionRow: {
        flexDirection: 'row',
        // Use space-between for slightly more even distribution when buttons have margin
        justifyContent: 'space-between',
        borderTopWidth: 1,
        paddingVertical: 12,
        paddingHorizontal: 8, // Adjusting padding to account for button margins
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        overflow: 'hidden',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 3,
        borderRadius: 8,
        borderWidth: 1,
        marginHorizontal: 0, // Margin is handled in the component's style prop for dynamic calculation
    },
    actionButtonText: {
        fontWeight: '600',
        textTransform: 'uppercase',
        textAlign: 'center',
        marginLeft: 2,
    },
    searchBarList: {
        borderRadius: 10,
        elevation: 1,
    },
    paperModalContainer: {
        width: '90%',
        alignSelf: 'center',
        padding: 20,
        borderRadius: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,
    },
    modalInputMultiline: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    modalLabel: {
        fontSize: 14,
        marginBottom: 5,
    },
    datePickerButton: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
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
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    modalButtonText: {
        fontWeight: 'bold',
        color: 'white',
    },
    adminModalOption: {
        width: '100%',
        alignItems: 'center',
    },
    adminModalOptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    adminModalOptionText: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '600',
    },
    adminListItem: {
        padding: 15,
        borderWidth: 1,
        borderRadius: 8,
        marginVertical: 4,
    },
    adminName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    adminRole: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    adminEmptyText: {
        textAlign: 'center',
        padding: 20,
        fontSize: 16,
    },
});

export default ManageUsersScreenUI;