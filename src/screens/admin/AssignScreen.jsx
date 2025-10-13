// import React, { useState, useEffect, useContext } from 'react';
// import { View, FlatList, TextInput as TextInputSearch, StyleSheet, Dimensions, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Portal, Button, Card, Text, Provider as PaperProvider, Snackbar, Chip, TextInput, Modal } from 'react-native-paper';
// import DatePicker from 'react-native-date-picker';
// import firestore from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';
// import { ThemeContext } from '../../context/ThemeContext';
// import PremiumTasksModal from "../../components/ViewTaskModal";
// import Ionicons from 'react-native-vector-icons/Ionicons';


// const { width } = Dimensions.get('window');

// const AssignScreen = () => {
//     const { theme } = useContext(ThemeContext);
//     const adminUid = auth().currentUser?.uid;

//     const [allUsers, setAllUsers] = useState([]);
//     const [staffUsers, setStaffUsers] = useState([]);
//     const [adminUsers, setAdminUsers] = useState([]);
//     const [tasks, setTasks] = useState([]);
//     const [loading, setLoading] = useState(true);

//     const [assignModalVisible, setAssignModalVisible] = useState(false);
//     const [viewTasksModalVisible, setViewTasksModalVisible] = useState(false);

//     const [selectedUser, setSelectedUser] = useState(null);
//     const [taskTitle, setTaskTitle] = useState('');
//     const [taskDescription, setTaskDescription] = useState('');
//     const [taskRemarks, setTaskRemarks] = useState('');
//     const [taskDeadline, setTaskDeadline] = useState(() => {
//         const d = new Date();
//         d.setDate(d.getDate() + 1); // Default to tomorrow
//         return d;
//     });
//     const [openDatePicker, setOpenDatePicker] = useState(false);

//     const [searchText, setSearchText] = useState('');
//     const [snackbarVisible, setSnackbarVisible] = useState(false);

//     // Tab State
//     const [activeTab, setActiveTab] = useState('users'); // 'users' or 'admins'

//     // ------------------------------------
//     // 1. DATA LOADING: Fetch ALL data once on component mount
//     // ------------------------------------

//     useEffect(() => {
//         if (!adminUid) return;
//         setLoading(true);

//         // --- 1. Fetch Staff Users ---
//         const unsubscribeStaff = firestore()
//             .collection('users')
//             .where('adminId', '==', adminUid)
//             .onSnapshot(snapshot => {
//                 const allUnderAdmin = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
//                 const staff = allUnderAdmin.filter(user => user.role !== 'admin');
//                 setStaffUsers(staff);
//             }, error => {
//                 console.error("Staff fetch error:", error);
//                 Alert.alert("Staff fetch error", `${error.message}`)
//             });

//         // --- 2. Fetch All Admins ---
//         const unsubscribeAdmins = firestore()
//             .collection('users')
//             .where('role', '==', 'admin')
//             .onSnapshot(snapshot => {
//                 const allAdmins = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
//                 const admins = allAdmins.filter(u => u.uid !== adminUid);
//                 setAdminUsers(admins);
//                 setLoading(false);
//             }, error => {
//                 console.error("Admin fetch error:", error);
//                 setLoading(false);
//             });

//         // Load tasks
//         const unsubscribeTasks = firestore()
//             .collection('tasks')
//             .where('assignedBy', '==', adminUid)
//             .onSnapshot(snapshot => setTasks(snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }))));

//         return () => {
//             unsubscribeStaff();
//             unsubscribeAdmins();
//             unsubscribeTasks();
//         };
//     }, [adminUid]);

//     // ------------------------------------
//     // 2. SEARCH & TAB SWITCH LOGIC (Now Dedicated)
//     // ------------------------------------
//     useEffect(() => {
//         // Determine which source list to filter based on the active tab
//         const sourceList = activeTab === 'users' ? staffUsers : adminUsers;
//         let filtered = [...sourceList];

//         // Apply search
//         if (searchText) {
//             const lower = searchText.toLowerCase();
//             filtered = filtered.filter(u => (u.name?.toLowerCase().includes(lower) || u.email?.toLowerCase().includes(lower)));
//         }

//         setAllUsers(filtered); // Update the list being rendered by FlatList
//     }, [searchText, staffUsers, adminUsers, activeTab]);

//     // ------------------------------------
//     // 3. HANDLERS
//     // ------------------------------------
//     const handleTabChange = (tab) => {
//         setActiveTab(tab);
//         setSearchText('');
//     };

//     const openAssignModal = user => {
//         setSelectedUser(user);
//         setTaskTitle('');
//         setTaskDescription('');
//         setTaskRemarks('');
//         setTaskDeadline(() => {
//             const d = new Date();
//             d.setDate(d.getDate() + 1);
//             return d;
//         });
//         setAssignModalVisible(true);
//     };

//     const openViewTasksModal = user => {
//         const userTasks = tasks.filter(t => t.assignedTo === user.uid);
//         setSelectedUser({ ...user, tasks: userTasks });
//         setViewTasksModalVisible(true);
//     };

//     const assignTask = async () => {
//         if (!taskTitle) return Alert.alert('Validation Error', 'Task title is required');

//         if (taskDeadline < new Date()) {
//             return Alert.alert('Validation Error', 'Deadline must be a future date.');
//         }

//         try {
//             const taskRef = firestore().collection('tasks').doc();

//             const assignedUserIsAdmin = selectedUser?.role === 'admin';

