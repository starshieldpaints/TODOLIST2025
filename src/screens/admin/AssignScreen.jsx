// import React, { useState, useEffect, useContext } from 'react';
// import {
//     View,
//     Text,
//     FlatList,
//     TouchableOpacity,
//     StyleSheet,
//     Modal,
//     TextInput,
//     Button,
//     Alert,
//     Animated,
//     Easing,
//     Dimensions,
//     ScrollView,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
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
//     const [modalVisible, setModalVisible] = useState(false);
//     const [selectedUser, setSelectedUser] = useState(null);
//     const [taskTitle, setTaskTitle] = useState('');
//     const [taskDescription, setTaskDescription] = useState('');
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
//         if (!adminUid) {
//             console.warn('No admin UID found.');
//             setUsers([]);
//             setLoading(false);
//             return;
//         }
//         const unsubscribe = firestore()
//             .collection('users')
//             .where('adminId', '==', adminUid)
//             .onSnapshot(
//                 (querySnapshot) => {
//                     const assignedUsers = querySnapshot.docs
//                         .map((doc) => ({ uid: doc.id, ...doc.data() }))
//                         .filter((user) => user.uid !== adminUid);
//                     setUsers(assignedUsers);
//                     setFilteredUsers(assignedUsers);
//                     setLoading(false);
//                 },
//                 (error) => {
//                     console.error('Firestore snapshot error:', error);
//                     setLoading(false);
//                 }
//             );

//         return () => unsubscribe();
//     }, [adminUid]);
//     useEffect(() => {
//         if (!adminUid) return;
//         const unsubscribeTasks = firestore()
//             .collection('tasks')
//             .where('assignedBy', '==', adminUid)
//             .onSnapshot(snapshot => {
//                 setTasks(snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() })));
//             });
//         return () => unsubscribeTasks();
//     }, [adminUid]);
//     useEffect(() => {
//         if (!searchText) {
//             setFilteredUsers(users);
//             return;
//         }
//         const lowerSearch = searchText.toLowerCase();
//         setFilteredUsers(
//             users.filter(
//                 (u) =>
//                     (u.name && u.name.toLowerCase().includes(lowerSearch)) ||
//                     (u.email && u.email.toLowerCase().includes(lowerSearch))
//             )
//         );
//     }, [searchText, users]);

//     const openAssignModal = (user) => {
//         setSelectedUser(user);
//         setTaskTitle('');
//         setTaskDescription('');
//         setModalVisible(true);
//     };

//     const assignTask = async () => {
//         if (!taskTitle) {
//             Alert.alert('Error', 'Task title is required');
//             return;
//         }

//         try {
//             const taskRef = firestore().collection('tasks').doc();
//             await taskRef.set({
//                 taskId: taskRef.id,
//                 title: taskTitle,
//                 description: taskDescription,
//                 status: 'todo',
//                 assignedTo: selectedUser.uid,
//                 assignedBy: adminUid,
//                 createdAt: firestore.FieldValue.serverTimestamp(),
//                 updatedAt: firestore.FieldValue.serverTimestamp(),
//                 remarks: [],
//             });
//             Alert.alert('Success', `Task assigned to ${selectedUser.name}`);
//             setModalVisible(false);
//         } catch (error) {
//             console.error('Error assigning task:', error);
//             Alert.alert('Error', 'Failed to assign task');
//         }
//     };

//     const renderUser = ({ item }) => {
//         const userTasks = tasks.filter(t => t.assignedTo === item.uid);

