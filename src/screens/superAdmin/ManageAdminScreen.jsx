// import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
// import {
//     View,
//     Text,
//     FlatList,
//     Pressable,
//     StyleSheet,
//     Dimensions,
//     ActivityIndicator,
//     Alert,
//     Platform,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import firestore from '@react-native-firebase/firestore';
// import {
//     Modal as PaperModal,
//     Portal,
//     Button,
//     Text as PaperText,
//     Searchbar,
//     List,
//     TextInput,
// } from 'react-native-paper';
// import DatePicker from 'react-native-date-picker';
// import { useFocusEffect } from '@react-navigation/native';
// import { ThemeContext } from '../../context/ThemeContext';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// const USERS_COLLECTION = 'users';
// const TASKS_COLLECTION = 'tasks';
// const ROLES = ['user', 'admin', 'superadmin'];

// const useScreenWidth = () => {
//     const [screenWidth] = useState(Dimensions.get('window').width);
//     return screenWidth;
// };

// const AssignUserModal = ({
//     isModalVisible,
//     setIsModalVisible,
//     targetAdmin,
//     assignUsersToAdmin,
//     theme,
//     styles
// }) => {
//     const [allUsers, setAllUsers] = useState([]);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [selectedUserIds, setSelectedUserIds] = useState(new Set());
//     const [loadingUsers, setLoadingUsers] = useState(true);
//     const [isAssigning, setIsAssigning] = useState(false);

//     useEffect(() => {
//         const fetchAllUsers = async () => {
//             if (!isModalVisible || !targetAdmin) return;
//             setLoadingUsers(true);
//             try {
//                 const snapshot = await firestore().collection(USERS_COLLECTION)
//                     .where('role', '==', 'user')
//                     .get();

//                 const usersData = snapshot.docs
//                     .map(doc => ({ id: doc.id, ...doc.data() }));

//                 const unassignedUsers = usersData.filter(user =>
//                     (user.adminId === undefined || user.adminId === null) && user.id !== targetAdmin.id
//                 );

//                 setAllUsers(unassignedUsers);

//             } catch (error) {
//                 console.error('[DEBUG: ASSIGN MODAL ERROR] Failed to fetch users:', error);
//             } finally {
//                 setLoadingUsers(false);
//             }
//         };

//         if (isModalVisible) {
//             fetchAllUsers();
//             setSelectedUserIds(new Set());
//             setSearchTerm('');
//         }
//     }, [isModalVisible, targetAdmin]);

//     const filteredUsers = useMemo(() => {
//         if (!searchTerm) {
//             return allUsers;
//         }
//         const lowerCaseSearch = searchTerm.toLowerCase();

//         return allUsers.filter(user =>
//             (user.name && user.name.toLowerCase().includes(lowerCaseSearch)) ||
//             (user.email && user.email.toLowerCase().includes(lowerCaseSearch)) ||
//             (user.phone && user.phone.includes(lowerCaseSearch))
//         );
//     }, [allUsers, searchTerm]);

//     const toggleSelection = useCallback((userId) => {
//         setSelectedUserIds(prevSelected => {
//             const newSet = new Set(prevSelected);
//             if (newSet.has(userId)) {
//                 newSet.delete(userId);
//             } else {
//                 newSet.add(userId);
//             }
//             return newSet;
//         });
//     }, []);

//     const handleAssignment = async () => {
//         if (selectedUserIds.size === 0 || !targetAdmin) return;

//         setIsAssigning(true);
//         const userIdsToAssign = Array.from(selectedUserIds);

//         const success = await assignUsersToAdmin(userIdsToAssign, targetAdmin.id);

//         setIsAssigning(false);
//         if (success) {
//             console.log(`[SUCCESS] Assignment complete. Admin ID ${targetAdmin.id} set on ${userIdsToAssign.length} users.`);
//             setIsModalVisible(false);
//         } else {
//             console.log("[FAILURE] Assignment failed. Check Firestore logs.");
//         }
//     };


//     const renderUserItem = ({ item }) => {
//         const isSelected = selectedUserIds.has(item.id);

//         return (
//             <List.Item
//                 title={item.name || item.email || 'Unknown User'}
//                 description={item.email || item.phone || ''}
//                 left={() => (
//                     <Ionicons
//                         name={isSelected ? 'checkbox' : 'square-outline'}
//                         size={24}
//                         color={isSelected ? theme.colors.primary : theme.colors.text}
//                         style={{ alignSelf: 'center' }}
//                     />
//                 )}
//                 right={() => (
//                     <PaperText
//                         variant="bodySmall"
//                         style={{ color: theme.colors.text, alignSelf: 'center' }}
//                     >
//                         {item.role.toUpperCase()}
//                     </PaperText>
//                 )}
//                 onPress={() => toggleSelection(item.id)}
//                 style={{
//                     backgroundColor: isSelected ? theme.colors.primary + '10' : theme.colors.card,
//                     borderBottomWidth: 1,
//                     borderBottomColor: theme.colors.border,
//                     paddingHorizontal: 0
//                 }}
//             />
//         );
//     };

//     const containerStyle = {
//         backgroundColor: theme.colors.card,
//         flex: 1,
//         margin: 20,
//         borderRadius: 15,
//         overflow: 'hidden',
//     };

//     return (
//         <Portal>
//             <PaperModal
//                 visible={isModalVisible}
//                 onDismiss={() => setIsModalVisible(false)}
//                 contentContainerStyle={containerStyle}
//             >
//                 <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
//                     <PaperText
//                         variant="titleLarge"
//                         style={[styles.modalHeader, { color: theme.colors.text }]}
//                     >
//                         Assign Users to {targetAdmin?.name || 'Admin'}
//                     </PaperText>

//                     <Searchbar
//                         placeholder="Search users"
//                         onChangeText={setSearchTerm}
//                         value={searchTerm}
//                         style={[styles.searchBar, { backgroundColor: theme.colors.background }]}
//                         inputStyle={{ color: theme.colors.text }}
//                         iconColor={theme.colors.text}
//                     />

//                     {loadingUsers ? (
//                         <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
//                     ) : (
//                         <FlatList
//                             data={filteredUsers}
//                             renderItem={renderUserItem}
//                             keyExtractor={item => item.id}
//                             contentContainerStyle={{ paddingBottom: 10 }}
//                             ListEmptyComponent={() => (
//                                 <View style={styles.emptyContainer}>
//                                     <PaperText style={{ color: theme.colors.text, textAlign:'center', fontSize:16,}}>
//                                         No unassigned users found or available for assignment.
//                                     </PaperText>
//                                 </View>
//                             )}
//                         />
//                     )}

//                     <View style={styles.modalActions}>
//                         <Button
//                             mode="outlined"
//                             onPress={() => setIsModalVisible(false)}
//                             style={[styles.actionButtonSpace,{borderColor:theme.colors.border,borderRadius:6}]}
//                             textColor={theme.colors.text}
//                             buttonColor={theme.colors.info}
//                             disabled={isAssigning}
//                         >
//                             Cancel
//                         </Button>
//                         <Button
//                             mode="contained"
//                             onPress={handleAssignment}
//                             style={[styles.actionButtonSpace, { borderColor: theme.colors.border, borderRadius: 6 }]}
//                             buttonColor={theme.colors.primary}
//                             textColor={theme.colors.text}
//                             loading={isAssigning}
//                             disabled={selectedUserIds.size === 0 || isAssigning}
//                         >
//                             Assign ({selectedUserIds.size})
//                         </Button>
//                     </View>
//                 </View>
//             </PaperModal>
//         </Portal>
//     );
// };