//             await taskRef.set({
//                 taskId: taskRef.id,
//                 title: taskTitle,
//                 description: taskDescription,
//                 status: "pending",
//                 assignedTo: selectedUser.uid,
//                 assignedBy: adminUid,
//                 assignedToIsAdmin: assignedUserIsAdmin,
//                 deadline: firestore.Timestamp.fromDate(taskDeadline),
//                 createdAt: firestore.FieldValue.serverTimestamp(),
//                 updatedAt: firestore.FieldValue.serverTimestamp(),
//                 remarks: taskRemarks ? taskRemarks.split(',').map(r => r.trim()) : [],
//             });

//             setAssignModalVisible(false);
//             setSnackbarVisible(true);
//             setTaskTitle('');
//             setTaskDescription('');
//             setTaskRemarks('');
//             setTaskDeadline(() => {
//                 const d = new Date();
//                 d.setDate(d.getDate() + 1);
//                 return d;
//             });
//         } catch (err) {
//             console.error(err);
//             Alert.alert('Error', 'Failed to assign task. Please check your connection.');
//         }
//     };

//     // ------------------------------------
//     // 4. RENDER COMPONENTS
//     // ------------------------------------

//     const renderUser = ({ item }) => {
//         const userTasks = tasks.filter(t => t.assignedTo === item.uid);
//         const pendingTasks = userTasks.filter(t => t.status === "pending");
//         const isSelectedUserAdmin = item.role === 'admin';

//         let nearestDeadline = null;
//         if (pendingTasks.length > 0) {
//             nearestDeadline = pendingTasks
//                 .map(t => t.deadline?.toDate?.())
//                 .filter(d => d)
//                 .sort((a, b) => a - b)[0];
//         }

//         let deadlineColor = theme.colors.text;
//         let deadlineLabel = "No deadline";
//         if (nearestDeadline) {
//             const now = new Date();
//             const diffHours = (nearestDeadline - now) / (1000 * 60 * 60);

//             if (diffHours < 0) {
//                 deadlineColor = "red";
//                 deadlineLabel = "Deadline Passed";
//             } else if (diffHours <= 24) {
//                 deadlineColor = "orange";
//                 deadlineLabel = "Due Soon ";
//             } else {
//                 deadlineColor = "green";
//                 deadlineLabel = "Upcoming ";
//             }
//         }

//         return (
//             <Card style={[styles.userCard, { backgroundColor: theme.colors.card }]}>
//                 <Card.Content style={{ position: 'relative' }}>



//                     {/* User Info */}
//                     <Text style={{
//                         color: theme.colors.text,
//                         fontSize: 18,
//                         fontWeight: '700',
//                     }}>
//                         {item.name}
//                     </Text>
//                     <Text style={{ color: theme.colors.text, marginBottom: 8 }}>
//                         {item.email || item.phone}
//                     </Text>

//                     {/* Badge for Pending */}
//                     {pendingTasks.length > 0 && (
//                         <View style={[styles.badge, { backgroundColor: theme.colors.notification }]}>
//                             <Text style={styles.badgeText}>{pendingTasks.length}</Text>
//                         </View>
//                     )}

//                     {/* Deadline Section */}
//                     {nearestDeadline && (
//                         <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
//                             <Ionicons name="calendar-outline" size={18} color={deadlineColor} style={{ marginRight: 6 }} />
//                             <Text style={{ color: deadlineColor, fontWeight: '600' }}>
//                                 {nearestDeadline.toDateString()} • {deadlineLabel}
//                             </Text>
//                         </View>
//                     )}

//                     {/* Actions */}
//                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
//                         <Button
//                             mode="contained"
//                             onPress={() => openViewTasksModal(item)}
//                             buttonColor={theme.colors.primary}
//                             textColor={theme.colors.text}
//                             style={{ borderRadius: 8 }}
//                             icon={() => <Ionicons name="list-outline" size={18} color={theme.colors.text} />}
//                         >
//                             {userTasks.length} Tasks
//                         </Button>
//                         <Button
//                             mode="contained-tonal"
//                             onPress={() => openAssignModal(item)}
//                             buttonColor={theme.colors.border}
//                             textColor={theme.colors.text}
//                             style={{ borderRadius: 8 }}
//                             icon={() => <Ionicons name="add-circle-outline" size={18} color={theme.colors.text} />}
//                         >
//                             Assign
//                         </Button>
//                     </View>
//                 </Card.Content>
//             </Card>
//         );
//     };

//     const ListHeader = () => (
//         <View style={{ backgroundColor: theme.colors.background, paddingBottom: 5 }}>
//             <TextInputSearch
//                 placeholder="Search by name or email"
//                 placeholderTextColor={theme.colors.text + '88'}
//                 value={searchText}
//                 onChangeText={setSearchText}
//                 style={[styles.searchInput, { borderColor: theme.colors.primary, color: theme.colors.text, backgroundColor: theme.colors.card }]}
//             />

//             {/* TAB SELECTOR */}
//             <View style={[styles.tabContainer, { borderColor: theme.colors.primary }]}>
//                 <TouchableOpacity
//                     style={[styles.tabButton, activeTab === 'users' && { backgroundColor: theme.colors.primary }]}
//                     onPress={() => handleTabChange('users')}
//                 >
//                     {/* FIXED: Applied theme color conditionally for active tab text */}
//                     <Text style={[styles.tabText, { color: activeTab === 'users' ? '#fff' : theme.colors.text }]}>Staff Users ({staffUsers.length})</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                     style={[styles.tabButton, activeTab === 'admins' && { backgroundColor: theme.colors.primary }]}
//                     onPress={() => handleTabChange('admins')}
//                 >
//                     {/* FIXED: Applied theme color conditionally for active tab text */}
//                     <Text style={[styles.tabText, { color: activeTab === 'admins' ? '#fff' : theme.colors.text }]}>All Admins ({adminUsers.length})</Text>
//                 </TouchableOpacity>
//             </View>
//         </View>
//     );


//     // ------------------------------------
//     // 5. MAIN RENDER
//     // ------------------------------------