//         return (
//             <View style={[styles.userCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
//                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
//                     <Text style={[styles.userName, { color: theme.colors.text }]}>{item.name}</Text>
//                     <TouchableOpacity
//                         style={[styles.assignButton, { backgroundColor: theme.colors.primary, paddingHorizontal: 12 }]}
//                         onPress={() => {
//                             setSelectedUser({ ...item, tasks: userTasks });
//                             setModalVisible(true);
//                         }}
//                     >
//                         <Text style={[styles.buttonText, { color: theme.colors.text }]}>{userTasks.length} Tasks</Text>
//                     </TouchableOpacity>
//                 </View>
//                 <Text style={{ color: theme.colors.text, fontSize: width * 0.035 }}>{item.email}</Text>
//                 <TouchableOpacity
//                     style={[styles.assignButton, { backgroundColor: theme.colors.primary, }]}
//                     onPress={() => openAssignModal(item)}
//                 >
//                     <Text style={[styles.buttonText, { color: theme.colors.text }]}>Assign Task</Text>
//                 </TouchableOpacity>
//             </View>
//         );
//     };

//     return (
//         <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
//             <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
//                 <TextInput
//                     placeholder="Search by name or email"
//                     placeholderTextColor={theme.colors.text + '88'}
//                     value={searchText}
//                     onChangeText={setSearchText}
//                     style={[styles.searchInput, { borderColor: theme.colors.border, color: theme.colors.text }]}
//                 />
//                 {loading ? (
//                     <View style={styles.loadingContainer}>
//                         <Text style={{ color: theme.colors.text }}>Loading users...</Text>
//                     </View>
//                 ) : filteredUsers.length === 0 ? (
//                     <View style={styles.noUsersContainer}>
//                         <Animated.Text
//                             style={[
//                                 styles.noUsersIcon,
//                                 { color: theme.colors.primary, transform: [{ translateY: bounceAnim }] },
//                             ]}
//                         >
//                             👤
//                         </Animated.Text>
//                         <Text style={[styles.noUsersTitle, { color: theme.colors.text }]}>No users found</Text>
//                         <Text style={[styles.noUsersSubtitle, { color: theme.colors.text + 'aa' }]}>
//                             No users match your search or are currently assigned.
//                         </Text>
//                     </View>
//                 ) : (
//                     <FlatList
//                         data={filteredUsers}
//                         keyExtractor={(item) => item.uid}
//                         renderItem={renderUser}
//                         contentContainerStyle={{ paddingBottom: height * 0.05 }}
//                     />
//                 )}
//                 <Modal
//                     animationType="slide"
//                     transparent={true}
//                     visible={modalVisible}
//                     onRequestClose={() => setModalVisible(false)}
//                 >
//                     <View style={styles.modalOverlay}>
//                         <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
//                             {selectedUser?.tasks ? (
//                                 <>
//                                     <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
//                                         {selectedUser.name}'s Tasks
//                                     </Text>
//                                     <ScrollView style={{ maxHeight: height * 0.6 }}>
//                                          {selectedUser.tasks.length ? (
//                                             selectedUser.tasks.map(task => (
//                                                 <View
//                                                     key={task.taskId}
//                                                     style={[styles.taskItem, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
//                                                 >
//                                                     <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>{task.title}</Text>
//                                                     <Text style={{ color: theme.colors.text }}>{task.status}</Text>
//                                                 </View>
//                                             ))
//                                         ) : (
//                                             <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20 }}>
//                                                 No tasks assigned
//                                             </Text>
//                                         )} 



//                                     </ScrollView>
//                                     <Button title="Close" color={theme.colors.primary} onPress={() => setModalVisible(false)} />
//                                 </>
//                             ) : (
//                                 <>
//                                     <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
//                                         Assign Task to {selectedUser?.name}
//                                     </Text>
//                                     <TextInput
//                                         placeholder="Task Title"
//                                         placeholderTextColor={theme.colors.text + '88'}
//                                         value={taskTitle}
//                                         onChangeText={setTaskTitle}
//                                         style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
//                                     />
//                                     <TextInput
//                                         placeholder="Task Description"
//                                         placeholderTextColor={theme.colors.text + '88'}
//                                         value={taskDescription}
//                                         onChangeText={setTaskDescription}
//                                         style={[
//                                             styles.input,
//                                             { borderColor: theme.colors.border, color: theme.colors.text, height: height * 0.12 },
//                                         ]}
//                                         multiline
//                                     />
//                                     <Button title="Assign Task" color={theme.colors.text} onPress={assignTask} />
//                                     <Button title="Cancel" color="red" onPress={() => setModalVisible(false)} />
//                                 </>
//                             )}
//                         </View>
//                     </View>
//                 </Modal>
//             </View>
//         </SafeAreaView>
//     );
// };

