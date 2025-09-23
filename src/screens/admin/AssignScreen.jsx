/* eslint-disable react-native/no-inline-styles */
// import React, { useState, useEffect, useContext } from 'react';
// import { View, FlatList, TextInput, ScrollView, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Modal, Portal, Button, Card, Text, Provider as PaperProvider } from 'react-native-paper';
// import firestore from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';
// import { ThemeContext } from '../../context/ThemeContext';

// const { width, height } = Dimensions.get('window');

// const AssignScreen = () => {
//     const { theme } = useContext(ThemeContext);
//     const adminUid = auth().currentUser?.uid;

//     const [users, setUsers] = useState([]);
//     const [filteredUsers, setFilteredUsers] = useState([]);
//     const [tasks, setTasks] = useState([]);
//     const [loading, setLoading] = useState(true);

//     const [assignModalVisible, setAssignModalVisible] = useState(false);
//     const [viewTasksModalVisible, setViewTasksModalVisible] = useState(false);

//     const [selectedUser, setSelectedUser] = useState(null);
//     const [taskTitle, setTaskTitle] = useState('');
//     const [taskDescription, setTaskDescription] = useState('');
//     const [taskStatus, setTaskStatus] = useState('todo');
//     const [taskRemarks, setTaskRemarks] = useState('');
//     const [searchText, setSearchText] = useState('');
//     const [bounceAnim] = useState(new Animated.Value(0));

//     // Bounce animation for "no users" icon
//     useEffect(() => {
//         Animated.loop(
//             Animated.sequence([
//                 Animated.timing(bounceAnim, { toValue: -10, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
//                 Animated.timing(bounceAnim, { toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: true }),
//             ])
//         ).start();
//     }, [bounceAnim]);

//     // Fetch users
//     useEffect(() => {
//         if (!adminUid) return;
//         const unsubscribe = firestore()
//             .collection('users')
//             .where('adminId', '==', adminUid)
//             .onSnapshot(snapshot => {
//                 const assignedUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })).filter(u => u.uid !== adminUid);
//                 setUsers(assignedUsers);
//                 setFilteredUsers(assignedUsers);
//                 setLoading(false);
//             }, error => {
//                 console.error(error);
//                 setLoading(false);
//             });
//         return () => unsubscribe();
//     }, [adminUid]);

//     // Fetch tasks
//     useEffect(() => {
//         if (!adminUid) return;
//         const unsubscribe = firestore()
//             .collection('tasks')
//             .where('assignedBy', '==', adminUid)
//             .onSnapshot(snapshot => setTasks(snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }))));
//         return () => unsubscribe();
//     }, [adminUid]);

//     // Filter users
//     useEffect(() => {
//         if (!searchText) return setFilteredUsers(users);
//         const lower = searchText.toLowerCase();
//         setFilteredUsers(users.filter(u => (u.name?.toLowerCase().includes(lower) || u.email?.toLowerCase().includes(lower))));
//     }, [searchText, users]);

//     const openAssignModal = user => {
//         setSelectedUser(user);
//         setTaskTitle('');
//         setTaskDescription('');
//         setTaskStatus('todo');
//         setTaskRemarks('');
//         setAssignModalVisible(true);
//     };

//     const openViewTasksModal = user => {
//         const userTasks = tasks.filter(t => t.assignedTo === user.uid);
//         setSelectedUser({ ...user, tasks: userTasks });
//         setViewTasksModalVisible(true);
//     };

//     const assignTask = async () => {
//         if (!taskTitle) return alert('Task title is required');
//         try {
//             const taskRef = firestore().collection('tasks').doc();
//             await taskRef.set({
//                 taskId: taskRef.id,
//                 title: taskTitle,
//                 description: taskDescription,
//                 status: taskStatus,
//                 assignedTo: selectedUser.uid,
//                 assignedBy: adminUid,
//                 createdAt: firestore.FieldValue.serverTimestamp(),
//                 updatedAt: firestore.FieldValue.serverTimestamp(),
//                 remarks: taskRemarks ? taskRemarks.split(',').map(r => r.trim()) : [],
//             });
//             alert(`Task assigned to ${selectedUser.name}`);
//             setAssignModalVisible(false);
//         } catch (err) {
//             console.error(err);
//             alert('Failed to assign task');
//         }
//     };

//     const renderUser = ({ item }) => {
//         const userTasks = tasks.filter(t => t.assignedTo === item.uid);
//         return (
//             <Card style={[styles.userCard, { backgroundColor: theme.colors.card }]}>
//                 <Card.Content>
//                     <Text style={{ color: theme.colors.text }}>{item.name}</Text>
//                     <Text style={{ color: theme.colors.text, marginBottom: 8 }}>{item.email}</Text>
//                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
//                         <Button mode="contained" onPress={() => openViewTasksModal(item)} buttonColor={theme.colors.primary} textColor={theme.colors.text}>
//                             {userTasks.length} Tasks
//                         </Button>
//                         <Button mode="contained" onPress={() => openAssignModal(item)} buttonColor={theme.colors.border} textColor={theme.colors.text}>
//                             Assign Task
//                         </Button>
//                     </View>
//                 </Card.Content>
//             </Card>
//         );
//     };

//     return (
//         <PaperProvider>
//             <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
//                 <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
//                     <TextInput
//                         placeholder="Search by name or email"
//                         placeholderTextColor={theme.colors.text + '88'}
//                         value={searchText}
//                         onChangeText={setSearchText}
//                         style={[styles.searchInput, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.card }]}
//                     />

//                     {loading ? (
//                         <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20 }}>Loading users...</Text>
//                     ) : filteredUsers.length === 0 ? (
//                         <View style={styles.noUsersContainer}>
//                             <Animated.Text style={[styles.noUsersIcon, { color: theme.colors.primary, transform: [{ translateY: bounceAnim }] }]}>👤</Animated.Text>
//                             <Text style={{ color: theme.colors.text }}>No users found</Text>
//                             <Text style={{ color: theme.colors.text + 'aa', textAlign: 'center' }}>No users match your search or are currently assigned.</Text>
//                         </View>
//                     ) : (
//                         <FlatList
//                             data={filteredUsers}
//                             keyExtractor={item => item.uid}
//                             renderItem={renderUser}
//                             contentContainerStyle={{ paddingBottom: 80 }}
//                         />
//                     )}