// const RoleModal = ({
//     isModalVisible,
//     setIsModalVisible,
//     selectedAdmin,
//     updateRoleInFirestore,
//     theme,
//     styles
// }) => {
//     const [isUpdating, setIsUpdating] = useState(false);

//     if (!selectedAdmin) {
//         return null;
//     }

//     const handleRoleSelect = async (newRole) => {
//         if (newRole === selectedAdmin.currentRole) {
//             setIsModalVisible(false);
//             return;
//         }

//         setIsUpdating(true);

//         const success = await updateRoleInFirestore(selectedAdmin.id, newRole);

//         setIsUpdating(false);
//         if (success) {
//             console.log(`[SUCCESS] Role change successful for ${selectedAdmin.name}.`);
//         } else {
//             console.log(`[FAILURE] Role change failed for ${selectedAdmin.name}. Check permissions/error logs.`);
//         }
//         setIsModalVisible(false);
//     };

//     const containerStyle = {
//         backgroundColor: theme.colors.card,
//         padding: 20,
//         margin: 20,
//         borderRadius: 15,
//         alignSelf: 'center',
//         width: '85%',
//         maxWidth: 400
//     };

//     return (
//         <Portal>
//             <PaperModal
//                 visible={isModalVisible}
//                 onDismiss={() => setIsModalVisible(false)}
//                 contentContainerStyle={containerStyle}
//             >
//                 <PaperText
//                     variant="headlineMedium"
//                     style={{ color: theme.colors.text, marginBottom: 5 }}
//                 >
//                     Change Role for : {selectedAdmin.name}
//                 </PaperText>

//                 <PaperText
//                     variant="bodySmall"
//                     style={{ color: theme.colors.textSecondary, marginBottom: 20 }}
//                 >
                   
//                     <PaperText
//                         variant="bodySmall"
//                         style={{ fontWeight: 'bold' }}
//                     >
//                         {selectedAdmin.currentRole.toUpperCase()}
//                     </PaperText>
//                 </PaperText>

//                 <View style={styles.roleOptionsContainer}>
//                     {isUpdating && (
//                         <View style={{ marginBottom: 15 }}>
//                             <ActivityIndicator size="small" color={theme.colors.primary} />
//                             <Text style={{ color: theme.colors.text, marginTop: 5, textAlign: 'center' }}>Updating role...</Text>
//                         </View>
//                     )}

//                     {ROLES.map((role) => {
//                         const isCurrent = role === selectedAdmin.currentRole;
//                         return (
//                             <Button
//                                 key={role}
//                                 mode={isCurrent ? "contained" : "outlined"}
//                                 buttonColor={isCurrent ? theme.colors.primary : 'transparent'}
//                                 textColor={isCurrent ? theme.colors.card : theme.colors.text}
//                                 style={[styles.roleOptionButton, {  borderRadius:5 }]}
//                                 labelStyle={{ fontWeight: '700' }}
//                                 onPress={() => handleRoleSelect(role)}
//                                 disabled={isUpdating}
//                             >
//                                 {role.toUpperCase()}
//                             </Button>
//                         );
//                     })}
//                 </View>

//                 <Button
//                     mode="elevated"
//                     onPress={() => setIsModalVisible(false)}
//                     style={{ marginTop: 20 ,borderColor:theme.colors.border,borderRadius:5}}
//                     textColor={theme.colors.text}
//                     disabled={isUpdating}
//                 >
//                     Close
//                 </Button>
//             </PaperModal>
//         </Portal>
//     );
// };


// const AddTaskModal = ({
//     isModalVisible,
//     setIsModalVisible,
//     assignedToId,
//     assignedToName,
//     createTaskInFirestore,
//     theme,
//     styles,
// }) => {
//     const [title, setTitle] = useState('');
//     const [description, setDescription] = useState('');
//     const [deadline, setDeadline] = useState(new Date());
//     const [openDatePicker, setOpenDatePicker] = useState(false);
//     const [isSubmitting, setIsSubmitting] = useState(false);

//     useEffect(() => {
//         if (!isModalVisible) {
//             setTitle('');
//             setDescription('');
//             setDeadline(new Date());
//         }
//     }, [isModalVisible]);

//     const handleSubmit = async () => {
//         if (!title || !description || !deadline) {
//             Alert.alert('Missing Info', 'Please fill in all fields and set a deadline.');
//             return;
//         }

//         if (deadline.getTime() < new Date().getTime() - 60000) {
//             Alert.alert('Invalid Deadline', 'The deadline must be in the future.');
//             return;
//         }

//         const assignedBy = "MWtoCbA37jWTJKYa6yUsdDpIdd43";

//         const taskData = {
//             title,
//             description,
//             deadline: firestore.Timestamp.fromDate(deadline),
//             assignedTo: assignedToId,
//             assignedBy: assignedBy,
//             status: 'inprogress',
//             remarks: [],
//         };

//         setIsSubmitting(true);
//         const success = await createTaskInFirestore(taskData);
//         setIsSubmitting(false);

//         if (success) {
//             setIsModalVisible(false);
//         }
//     };

//     const containerStyle = {
//         backgroundColor: theme.colors.card,
//         padding: 25,
//         margin: 20,
//         borderRadius: 15,
//         alignSelf: 'center',
//         width: '90%',
//         maxWidth: 500,
//     };

//     const deadlineText = deadline
//         ? deadline.toLocaleDateString() + ' ' + deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//         : 'Select Deadline';

//     return (
//         <Portal>
//             <PaperModal
//                 visible={isModalVisible}
//                 onDismiss={() => setIsModalVisible(false)}
//                 contentContainerStyle={containerStyle}
//             >
//                 <PaperText
//                     variant="titleLarge"
//                     style={[styles.modalHeader, { color: theme.colors.text }]}
//                 >
//                     Assign New Task to {assignedToName || 'User'}
//                 </PaperText>

//                 <TextInput
//                     label="Task Title"
//                     value={title}
//                     onChangeText={setTitle}
//                     mode="outlined"
//                     style={{ marginBottom: 15 }}
//                     theme={{ colors: { primary: theme.colors.primary, onSurface: theme.colors.text, background: theme.colors.card } }}
//                 />

//                 <TextInput
//                     label="Description"
//                     value={description}
//                     onChangeText={setDescription}
//                     mode="outlined"
//                     multiline
//                     numberOfLines={4}
//                     style={{ marginBottom: 15 }}
//                     theme={{ colors: { primary: theme.colors.primary, onSurface: theme.colors.text, background: theme.colors.card } }}
//                 />

//                 <Button
//                     mode="outlined"
//                     onPress={() => setOpenDatePicker(true)}
//                     icon="calendar"
//                     style={{ marginBottom: 20,borderRadius:5 }}
//                     textColor={theme.colors.text}
//                 >
//                     {deadlineText}
//                 </Button>

//                 <DatePicker
//                     modal
//                     open={openDatePicker}
//                     date={deadline}
//                     onConfirm={(date) => {
//                         setOpenDatePicker(false);
//                         setDeadline(date);
//                     }}
//                     onCancel={() => {
//                         setOpenDatePicker(false);
//                     }}
//                     mode="datetime"
//                     minimumDate={new Date()}
//                     title="Select Task Deadline"
//                     theme={theme.dark ? 'dark' : 'light'}
//                 />