// export default AssignScreen;

// const styles = StyleSheet.create({
//     container: { flex: 1, paddingHorizontal: width * 0.05, paddingTop: height * 0.02 },
//     searchInput: {
//         borderWidth: 1,
//         borderRadius: 8,
//         paddingHorizontal: width * 0.03,
//         paddingVertical: height * 0.015,
//         fontSize: width * 0.04,
//         marginBottom: height * 0.02,
//     },
//     loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//     userCard: {
//         padding: width * 0.04,
//         borderRadius: 12,
//         marginBottom: height * 0.015,
//         borderWidth: 1,
//     },
//     userName: { fontSize: width * 0.045, fontWeight: 'bold' },
//     assignButton: {
//         marginTop: height * 0.01,
//         paddingVertical: height * 0.012,
//         borderRadius: 8,
//     },
//     buttonText: { textAlign: 'center', fontWeight: 'bold', fontSize: width * 0.04 },
//     modalOverlay: {
//         flex: 1,
//         justifyContent: 'center',
//         backgroundColor: 'rgba(0,0,0,0.5)',
//         paddingHorizontal: width * 0.05,
//     },
//     modalContent: { padding: width * 0.05, borderRadius: 12 },
//     modalTitle: { fontSize: width * 0.05, fontWeight: 'bold', marginBottom: height * 0.015 },
//     input: {
//         borderWidth: 1,
//         borderRadius: 8,
//         paddingHorizontal: width * 0.03,
//         paddingVertical: height * 0.015,
//         fontSize: width * 0.04,
//         marginBottom: height * 0.015,
//     },
//     noUsersContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: width * 0.08 },
//     noUsersIcon: { fontSize: width * 0.16, marginBottom: height * 0.02 },
//     noUsersTitle: { fontSize: width * 0.05, fontWeight: 'bold', marginBottom: height * 0.01 },
//     noUsersSubtitle: { fontSize: width * 0.035, textAlign: 'center', lineHeight: height * 0.025 },
//     taskItem: {
//         padding: width * 0.03,
//         marginBottom: height * 0.012,
//         borderRadius: 8,
//         borderWidth: 1,
//     },
// });














// import React, { useState, useEffect, useContext } from 'react';
// import {
//     View,
//     Text,
//     FlatList,
//     TouchableOpacity,
//     StyleSheet,
//     Modal,
//     TextInput,
//     Button,
//     Alert,
//     Animated,
//     Easing,
//     Dimensions,
//     ScrollView,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
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
//     const [modalVisible, setModalVisible] = useState(false);
//     const [selectedUser, setSelectedUser] = useState(null);
//     const [taskTitle, setTaskTitle] = useState('');
//     const [taskDescription, setTaskDescription] = useState('');
//     const [taskStatus, setTaskStatus] = useState('todo');
//     const [taskRemarks, setTaskRemarks] = useState('');
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
//             .onSnapshot(
//                 (querySnapshot) => {
//                     const assignedUsers = querySnapshot.docs
//                         .map((doc) => ({ uid: doc.id, ...doc.data() }))
//                         .filter((user) => user.uid !== adminUid);
//                     setUsers(assignedUsers);
//                     setFilteredUsers(assignedUsers);
//                     setLoading(false);
//                 },
//                 (error) => {
//                     console.error('Firestore snapshot error:', error);
//                     setLoading(false);
//                 }
//             );
//         return () => unsubscribe();
//     }, [adminUid]);

//     useEffect(() => {
//         if (!adminUid) return;
//         const unsubscribeTasks = firestore()
//             .collection('tasks')
//             .where('assignedBy', '==', adminUid)
//             .onSnapshot(snapshot => {
//                 setTasks(snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() })));
//             });
//         return () => unsubscribeTasks();
//     }, [adminUid]);