//                     {/* Assign Task Modal */}
//                     <Portal>
//                         <Modal visible={assignModalVisible} onDismiss={() => setAssignModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
//                             <Text style={{ color: theme.colors.text, marginBottom: 12 }} variant='headlineMedium'>Assign Task to {selectedUser?.name}</Text>
//                             <TextInput
//                                 placeholder="Task Title"
//                                 value={taskTitle}
//                                 onChangeText={setTaskTitle}
//                                 style={[styles.input, { borderColor: theme.colors.primary, color: theme.colors.text, backgroundColor: theme.colors.background }]}
//                             />
//                             <TextInput
//                                 placeholder="Task Description"
//                                 value={taskDescription}
//                                 onChangeText={setTaskDescription}
//                                 multiline
//                                 style={[styles.input, { borderColor: theme.colors.primary, color: theme.colors.text, height: 100, backgroundColor: theme.colors.background }]}
//                             />
//                             <TextInput
//                                 placeholder="Status"
//                                 value={taskStatus}
//                                 onChangeText={setTaskStatus}
//                                 style={[styles.input, { borderColor: theme.colors.primary, color: theme.colors.text, backgroundColor: theme.colors.background }]}
//                             />
//                             <TextInput
//                                 placeholder="Remarks (comma separated)"
//                                 value={taskRemarks}
//                                 onChangeText={setTaskRemarks}
//                                 style={[styles.input, { borderColor: theme.colors.primary, color: theme.colors.text, backgroundColor: theme.colors.background }]}
//                             />
//                             <Button mode="contained" onPress={assignTask} style={{ marginBottom: 8 }} buttonColor={theme.colors.border} textColor={theme.colors.text}>Assign Task</Button>
//                             <Button mode="text" buttonColor={theme.colors.primary} textColor={theme.colors.text} onPress={() => setAssignModalVisible(false)}>Cancel</Button>
//                         </Modal>
//                     </Portal>

//                     {/* View Tasks Modal */}
//                     <Portal>
//                         <Modal visible={viewTasksModalVisible} onDismiss={() => setViewTasksModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.card, maxHeight: height * 0.7 }]}>
//                             <Text style={{ color: theme.colors.text, marginBottom: 12 }} >{selectedUser?.name}'s Tasks</Text>
//                             <ScrollView>
//                                 {selectedUser?.tasks?.length ? selectedUser.tasks.map(task => (
//                                     <Card key={task.taskId} style={[styles.taskItem, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
//                                         <Card.Content>
//                                             <Text style={{ color: theme.colors.text }}>{task.title}</Text>
//                                             <Text style={{ color: theme.colors.text }}>Status: {task.status}</Text>
//                                             <Text style={{ color: theme.colors.text }}>Description: {task.description}</Text>
//                                             {task.remarks?.length > 0 && <Text style={{ color: theme.colors.text }}>Remarks: {task.remarks.join(', ')}</Text>}
//                                         </Card.Content>
//                                     </Card>
//                                 )) : <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20 }}>No tasks assigned</Text>}
//                             </ScrollView>
//                             <Button mode="contained" onPress={() => setViewTasksModalVisible(false)} style={{ marginTop: 8 }} buttonColor={theme.colors.primary} textColor={theme.colors.text}>Close</Button>
//                         </Modal>
//                     </Portal> 
   

                   

//                 </View>
//             </SafeAreaView>
//         </PaperProvider>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flex: 1, padding: 16 },
//     userCard: { marginBottom: 12, borderRadius: 12, elevation: 2 },
//     searchInput: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 12 },
//     modalContent: { padding: 20, borderRadius: 12, marginHorizontal: 16 },
//     input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12 },
//     taskItem: { marginBottom: 10, borderRadius: 10, elevation: 1 },
//     noUsersContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
//     noUsersIcon: { fontSize: width * 0.18, marginBottom: 16 },
// });

// export default AssignScreen;



// import React, { useState, useEffect, useContext } from 'react';
// import { View, FlatList, TextInput, ScrollView, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Modal, Portal, Button, Card, Text, Provider as PaperProvider, Menu } from 'react-native-paper';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import firestore from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';
// import { ThemeContext } from '../../context/ThemeContext';

// const { width, height } = Dimensions.get('window');

// const AssignScreen = () => {
//     const { theme } = useContext(ThemeContext);
//     const adminUid = auth().currentUser?.uid;

//     const [users, setUsers] = useState([]);
//     const [filteredUsers, setFilteredUsers] = useState([]);
//     const [tasks, setTasks] = useState([]);
//     const [loading, setLoading] = useState(true);

//     const [assignModalVisible, setAssignModalVisible] = useState(false);
//     const [viewTasksModalVisible, setViewTasksModalVisible] = useState(false);

//     const [selectedUser, setSelectedUser] = useState(null);
//     const [taskTitle, setTaskTitle] = useState('');
//     const [taskDescription, setTaskDescription] = useState('');
//     const [taskStatus, setTaskStatus] = useState('pending');
//     const [taskRemarks, setTaskRemarks] = useState('');
//     const [taskDeadline, setTaskDeadline] = useState(new Date());

//     const [statusMenuVisible, setStatusMenuVisible] = useState(false);
//     const [showDatePicker, setShowDatePicker] = useState(false);

//     const [searchText, setSearchText] = useState('');
//     const [bounceAnim] = useState(new Animated.Value(0));

//     // Bounce animation for "no users" icon
//     useEffect(() => {
//         Animated.loop(
//             Animated.sequence([
//                 Animated.timing(bounceAnim, { toValue: -10, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
//                 Animated.timing(bounceAnim, { toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: true }),
//             ])
//         ).start();
//     }, [bounceAnim]);

//     // Fetch users
//     useEffect(() => {
//         if (!adminUid) return;
//         const unsubscribe = firestore()
//             .collection('users')
//             .where('adminId', '==', adminUid)
//             .onSnapshot(snapshot => {
//                 const assignedUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })).filter(u => u.uid !== adminUid);
//                 setUsers(assignedUsers);
//                 setFilteredUsers(assignedUsers);
//                 setLoading(false);
//             }, error => {
//                 console.error(error);
//                 setLoading(false);
//             });
//         return () => unsubscribe();
//     }, [adminUid]);

//     // Fetch tasks
//     useEffect(() => {
//         if (!adminUid) return;
//         const unsubscribe = firestore()
//             .collection('tasks')
//             .where('assignedBy', '==', adminUid)
//             .onSnapshot(snapshot => setTasks(snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }))));
//         return () => unsubscribe();
//     }, [adminUid]);

//     // Filter users
//     useEffect(() => {
//         if (!searchText) return setFilteredUsers(users);
//         const lower = searchText.toLowerCase();
//         setFilteredUsers(users.filter(u => (u.name?.toLowerCase().includes(lower) || u.email?.toLowerCase().includes(lower))));
//     }, [searchText, users]);