//                 <View style={styles.modalActions}>
//                     <Button
//                         mode="outlined"
//                         onPress={() => setIsModalVisible(false)}
//                         style={[styles.actionButtonSpace,{borderRadius:5}]}
//                         textColor={theme.colors.text}
//                         disabled={isSubmitting}
//                     >
//                         Cancel
//                     </Button>
//                     <Button
//                         mode="contained"
//                         onPress={handleSubmit}
//                         style={[styles.actionButtonSpace,{borderRadius:5}]}
//                         buttonColor={theme.colors.text}
//                         loading={isSubmitting}
//                         disabled={isSubmitting || !title || !description}
//                     >
//                         Assign Task
//                     </Button>
//                 </View>
//             </PaperModal>
//         </Portal>
//     );
// };


// const ManageAdminScreen = () => {
//     const { theme } = useContext(ThemeContext);
//     const screenWidth = useScreenWidth();
//     const scale = screenWidth / 375;

//     const [users, setUsers] = useState([]);
//     const [adminStats, setAdminStats] = useState({});
//     const [loading, setLoading] = useState(true);

//     const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
//     const [selectedAdminForRole, setSelectedAdminForRole] = useState(null);

//     const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
//     const [targetAdminForAssignment, setTargetAdminForAssignment] = useState(null);

//     const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
//     const [targetUserForTask, setTargetUserForTask] = useState(null);


//     const filteredAdmins = useMemo(() => {
//         const filtered = users.filter(item => item.role === 'admin');
//         return filtered;
//     }, [users]);


//     // 💡 WRAP FETCH LOGIC IN useCallback
//     const fetchAdminsData = useCallback(async () => {
//         try {
//             const userSnapshot = await firestore().collection(USERS_COLLECTION).get();
//             const usersMap = {};
//             const allUserIds = [];

//             userSnapshot.docs.forEach(doc => {
//                 const userData = { id: doc.id, ...doc.data() };
//                 usersMap[doc.id] = userData;
//                 allUserIds.push(doc.id);
//             });

//             const tasksSnapshot = await firestore().collection(TASKS_COLLECTION).get();

//             const stats = {};
//             const adminTaskMap = {};

//             tasksSnapshot.docs.forEach(doc => {
//                 const task = doc.data();
//                 const userId = task.assignedTo;
//                 if (userId && usersMap[userId]) {
//                     if (!stats[userId]) {
//                         stats[userId] = { totalTasks: 0, inprogressTasks: 0 };
//                     }
//                     stats[userId].totalTasks += 1;
//                     if (task.status === 'inprogress') {
//                         stats[userId].inprogressTasks += 1;
//                     }
//                     const assignedByUserId = task.assignedBy;
//                     if (assignedByUserId && assignedByUserId !== userId) {
//                         if (!adminTaskMap[userId]) adminTaskMap[userId] = new Set();
//                         adminTaskMap[userId].add(assignedByUserId);
//                     }
//                 }
//             });

//             const finalUsers = allUserIds.map(id => {
//                 const user = usersMap[id];
//                 const assignedUsers = Array.from(adminTaskMap[id] || []);
//                 return {
//                     ...user,
//                     id: user.id,
//                     assignedUsers: assignedUsers,
//                 };
//             });

//             setUsers(finalUsers);
//             setAdminStats(stats);

//         } catch (error) {
//             console.error('[DEBUG: DATA RE-FETCH ERROR]', error);
//             throw new Error("Failed to load data from the database.");
//         }
//     }, []); // Empty dependency array ensures this function is stable


//     const updateRoleInFirestore = async (userId, newRole) => {
//         if (!userId || !newRole) return false;

//         let success = false;
//         try {
//             await firestore().collection(USERS_COLLECTION).doc(userId).update({
//                 role: newRole
//             });

//             setUsers(prevUsers => {
//                 const newUsers = prevUsers.map(user =>
//                     user.id === userId ? { ...user, role: newRole } : user
//                 );
//                 return newUsers;
//             });

//             // Re-fetch data to update all stats and relationships
//             await fetchAdminsData();
//             success = true;
//         } catch (error) {
//             console.error('[DEBUG: FIRESTORE UPDATE ERROR]', error);
//         }
//         return success;
//     };

//     const assignUsersToAdmin = async (userIds, adminId) => {
//         let successCount = 0;
//         try {
//             const batch = firestore().batch();

//             userIds.forEach(userId => {
//                 const userRef = firestore().collection(USERS_COLLECTION).doc(userId);
//                 batch.update(userRef, { adminId: adminId });
//             });

//             await batch.commit();
//             successCount = userIds.length;

//             // Re-fetch data to update all stats and relationships
//             await fetchAdminsData();
//         } catch (error) {
//             console.error('[DEBUG: ASSIGNMENT ERROR]', error);
//         }
//         return successCount > 0;
//     };

//     const createTaskInFirestore = async (taskData) => {
//         let success = false;
//         try {
//             const now = firestore.Timestamp.now();
//             const taskRef = firestore().collection(TASKS_COLLECTION).doc();

//             await taskRef.set({
//                 ...taskData,
//                 taskId: taskRef.id,
//                 createdAt: now,
//                 updatedAt: now,
//                 rejectRemark: "",
//                 remark: "",
//             });

//             Alert.alert('Success', `Task "${taskData.title}" created and assigned to ${targetUserForTask.name}.`);

//             // Re-fetch data to update all stats and relationships
//             await fetchAdminsData();
//             success = true;
//         } catch (error) {
//             Alert.alert('Error', 'Failed to create task. Please try again.');
//             console.error('[DEBUG: FIRESTORE TASK CREATION ERROR]', error);
//         }
//         return success;
//     };


//     // 💡 USE useFocusEffect TO RE-FETCH DATA ON TAB SWITCH
//     useFocusEffect(
//         useCallback(() => {
//             const loadData = async () => {
//                 setLoading(true);
//                 try {
//                     await fetchAdminsData();
//                 } catch (error) {
//                     Alert.alert("Error", error.message || "Failed to load initial data.");
//                 } finally {
//                     setLoading(false);
//                 }
//             };

//             loadData();

//             // Cleanup function (optional for firestore.get())
//             return () => {
//                 // Perform any cleanup if needed when the screen loses focus
//             };
//         }, [fetchAdminsData]) // fetchAdminsData is stable due to useCallback
//     );


//     useEffect(() => {
//         if (!isRoleModalVisible) {
//             setSelectedAdminForRole(null);
//         }
//     }, [isRoleModalVisible]);

//     useEffect(() => {
//         if (!isAssignModalVisible) {
//             setTargetAdminForAssignment(null);
//         }
//     }, [isAssignModalVisible]);

//     useEffect(() => {
//         if (!isTaskModalVisible) {
//             setTargetUserForTask(null);
//         }
//     }, [isTaskModalVisible]);


//     const handleChangeRole = (userItem) => {
//         setSelectedAdminForRole({
//             id: userItem.id,
//             name: userItem.name || 'Unknown',
//             currentRole: userItem.role,
//         });
//         setIsRoleModalVisible(true);
//     };