//     useEffect(() => {
//         if (!searchText) {
//             setFilteredUsers(users);
//             return;
//         }
//         const lowerSearch = searchText.toLowerCase();
//         setFilteredUsers(
//             users.filter(
//                 (u) =>
//                     (u.name && u.name.toLowerCase().includes(lowerSearch)) ||
//                     (u.email && u.email.toLowerCase().includes(lowerSearch))
//             )
//         );
//     }, [searchText, users]);

//     const openAssignModal = (user) => {
//         setSelectedUser(user);
//         setTaskTitle('');
//         setTaskDescription('');
//         setTaskStatus('todo');
//         setTaskRemarks('');
//         setModalVisible(true);
//     };

//     const assignTask = async () => {
//         if (!taskTitle) {
//             Alert.alert('Error', 'Task title is required');
//             return;
//         }

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
//             Alert.alert('Success', `Task assigned to ${selectedUser.name}`);
//             setModalVisible(false);
//         } catch (error) {
//             console.error('Error assigning task:', error);
//             Alert.alert('Error', 'Failed to assign task');
//         }
//     };

//     const renderUser = ({ item }) => {
//         const userTasks = tasks.filter(t => t.assignedTo === item.uid);

//         return (
//             <View style={[styles.userCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
//                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
//                     <Text style={[styles.userName, { color: theme.colors.text }]}>{item.name}</Text>
//                     <TouchableOpacity
//                         style={[styles.assignButton, { backgroundColor: theme.colors.primary, paddingHorizontal: 12 }]}
//                         onPress={() => {
//                             setSelectedUser({ ...item, tasks: userTasks });
//                             setModalVisible(true);
//                         }}
//                     >
//                         <Text style={[styles.buttonText, { color: theme.colors.text }]}>{userTasks.length} Tasks</Text>
//                     </TouchableOpacity>
//                 </View>
//                 <Text style={{ color: theme.colors.text, fontSize: width * 0.035 }}>{item.email}</Text>
//                 <TouchableOpacity
//                     style={[styles.assignButton, { backgroundColor: theme.colors.primary }]}
//                     onPress={() => openAssignModal(item)}
//                 >
//                     <Text style={[styles.buttonText, { color: theme.colors.text }]}>Assign Task</Text>
//                 </TouchableOpacity>
//             </View>
//         );
//     };

//     return (
//         <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
//             <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
//                 <TextInput
//                     placeholder="Search by name or email"
//                     placeholderTextColor={theme.colors.text + '88'}
//                     value={searchText}
//                     onChangeText={setSearchText}
//                     style={[styles.searchInput, { borderColor: theme.colors.border, color: theme.colors.text }]}
//                 />
//                 {loading ? (
//                     <View style={styles.loadingContainer}>
//                         <Text style={{ color: theme.colors.text }}>Loading users...</Text>
//                     </View>
//                 ) : filteredUsers.length === 0 ? (
//                     <View style={styles.noUsersContainer}>
//                         <Animated.Text
//                             style={[
//                                 styles.noUsersIcon,
//                                 { color: theme.colors.primary, transform: [{ translateY: bounceAnim }] },
//                             ]}
//                         >
//                             👤
//                         </Animated.Text>
//                         <Text style={[styles.noUsersTitle, { color: theme.colors.text }]}>No users found</Text>
//                         <Text style={[styles.noUsersSubtitle, { color: theme.colors.text + 'aa' }]}>
//                             No users match your search or are currently assigned.
//                         </Text>
//                     </View>
//                 ) : (
//                     <FlatList
//                         data={filteredUsers}
//                         keyExtractor={(item) => item.uid}
//                         renderItem={renderUser}
//                         contentContainerStyle={{ paddingBottom: height * 0.05 }}
//                     />
//                 )}