//     const openAssignModal = user => {
//         setSelectedUser(user);
//         setTaskTitle('');
//         setTaskDescription('');
//         setTaskStatus('pending');
//         setTaskRemarks('');
//         setTaskDeadline(new Date());
//         setAssignModalVisible(true);
//     };

//     const openViewTasksModal = user => {
//         const userTasks = tasks.filter(t => t.assignedTo === user.uid);
//         setSelectedUser({ ...user, tasks: userTasks });
//         setViewTasksModalVisible(true);
//     };

//     const assignTask = async () => {
//         if (!taskTitle) return alert('Task title is required');
//         try {
//             const taskRef = firestore().collection('tasks').doc();
//             await taskRef.set({
//                 taskId: taskRef.id,
//                 title: taskTitle,
//                 description: taskDescription,
//                 status: taskStatus,
//                 assignedTo: selectedUser.uid,
//                 assignedBy: adminUid,
//                 deadline: firestore.Timestamp.fromDate(taskDeadline),
//                 createdAt: firestore.FieldValue.serverTimestamp(),
//                 updatedAt: firestore.FieldValue.serverTimestamp(),
//                 remarks: taskRemarks ? taskRemarks.split(',').map(r => r.trim()) : [],
//             });
//             alert(`Task assigned to ${selectedUser.name}`);
//             setAssignModalVisible(false);
//         } catch (err) {
//             console.error(err);
//             alert('Failed to assign task');
//         }
//     };

//     const renderUser = ({ item }) => {
//         const userTasks = tasks.filter(t => t.assignedTo === item.uid);
//         return (
//             <Card style={[styles.userCard, { backgroundColor: theme.colors.card }]}>
//                 <Card.Content>
//                     <Text style={{ color: theme.colors.text }}>{item.name}</Text>
//                     <Text style={{ color: theme.colors.text, marginBottom: 8 }}>{item.email}</Text>
//                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
//                         <Button mode="contained" onPress={() => openViewTasksModal(item)} buttonColor={theme.colors.primary} textColor={theme.colors.text}>
//                             {userTasks.length} Tasks
//                         </Button>
//                         <Button mode="contained" onPress={() => openAssignModal(item)} buttonColor={theme.colors.border} textColor={theme.colors.text}>
//                             Assign Task
//                         </Button>
//                     </View>
//                 </Card.Content>
//             </Card>
//         );
//     };

//     return (
//         <PaperProvider>
//             <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
//                 <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
//                     <TextInput
//                         placeholder="Search by name or email"
//                         placeholderTextColor={theme.colors.text + '88'}
//                         value={searchText}
//                         onChangeText={setSearchText}
//                         style={[styles.searchInput, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.card }]}
//                     />

//                     {loading ? (
//                         <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20 }}>Loading users...</Text>
//                     ) : filteredUsers.length === 0 ? (
//                         <View style={styles.noUsersContainer}>
//                             <Animated.Text style={[styles.noUsersIcon, { color: theme.colors.primary, transform: [{ translateY: bounceAnim }] }]}>👤</Animated.Text>
//                             <Text style={{ color: theme.colors.text }}>No users found</Text>
//                             <Text style={{ color: theme.colors.text + 'aa', textAlign: 'center' }}>No users match your search or are currently assigned.</Text>
//                         </View>
//                     ) : (
//                         <FlatList
//                             data={filteredUsers}
//                             keyExtractor={item => item.uid}
//                             renderItem={renderUser}
//                             contentContainerStyle={{ paddingBottom: 80 }}
//                         />
//                     )}

//                     {/* Assign Task Modal */}
//                     <Portal>
//                         <Modal visible={assignModalVisible} onDismiss={() => setAssignModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
//                             <Text style={{ color: theme.colors.text, marginBottom: 12 }} variant='headlineMedium'>Assign Task to {selectedUser?.name}</Text>

//                             <TextInput
//                                 placeholder="Task Title"
//                                 value={taskTitle}
//                                 onChangeText={setTaskTitle}
//                                 style={[styles.input, { borderColor: theme.colors.primary, color: theme.colors.text, backgroundColor: theme.colors.background }]}
//                             />
//                             <TextInput
//                                 placeholder="Task Description"
//                                 value={taskDescription}
//                                 onChangeText={setTaskDescription}
//                                 multiline
//                                 style={[styles.input, { borderColor: theme.colors.primary, color: theme.colors.text, height: 100, backgroundColor: theme.colors.background }]}
//                             />

//                             {/* Status Dropdown */}
//                             <Menu
//                                 visible={statusMenuVisible}
//                                 onDismiss={() => setStatusMenuVisible(false)}
//                                 anchor={
//                                     <Button mode="outlined" onPress={() => setStatusMenuVisible(true)} style={{ marginBottom: 12 }}>
//                                         {taskStatus.toUpperCase()}
//                                     </Button>
//                                 }
//                             >
//                                 {["pending", "accepted", "rejected", "in-progress", "completed"].map(status => (
//                                     <Menu.Item key={status} onPress={() => { setTaskStatus(status); setStatusMenuVisible(false); }} title={status} />
//                                 ))}
//                             </Menu>

//                             {/* Deadline Picker */}
//                             <Button mode="outlined" onPress={() => setShowDatePicker(true)} style={{ marginBottom: 12 }}>
//                                 Deadline: {taskDeadline.toDateString()}
//                             </Button>
//                             {showDatePicker && (
//                                 <DateTimePicker
//                                     value={taskDeadline}
//                                     mode="date"
//                                     display="default"
//                                     onChange={(event, selectedDate) => {
//                                         setShowDatePicker(false);
//                                         if (selectedDate) setTaskDeadline(selectedDate);
//                                     }}
//                                 />
//                             )}

//                             <TextInput
//                                 placeholder="Remarks (comma separated)"
//                                 value={taskRemarks}
//                                 onChangeText={setTaskRemarks}
//                                 style={[styles.input, { borderColor: theme.colors.primary, color: theme.colors.text, backgroundColor: theme.colors.background }]}
//                             />

//                             <Button mode="contained" onPress={assignTask} style={{ marginBottom: 8 }} buttonColor={theme.colors.border} textColor={theme.colors.text}>Assign Task</Button>
//                             <Button mode="text" buttonColor={theme.colors.primary} textColor={theme.colors.text} onPress={() => setAssignModalVisible(false)}>Cancel</Button>
//                         </Modal>
//                     </Portal>