//     return (
//         <PaperProvider>
//             <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
//                 <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

//                     {loading && (staffUsers.length === 0 && adminUsers.length === 0) ? (
//                         <View style={styles.loadingContainer}>
//                             <ActivityIndicator size="large" color={theme.colors.primary} />
//                             <Text style={{ color: theme.colors.text, marginTop: 10 }}>Loading users and tasks...</Text>
//                         </View>
//                     ) : (
//                         <FlatList
//                             data={allUsers}
//                             keyExtractor={item => item.uid}
//                             renderItem={renderUser}
//                             ListHeaderComponent={ListHeader}
//                             stickyHeaderIndices={[0]}
//                             contentContainerStyle={{ paddingBottom: 80 }}
//                             ListEmptyComponent={
//                                 <Text style={{ color: theme.colors.text + 'aa', textAlign: 'center', marginTop: 20 }}>
//                                     No {activeTab === 'users' ? 'staff users assigned to you' : 'other admins'} found.
//                                 </Text>
//                             }
//                         />
//                     )}

//                     <Portal>
//                         {/* Task Assignment Modal */}
//                         <Modal visible={assignModalVisible} onDismiss={() => setAssignModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
//                             <Text style={{ color: theme.colors.text, marginBottom: 12, fontSize: 20, fontWeight: '700' }}>Assign Task to {selectedUser?.name}</Text>

//                             <TextInput
//                                 mode='outlined'
//                                 placeholder="Task Title"
//                                 value={taskTitle}
//                                 onChangeText={setTaskTitle}
//                                 // FIXED: Replaced inline style { height: 40, backgroundColor: theme.colors.card }
//                                 style={[styles.input, styles.inputHeight, { color: theme.colors.text }]}
//                                 outlineColor={theme.colors.primary}
//                                 activeOutlineColor={theme.colors.border}
//                                 placeholderTextColor={theme.colors.text + '88'}
//                                 theme={{ colors: { background: theme.colors.card } }} // Use theme prop for background
//                             />
//                             <TextInput
//                                 mode='outlined'
//                                 placeholder="Task Description"
//                                 value={taskDescription}
//                                 onChangeText={setTaskDescription}
//                                 outlineColor={theme.colors.primary}
//                                 activeOutlineColor={theme.colors.border}
//                                 // FIXED: Replaced inline style { height: 40, backgroundColor: theme.colors.card }
//                                 style={[styles.input, styles.inputHeight, { color: theme.colors.text }]}
//                                 placeholderTextColor={theme.colors.text + '88'}
//                                 theme={{ colors: { background: theme.colors.card } }}
//                             />

//                             <Button mode="outlined" onPress={() => setOpenDatePicker(true)} style={{ marginBottom: 12, borderRadius: 4, height: 40, borderColor: theme.colors.primary, }} buttonColor={theme.colors.card} textColor={theme.colors.text}>
//                                 Deadline: {taskDeadline.toDateString()}
//                             </Button>
//                             <DatePicker
//                                 modal
//                                 open={openDatePicker}
//                                 date={taskDeadline}
//                                 mode="date"
//                                 onConfirm={(date) => { setOpenDatePicker(false); setTaskDeadline(date); }}
//                                 onCancel={() => setOpenDatePicker(false)}
//                                 minimumDate={new Date()}
//                             />

//                             <TextInput
//                                 mode='outlined'
//                                 placeholder="Remarks (comma separated)"
//                                 value={taskRemarks}
//                                 onChangeText={setTaskRemarks}
//                                 // FIXED: Replaced inline style { height: 40, backgroundColor: theme.colors.card }
//                                 style={[styles.input, styles.inputHeight, { color: theme.colors.text }]}
//                                 outlineColor={theme.colors.primary}
//                                 activeOutlineColor={theme.colors.border}
//                                 placeholderTextColor={theme.colors.text + '88'}
//                                 theme={{ colors: { background: theme.colors.card } }}
//                             />

//                             <Button mode="contained" onPress={assignTask} style={{ marginBottom: 8, borderRadius: 8 }} buttonColor={theme.colors.primary} textColor={theme.colors.text} >
//                                 Assign Task
//                             </Button>
//                             <Button mode="outlined" style={{ borderColor: theme.colors.border, borderRadius: 5 }} onPress={() => setAssignModalVisible(false)} textColor={theme.colors.text} buttonColor={theme.colors.card}>
//                                 Cancel
//                             </Button>
//                         </Modal>
//                     </Portal>

//                     <PremiumTasksModal
//                         visible={viewTasksModalVisible}
//                         onDismiss={() => setViewTasksModalVisible(false)}
//                         selectedUser={selectedUser}
//                         theme={theme}
//                     />

//                     <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={2000} style={{ backgroundColor: theme.colors.primary }}>
//                         Task assigned successfully to {selectedUser?.name}!
//                     </Snackbar>
//                 </View>
//             </SafeAreaView>
//         </PaperProvider>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flex: 1, paddingHorizontal: 16 },
//     loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//     userCard: { marginBottom: 12, borderRadius: 12, elevation: 2 },
//     searchInput: {
//         borderWidth: 1,
//         borderRadius: 10,
//         paddingHorizontal: 10,
//         marginBottom: 12,
//         height: 40,
//     },
//     modalContent: { padding: 20, borderRadius: 12, marginHorizontal: 16 },

//     // NEW STATIC STYLE TO REMOVE INLINE WARNING
//     inputHeight: {
//         height: 40,
//     },

//     input: { padding: 4, marginBottom: 12, fontSize: 14 },