//                 <Modal
//                     animationType="slide"
//                     transparent={true}
//                     visible={modalVisible}
//                     onRequestClose={() => setModalVisible(false)}
//                 >
//                     <View style={styles.modalOverlay}>
//                         <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
//                             {selectedUser?.tasks ? (
//                                 <>
//                                     <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
//                                         {selectedUser.name}'s Tasks
//                                     </Text>
//                                     <ScrollView style={{ maxHeight: height * 0.6 }}>
//                                         {selectedUser.tasks.length ? (
//                                             selectedUser.tasks.map(task => (
//                                                 <View
//                                                     key={task.taskId}
//                                                     style={[styles.taskItem, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
//                                                 >
//                                                     <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>{task.title}</Text>
//                                                     <Text style={{ color: theme.colors.text }}>Description: {task.description}</Text>
//                                                     <Text style={{ color: theme.colors.text }}>Status: {task.status}</Text>
//                                                     <Text style={{ color: theme.colors.text }}>Assigned By: {task.assignedBy}</Text>
//                                                     <Text style={{ color: theme.colors.text }}>Assigned To: {task.assignedTo}</Text>
//                                                     <Text style={{ color: theme.colors.text }}>
//                                                         Created At: {task.createdAt?.toDate().toLocaleString()}
//                                                     </Text>
//                                                     <Text style={{ color: theme.colors.text }}>
//                                                         Updated At: {task.updatedAt?.toDate().toLocaleString()}
//                                                     </Text>
//                                                     {task.remarks?.length > 0 && (
//                                                         <Text style={{ color: theme.colors.text }}>Remarks: {task.remarks.join(', ')}</Text>
//                                                     )}
//                                                 </View>
//                                             ))
//                                         ) : (
//                                             <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20 }}>
//                                                 No tasks assigned
//                                             </Text>
//                                         )}
//                                     </ScrollView>
//                                     <Button title="Close" color={theme.colors.primary} onPress={() => setModalVisible(false)} />
//                                 </>
//                             ) : (
//                                 <>
//                                     <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
//                                         Assign Task to {selectedUser?.name}
//                                     </Text>
//                                     <TextInput
//                                         placeholder="Task Title"
//                                         placeholderTextColor={theme.colors.text + '88'}
//                                         value={taskTitle}
//                                         onChangeText={setTaskTitle}
//                                         style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
//                                     />
//                                     <TextInput
//                                         placeholder="Task Description"
//                                         placeholderTextColor={theme.colors.text + '88'}
//                                         value={taskDescription}
//                                         onChangeText={setTaskDescription}
//                                         style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, height: height * 0.12 }]}
//                                         multiline
//                                     />
//                                     <TextInput
//                                         placeholder="Status (todo / inprogress / done)"
//                                         placeholderTextColor={theme.colors.text + '88'}
//                                         value={taskStatus}
//                                         onChangeText={setTaskStatus}
//                                         style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
//                                     />
//                                     <TextInput
//                                         placeholder="Remarks (comma separated)"
//                                         placeholderTextColor={theme.colors.text + '88'}
//                                         value={taskRemarks}
//                                         onChangeText={setTaskRemarks}
//                                         style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
//                                     />
//                                     <Button title="Assign Task" color={theme.colors.primary} onPress={assignTask} />
//                                     <Button title="Cancel" color="red" onPress={() => setModalVisible(false)} />
//                                 </>
//                             )}
//                         </View>
//                     </View>
//                 </Modal>
//             </View>
//         </SafeAreaView>
//     );
// };

// export default AssignScreen;