//                     {/* View Tasks Modal */}
//                     <Portal>
//                         <Modal visible={viewTasksModalVisible} onDismiss={() => setViewTasksModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.card, maxHeight: height * 0.7 }]}>
//                             <Text style={{ color: theme.colors.text, marginBottom: 12 }} >{selectedUser?.name}'s Tasks</Text>
//                             <ScrollView>
//                                 {selectedUser?.tasks?.length ? selectedUser.tasks.map(task => (
//                                     <Card key={task.taskId} style={[styles.taskItem, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
//                                         <Card.Content>
//                                             <Text style={{ color: theme.colors.text }}>{task.title}</Text>
//                                             <Text style={{ color: theme.colors.text }}>Status: {task.status}</Text>
//                                             <Text style={{ color: theme.colors.text }}>Deadline: {task.deadline?.toDate?.().toDateString?.() || "N/A"}</Text>
//                                             <Text style={{ color: theme.colors.text }}>Description: {task.description}</Text>
//                                             {task.remarks?.length > 0 && <Text style={{ color: theme.colors.text }}>Remarks: {task.remarks.join(', ')}</Text>}
//                                         </Card.Content>
//                                     </Card>
//                                 )) : <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20 }}>No tasks assigned</Text>}
//                             </ScrollView>
//                             <Button mode="contained" onPress={() => setViewTasksModalVisible(false)} style={{ marginTop: 8 }} buttonColor={theme.colors.primary} textColor={theme.colors.text}>Close</Button>
//                         </Modal>
//                     </Portal>
//                 </View>
//             </SafeAreaView>
//         </PaperProvider>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flex: 1, padding: 16 },
//     userCard: { marginBottom: 12, borderRadius: 12, elevation: 2 },
//     searchInput: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 12 },
//     modalContent: { padding: 20, borderRadius: 12, marginHorizontal: 16 },
//     input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12 },
//     taskItem: { marginBottom: 10, borderRadius: 10, elevation: 1 },
//     noUsersContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
//     noUsersIcon: { fontSize: width * 0.18, marginBottom: 16 },
// });

// export default AssignScreen;




// import React, { useState, useEffect, useContext } from 'react';
// import { View, FlatList, TextInput, ScrollView, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Modal, Portal, Button, Card, Text, Provider as PaperProvider, Menu , TextInput} from 'react-native-paper';
// import DatePicker from 'react-native-date-picker'; // ✅ Updated import
// import firestore from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';
// import { ThemeContext } from '../../context/ThemeContext';

// const { width, height } = Dimensions.get('window');

// const AssignScreen = () => {
//     const { theme } = useContext(ThemeContext);
//     const adminUid = auth().currentUser?.uid;

//     const [users, setUsers] = useState([]);
//     const [filteredUsers, setFilteredUsers] = useState([]);
//     const [tasks, setTasks] = useState([]);
//     const [loading, setLoading] = useState(true);

//     const [assignModalVisible, setAssignModalVisible] = useState(false);
//     const [viewTasksModalVisible, setViewTasksModalVisible] = useState(false);

//     const [selectedUser, setSelectedUser] = useState(null);
//     const [taskTitle, setTaskTitle] = useState('');
//     const [taskDescription, setTaskDescription] = useState('');
//     const [taskStatus, setTaskStatus] = useState('pending');
//     const [taskRemarks, setTaskRemarks] = useState('');
//     const [taskDeadline, setTaskDeadline] = useState(new Date());

//     const [openDatePicker, setOpenDatePicker] = useState(false); 

//     const [searchText, setSearchText] = useState('');
//     const [bounceAnim] = useState(new Animated.Value(0));

//     useEffect(() => {
//         Animated.loop(
//             Animated.sequence([
//                 Animated.timing(bounceAnim, { toValue: -10, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
//                 Animated.timing(bounceAnim, { toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: true }),
//             ])
//         ).start();
//     }, [bounceAnim]);

//     useEffect(() => {
//         if (!adminUid) return;
//         const unsubscribe = firestore()
//             .collection('users')
//             .where('adminId', '==', adminUid)
//             .onSnapshot(snapshot => {
//                 const assignedUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })).filter(u => u.uid !== adminUid);
//                 setUsers(assignedUsers);
//                 setFilteredUsers(assignedUsers);
//                 setLoading(false);
//             }, error => {
//                 console.error(error);
//                 setLoading(false);
//             });
//         return () => unsubscribe();
//     }, [adminUid]);

//     useEffect(() => {
//         if (!adminUid) return;
//         const unsubscribe = firestore()
//             .collection('tasks')
//             .where('assignedBy', '==', adminUid)
//             .onSnapshot(snapshot => setTasks(snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }))));
//         return () => unsubscribe();
//     }, [adminUid]);

//     useEffect(() => {
//         if (!searchText) return setFilteredUsers(users);
//         const lower = searchText.toLowerCase();
//         setFilteredUsers(users.filter(u => (u.name?.toLowerCase().includes(lower) || u.email?.toLowerCase().includes(lower))));
//     }, [searchText, users]);

//     const openAssignModal = user => {
//         setSelectedUser(user);
//         setTaskTitle('');
//         setTaskDescription('');
//         setTaskStatus('pending');
//         setTaskRemarks('');
//         setTaskDeadline(new Date());
//         setAssignModalVisible(true);
//     };

//     const openViewTasksModal = user => {
//         const userTasks = tasks.filter(t => t.assignedTo === user.uid);
//         setSelectedUser({ ...user, tasks: userTasks });
//         setViewTasksModalVisible(true);
//     };

//     const assignTask = async () => {
//         if (!taskTitle) return alert('Task title is required');
//         try {
//             const taskRef = firestore().collection('tasks').doc();
//             await taskRef.set({
//                 taskId: taskRef.id,
//                 title: taskTitle,
//                 description: taskDescription,
//                 status: "pending",
//                 assignedTo: selectedUser.uid,
//                 assignedBy: adminUid,
//                 deadline: firestore.Timestamp.fromDate(taskDeadline),
//                 createdAt: firestore.FieldValue.serverTimestamp(),
//                 updatedAt: firestore.FieldValue.serverTimestamp(),
//                 remarks: taskRemarks ? taskRemarks.split(',').map(r => r.trim()) : [],
//             });
//             setAssignModalVisible(false);
//         } catch (err) {
//             console.error(err);
//         }
//     };