//     // TAB STYLES
//     tabContainer: {
//         flexDirection: 'row',
//         marginBottom: 10,
//         borderRadius: 8,
//         overflow: 'hidden',
//         borderWidth: 1,
//     },
//     tabButton: {
//         flex: 1,
//         paddingVertical: 10,
//         alignItems: 'center',
//     },
//     tabText: {
//         fontWeight: 'bold',
//         fontSize: 14,
//     },

//     // BADGE/CHIP STYLES
//     badge: {
//         position: 'absolute',
//         top: 8,
//         right: 8,
//         borderRadius: 12,
//         paddingHorizontal: 8,
//         paddingVertical: 4,
//         zIndex: 1,
//     },
//     badgeText: {
//         color: '#fff',
//         fontSize: 12,
//         fontWeight: '700'
//     },
//     adminChip: {
//         position: 'absolute',
//         top: 8,
//         left: 8,
//         height: 25,
//         justifyContent: 'center',
//         elevation: 1,
//         zIndex: 1,
//     }
// });

// export default AssignScreen;


















// import React, { useState, useEffect, useContext } from 'react';
// import { View, FlatList, TextInput as TextInputSearch, StyleSheet, Dimensions, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Portal, Button, Card, Text, Provider as PaperProvider, Snackbar, TextInput, Modal } from 'react-native-paper';
// import DatePicker from 'react-native-date-picker';
// import firestore from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';
// import { ThemeContext } from '../../context/ThemeContext';
// import PremiumTasksModal from "../../components/ViewTaskModal";
// import Ionicons from 'react-native-vector-icons/Ionicons';

// const { width } = Dimensions.get('window');

// const AssignScreen = () => {
//     const { theme } = useContext(ThemeContext);
//     const adminUid = auth().currentUser?.uid;

//     const [allUsers, setAllUsers] = useState([]);
//     const [staffUsers, setStaffUsers] = useState([]);
//     const [adminUsers, setAdminUsers] = useState([]);
//     const [tasks, setTasks] = useState([]);
//     const [loading, setLoading] = useState(true);

//     const [assignModalVisible, setAssignModalVisible] = useState(false);
//     const [viewTasksModalVisible, setViewTasksModalVisible] = useState(false);

//     const [selectedUser, setSelectedUser] = useState(null);
//     const [taskTitle, setTaskTitle] = useState('');
//     const [taskDescription, setTaskDescription] = useState('');
//     const [taskRemarks, setTaskRemarks] = useState('');
//     const [taskDeadline, setTaskDeadline] = useState(() => {
//         const d = new Date();
//         d.setDate(d.getDate() + 1); // Default to tomorrow
//         return d;
//     });
//     const [openDatePicker, setOpenDatePicker] = useState(false);

//     const [searchText, setSearchText] = useState('');
//     const [snackbarVisible, setSnackbarVisible] = useState(false);
//     const [activeTab, setActiveTab] = useState('users'); // 'users' or 'admins'

//     useEffect(() => {
//         if (!adminUid) return;
//         setLoading(true);

//         const unsubscribeStaff = firestore()
//             .collection('users')
//             .where('adminId', '==', adminUid)
//             .onSnapshot(snapshot => {
//                 const staff = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })).filter(user => user.role !== 'admin');
//                 setStaffUsers(staff);
//             }, error => {
//                 console.error("Staff fetch error:", error);
//                 Alert.alert("Error", "Could not fetch staff users.");
//             });

//         const unsubscribeAdmins = firestore()
//             .collection('users')
//             .where('role', '==', 'admin')
//             .onSnapshot(snapshot => {
//                 const admins = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })).filter(u => u.uid !== adminUid);
//                 setAdminUsers(admins);
//             }, error => {
//                 console.error("Admin fetch error:", error);
//             });

//         const unsubscribeTasks = firestore()
//             .collection('tasks')
//             .where('assignedBy', '==', adminUid)
//             .onSnapshot(snapshot => {
//                 const fetchedTasks = snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }));
//                 setTasks(fetchedTasks);
//                 setLoading(false);
//             }, error => {
//                 console.error("Tasks fetch error:", error);
//                 setLoading(false);
//             });

//         return () => {
//             unsubscribeStaff();
//             unsubscribeAdmins();
//             unsubscribeTasks();
//         };
//     }, [adminUid]);

//     useEffect(() => {
//         const sourceList = activeTab === 'users' ? staffUsers : adminUsers;
//         let filtered = [...sourceList];

//         if (searchText) {
//             const lower = searchText.toLowerCase();
//             filtered = filtered.filter(u =>
//                 u.name?.toLowerCase().includes(lower) || u.email?.toLowerCase().includes(lower)
//             );
//         }
//         setAllUsers(filtered);
//     }, [searchText, staffUsers, adminUsers, activeTab]);

//     const handleTabChange = (tab) => {
//         setActiveTab(tab);
//         setSearchText('');
//     };

//     const openAssignModal = user => {
//         setSelectedUser(user);
//         setTaskTitle('');
//         setTaskDescription('');
//         setTaskRemarks('');
//         setTaskDeadline(new Date(new Date().setDate(new Date().getDate() + 1)));
//         setAssignModalVisible(true);
//     };

//     const openViewTasksModal = user => {
//         const userTasks = tasks.filter(t => t.assignedTo === user.uid);
//         setSelectedUser({ ...user, tasks: userTasks });
//         setViewTasksModalVisible(true);
//     };

//     const assignTask = async () => {
//         if (!taskTitle.trim()) {
//             return Alert.alert('Validation Error', 'Task title is required.');
//         }
//         if (taskDeadline < new Date()) {
//             return Alert.alert('Validation Error', 'Deadline must be a future date.');
//         }