// const styles = StyleSheet.create({
//     container: { flex: 1, paddingHorizontal: width * 0.05, paddingTop: height * 0.02 },
//     searchInput: {
//         borderWidth: 1,
//         borderRadius: 8,
//         paddingHorizontal: width * 0.03,
//         paddingVertical: height * 0.015,
//         fontSize: width * 0.04,
//         marginBottom: height * 0.02,
//     },
//     loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//     userCard: {
//         padding: width * 0.04,
//         borderRadius: 12,
//         marginBottom: height * 0.015,
//         borderWidth: 1,
//     },
//     userName: { fontSize: width * 0.045, fontWeight: 'bold' },
//     assignButton: {
//         marginTop: height * 0.01,
//         paddingVertical: height * 0.012,
//         borderRadius: 8,
//     },
//     buttonText: { textAlign: 'center', fontWeight: 'bold', fontSize: width * 0.04 },
//     modalOverlay: {
//         flex: 1,
//         justifyContent: 'center',
//         backgroundColor: 'rgba(0,0,0,0.5)',
//         paddingHorizontal: width * 0.05,
//     },
//     modalContent: { padding: width * 0.05, borderRadius: 12 },
//     modalTitle: { fontSize: width * 0.05, fontWeight: 'bold', marginBottom: height * 0.015 },
//     input: {
//         borderWidth: 1,
//         borderRadius: 8,
//         paddingHorizontal: width * 0.03,
//         paddingVertical: height * 0.015,
//         fontSize: width * 0.04,
//         marginBottom: height * 0.015,
//     },
//     noUsersContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: width * 0.08 },
//     noUsersIcon: { fontSize: width * 0.16, marginBottom: height * 0.02 },
//     noUsersTitle: { fontSize: width * 0.05, fontWeight: 'bold', marginBottom: height * 0.01 },
//     noUsersSubtitle: { fontSize: width * 0.035, textAlign: 'center', lineHeight: height * 0.025 },
//     taskItem: {
//         padding: width * 0.03,
//         marginBottom: height * 0.012,
//         borderRadius: 8,
//         borderWidth: 1,
//     },
// });


















// import React, { useState, useEffect, useContext } from 'react';
// import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ScrollView, Dimensions, Animated, Easing } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Modal, Portal, Button, Provider as PaperProvider } from 'react-native-paper';
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

//     // Bounce animation
//     useEffect(() => {
//         Animated.loop(
//             Animated.sequence([
//                 Animated.timing(bounceAnim, { toValue: -10, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
//                 Animated.timing(bounceAnim, { toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: true }),
//             ])
//         ).start();
//     }, []);

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

//     // Search
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
//             <View style={[styles.userCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
//                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
//                     <Text style={[styles.userName, { color: theme.colors.text }]}>{item.name}</Text>
//                     <Button mode="contained" onPress={() => openViewTasksModal(item)}>{userTasks.length} Tasks</Button>
//                 </View>
//                 <Text style={{ color: theme.colors.text }}>{item.email}</Text>
//                 <Button mode="contained" onPress={() => openAssignModal(item)}>Assign Task</Button>
//             </View>
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
//                         style={[styles.searchInput, { borderColor: theme.colors.border, color: theme.colors.text }]}
//                     />

//                     {loading ? <Text style={{ color: theme.colors.text }}>Loading users...</Text> : (
//                         <FlatList
//                             data={filteredUsers}
//                             keyExtractor={item => item.uid}
//                             renderItem={renderUser}
//                         />
//                     )}

//                     {/* Assign Task Modal */}
//                     <Portal>
//                         <Modal visible={assignModalVisible} onDismiss={() => setAssignModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
//                             <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Assign Task to {selectedUser?.name}</Text>
//                             <TextInput placeholder="Title" value={taskTitle} onChangeText={setTaskTitle} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]} />
//                             <TextInput placeholder="Description" value={taskDescription} onChangeText={setTaskDescription} multiline style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, height: 100 }]} />
//                             <TextInput placeholder="Status" value={taskStatus} onChangeText={setTaskStatus} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]} />
//                             <TextInput placeholder="Remarks (comma separated)" value={taskRemarks} onChangeText={setTaskRemarks} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]} />
//                             <Button mode="contained" onPress={assignTask}>Assign Task</Button>
//                             <Button mode="text" onPress={() => setAssignModalVisible(false)}>Cancel</Button>
//                         </Modal>
//                     </Portal>