//     const renderUser = ({ item }) => {
//         const userTasks = tasks.filter(t => t.assignedTo === item.uid);
//         return (
//             <Card style={[styles.userCard, { backgroundColor: theme.colors.card }]}>
//                 <Card.Content>
//                     <Text style={{ color: theme.colors.text }}>{item.name}</Text>
//                     <Text style={{ color: theme.colors.text, marginBottom: 8 }}>{item.email}</Text>
//                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
//                         <Button mode="contained" onPress={() => openViewTasksModal(item)} buttonColor={theme.colors.primary} textColor={theme.colors.text}>
//                             {userTasks.length} Tasks
//                         </Button>
//                         <Button mode="contained" onPress={() => openAssignModal(item)} buttonColor={theme.colors.border} textColor={theme.colors.text}>
//                             Assign Task
//                         </Button>
//                     </View>
//                 </Card.Content>
//             </Card>
//         );
//     };

//     return (
//         <PaperProvider>
//             <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
//                 <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
//                     <TextInput
//                         placeholder="Search by name or email"
//                         placeholderTextColor={theme.colors.text + '88'}
//                         value={searchText}
//                         onChangeText={setSearchText}
//                         style={[styles.searchInput, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.card }]}
//                     />

//                     {loading ? (
//                         <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20 }}>Loading users...</Text>
//                     ) : filteredUsers.length === 0 ? (
//                         <View style={styles.noUsersContainer}>
//                             <Animated.Text style={[styles.noUsersIcon, { color: theme.colors.primary, transform: [{ translateY: bounceAnim }] }]}>👤</Animated.Text>
//                             <Text style={{ color: theme.colors.text }}>No users found</Text>
//                             <Text style={{ color: theme.colors.text + 'aa', textAlign: 'center' }}>No users match your search or are currently assigned.</Text>
//                         </View>
//                     ) : (
//                         <FlatList
//                             data={filteredUsers}
//                             keyExtractor={item => item.uid}
//                             renderItem={renderUser}
//                             contentContainerStyle={{ paddingBottom: 80 }}
//                         />
//                     )}

//                     {/* Assign Task Modal */}
//                     <Portal>
//                         <Modal visible={assignModalVisible} onDismiss={() => setAssignModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
//                             <Text style={{ color: theme.colors.text, marginBottom: 12 }} variant='headlineMedium'>Assign Task to {selectedUser?.name}</Text>

//                             <TextInput
//                                 placeholder="Task Title"
//                                 value={taskTitle}
//                                 onChangeText={setTaskTitle}
//                                 style={[styles.input, { borderColor: theme.colors.primary, color: theme.colors.text, backgroundColor: theme.colors.background }]}
//                             />
//                             <TextInput
//                                 placeholder="Task Description"
//                                 value={taskDescription}
//                                 onChangeText={setTaskDescription}
//                                 multiline
//                                 style={[styles.input, { borderColor: theme.colors.primary, color: theme.colors.text, height: 100, backgroundColor: theme.colors.background }]}
//                             />

//                             <Button mode="outlined" onPress={() => setOpenDatePicker(true)} style={{
//                                 marginBottom: 12,
//                                 borderColor: '#FF0000', 
//                                 borderRadius: 8           
//                             }}>
//                                 Deadline: {taskDeadline.toDateString()}
//                             </Button>
//                           <DatePicker
//                                 modal
//                                 open={openDatePicker}
//                                 date={taskDeadline}
//                                 mode="date"
//                                 onConfirm={(date) => {
//                                     setOpenDatePicker(false);
//                                     setTaskDeadline(date);
//                                 }}
//                                 onCancel={() => setOpenDatePicker(false)}
//                                 style={{color:theme.colors.primary}}
//                             /> 

                            

//                             <TextInput
//                                 placeholder="Remarks (comma separated)"
//                                 value={taskRemarks}
//                                 onChangeText={setTaskRemarks}
//                                 style={[styles.input, { borderColor: theme.colors.primary, color: theme.colors.text, backgroundColor: theme.colors.background }]}
//                             />

//                             <Button mode="contained" onPress={assignTask} style={{ marginBottom: 8 }} buttonColor={theme.colors.border} textColor={theme.colors.text}>Assign Task</Button>
//                             <Button mode="text" buttonColor={theme.colors.primary} textColor={theme.colors.text} onPress={() => setAssignModalVisible(false)}>Cancel</Button>
//                         </Modal>
//                     </Portal>

//                     {/* View Tasks Modal */}
//                     <Portal>
//                         <Modal visible={viewTasksModalVisible} onDismiss={() => setViewTasksModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.card, maxHeight: height * 0.7 }]}>
//                             <Text style={{ color: theme.colors.text, marginBottom: 12 }} >{selectedUser?.name}'s Tasks</Text>
//                             <ScrollView>
//                                 {selectedUser?.tasks?.length ? selectedUser.tasks.map(task => (
//                                     <Card key={task.taskId} style={[styles.taskItem, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
//                                         <Card.Content>
//                                             <Text style={{ color: theme.colors.text }}>{task.title}</Text>
//                                             <Text style={{ color: theme.colors.text }}>Status: {task.status}</Text>
//                                             <Text style={{ color: theme.colors.text }}>Deadline: {task.deadline?.toDate?.().toDateString?.() || "N/A"}</Text>
//                                             <Text style={{ color: theme.colors.text }}>Description: {task.description}</Text>
//                                             {task.remarks?.length > 0 && <Text style={{ color: theme.colors.text }}>Remarks: {task.remarks.join(', ')}</Text>}
//                                         </Card.Content>
//                                     </Card>
//                                 )) : <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20 }}>No tasks assigned</Text>}
//                             </ScrollView>
//                             <Button mode="contained" onPress={() => setViewTasksModalVisible(false)} style={{ marginTop: 8 }} buttonColor={theme.colors.primary} textColor={theme.colors.text}>Close</Button>
//                         </Modal>
//                     </Portal>
//                 </View>
//             </SafeAreaView>
//         </PaperProvider>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flex: 1, padding: 16 },
//     userCard: { marginBottom: 12, borderRadius: 12, elevation: 2 },
//     searchInput: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 12 },
//     modalContent: { padding: 20, borderRadius: 12, marginHorizontal: 16 },
//     input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12 },
//     taskItem: { marginBottom: 10, borderRadius: 10, elevation: 1 },
//     noUsersContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
//     noUsersIcon: { fontSize: width * 0.18, marginBottom: 16 },
// });

// export default AssignScreen;







// import React, { useState, useEffect, useContext } from 'react';
// import { View, FlatList, TextInput as TextInputSearch, ScrollView, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Modal, Portal, Button, Card, Text, Provider as PaperProvider, TextInput } from 'react-native-paper';
// import DatePicker from 'react-native-date-picker'; // ✅ Updated import
// import firestore from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';
// import { ThemeContext } from '../../context/ThemeContext';