//         try {
//             const taskRef = firestore().collection('tasks').doc();
//             await taskRef.set({
//                 taskId: taskRef.id,
//                 title: taskTitle.trim(),
//                 description: taskDescription.trim(),
//                 status: "pending",
//                 assignedTo: selectedUser.uid,
//                 assignedBy: adminUid,
//                 assignedToIsAdmin: selectedUser?.role === 'admin',
//                 deadline: firestore.Timestamp.fromDate(taskDeadline),
//                 createdAt: firestore.FieldValue.serverTimestamp(),
//                 updatedAt: firestore.FieldValue.serverTimestamp(),
//                 remarks: taskRemarks ? taskRemarks.split(',').map(r => r.trim()) : [],
//             });

//             setAssignModalVisible(false);
//             setSnackbarVisible(true);
//         } catch (err) {
//             console.error(err);
//             Alert.alert('Error', 'Failed to assign task. Please check your connection.');
//         }
//     };

//     const renderUser = ({ item }) => {
//         const userTasks = tasks.filter(t => t.assignedTo === item.uid);
//         const pendingTasks = userTasks.filter(t => t.status === "pending");

//         let nearestDeadline = null;
//         if (pendingTasks.length > 0) {
//             nearestDeadline = pendingTasks
//                 .map(t => t.deadline?.toDate?.())
//                 .filter(Boolean)
//                 .sort((a, b) => a - b)[0];
//         }

//         let deadlineColor = theme.colors.text;
//         let deadlineLabel = "No pending deadline";
//         if (nearestDeadline) {
//             const now = new Date();
//             const diffHours = (nearestDeadline - now) / (1000 * 60 * 60);

//             if (diffHours < 0) {
//                 deadlineColor = "red";
//                 deadlineLabel = "Deadline Passed";
//             } else if (diffHours <= 24) {
//                 deadlineColor = "orange";
//                 deadlineLabel = "Due Soon";
//             } else {
//                 deadlineColor = "green";
//                 deadlineLabel = "Upcoming";
//             }
//         }

//         return (
//             <Card style={[styles.userCard, { backgroundColor: theme.colors.card }]}>
//                 <Card.Content>
//                     <Text variant="titleLarge" style={{ color: theme.colors.text }}>{item.name}</Text>
//                     <Text style={{ color: theme.colors.text, marginBottom: 8 }}>{item.email || item.phone}</Text>

//                     {pendingTasks.length > 0 && (
//                         <View style={[styles.badge, { backgroundColor: theme.colors.notification }]}>
//                             <Text style={styles.badgeText}>{pendingTasks.length}</Text>
//                         </View>
//                     )}

//                     {nearestDeadline && (
//                         <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
//                             <Ionicons name="calendar-outline" size={18} color={deadlineColor} style={{ marginRight: 6 }} />
//                             <Text style={{ color: deadlineColor, fontWeight: '600' }}>
//                                 {`${nearestDeadline.toDateString()} • ${deadlineLabel}`}
//                             </Text>
//                         </View>
//                     )}

//                     <View style={styles.buttonRow}>
//                         <Button
//                             mode="contained"
//                             onPress={() => openViewTasksModal(item)}
//                             buttonColor={theme.colors.primary}
//                             textColor={theme.colors.text}
//                             style={styles.cardButton}
//                             icon={() => <Ionicons name="list-outline" size={18} color={theme.colors.text} />}
//                         >
//                             {`${userTasks.length} Tasks`}
//                         </Button>
//                         <Button
//                             mode="contained-tonal"
//                             onPress={() => openAssignModal(item)}
//                             buttonColor={theme.colors.border}
//                             textColor={theme.colors.text}
//                             style={styles.cardButton}
//                             icon={() => <Ionicons name="add-circle-outline" size={18} color={theme.colors.text} />}
//                         >
//                             Assign
//                         </Button>
//                     </View>
//                 </Card.Content>
//             </Card>
//         );
//     };

//     const ListHeader = () => (
//         <View style={{ backgroundColor: theme.colors.background, paddingBottom: 5 }}>
//             <TextInputSearch
//                 placeholder="Search by name or email"
//                 placeholderTextColor={theme.colors.text + '88'}
//                 value={searchText}
//                 onChangeText={setSearchText}
//                 style={[styles.searchInput, { borderColor: theme.colors.primary, color: theme.colors.text, backgroundColor: theme.colors.card }]}
//             />
//             <View style={[styles.tabContainer, { borderColor: theme.colors.primary }]}>
//                 <TouchableOpacity
//                     style={[styles.tabButton, activeTab === 'users' && { backgroundColor: theme.colors.primary }]}
//                     onPress={() => handleTabChange('users')}
//                 >
//                     <Text style={[styles.tabText, { color: activeTab === 'users' ? '#fff' : theme.colors.text }]}>{`Staff (${staffUsers.length})`}</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                     style={[styles.tabButton, activeTab === 'admins' && { backgroundColor: theme.colors.primary }]}
//                     onPress={() => handleTabChange('admins')}
//                 >
//                     <Text style={[styles.tabText, { color: activeTab === 'admins' ? '#fff' : theme.colors.text }]}>{`Admins (${adminUsers.length})`}</Text>
//                 </TouchableOpacity>
//             </View>
//         </View>
//     );

//     return (
//         <PaperProvider>
//             <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
//                 <View style={styles.container}>
//                     {loading ? (
//                         <View style={styles.loadingContainer}>
//                             <ActivityIndicator size="large" color={theme.colors.primary} />
//                             <Text style={{ color: theme.colors.text, marginTop: 10 }}>Loading users...</Text>
//                         </View>
//                     ) : (
//                         <FlatList
//                             data={allUsers}
//                             keyExtractor={item => item.uid}
//                             renderItem={renderUser}
//                             ListHeaderComponent={ListHeader}
//                             stickyHeaderIndices={[0]}
//                             contentContainerStyle={{ paddingBottom: 80 }}
//                             ListEmptyComponent={
//                                 <Text style={{ color: theme.colors.text + 'aa', textAlign: 'center', marginTop: 50 }}>
//                                     {`No ${activeTab === 'users' ? 'staff users' : 'other admins'} found.`}
//                                 </Text>
//                             }
//                         />
//                     )}