//     const handleAssignUser = (userItem) => {
//         setTargetAdminForAssignment({
//             id: userItem.id,
//             name: userItem.name || 'Unknown',
//         });
//         setIsAssignModalVisible(true);
//     };

//     const handleAssignTask = (userItem) => {
//         setTargetUserForTask({
//             id: userItem.id,
//             name: userItem.name || 'Admin',
//         });
//         setIsTaskModalVisible(true);
//     };

//     const handleCardPress = (userId) => {
//         console.log(`User Details Pressed for: ${userId}`);
//     };


//     const ActionButton = ({ icon, label, onPress, color = theme.colors.primary }) => (
//         <Pressable
//             onPress={onPress}
//             style={({ pressed }) => [
//                 styles.actionButton,
//                 {
//                     backgroundColor: pressed ? color + '33' : theme.colors.background,
//                     borderColor: color,
//                     width: (screenWidth / 3) - 20,
//                     opacity: pressed ? 0.8 : 1
//                 }
//             ]}
//         >
//             <Ionicons name={icon} size={14 * scale} color={color} style={{ marginRight: 4 }} />
//             <Text style={[styles.actionButtonText, { color: color, fontSize: 11 * scale }]}>{label}</Text>
//         </Pressable>
//     );

//     const renderAdminCard = ({ item }) => {
//         const stats = adminStats[item.id] || { totalTasks: 0, inprogressTasks: 0 };
//         const assignedUsersCount = users.filter(user => user.adminId === item.id).length;
//         const totalTasks = stats.totalTasks || 0;
//         const iconSize = 14 * scale;
//         const verticalAdjustment = 1;

//         let contactIcon;
//         let contactLabel;

//         if (item.email) {
//             contactIcon = "mail-outline";
//             contactLabel = item.email;
//         } else if (item.phone) {
//             contactIcon = "call-outline";
//             contactLabel = item.phone;
//         } else {
//             contactIcon = "close-circle-outline";
//             contactLabel = "Contact Not Found";
//         }

//         let roleColor;
//         if (item.role === 'superadmin') {
//             roleColor = theme.colors.primary;
//         } else if (item.role === 'admin') {
//             roleColor = '#3498db';
//         } else {
//             roleColor = '#7f8c8d';
//         }

//         return (
//             <View style={{ marginBottom: 16 }}>
//                 <Pressable
//                     onPress={() => handleCardPress(item.id)}
//                     style={[
//                         styles.adminCard,
//                         {
//                             backgroundColor: theme.colors.card,
//                             borderColor: theme.colors.primary,
//                             padding: 16 * scale,
//                             borderRadius: 12 * scale,
//                             borderBottomLeftRadius: 0,
//                             borderBottomRightRadius: 0,
//                         }
//                     ]}
//                 >
//                     <View style={styles.cardHeader}>
//                         <Text style={[styles.adminName, { color: theme.colors.text, fontSize: 16 * scale }]}>{item.name || 'Unknown User'}</Text>
//                         <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
//                             <Text style={styles.roleText}>{item.role || 'user'}</Text>
//                         </View>
//                     </View>

//                     <View style={styles.emailRow}>
//                         <Ionicons
//                             name={contactIcon}
//                             size={iconSize}
//                             color={theme.colors.text}
//                             style={{ marginRight: 5, marginTop: verticalAdjustment }}
//                         />
//                         <Text
//                             style={[
//                                 styles.adminEmailText,
//                                 {
//                                     color: theme.colors.text,
//                                     fontSize: iconSize,
//                                     opacity: 0.7
//                                 }
//                             ]}
//                         >
//                             {contactLabel}
//                         </Text>
//                     </View>

//                     <View style={[
//                         styles.infoRow,
//                         { borderTopColor: theme.dark ? '#333' : '#eee' }
//                     ]}>
//                         <View style={[
//                             styles.infoPill,
//                             { backgroundColor: theme.dark ? theme.colors.card : theme.colors.background }
//                         ]}>
//                             <Ionicons
//                                 name="people-outline"
//                                 size={iconSize}
//                                 color="#2ecc71"
//                                 style={{ marginTop: verticalAdjustment }}
//                             />
//                             <Text style={[styles.infoText, { color: theme.colors.text, fontSize: 13 * scale }]}>
//                                 {assignedUsersCount} Users Assigned
//                             </Text>
//                         </View>

//                         <View style={[
//                             styles.infoPill,
//                             { backgroundColor: theme.dark ? theme.colors.card : theme.colors.background }
//                         ]}>
//                             <Ionicons
//                                 name="list-outline"
//                                 size={iconSize}
//                                 color="#f39c12"
//                                 style={{ marginTop: verticalAdjustment }}
//                             />
//                             <Text style={[styles.infoText, { color: theme.colors.text, fontSize: 13 * scale }]}>
//                                 {totalTasks} Total Tasks
//                             </Text>
//                         </View>
//                     </View>
//                 </Pressable>

//                 <View style={[styles.actionRow, { backgroundColor: theme.colors.card }]}>
//                     <ActionButton
//                         icon="swap-horizontal-outline"
//                         label="Role"
//                         onPress={() => handleChangeRole(item)}
//                         color="#e74c3c"
//                     />
//                     <ActionButton
//                         icon="person-add-outline"
//                         label="ADD User"
//                         onPress={() => handleAssignUser(item)}
//                         color="#3498db"
//                     />
//                     <ActionButton
//                         icon="briefcase-outline"
//                         label="ADD Task"
//                         onPress={() => handleAssignTask(item)}
//                         color="#2ecc71"
//                     />
//                 </View>
//             </View>
//         );
//     };

//     if (loading) {
//         return (
//             <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
//                 <ActivityIndicator size="large" color={theme.colors.primary} />
//                 <Text style={{ color: theme.colors.text, marginTop: 10 }}>Fetching user list...</Text>
//             </SafeAreaView>
//         );
//     }

//     return (
//         <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
//             <Text style={[styles.pageTitle, { color: theme.colors.text, fontSize: 24 * scale }]}>
//                 Admin Management
//             </Text>
//             <FlatList
//                 data={filteredAdmins}
//                 renderItem={renderAdminCard}
//                 keyExtractor={item => item.id}
//                 contentContainerStyle={{ padding: 16,  }}
//                 ListEmptyComponent={
//                     <View style={styles.emptyContainer}>
//                         <Ionicons name="people-outline" size={50 * scale} color={theme.colors.textSecondary} />
//                         <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
//                             No active Admins found.
//                         </Text>
//                     </View>
//                 }
//                 style={{marginBottom:50}}
//             />

//             {/* Modals */}
//             <RoleModal
//                 isModalVisible={isRoleModalVisible}
//                 setIsModalVisible={setIsRoleModalVisible}
//                 selectedAdmin={selectedAdminForRole}
//                 updateRoleInFirestore={updateRoleInFirestore}
//                 theme={theme}
//                 styles={styles}
//             />
//             <AssignUserModal
//                 isModalVisible={isAssignModalVisible}
//                 setIsModalVisible={setIsAssignModalVisible}
//                 targetAdmin={targetAdminForAssignment}
//                 assignUsersToAdmin={assignUsersToAdmin}
//                 theme={theme}
//                 styles={styles}
//             />
//             <AddTaskModal
//                 isModalVisible={isTaskModalVisible}
//                 setIsModalVisible={setIsTaskModalVisible}
//                 assignedToId={targetUserForTask?.id}
//                 assignedToName={targetUserForTask?.name}
//                 createTaskInFirestore={createTaskInFirestore}
//                 theme={theme}
//                 styles={styles}
//             />
//         </SafeAreaView>
//     );
// };