// const { width, height } = Dimensions.get('window');

// const AssignScreen = () => {
//     const { theme } = useContext(ThemeContext);
//     const adminUid = auth().currentUser?.uid;

//     const [users, setUsers] = useState([]);
//     const [filteredUsers, setFilteredUsers] = useState([]);
//     const [tasks, setTasks] = useState([]);
//     const [loading, setLoading] = useState(true);

//     const [assignModalVisible, setAssignModalVisible] = useState(false);
//     const [viewTasksModalVisible, setViewTasksModalVisible] = useState(false);

//     const [selectedUser, setSelectedUser] = useState(null);
//     const [taskTitle, setTaskTitle] = useState('');
//     const [taskDescription, setTaskDescription] = useState('');
//     const [taskStatus, setTaskStatus] = useState('pending');
//     const [taskRemarks, setTaskRemarks] = useState('');
//     const [taskDeadline, setTaskDeadline] = useState(new Date());

//     const [openDatePicker, setOpenDatePicker] = useState(false);

//     const [searchText, setSearchText] = useState('');
//     const [bounceAnim] = useState(new Animated.Value(0));

//     useEffect(() => {
//         Animated.loop(
//             Animated.sequence([
//                 Animated.timing(bounceAnim, { toValue: -10, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
//                 Animated.timing(bounceAnim, { toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: true }),
//             ])
//         ).start();
//     }, [bounceAnim]);

//     useEffect(() => {
//         if (!adminUid) return;
//         const unsubscribe = firestore()
//             .collection('users')
//             .where('adminId', '==', adminUid)
//             .onSnapshot(snapshot => {
//                 const assignedUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })).filter(u => u.uid !== adminUid);
//                 setUsers(assignedUsers);
//                 setFilteredUsers(assignedUsers);
//                 setLoading(false);
//             }, error => {
//                 console.error(error);
//                 setLoading(false);
//             });
//         return () => unsubscribe();
//     }, [adminUid]);

//     useEffect(() => {
//         if (!adminUid) return;
//         const unsubscribe = firestore()
//             .collection('tasks')
//             .where('assignedBy', '==', adminUid)
//             .onSnapshot(snapshot => setTasks(snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }))));
//         return () => unsubscribe();
//     }, [adminUid]);

//     useEffect(() => {
//         if (!searchText) return setFilteredUsers(users);
//         const lower = searchText.toLowerCase();
//         setFilteredUsers(users.filter(u => (u.name?.toLowerCase().includes(lower) || u.email?.toLowerCase().includes(lower))));
//     }, [searchText, users]);

//     const openAssignModal = user => {
//         setSelectedUser(user);
//         setTaskTitle('');
//         setTaskDescription('');
//         setTaskStatus('pending');
//         setTaskRemarks('');
//         setTaskDeadline(new Date());
//         setAssignModalVisible(true);
//     };

//     const openViewTasksModal = user => {
//         const userTasks = tasks.filter(t => t.assignedTo === user.uid);
//         setSelectedUser({ ...user, tasks: userTasks });
//         setViewTasksModalVisible(true);
//     };

//     const assignTask = async () => {
//         if (!taskTitle) return alert('Task title is required');
//         try {
//             const taskRef = firestore().collection('tasks').doc();
//             await taskRef.set({
//                 taskId: taskRef.id,
//                 title: taskTitle,
//                 description: taskDescription,
//                 status: "pending",
//                 assignedTo: selectedUser.uid,
//                 assignedBy: adminUid,
//                 deadline: firestore.Timestamp.fromDate(taskDeadline),
//                 createdAt: firestore.FieldValue.serverTimestamp(),
//                 updatedAt: firestore.FieldValue.serverTimestamp(),
//                 remarks: taskRemarks ? taskRemarks.split(',').map(r => r.trim()) : [],
//             });
//             setAssignModalVisible(false);
//         } catch (err) {
//             console.error(err);
//         }
//     };

//     const renderUser = ({ item }) => {
//         const userTasks = tasks.filter(t => t.assignedTo === item.uid);
//         return (
//             <Card style={[styles.userCard, { backgroundColor: theme.colors.card }]}>
//                 <Card.Content>
//                     <Text style={{ color: theme.colors.text }}>{item.name}</Text>
//                     <Text style={{ color: theme.colors.text, marginBottom: 8 }}>{item.email}</Text>
//                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
//                         <Button mode="contained" onPress={() => openViewTasksModal(item)} buttonColor={theme.colors.primary} textColor={theme.colors.text}>
//                             {userTasks.length} Tasks
//                         </Button>
//                         <Button mode="contained" onPress={() => openAssignModal(item)} buttonColor={theme.colors.border} textColor={theme.colors.text}>
//                             Assign Task
//                         </Button>
//                     </View>
//                 </Card.Content>
//             </Card>
//         );
//     };

//     return (
//         <PaperProvider>
//             <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
//                 <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
//                     <TextInputSearch
//                         placeholder="Search by name or email"
//                         placeholderTextColor={theme.colors.text + '88'}
//                         value={searchText}
//                         onChangeText={setSearchText}
//                         style={[styles.searchInput, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.card }]}
//                     />

//                     {loading ? (
//                         <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20 }}>Loading users...</Text>
//                     ) : filteredUsers.length === 0 ? (
//                         <View style={styles.noUsersContainer}>
//                             <Animated.Text style={[styles.noUsersIcon, { color: theme.colors.primary, transform: [{ translateY: bounceAnim }] }]}>👤</Animated.Text>
//                             <Text style={{ color: theme.colors.text }}>No users found</Text>
//                             <Text style={{ color: theme.colors.text + 'aa', textAlign: 'center' }}>No users match your search or are currently assigned.</Text>
//                         </View>
//                     ) : (
//                         <FlatList
//                             data={filteredUsers}
//                             keyExtractor={item => item.uid}
//                             renderItem={renderUser}
//                             contentContainerStyle={{ paddingBottom: 80 }}
//                         />
//                     )}

//                     {/* Assign Task Modal */}
//                     <Portal>
//                         <Modal visible={assignModalVisible} onDismiss={() => setAssignModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
//                             <Text style={{ color: theme.colors.text, marginBottom: 12 }} variant='headlineMedium'>Assign Task to {selectedUser?.name}</Text>