//                     {/* View Tasks Modal */}
//                     <Portal>
//                         <Modal visible={viewTasksModalVisible} onDismiss={() => setViewTasksModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.card, maxHeight: height * 0.7 }]}>
//                             <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{selectedUser?.name}'s Tasks</Text>
//                             <ScrollView>
//                                 {selectedUser?.tasks?.length ? selectedUser.tasks.map(task => (
//                                     <View key={task.taskId} style={[styles.taskItem, { borderColor: theme.colors.border }]}>
//                                         <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>{task.title}</Text>
//                                         <Text style={{ color: theme.colors.text }}>Status: {task.status}</Text>
//                                     </View>
//                                 )) : <Text style={{ color: theme.colors.text }}>No tasks assigned</Text>}
//                             </ScrollView>
//                             <Button mode="contained" onPress={() => setViewTasksModalVisible(false)}>Close</Button>
//                         </Modal>
//                     </Portal>
//                 </View>
//             </SafeAreaView>
//         </PaperProvider>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flex: 1, padding: 16 },
//     userCard: { padding: 12, borderWidth: 1, borderRadius: 10, marginBottom: 10 },
//     userName: { fontSize: 16, fontWeight: 'bold' },
//     searchInput: { borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 10 },
//     modalContent: { padding: 16, borderRadius: 10, marginHorizontal: 16 },
//     modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
//     input: { borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 10 },
//     taskItem: { padding: 10, marginBottom: 8, borderWidth: 1, borderRadius: 8 },
// });

// export default AssignScreen;