// const styles = StyleSheet.create({
//     loadingContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     pageTitle: {
//         fontWeight: 'bold',
//         paddingHorizontal: 16,
//         paddingTop: 10,
//         paddingBottom: 5,
//     },
//     adminCard: {
//         borderWidth: 1,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         elevation: 3,
//     },
//     cardHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 8,
//     },
//     adminName: {
//         fontWeight: '900',
//         flexShrink: 1,
//         marginRight: 10,
//     },
//     roleBadge: {
//         borderRadius: 15,
//         paddingHorizontal: 8,
//         paddingVertical: 3,
//     },
//     roleText: {
//         color: 'white',
//         fontSize: 10,
//         fontWeight: 'bold',
//         textTransform: 'uppercase',
//     },
//     emailRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 10,
//     },
//     adminEmailText: {
//         flexShrink: 1,
//     },
//     infoRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         paddingTop: 10,
//         marginTop: 10,
//         borderTopWidth: 1,
//     },
//     infoPill: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         paddingHorizontal: 8,
//         paddingVertical: 5,
//         borderRadius: 20,
//         flex: 1,
//         marginHorizontal: 4,
//         justifyContent: 'center',
//     },
//     infoText: {
//         marginLeft: 5,
//         fontWeight: '600',
//     },
//     actionRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         paddingHorizontal: 12,
//         paddingVertical: 8,
//         borderBottomLeftRadius: 12,
//         borderBottomRightRadius: 12,
//         borderLeftWidth: 1,
//         borderRightWidth: 1,
//         borderBottomWidth: 1,
//         borderColor: '#ccc', // Use a default light border or theme.colors.border
//         marginTop: -1, // Overlap the border
//     },
//     actionButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         paddingVertical: 8,
//         borderRadius: 20,
//         borderWidth: 1,
//         marginHorizontal: 2,
//     },
//     actionButtonText: {
//         fontWeight: '700',
//         textTransform: 'uppercase',
//     },
//     emptyContainer: {
//         marginTop: 50,
//         alignItems: 'center',
//         padding: 20,
//     },
//     emptyText: {
//         marginTop: 10,
//         fontSize: 16,
//         textAlign: 'center',
//     },
//     modalContent: {
//         flex: 1,
//         padding: 25,
//     },
//     modalHeader: {
//         marginBottom: 20,
//         fontWeight: 'bold',
//         textAlign: 'center',
//     },
//     searchBar: {
//         marginBottom: 15,
//         borderRadius: 10,
//     },
//     modalActions: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         marginTop: 20,
//     },
//     actionButtonSpace: {
//         flex: 1,
//         marginHorizontal: 5,
//     },
//     roleOptionsContainer: {
//         marginTop: 10,
//     },
//     roleOptionButton: {
//         marginVertical: 5,
//         borderWidth: 1.5,
//     }
// });

// export default ManageAdminScreen;
















































import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    Pressable,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import {
    Modal as PaperModal,
    Portal,
    Button,
    Text as PaperText,
    Searchbar,
    List,
    TextInput,
} from 'react-native-paper';
import DatePicker from 'react-native-date-picker';
import { useFocusEffect } from '@react-navigation/native';
import { ThemeContext } from '../../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ViewUserTasksModal from './components/ViewUserTasksModal';
const USERS_COLLECTION = 'users';
const TASKS_COLLECTION = 'tasks';
const ROLES = ['user', 'admin', 'superadmin'];

const useScreenWidth = () => {
    const [screenWidth] = useState(Dimensions.get('window').width);
    return screenWidth;
};

const AssignUserModal = ({
    isModalVisible,
    setIsModalVisible,
    targetAdmin,
    assignUsersToAdmin,
    theme,
    styles
}) => {
    const [allUsers, setAllUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState(new Set());
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        const fetchAllUsers = async () => {
            if (!isModalVisible || !targetAdmin) return;
            setLoadingUsers(true);
            try {
                const snapshot = await firestore().collection(USERS_COLLECTION)
                    .where('role', '==', 'user')
                    .get();

                const usersData = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }));

                const unassignedUsers = usersData.filter(user =>
                    (user.adminId === undefined || user.adminId === null) && user.id !== targetAdmin.id
                );

                setAllUsers(unassignedUsers);

            } catch (error) {
                console.error('[DEBUG: ASSIGN MODAL ERROR] Failed to fetch users:', error);
            } finally {
                setLoadingUsers(false);
            }
        };

        if (isModalVisible) {
            fetchAllUsers();
            setSelectedUserIds(new Set());
            setSearchTerm('');
        }
    }, [isModalVisible, targetAdmin]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) {
            return allUsers;
        }
        const lowerCaseSearch = searchTerm.toLowerCase();

        return allUsers.filter(user =>
            (user.name && user.name.toLowerCase().includes(lowerCaseSearch)) ||
            (user.email && user.email.toLowerCase().includes(lowerCaseSearch)) ||
            (user.phone && user.phone.includes(lowerCaseSearch))
        );
    }, [allUsers, searchTerm]);

    const toggleSelection = useCallback((userId) => {
        setSelectedUserIds(prevSelected => {
            const newSet = new Set(prevSelected);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    }, []);

    const handleAssignment = async () => {
        if (selectedUserIds.size === 0 || !targetAdmin) return;

        setIsAssigning(true);
        const userIdsToAssign = Array.from(selectedUserIds);

        const success = await assignUsersToAdmin(userIdsToAssign, targetAdmin.id);

        setIsAssigning(false);
        if (success) {
            console.log(`[SUCCESS] Assignment complete. Admin ID ${targetAdmin.id} set on ${userIdsToAssign.length} users.`);
            setIsModalVisible(false);
        } else {
            console.log("[FAILURE] Assignment failed. Check Firestore logs.");
        }
    };

    const renderUserItem = ({ item }) => {
        const isSelected = selectedUserIds.has(item.id);

        return (
            <List.Item
                title={item.name || item.email || 'Unknown User'}
                description={item.email || item.phone || ''}
                left={() => (
                    <Ionicons
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={isSelected ? theme.colors.primary : theme.colors.text}
                        style={{ alignSelf: 'center' }}
                    />
                )}
                right={() => (
                    <PaperText
                        variant="bodySmall"
                        style={{ color: theme.colors.text, alignSelf: 'center' }}
                    >
                        {item.role.toUpperCase()}
                    </PaperText>
                )}
                onPress={() => toggleSelection(item.id)}
                style={{
                    backgroundColor: isSelected ? theme.colors.primary + '10' : theme.colors.card,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                    paddingHorizontal: 0
                }}
            />
        );
    };

    const containerStyle = {
        backgroundColor: theme.colors.card,
        flex: 1,
        margin: 20,
        borderRadius: 15,
        overflow: 'hidden',
    };

    return (
        <Portal>
            <PaperModal
                visible={isModalVisible}
                onDismiss={() => setIsModalVisible(false)}
                contentContainerStyle={containerStyle}
            >
                <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                    <PaperText
                        variant="titleLarge"
                        style={[styles.modalHeader, { color: theme.colors.text }]}
                    >
                        Assign Users to {targetAdmin?.name || 'Admin'}
                    </PaperText>

                    <Searchbar
                        placeholder="Search users"
                        onChangeText={setSearchTerm}
                        value={searchTerm}
                        style={[styles.searchBar, { backgroundColor: theme.colors.background }]}
                        inputStyle={{ color: theme.colors.text }}
                        iconColor={theme.colors.text}
                    />

                    {loadingUsers ? (
                        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
                    ) : (
                        <FlatList
                            data={filteredUsers}
                            renderItem={renderUserItem}
                            keyExtractor={item => item.id}
                            contentContainerStyle={{ paddingBottom: 10 }}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyContainer}>
                                    <PaperText style={{ color: theme.colors.text, textAlign: 'center', fontSize: 16, }}>
                                        No unassigned users found or available for assignment.
                                    </PaperText>
                                </View>
                            )}
                        />
                    )}

                    <View style={styles.modalActions}>
                        <Button
                            mode="outlined"
                            onPress={() => setIsModalVisible(false)}
                            style={[styles.actionButtonSpace, { borderColor: theme.colors.border, borderRadius: 6 }]}
                            textColor={theme.colors.text}
                            buttonColor={theme.colors.info}
                            disabled={isAssigning}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleAssignment}
                            style={[styles.actionButtonSpace, { borderColor: theme.colors.border, borderRadius: 6 }]}
                            buttonColor={theme.colors.primary}
                            textColor={theme.colors.text}
                            loading={isAssigning}
                            disabled={selectedUserIds.size === 0 || isAssigning}
                        >
                            Assign ({selectedUserIds.size})
                        </Button>
                    </View>
                </View>
            </PaperModal>
        </Portal>
    );
};