//                             <TextInput
//                                 placeholder="Task Title"
//                                 value={taskTitle}
//                                 onChangeText={setTaskTitle}
//                                 style={[styles.input, { color: theme.colors.text,height:10, backgroundColor: theme.colors.background }]}
//                             />
//                             <TextInput
//                                 placeholder="Task Description"
//                                mode='flat'
//                                 value={taskDescription}
//                                 onChangeText={setTaskDescription}
//                                 multiline
//                                 style={[styles.input, {  color: theme.colors.text, height: 50, backgroundColor: theme.colors.background }]}
//                             />

//                             <Button mode="outlined" onPress={() => setOpenDatePicker(true)} style={{
//                                 marginBottom: 12,
//                                 borderRadius: 8
//                             }}>
//                                 Deadline: {taskDeadline.toDateString()}
//                             </Button>
//                             <DatePicker
//                                 modal
//                                 open={openDatePicker}
//                                 date={taskDeadline}
//                                 mode="date"
//                                 onConfirm={(date) => {
//                                     setOpenDatePicker(false);
//                                     setTaskDeadline(date);
//                                 }}
//                                 onCancel={() => setOpenDatePicker(false)}
//                                 style={{ color: theme.colors.primary }}
//                             />



//                             <TextInput
//                                 placeholder="Remarks (comma separated)"
//                                 value={taskRemarks}
//                                 onChangeText={setTaskRemarks}
//                                 style={[styles.input, {  color: theme.colors.text,height:10, backgroundColor: theme.colors.background }]}
//                             />

//                             <Button mode="contained" onPress={assignTask} style={{ marginBottom: 8 }} buttonColor={theme.colors.border} textColor={theme.colors.text}>Assign Task</Button>
//                             <Button mode="text" buttonColor={theme.colors.primary} textColor={theme.colors.text} onPress={() => setAssignModalVisible(false)}>Cancel</Button>
//                         </Modal>
//                     </Portal>

//                     {/* View Tasks Modal */}
//                     <Portal>
//                         <Modal visible={viewTasksModalVisible} onDismiss={() => setViewTasksModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.card, maxHeight: height * 0.7 }]}>
//                             <Text style={{ color: theme.colors.text, marginBottom: 12 }} >{selectedUser?.name}'s Tasks</Text>
//                             <ScrollView>
//                                 {selectedUser?.tasks?.length ? selectedUser.tasks.map(task => (
//                                     <Card key={task.taskId} style={[styles.taskItem, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
//                                         <Card.Content>
//                                             <Text style={{ color: theme.colors.text }}>{task.title}</Text>
//                                             <Text style={{ color: theme.colors.text }}>Status: {task.status}</Text>
//                                             <Text style={{ color: theme.colors.text }}>Deadline: {task.deadline?.toDate?.().toDateString?.() || "N/A"}</Text>
//                                             <Text style={{ color: theme.colors.text }}>Description: {task.description}</Text>
//                                             {task.remarks?.length > 0 && <Text style={{ color: theme.colors.text }}>Remarks: {task.remarks.join(', ')}</Text>}
//                                         </Card.Content>
//                                     </Card>
//                                 )) : <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20 }}>No tasks assigned</Text>}
//                             </ScrollView>
//                             <Button mode="contained" onPress={() => setViewTasksModalVisible(false)} style={{ marginTop: 8 }} buttonColor={theme.colors.primary} textColor={theme.colors.text}>Close</Button>
//                         </Modal>
//                     </Portal>
//                 </View>
//             </SafeAreaView>
//         </PaperProvider>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flex: 1, padding: 16 },
//     userCard: { marginBottom: 12, borderRadius: 12, elevation: 2 },
//     searchInput: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 12 },
//     modalContent: { padding: 20, borderRadius: 12, marginHorizontal: 16 },
//     input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12 },
//     taskItem: { marginBottom: 10, borderRadius: 10, elevation: 1 },
//     noUsersContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
//     noUsersIcon: { fontSize: width * 0.18, marginBottom: 16 },
// });

// export default AssignScreen;































import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, TextInput as TextInputSearch, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Portal, Button, Card, Text, Provider as PaperProvider, Snackbar, Menu, TextInput, Modal } from 'react-native-paper';
import DatePicker from 'react-native-date-picker';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { ThemeContext } from '../../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PremiumTasksModal from "../../components/ViewTaskModal"

const { width, height } = Dimensions.get('window');