//                     <Portal>
//                         <Modal visible={assignModalVisible} onDismiss={() => setAssignModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
//                             <Text variant='titleLarge' style={{ color: theme.colors.text, marginBottom: 16 }}>{`Assign to ${selectedUser?.name}`}</Text>
//                             <TextInput
//                                 mode='outlined'
//                                 label="Task Title"
//                                 value={taskTitle}
//                                 onChangeText={setTaskTitle}
//                                 style={styles.input}
//                                 outlineColor={theme.colors.primary}
//                                 activeOutlineColor={theme.colors.border}
//                             />
//                             <TextInput
//                                 mode='outlined'
//                                 label="Task Description"
//                                 value={taskDescription}
//                                 onChangeText={setTaskDescription}
//                                 style={styles.input}
//                                 outlineColor={theme.colors.primary}
//                                 activeOutlineColor={theme.colors.border}
//                             />
//                             <Button mode="outlined" onPress={() => setOpenDatePicker(true)} style={styles.dateButton} textColor={theme.colors.text}>
//                                 {`Deadline: ${taskDeadline.toDateString()}`}
//                             </Button>
//                             <DatePicker
//                                 modal
//                                 open={openDatePicker}
//                                 date={taskDeadline}
//                                 mode="date"
//                                 onConfirm={(date) => { setOpenDatePicker(false); setTaskDeadline(date); }}
//                                 onCancel={() => setOpenDatePicker(false)}
//                                 minimumDate={new Date()}
//                             />
//                             <TextInput
//                                 mode='outlined'
//                                 label="Remarks (comma separated)"
//                                 value={taskRemarks}
//                                 onChangeText={setTaskRemarks}
//                                 style={styles.input}
//                                 outlineColor={theme.colors.primary}
//                                 activeOutlineColor={theme.colors.border}
//                             />
//                             <Button mode="contained" onPress={assignTask} style={{ marginTop: 8 }} buttonColor={theme.colors.primary}>
//                                 Assign Task
//                             </Button>
//                             <Button mode="text" style={{ marginTop: 4 }} onPress={() => setAssignModalVisible(false)} textColor={theme.colors.text}>
//                                 Cancel
//                             </Button>
//                         </Modal>
//                     </Portal>

//                     {selectedUser && (
//                         <PremiumTasksModal
//                             visible={viewTasksModalVisible}
//                             onDismiss={() => setViewTasksModalVisible(false)}
//                             selectedUser={selectedUser}
//                             theme={theme}
//                         />
//                     )}

//                     <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={2000} style={{ backgroundColor: theme.colors.primary }}>
//                         {`Task assigned to ${selectedUser?.name}!`}
//                     </Snackbar>
//                 </View>
//             </SafeAreaView>
//         </PaperProvider>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flex: 1, paddingHorizontal: 16 },
//     loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//     userCard: { marginBottom: 12, borderRadius: 12, elevation: 2 },
//     searchInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, height: 50, marginBottom: 12 },
//     modalContent: { padding: 20, borderRadius: 12, marginHorizontal: 16 },
//     input: { marginBottom: 12 },
//     dateButton: { marginBottom: 12, paddingVertical: 8, borderRadius: 5, justifyContent: 'center' },
//     tabContainer: { flexDirection: 'row', marginBottom: 10, borderRadius: 8, overflow: 'hidden', borderWidth: 1 },
//     tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center' },
//     tabText: { fontWeight: 'bold', fontSize: 14 },
//     badge: { position: 'absolute', top: 16, right: 16, borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
//     badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
//     buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
//     cardButton: { flex: 0.48, borderRadius: 8 }
// });

// export default AssignScreen;



