const RoleModal = ({
    isModalVisible,
    setIsModalVisible,
    selectedAdmin,
    updateRoleInFirestore,
    theme,
    styles
}) => {
    const [isUpdating, setIsUpdating] = useState(false);

    if (!selectedAdmin) {
        return null;
    }

    const handleRoleSelect = async (newRole) => {
        if (newRole === selectedAdmin.currentRole) {
            setIsModalVisible(false);
            return;
        }

        setIsUpdating(true);

        const success = await updateRoleInFirestore(selectedAdmin.id, newRole);

        setIsUpdating(false);
        if (success) {
            console.log(`[SUCCESS] Role change successful for ${selectedAdmin.name}.`);
        } else {
            console.log(`[FAILURE] Role change failed for ${selectedAdmin.name}. Check permissions/error logs.`);
        }
        setIsModalVisible(false);
    };

    const containerStyle = {
        backgroundColor: theme.colors.card,
        padding: 20,
        margin: 20,
        borderRadius: 15,
        alignSelf: 'center',
        width: '85%',
        maxWidth: 400
    };

    return (
        <Portal>
            <PaperModal
                visible={isModalVisible}
                onDismiss={() => setIsModalVisible(false)}
                contentContainerStyle={containerStyle}
            >
                <PaperText
                    variant="headlineMedium"
                    style={{ color: theme.colors.text, marginBottom: 5 }}
                >
                    Change Role for : {selectedAdmin.name}
                </PaperText>

                <PaperText
                    variant="bodySmall"
                    style={{ color: theme.colors.textSecondary, marginBottom: 20 }}
                >

                    <PaperText
                        variant="bodySmall"
                        style={{ fontWeight: 'bold' }}
                    >
                        {selectedAdmin.currentRole.toUpperCase()}
                    </PaperText>
                </PaperText>

                <View style={styles.roleOptionsContainer}>
                    {isUpdating && (
                        <View style={{ marginBottom: 15 }}>
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                            <Text style={{ color: theme.colors.text, marginTop: 5, textAlign: 'center' }}>Updating role...</Text>
                        </View>
                    )}

                    {ROLES.map((role) => {
                        const isCurrent = role === selectedAdmin.currentRole;
                        return (
                            <Button
                                key={role}
                                mode={isCurrent ? "contained" : "outlined"}
                                buttonColor={isCurrent ? theme.colors.primary : 'transparent'}
                                textColor={isCurrent ? theme.colors.card : theme.colors.text}
                                style={[styles.roleOptionButton, { borderRadius: 5 }]}
                                labelStyle={{ fontWeight: '700' }}
                                onPress={() => handleRoleSelect(role)}
                                disabled={isUpdating}
                            >
                                {role.toUpperCase()}
                            </Button>
                        );
                    })}
                </View>

                <Button
                    mode="elevated"
                    onPress={() => setIsModalVisible(false)}
                    style={{ marginTop: 20, borderColor: theme.colors.border, borderRadius: 5 }}
                    textColor={theme.colors.text}
                    disabled={isUpdating}
                >
                    Close
                </Button>
            </PaperModal>
        </Portal>
    );
};

const AddTaskModal = ({
    isModalVisible,
    setIsModalVisible,
    assignedToId,
    assignedToName,
    createTaskInFirestore,
    theme,
    styles,
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState(new Date());
    const [openDatePicker, setOpenDatePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isModalVisible) {
            setTitle('');
            setDescription('');
            setDeadline(new Date());
        }
    }, [isModalVisible]);

    const handleSubmit = async () => {
        if (!title || !description || !deadline) {
            Alert.alert('Missing Info', 'Please fill in all fields and set a deadline.');
            return;
        }

        if (deadline.getTime() < new Date().getTime() - 60000) {
            Alert.alert('Invalid Deadline', 'The deadline must be in the future.');
            return;
        }

        const assignedBy = "MWtoCbA37jWTJKYa6yUsdDpIdd43";

        const taskData = {
            title,
            description,
            deadline: firestore.Timestamp.fromDate(deadline),
            assignedTo: assignedToId,
            assignedBy: assignedBy,
            status: 'inprogress',
            remarks: [],
        };

        setIsSubmitting(true);
        const success = await createTaskInFirestore(taskData);
        setIsSubmitting(false);

        if (success) {
            setIsModalVisible(false);
        }
    };

    const containerStyle = {
        backgroundColor: theme.colors.card,
        padding: 25,
        margin: 20,
        borderRadius: 15,
        alignSelf: 'center',
        width: '90%',
        maxWidth: 500,
    };

    const deadlineText = deadline
        ? deadline.toLocaleDateString() + ' ' + deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Select Deadline';

    return (
        <Portal>
            <PaperModal
                visible={isModalVisible}
                onDismiss={() => setIsModalVisible(false)}
                contentContainerStyle={containerStyle}
            >
                <PaperText
                    variant="titleLarge"
                    style={[styles.modalHeader, { color: theme.colors.text }]}
                >
                    Assign New Task to {assignedToName || 'User'}
                </PaperText>

                <TextInput
                    label="Task Title"
                    value={title}
                    onChangeText={setTitle}
                    mode="outlined"
                    style={{ marginBottom: 15 }}
                    theme={{ colors: { primary: theme.colors.primary, onSurface: theme.colors.text, background: theme.colors.card } }}
                />

                <TextInput
                    label="Description"
                    value={description}
                    onChangeText={setDescription}
                    mode="outlined"
                    multiline
                    numberOfLines={4}
                    style={{ marginBottom: 15 }}
                    theme={{ colors: { primary: theme.colors.primary, onSurface: theme.colors.text, background: theme.colors.card } }}
                />

                <Button
                    mode="outlined"
                    onPress={() => setOpenDatePicker(true)}
                    icon="calendar"
                    style={{ marginBottom: 20, borderRadius: 5 }}
                    textColor={theme.colors.text}
                >
                    {deadlineText}
                </Button>

                <DatePicker
                    modal
                    open={openDatePicker}
                    date={deadline}
                    onConfirm={(date) => {
                        setOpenDatePicker(false);
                        setDeadline(date);
                    }}
                    onCancel={() => {
                        setOpenDatePicker(false);
                    }}
                    mode="datetime"
                    minimumDate={new Date()}
                    title="Select Task Deadline"
                    theme={theme.dark ? 'dark' : 'light'}
                />

                <View style={styles.modalActions}>
                    <Button
                        mode="outlined"
                        onPress={() => setIsModalVisible(false)}
                        style={[styles.actionButtonSpace, { borderRadius: 5 }]}
                        textColor={theme.colors.text}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        mode="contained"
                        onPress={handleSubmit}
                        style={[styles.actionButtonSpace, { borderRadius: 5 }]}
                        buttonColor={theme.colors.text}
                        loading={isSubmitting}
                        disabled={isSubmitting || !title || !description}
                    >
                        Assign Task
                    </Button>
                </View>
            </PaperModal>
        </Portal>
    );
};