const AssignScreen = () => {
    const { theme } = useContext(ThemeContext);
    const adminUid = auth().currentUser?.uid;

    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const [assignModalVisible, setAssignModalVisible] = useState(false);
    const [viewTasksModalVisible, setViewTasksModalVisible] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskRemarks, setTaskRemarks] = useState('');
    const [taskDeadline, setTaskDeadline] = useState(new Date());
    const [openDatePicker, setOpenDatePicker] = useState(false);

    const [searchText, setSearchText] = useState('');
    const [snackbarVisible, setSnackbarVisible] = useState(false);

    // Task modal state for inline updates
    const [menuVisible, setMenuVisible] = useState({});
    const [remarkModalVisible, setRemarkModalVisible] = useState(false);
    const [remarkText, setRemarkText] = useState('');
    const [currentTaskId, setCurrentTaskId] = useState(null);

    // Load users
    useEffect(() => {
        if (!adminUid) return;
        const unsubscribe = firestore()
            .collection('users')
            .where('adminId', '==', adminUid)
            .onSnapshot(snapshot => {
                const assignedUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })).filter(u => u.uid !== adminUid);
                setUsers(assignedUsers);
                setFilteredUsers(assignedUsers);
                setLoading(false);
            }, error => {
                console.error(error);
                setLoading(false);
            });
        return () => unsubscribe();
    }, [adminUid]);

    // Load tasks
    useEffect(() => {
        if (!adminUid) return;
        const unsubscribe = firestore()
            .collection('tasks')
            .where('assignedBy', '==', adminUid)
            .onSnapshot(snapshot => setTasks(snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }))));
        return () => unsubscribe();
    }, [adminUid]);

    // Filter users by search
    useEffect(() => {
        if (!searchText) return setFilteredUsers(users);
        const lower = searchText.toLowerCase();
        setFilteredUsers(users.filter(u => (u.name?.toLowerCase().includes(lower) || u.email?.toLowerCase().includes(lower))));
    }, [searchText, users]);

    const openAssignModal = user => {
        setSelectedUser(user);
        setTaskTitle('');
        setTaskDescription('');
        setTaskRemarks('');
        setTaskDeadline(new Date());
        setAssignModalVisible(true);
    };

    const openViewTasksModal = user => {
        const userTasks = tasks.filter(t => t.assignedTo === user.uid);
        setSelectedUser({ ...user, tasks: userTasks });
        setViewTasksModalVisible(true);
    };

    const assignTask = async () => {
        if (!taskTitle) return alert('Task title is required');
        try {
            const taskRef = firestore().collection('tasks').doc();
            await taskRef.set({
                taskId: taskRef.id,
                title: taskTitle,
                description: taskDescription,
                status: "pending",
                assignedTo: selectedUser.uid,
                assignedBy: adminUid,
                deadline: firestore.Timestamp.fromDate(taskDeadline),
                createdAt: firestore.FieldValue.serverTimestamp(),
                updatedAt: firestore.FieldValue.serverTimestamp(),
                remarks: taskRemarks ? taskRemarks.split(',').map(r => r.trim()) : [],
            });

            setAssignModalVisible(false);
            setSnackbarVisible(true);

            setTaskTitle('');
            setTaskDescription('');
            setTaskRemarks('');
            setTaskDeadline(new Date());
        } catch (err) {
            console.error(err);
        }
    };

    // ----- Inline Task Modal Handlers -----
    const openMenu = (taskId) => setMenuVisible({ ...menuVisible, [taskId]: true });
    const closeMenu = (taskId) => setMenuVisible({ ...menuVisible, [taskId]: false });

    const updateTaskStatus = async (taskId, status) => {
        await firestore().collection('tasks').doc(taskId).update({
            status,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        closeMenu(taskId);
    };

    const deleteTask = async (taskId) => {
        await firestore().collection('tasks').doc(taskId).delete();
    };

    const openAddRemark = (taskId) => {
        setCurrentTaskId(taskId);
        setRemarkText('');
        setRemarkModalVisible(true);
    };

    const saveRemark = async () => {
        if (!remarkText) return;
        const taskRef = firestore().collection('tasks').doc(currentTaskId);
        const taskDoc = await taskRef.get();
        const updatedRemarks = [...(taskDoc.data().remarks || []), remarkText];
        await taskRef.update({ remarks: updatedRemarks, updatedAt: firestore.FieldValue.serverTimestamp() });
        setRemarkText('');
        setRemarkModalVisible(false);
    };

    const statusColors = { pending: '#FFB300', completed: '#4CAF50', 'in-progress': '#2196F3' };

    const renderUser = ({ item }) => {
        const userTasks = tasks.filter(t => t.assignedTo === item.uid);
        const pendingTasks = userTasks.filter(t => t.status === "pending").length;

        return (
            <Card style={[styles.userCard, { backgroundColor: theme.colors.card }]}>
                <Card.Content style={{ position: 'relative' }}>
                    <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
                    <Text style={{ color: theme.colors.text, marginBottom: 8 }}>{item.email}</Text>

                    {pendingTasks > 0 && (
                        <View style={[styles.badge, { backgroundColor: theme.colors.notification }]}>
                            <Text style={styles.badgeText}>{pendingTasks}</Text>
                        </View>
                    )}

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                        <Button
                            mode="contained"
                            onPress={() => openViewTasksModal(item)}
                            buttonColor={theme.colors.primary}
                            textColor={theme.colors.text}
                        >
                            {userTasks.length} Tasks
                        </Button>
                        <Button
                            mode="contained"
                            onPress={() => openAssignModal(item)}
                            buttonColor={theme.colors.border}
                            textColor={theme.colors.text}
                        >
                            Assign Task
                        </Button>
                    </View>
                </Card.Content>
            </Card>
        );
    };

    return (
        <PaperProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                    <TextInputSearch
                        placeholder="Search by name or email"
                        placeholderTextColor={theme.colors.text + '88'}
                        value={searchText}
                        onChangeText={setSearchText}
                        style={[styles.searchInput, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.card }]}
                    />

                    {loading ? (
                        <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20 }}>Loading users...</Text>
                    ) : (
                        <FlatList
                            data={filteredUsers}
                            keyExtractor={item => item.uid}
                            renderItem={renderUser}
                            contentContainerStyle={{ paddingBottom: 80 }}
                        />
                    )}

                    {/* Assign Task Modal */}
                    <Portal>
                        <Modal visible={assignModalVisible} onDismiss={() => setAssignModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                            <Text style={{ color: theme.colors.text, marginBottom: 12, fontSize: 20, fontWeight: '700' }}>Assign Task to {selectedUser?.name}</Text>

                            <TextInput
                                placeholder="Task Title"
                                value={taskTitle}
                                onChangeText={setTaskTitle}
                                style={[styles.input, { color: theme.colors.text }]}
                            />
                            <TextInput
                                placeholder="Task Description"
                                value={taskDescription}
                                onChangeText={setTaskDescription}
                                multiline
                                style={[styles.input, { color: theme.colors.text, height: 50 }]}
                            />

                            <Button mode="outlined" onPress={() => setOpenDatePicker(true)} style={{ marginBottom: 12, borderRadius: 8 }}>
                                Deadline: {taskDeadline.toDateString()}
                            </Button>
                            <DatePicker
                                modal
                                open={openDatePicker}
                                date={taskDeadline}
                                mode="date"
                                onConfirm={(date) => { setOpenDatePicker(false); setTaskDeadline(date); }}
                                onCancel={() => setOpenDatePicker(false)}
                            />

                            <TextInput
                                placeholder="Remarks (comma separated)"
                                value={taskRemarks}
                                onChangeText={setTaskRemarks}
                                style={[styles.input, { color: theme.colors.text }]}
                            />

                            <Button mode="contained" onPress={assignTask} style={{ marginBottom: 8, borderRadius: 8 }} buttonColor={theme.colors.primary}>
                                Assign Task
                            </Button>
                            <Button mode="text" onPress={() => setAssignModalVisible(false)} textColor={theme.colors.text}>
                                Cancel
                            </Button>
                        </Modal>
                    </Portal>

                  
                    <PremiumTasksModal visible={viewTasksModalVisible}
                        onDismiss={() => setViewTasksModalVisible(false)}
                        selectedUser={selectedUser}
                        theme={theme} />

                    <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={2000}>
                        Task assigned successfully!
                    </Snackbar>
                </View>
            </SafeAreaView>
        </PaperProvider>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    userCard: { marginBottom: 12, borderRadius: 12, elevation: 2 },
    searchInput: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 12 },
    modalContent: { padding: 20, borderRadius: 12, marginHorizontal: 16 },
    input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12 },
    taskCard: { borderRadius: 12, elevation: 4 },
    badge: { position: 'absolute', top: 0, right: 0, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    remarkChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0E0E0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 6, marginBottom: 6 },
});

export default AssignScreen;