import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { View, FlatList, TextInput as TextInputSearch, StyleSheet, Dimensions, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Portal, Button, Card, Text, Provider as PaperProvider, Snackbar, TextInput, Modal, useTheme } from 'react-native-paper';
import DatePicker from 'react-native-date-picker';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { ThemeContext } from '../../context/ThemeContext';
import PremiumTasksModal from "../../components/ViewTaskModal";
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const AssignScreen = () => {
    const { theme } = useContext(ThemeContext);
    const RNPTheme = useTheme();
    const adminUid = auth().currentUser?.uid;

    const [allUsers, setAllUsers] = useState([]);
    const [staffUsers, setStaffUsers] = useState([]);
    const [adminUsers, setAdminUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const [assignModalVisible, setAssignModalVisible] = useState(false);
    const [viewTasksModalVisible, setViewTasksModalVisible] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskDeadline, setTaskDeadline] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
    });
    const [openDatePicker, setOpenDatePicker] = useState(false);

    const [searchText, setSearchText] = useState('');
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('users');

    // --- Data Fetching & Filtering (Unchanged) ---
    useEffect(() => {
        if (!adminUid) return;
        setLoading(true);

        const unsubscribeStaff = firestore()
            .collection('users')
            .where('adminId', '==', adminUid)
            .onSnapshot(snapshot => {
                const staff = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })).filter(user => user.role !== 'admin');
                setStaffUsers(staff);
            }, error => {
                console.error("Staff fetch error:", error);
                Alert.alert("Error", "Could not fetch staff users.");
            });

        const unsubscribeAdmins = firestore()
            .collection('users')
            .where('role', '==', 'admin')
            .onSnapshot(snapshot => {
                const admins = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })).filter(u => u.uid !== adminUid);
                setAdminUsers(admins);
            }, error => {
                console.error("Admin fetch error:", error);
            });

        const unsubscribeTasks = firestore()
            .collection('tasks')
            .where('assignedBy', '==', adminUid)
            .onSnapshot(snapshot => {
                const fetchedTasks = snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }));
                setTasks(fetchedTasks);
                setLoading(false);
            }, error => {
                console.error("Tasks fetch error:", error);
                setLoading(false);
            });

        return () => {
            unsubscribeStaff();
            unsubscribeAdmins();
            unsubscribeTasks();
        };
    }, [adminUid]);

    useEffect(() => {
        const sourceList = activeTab === 'users' ? staffUsers : adminUsers;
        let filtered = [...sourceList];

        if (searchText) {
            const lower = searchText.toLowerCase();
            filtered = filtered.filter(u =>
                u.name?.toLowerCase().includes(lower) || u.email?.toLowerCase().includes(lower)
            );
        }
        setAllUsers(filtered);
    }, [searchText, staffUsers, adminUsers, activeTab]);
    // --- End Data Fetching & Filtering ---


    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchText('');
    };

    const openAssignModal = user => {
        setSelectedUser(user);
        setTaskTitle('');
        setTaskDescription('');
        setTaskDeadline(new Date(new Date().setDate(new Date().getDate() + 1)));
        setAssignModalVisible(true);
    };

    // 💡 FIX 1: Wrap openViewTasksModal in useCallback to stabilize it.
    const openViewTasksModal = useCallback(user => {
        // Dependencies: tasks, setSelectedUser, setViewTasksModalVisible
        const userTasks = tasks.filter(t => t.assignedTo === user.uid);
        setSelectedUser({ ...user, tasks: userTasks });
        setViewTasksModalVisible(true);
    }, [tasks, setSelectedUser, setViewTasksModalVisible]);


    const assignTask = async () => {
        if (!taskTitle.trim()) {
            return Alert.alert('Validation Error', 'Task title is required.');
        }
        if (taskDeadline < new Date()) {
            return Alert.alert('Validation Error', 'Deadline must be a future date.');
        }

        try {
            const taskRef = firestore().collection('tasks').doc();
            await taskRef.set({
                taskId: taskRef.id,
                title: taskTitle.trim(),
                description: taskDescription.trim(),
                status: "pending",
                assignedTo: selectedUser.uid,
                assignedBy: adminUid,
                assignedToIsAdmin: selectedUser?.role === 'admin',
                deadline: firestore.Timestamp.fromDate(taskDeadline),
                createdAt: firestore.FieldValue.serverTimestamp(),
                updatedAt: firestore.FieldValue.serverTimestamp(),
                remarks: [],
            });

            setAssignModalVisible(false);
            setSnackbarVisible(true);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to assign task. Please check your connection.');
        }
    };

    // 💡 FIX 2: Now that openViewTasksModal is stable (via useCallback), we can use it in useMemo.
    const renderUser = useCallback(({ item }) => {
        const userTasks = tasks.filter(t => t.assignedTo === item.uid);
        const pendingTasks = userTasks.filter(t => t.status === "pending" || t.status === "in-progress");

        let nearestDeadline = null;
        if (pendingTasks.length > 0) {
            nearestDeadline = pendingTasks
                .map(t => t.deadline?.toDate?.())
                .filter(Boolean)
                .sort((a, b) => a - b)[0];
        }

        let deadlineColor = theme.colors.text;
        let deadlineLabel = "No pending deadline";
        if (nearestDeadline) {
            const now = new Date();
            const diffHours = (nearestDeadline - now) / (1000 * 60 * 60);

            if (diffHours < 0) {
                deadlineColor = theme.colors.primary;
                deadlineLabel = "Deadline Passed";
            } else if (diffHours <= 72) {
                deadlineColor = theme.colors.border;
                deadlineLabel = "Due Soon";
            } else {
                deadlineColor = RNPTheme.colors.onSurfaceVariant;
                deadlineLabel = "Upcoming";
            }
        }

        const badgeBgColor = pendingTasks.length > 0 ? theme.colors.notification : RNPTheme.colors.surfaceVariant;
        const buttonTextColor = theme.dark ? '#FFFFFF' : theme.colors.text;
        const textColor = theme.colors.text;

        return (
            <Card style={[styles.userCard, { backgroundColor: theme.colors.card }]}>
                <Card.Content>
                    <Text variant="titleLarge" style={{ color: textColor, fontWeight: '700' }}>{item.name}</Text>
                    <Text style={{ color: RNPTheme.colors.onSurfaceVariant, marginBottom: 8, fontSize: 13 }}>{item.email || item.phone}</Text>

                    {pendingTasks.length > 0 && (
                        <View style={[styles.badge, { backgroundColor: badgeBgColor }]}>
                            <Text style={styles.badgeText}>{pendingTasks.length}</Text>
                        </View>
                    )}

                    {nearestDeadline && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                            <Ionicons name="calendar-outline" size={16} color={deadlineColor} style={{ marginRight: 6 }} />
                            <Text style={{ color: deadlineColor, fontWeight: '600', fontSize: 13 }}>
                                {`${nearestDeadline.toDateString()} • ${deadlineLabel}`}
                            </Text>
                        </View>
                    )}

                    <View style={styles.buttonRow}>
                        <Button
                            mode="outlined"
                            onPress={() => openViewTasksModal(item)}
                            textColor={buttonTextColor}
                            style={[styles.cardButton, { borderColor: theme.colors.primary }]}
                            icon={() => <Ionicons name="list-outline" size={18} color={theme.colors.primary} />}
                        >
                            {`${userTasks.length} Tasks`}
                        </Button>
                        <Button
                            mode="contained"
                            onPress={() => openAssignModal(item)}
                            buttonColor={theme.colors.border}
                            textColor={buttonTextColor}
                            style={styles.cardButton}
                            icon={() => <Ionicons name="add-circle-outline" size={18} color={buttonTextColor} />}
                        >
                            Assign
                        </Button>
                    </View>
                </Card.Content>
            </Card>
        );
    }, [tasks, theme, RNPTheme, openViewTasksModal]); // Include openViewTasksModal in dependencies

    const SearchAndTabs = () => (
        <View style={{ backgroundColor: theme.colors.background, paddingHorizontal: 16, paddingBottom: 10 }}>
            <TextInputSearch
                placeholder="Search by name or email"
                placeholderTextColor={theme.colors.text + '88'}
                value={searchText}
                onChangeText={setSearchText}
                style={[
                    styles.searchInput,
                    {
                        borderColor: theme.colors.primary,
                        color: theme.colors.text,
                        backgroundColor: theme.colors.card
                    }
                ]}
            />
            <View style={[styles.tabContainer, { borderColor: theme.colors.primary }]}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'users' && { backgroundColor: theme.colors.primary }]}
                    onPress={() => handleTabChange('users')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'users' ? '#fff' : theme.colors.text }]}>{`Staff (${staffUsers.length})`}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'admins' && { backgroundColor: theme.colors.primary }]}
                    onPress={() => handleTabChange('admins')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'admins' ? '#fff' : theme.colors.text }]}>{`Admins (${adminUsers.length})`}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const inputStyleProps = {
        mode: 'outlined',
        outlineColor: theme.colors.primary,
        activeOutlineColor: theme.colors.border,
        selectionColor: theme.colors.border,
        textColor: theme.colors.text,
        theme: RNPTheme,
    };

    const textColor = theme.colors.text;

    return (
        <PaperProvider theme={RNPTheme}>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <View style={{ flex: 1 }}>
                    <SearchAndTabs />

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                            <Text style={{ color: textColor, marginTop: 10 }}>Loading users...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={allUsers}
                            keyExtractor={item => item.uid}
                            renderItem={renderUser}
                            contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 16 }}
                            ListEmptyComponent={
                                <Text style={{ color: textColor + 'aa', textAlign: 'center', marginTop: 50 }}>
                                    {`No ${activeTab === 'users' ? 'staff users' : 'other admins'} found.`}
                                </Text>
                            }
                        />
                    )}

                    <Portal>
                        {/* Assign Task Modal */}
                        <Modal visible={assignModalVisible} onDismiss={() => setAssignModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                            <Text variant='titleLarge' style={{ color: textColor, marginBottom: 16, fontWeight: '700' }}>{`Assign Task to ${selectedUser?.name || 'User'}`}</Text>

                            <TextInput
                                {...inputStyleProps}
                                label="Task Title"
                                value={taskTitle}
                                onChangeText={setTaskTitle}
                                style={styles.input}
                            />
                            <TextInput
                                {...inputStyleProps}
                                label="Task Description (Optional)"
                                value={taskDescription}
                                onChangeText={setTaskDescription}
                                multiline
                                numberOfLines={3}
                                style={styles.input}
                            />

                            <Button mode="outlined" onPress={() => setOpenDatePicker(true)} style={[styles.dateButton, { borderColor: theme.colors.primary }]} textColor={textColor} icon="calendar-month-outline">
                                {`Deadline: ${taskDeadline.toDateString()}`}
                            </Button>

                            <DatePicker
                                modal
                                open={openDatePicker}
                                date={taskDeadline}
                                mode="date"
                                onConfirm={(date) => { setOpenDatePicker(false); setTaskDeadline(date); }}
                                onCancel={() => setOpenDatePicker(false)}
                                minimumDate={new Date()}
                            />

                            <Button mode="contained" onPress={assignTask} style={{ marginTop: 16, borderRadius: 8 }} buttonColor={theme.colors.border}>
                                ASSIGN TASK
                            </Button>
                            <Button mode="text" style={{ marginTop: 4 }} onPress={() => setAssignModalVisible(false)} textColor={textColor}>
                                Cancel
                            </Button>
                        </Modal>
                    </Portal>

                    {selectedUser && (
                        <PremiumTasksModal
                            visible={viewTasksModalVisible}
                            onDismiss={() => setViewTasksModalVisible(false)}
                            selectedUser={selectedUser}
                        />
                    )}

                    <Snackbar
                        visible={snackbarVisible}
                        onDismiss={() => setSnackbarVisible(false)}
                        duration={2000}
                        style={{ backgroundColor: theme.colors.primary, bottom: 0, zIndex: 9999 }}
                    >
                        <Text style={{ color: theme.dark ? textColor : '#FFFFFF' }}>{`Task assigned to ${selectedUser?.name || 'user'}!`}</Text>
                    </Snackbar>
                </View>
            </SafeAreaView>
        </PaperProvider>
    );
};

// ---
// ## Styles
// ---

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    userCard: { marginBottom: 16, borderRadius: 12, elevation: 4 },

    searchInput: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 50,
        marginBottom: 12,
        paddingLeft: 10,
    },

    tabContainer: {
        flexDirection: 'row',
        marginBottom: 10,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 2,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center'
    },
    tabText: { fontWeight: 'bold', fontSize: 15 },

    badge: {
        position: 'absolute',
        top: 16,
        right: 16,
        borderRadius: 12,
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1
    },
    badgeText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
    cardButton: { flex: 0.48, borderRadius: 8, paddingVertical: 4 },

    modalContent: {
        padding: 24,
        borderRadius: 16,
        marginHorizontal: 16,
    },
    input: { marginBottom: 12 },
    dateButton: { marginBottom: 16, paddingVertical: 10, borderRadius: 8, justifyContent: 'center' },
});

export default AssignScreen;