import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, TextInput, ScrollView, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Modal, Portal, Button, Card, Text, Provider as PaperProvider } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { ThemeContext } from '../../context/ThemeContext';

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
    const [taskStatus, setTaskStatus] = useState('todo');
    const [taskRemarks, setTaskRemarks] = useState('');
    const [searchText, setSearchText] = useState('');
    const [bounceAnim] = useState(new Animated.Value(0));

    // Bounce animation for "no users" icon
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(bounceAnim, { toValue: -10, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                Animated.timing(bounceAnim, { toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            ])
        ).start();
    }, [bounceAnim]);

    // Fetch users
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

    // Fetch tasks
    useEffect(() => {
        if (!adminUid) return;
        const unsubscribe = firestore()
            .collection('tasks')
            .where('assignedBy', '==', adminUid)
            .onSnapshot(snapshot => setTasks(snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }))));
        return () => unsubscribe();
    }, [adminUid]);

    // Filter users
    useEffect(() => {
        if (!searchText) return setFilteredUsers(users);
        const lower = searchText.toLowerCase();
        setFilteredUsers(users.filter(u => (u.name?.toLowerCase().includes(lower) || u.email?.toLowerCase().includes(lower))));
    }, [searchText, users]);

    const openAssignModal = user => {
        setSelectedUser(user);
        setTaskTitle('');
        setTaskDescription('');
        setTaskStatus('todo');
        setTaskRemarks('');
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
                status: taskStatus,
                assignedTo: selectedUser.uid,
                assignedBy: adminUid,
                createdAt: firestore.FieldValue.serverTimestamp(),
                updatedAt: firestore.FieldValue.serverTimestamp(),
                remarks: taskRemarks ? taskRemarks.split(',').map(r => r.trim()) : [],
            });
            alert(`Task assigned to ${selectedUser.name}`);
            setAssignModalVisible(false);
        } catch (err) {
            console.error(err);
            alert('Failed to assign task');
        }
    };

    const renderUser = ({ item }) => {
        const userTasks = tasks.filter(t => t.assignedTo === item.uid);
        return (
            <Card style={[styles.userCard, { backgroundColor: theme.colors.card }]}>
                <Card.Content>
                    <Text style={{ color: theme.colors.text }}>{item.name}</Text>
                    <Text style={{ color: theme.colors.text, marginBottom: 8 }}>{item.email}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                        <Button mode="contained" onPress={() => openViewTasksModal(item)} buttonColor={theme.colors.primary} textColor={theme.colors.text}>
                            {userTasks.length} Tasks
                        </Button>
                        <Button mode="contained" onPress={() => openAssignModal(item)} buttonColor={theme.colors.border} textColor={theme.colors.text}>
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
                    <TextInput
                        placeholder="Search by name or email"
                        placeholderTextColor={theme.colors.text + '88'}
                        value={searchText}
                        onChangeText={setSearchText}
                        style={[styles.searchInput, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.card }]}
                    />

                    {loading ? (
                        <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20 }}>Loading users...</Text>
                    ) : filteredUsers.length === 0 ? (
                        <View style={styles.noUsersContainer}>
                            <Animated.Text style={[styles.noUsersIcon, { color: theme.colors.primary, transform: [{ translateY: bounceAnim }] }]}>👤</Animated.Text>
                            <Text style={{ color: theme.colors.text }}>No users found</Text>
                            <Text style={{ color: theme.colors.text + 'aa', textAlign: 'center' }}>No users match your search or are currently assigned.</Text>
                        </View>
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
                            <Text style={{ color: theme.colors.text, marginBottom: 12 }} variant='headlineMedium'>Assign Task to {selectedUser?.name}</Text>
                            <TextInput
                                placeholder="Task Title"
                                value={taskTitle}
                                onChangeText={setTaskTitle}
                                style={[styles.input, { borderColor: theme.colors.primary, color: theme.colors.text, backgroundColor: theme.colors.background }]}
                            />
                            <TextInput
                                placeholder="Task Description"
                                value={taskDescription}
                                onChangeText={setTaskDescription}
                                multiline
                                style={[styles.input, { borderColor: theme.colors.primary, color: theme.colors.text, height: 100, backgroundColor: theme.colors.background }]}
                            />
                            <TextInput
                                placeholder="Status"
                                value={taskStatus}
                                onChangeText={setTaskStatus}
                                style={[styles.input, { borderColor: theme.colors.primary, color: theme.colors.text, backgroundColor: theme.colors.background }]}
                            />
                            <TextInput
                                placeholder="Remarks (comma separated)"
                                value={taskRemarks}
                                onChangeText={setTaskRemarks}
                                style={[styles.input, { borderColor: theme.colors.primary, color: theme.colors.text, backgroundColor: theme.colors.background }]}
                            />
                            <Button mode="contained" onPress={assignTask} style={{ marginBottom: 8 }} buttonColor={theme.colors.border} textColor={theme.colors.text}>Assign Task</Button>
                            <Button mode="text" buttonColor={theme.colors.primary} textColor={theme.colors.text} onPress={() => setAssignModalVisible(false)}>Cancel</Button>
                        </Modal>
                    </Portal>

                    {/* View Tasks Modal */}
                    <Portal>
                        <Modal visible={viewTasksModalVisible} onDismiss={() => setViewTasksModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.card, maxHeight: height * 0.7 }]}>
                            <Text style={{ color: theme.colors.text, marginBottom: 12 }} >{selectedUser?.name}'s Tasks</Text>
                            <ScrollView>
                                {selectedUser?.tasks?.length ? selectedUser.tasks.map(task => (
                                    <Card key={task.taskId} style={[styles.taskItem, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
                                        <Card.Content>
                                            <Text style={{ color: theme.colors.text }}>{task.title}</Text>
                                            <Text style={{ color: theme.colors.text }}>Status: {task.status}</Text>
                                            <Text style={{ color: theme.colors.text }}>Description: {task.description}</Text>
                                            {task.remarks?.length > 0 && <Text style={{ color: theme.colors.text }}>Remarks: {task.remarks.join(', ')}</Text>}
                                        </Card.Content>
                                    </Card>
                                )) : <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20 }}>No tasks assigned</Text>}
                            </ScrollView>
                            <Button mode="contained" onPress={() => setViewTasksModalVisible(false)} style={{ marginTop: 8 }} buttonColor={theme.colors.primary} textColor={theme.colors.text}>Close</Button>
                        </Modal>
                    </Portal> 
   

                   

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
    taskItem: { marginBottom: 10, borderRadius: 10, elevation: 1 },
    noUsersContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    noUsersIcon: { fontSize: width * 0.18, marginBottom: 16 },
});

export default AssignScreen;