const ManageAdminScreen = () => {
    const { theme } = useContext(ThemeContext);
    const screenWidth = useScreenWidth();
    const scale = screenWidth / 375;

    const [users, setUsers] = useState([]);
    const [adminStats, setAdminStats] = useState({});
    const [loading, setLoading] = useState(true);

    const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
    const [selectedAdminForRole, setSelectedAdminForRole] = useState(null);

    const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
    const [targetAdminForAssignment, setTargetAdminForAssignment] = useState(null);

    const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
    const [targetUserForTask, setTargetUserForTask] = useState(null);
    const [viewTasksModal, setViewTasksModal] = useState({ isVisible: false, user: null });

    const openViewTasksModal = (userItem) => {
        setViewTasksModal({ isVisible: true, user: userItem });
    };

    const filteredAdmins = useMemo(() => {
        const filtered = users.filter(item => item.role === 'admin');
        return filtered;
    }, [users]);

    const fetchAdminsData = useCallback(async () => {
        try {
            const userSnapshot = await firestore().collection(USERS_COLLECTION).get();
            const usersMap = {};
            const allUserIds = [];

            userSnapshot.docs.forEach(doc => {
                const userData = { id: doc.id, ...doc.data() };
                usersMap[doc.id] = userData;
                allUserIds.push(doc.id);
            });

            const tasksSnapshot = await firestore().collection(TASKS_COLLECTION).get();

            const stats = {};
            const adminTaskMap = {};

            tasksSnapshot.docs.forEach(doc => {
                const task = doc.data();
                const userId = task.assignedTo;
                if (userId && usersMap[userId]) {
                    if (!stats[userId]) {
                        stats[userId] = { totalTasks: 0, inprogressTasks: 0 };
                    }
                    stats[userId].totalTasks += 1;
                    if (task.status === 'inprogress') {
                        stats[userId].inprogressTasks += 1;
                    }
                    const assignedByUserId = task.assignedBy;
                    if (assignedByUserId && assignedByUserId !== userId) {
                        if (!adminTaskMap[userId]) adminTaskMap[userId] = new Set();
                        adminTaskMap[userId].add(assignedByUserId);
                    }
                }
            });

            const finalUsers = allUserIds.map(id => {
                const user = usersMap[id];
                const assignedUsers = Array.from(adminTaskMap[id] || []);
                return {
                    ...user,
                    id: user.id,
                    assignedUsers: assignedUsers,
                };
            });

            setUsers(finalUsers);
            setAdminStats(stats);

        } catch (error) {
            console.error('[DEBUG: DATA RE-FETCH ERROR]', error);
            throw new Error("Failed to load data from the database.");
        }
    }, []);

    const updateRoleInFirestore = async (userId, newRole) => {
        if (!userId || !newRole) return false;

        let success = false;
        try {
            await firestore().collection(USERS_COLLECTION).doc(userId).update({
                role: newRole
            });

            setUsers(prevUsers => {
                const newUsers = prevUsers.map(user =>
                    user.id === userId ? { ...user, role: newRole } : user
                );
                return newUsers;
            });

            await fetchAdminsData();
            success = true;
        } catch (error) {
            console.error('[DEBUG: FIRESTORE UPDATE ERROR]', error);
        }
        return success;
    };

    const assignUsersToAdmin = async (userIds, adminId) => {
        let successCount = 0;
        try {
            const batch = firestore().batch();

            userIds.forEach(userId => {
                const userRef = firestore().collection(USERS_COLLECTION).doc(userId);
                batch.update(userRef, { adminId: adminId });
            });

            await batch.commit();
            successCount = userIds.length;

            await fetchAdminsData();
        } catch (error) {
            console.error('[DEBUG: ASSIGNMENT ERROR]', error);
        }
        return successCount > 0;
    };

    const createTaskInFirestore = async (taskData) => {
        let success = false;
        try {
            const now = firestore.Timestamp.now();
            const taskRef = firestore().collection(TASKS_COLLECTION).doc();

            await taskRef.set({
                ...taskData,
                taskId: taskRef.id,
                createdAt: now,
                updatedAt: now,
                rejectRemark: "",
                remark: "",
            });

            Alert.alert('Success', `Task "${taskData.title}" created and assigned to ${targetUserForTask.name}.`);

            await fetchAdminsData();
            success = true;
        } catch (error) {
            Alert.alert('Error', 'Failed to create task. Please try again.');
            console.error('[DEBUG: FIRESTORE TASK CREATION ERROR]', error);
        }
        return success;
    };

    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                setLoading(true);
                try {
                    await fetchAdminsData();
                } catch (error) {
                    Alert.alert("Error", error.message || "Failed to load initial data.");
                } finally {
                    setLoading(false);
                }
            };

            loadData();

            return () => {

            };
        }, [fetchAdminsData])
    );

    useEffect(() => {
        if (!isRoleModalVisible) {
            setSelectedAdminForRole(null);
        }
    }, [isRoleModalVisible]);

    useEffect(() => {
        if (!isAssignModalVisible) {
            setTargetAdminForAssignment(null);
        }
    }, [isAssignModalVisible]);

    useEffect(() => {
        if (!isTaskModalVisible) {
            setTargetUserForTask(null);
        }
    }, [isTaskModalVisible]);

    const handleChangeRole = (userItem) => {
        setSelectedAdminForRole({
            id: userItem.id,
            name: userItem.name || 'Unknown',
            currentRole: userItem.role,
        });
        setIsRoleModalVisible(true);
    };

    const handleAssignUser = (userItem) => {
        setTargetAdminForAssignment({
            id: userItem.id,
            name: userItem.name || 'Unknown',
        });
        setIsAssignModalVisible(true);
    };

    const handleAssignTask = (userItem) => {
        setTargetUserForTask({
            id: userItem.id,
            name: userItem.name || 'Admin',
        });
        setIsTaskModalVisible(true);
    };

    const handleCardPress = (userId) => {
        console.log(`User Details Pressed for: ${userId}`);
    };

    const ActionButton = ({ icon, label, onPress, color = theme.colors.primary }) => (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.actionButton,
                {
                    backgroundColor: pressed ? color + '33' : theme.colors.background,
                    borderColor: color,
                    width: (screenWidth / 3) - 20,
                    opacity: pressed ? 0.8 : 1
                }
            ]}
        >
            <Ionicons name={icon} size={14 * scale} color={color} style={{ marginRight: 4 }} />
            <Text style={[styles.actionButtonText, { color: color, fontSize: 11 * scale }]}>{label}</Text>
        </Pressable>
    );

    const renderAdminCard = ({ item }) => {
        const stats = adminStats[item.id] || { totalTasks: 0, inprogressTasks: 0 };
        const assignedUsersCount = users.filter(user => user.adminId === item.id).length;
        const totalTasks = stats.totalTasks || 0;
        const iconSize = 14 * scale;
        const verticalAdjustment = 1;

        let contactIcon;
        let contactLabel;

        if (item.email) {
            contactIcon = "mail-outline";
            contactLabel = item.email;
        } else if (item.phone) {
            contactIcon = "call-outline";
            contactLabel = item.phone;
        } else {
            contactIcon = "close-circle-outline";
            contactLabel = "Contact Not Found";
        }

        let roleColor;
        if (item.role === 'superadmin') {
            roleColor = theme.colors.primary;
        } else if (item.role === 'admin') {
            roleColor = '#3498db';
        } else {
            roleColor = '#7f8c8d';
        }

        return (
            <View style={{ marginBottom: 16 }}>
                <Pressable
                    onPress={() => handleCardPress(item.id)}
                    style={[
                        styles.adminCard,
                        {
                            backgroundColor: theme.colors.card,
                            borderColor: theme.colors.primary,
                            padding: 16 * scale,
                            borderRadius: 12 * scale,
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0,
                        }
                    ]}
                >

                    <View style={styles.cardHeader}>
                        <Text
                            style={[styles.adminName, { color: theme.colors.text, fontSize: 16 * scale }]}
                            numberOfLines={1}
                        >
                            {item.name || 'Unknown User'}
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Pressable
                                onPress={() => openViewTasksModal(item)}
                                style={[
                                    styles.viewTasksButton,
                                    {
                                        backgroundColor: theme.colors.primary + '22',
                                        borderColor: theme.colors.primary,
                                    },
                                ]}
                            >
                                <Ionicons
                                    name="eye-outline"
                                    size={14 * scale}
                                    color={theme.colors.primary}
                                />
                                <Text
                                    style={[
                                        styles.viewTasksText,
                                        { color: theme.colors.primary },
                                    ]}
                                >
                                    View Tasks
                                </Text>
                            </Pressable>

                        </View>
                    </View>

                    <View style={styles.emailRow}>
                        <Ionicons
                            name={contactIcon}
                            size={iconSize}
                            color={theme.colors.text}
                            style={{ marginRight: 5, marginTop: verticalAdjustment }}
                        />
                        <Text
                            style={[
                                styles.adminEmailText,
                                {
                                    color: theme.colors.text,
                                    fontSize: iconSize,
                                    opacity: 0.7
                                }
                            ]}
                        >
                            {contactLabel}
                        </Text>
                    </View>

                    <View style={[
                        styles.infoRow,
                        { borderTopColor: theme.dark ? '#333' : '#eee' }
                    ]}>
                        <View style={[
                            styles.infoPill,
                            { backgroundColor: theme.dark ? theme.colors.card : theme.colors.background }
                        ]}>
                            <Ionicons
                                name="people-outline"
                                size={iconSize}
                                color="#2ecc71"
                                style={{ marginTop: verticalAdjustment }}
                            />
                            <Text style={[styles.infoText, { color: theme.colors.text, fontSize: 13 * scale }]}>
                                {assignedUsersCount} Users Assigned
                            </Text>
                        </View>

                        <View style={[
                            styles.infoPill,
                            { backgroundColor: theme.dark ? theme.colors.card : theme.colors.background }
                        ]}>
                            <Ionicons
                                name="list-outline"
                                size={iconSize}
                                color="#f39c12"
                                style={{ marginTop: verticalAdjustment }}
                            />
                            <Text style={[styles.infoText, { color: theme.colors.text, fontSize: 13 * scale }]}>
                                {totalTasks} Total Tasks
                            </Text>
                        </View>
                    </View>
                </Pressable>

                <View style={[styles.actionRow, { backgroundColor: theme.colors.card }]}>
                    <ActionButton
                        icon="swap-horizontal-outline"
                        label="Role"
                        onPress={() => handleChangeRole(item)}
                        color="#e74c3c"
                    />
                    <ActionButton
                        icon="person-add-outline"
                        label="ADD User"
                        onPress={() => handleAssignUser(item)}
                        color="#3498db"
                    />
                    <ActionButton
                        icon="briefcase-outline"
                        label="ADD Task"
                        onPress={() => handleAssignTask(item)}
                        color="#2ecc71"
                    />
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ color: theme.colors.text, marginTop: 10 }}>Fetching user list...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
            <Text style={[styles.pageTitle, { color: theme.colors.text, fontSize: 24 * scale }]}>
                Admin Management
            </Text>
            <FlatList
                data={filteredAdmins}
                renderItem={renderAdminCard}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16, }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={50 * scale} color={theme.colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                            No active Admins found.
                        </Text>
                    </View>
                }
                style={{ marginBottom: 50 }}
            />

            { }
            <RoleModal
                isModalVisible={isRoleModalVisible}
                setIsModalVisible={setIsRoleModalVisible}
                selectedAdmin={selectedAdminForRole}
                updateRoleInFirestore={updateRoleInFirestore}
                theme={theme}
                styles={styles}
            />
            <AssignUserModal
                isModalVisible={isAssignModalVisible}
                setIsModalVisible={setIsAssignModalVisible}
                targetAdmin={targetAdminForAssignment}
                assignUsersToAdmin={assignUsersToAdmin}
                theme={theme}
                styles={styles}
            />
            <AddTaskModal
                isModalVisible={isTaskModalVisible}
                setIsModalVisible={setIsTaskModalVisible}
                assignedToId={targetUserForTask?.id}
                assignedToName={targetUserForTask?.name}
                createTaskInFirestore={createTaskInFirestore}
                theme={theme}
                styles={styles}
            />
            <ViewUserTasksModal
                isVisible={viewTasksModal.isVisible}
                onDismiss={() => setViewTasksModal({ isVisible: false, user: null })}
                user={viewTasksModal.user}
                theme={theme}
            />


        </SafeAreaView>
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
        paddingBottom: 5,
    },
    adminCard: {
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
    adminName: {
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
    adminEmailText: {
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
        justifyContent: 'center',
    },
    infoText: {
        marginLeft: 5,
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
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
        marginHorizontal: 2,
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
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        textAlign: 'center',
    },
    modalContent: {
        flex: 1,
        padding: 25,
    },
    modalHeader: {
        marginBottom: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    searchBar: {
        marginBottom: 15,
        borderRadius: 10,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    actionButtonSpace: {
        flex: 1,
        marginHorizontal: 5,
    },
    roleOptionsContainer: {
        marginTop: 10,
    },
    roleOptionButton: {
        marginVertical: 5,
        borderWidth: 1.5,
    },
    viewTasksButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    viewTasksText: {
        marginLeft: 4,
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },

});

export default ManageAdminScreen;