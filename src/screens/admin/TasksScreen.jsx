// import React, { useState, useEffect, useContext } from 'react';
// import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
// import firestore from '@react-native-firebase/firestore';
// import { ThemeContext } from '../../context/ThemeContext';
// import auth from '@react-native-firebase/auth';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import Ionicons from 'react-native-vector-icons/Ionicons';


// // Utility function to determine the color based on task status
// const getStatusBorderColor = (status) => {
//     switch (status) {
//         case 'todo':
//             return '#1e90ff'; // Dodger Blue (Planning/Pending)
//         case 'inprogress':
//             return '#ffb300'; // Amber/Orange (Active Work)
//         case 'done':
//             return '#228b22'; // Forest Green (Completed)
//         default:
//             return '#cccccc'; // Default light grey
//     }
// };


// const TasksScreen = ({ route }) => {
//     const { theme } = useContext(ThemeContext);
//     const adminUid = auth().currentUser?.uid; // Use optional chaining for safety

//     const [tasks, setTasks] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [userNames, setUserNames] = useState({}); // Stores map of UID to Name/Role

//     // --- EFFECT: Fetch Tasks and Assigner Names ---
//     useEffect(() => {
//         if (!adminUid) {
//             setTasks([]);
//             setLoading(false);
//             return;
//         }

//         const unsubscribe = firestore()
//             .collection('tasks')
//             .where('assignedTo', '==', adminUid)
//             .onSnapshot(
//                 async snapshot => {
//                     const data = snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }));
//                     setTasks(data);

//                     // 1. Identify all unique UIDs of users who assigned tasks
//                     const assignerUids = [...new Set(data.map(t => t.assignedBy))];

//                     if (assignerUids.length > 0) {
//                         try {
//                             // 2. Fetch user documents (assigners)
//                             const userDocs = await firestore()
//                                 .collection('users')
//                                 .where(firestore.FieldPath.documentId(), 'in', assignerUids.slice(0, 10))
//                                 .get();

//                             const namesMap = {};
//                             userDocs.forEach(doc => {
//                                 const userData = doc.data();
//                                 namesMap[doc.id] = userData.name || userData.email || 'Unknown User';
//                             });
//                             setUserNames(namesMap);

//                         } catch (error) {
//                             console.error('Error fetching assigner names:', error);
//                         }
//                     }

//                     setLoading(false);
//                 },
//                 error => {
//                     console.error('Firestore error:', error);
//                     setLoading(false);
//                     Alert.alert('Error', 'Failed to load tasks.');
//                 }
//             );

//         return () => unsubscribe();
//     }, [adminUid]);


//     const changeStatus = async (task, newStatus) => {
//         try {
//             await firestore()
//                 .collection('tasks')
//                 .doc(task.taskId)
//                 .update({
//                     status: newStatus,
//                     updatedAt: firestore.FieldValue.serverTimestamp(),
//                 });
//         } catch (error) {
//             console.error('Error updating task status:', error);
//             Alert.alert('Error', 'Failed to update task status');
//         }
//     };

//     const renderTask = ({ item }) => {
//         const assignerName = userNames[item.assignedBy] || 'Admin/Super Admin';

//         const deadline = item.deadline?.toDate ? item.deadline.toDate() : null;
//         const now = new Date();
//         const isOverdue = deadline && deadline < now;

//         // Get color based on status
//         const statusColor = getStatusBorderColor(item.status);

//         // Prioritize red for overdue tasks that are not yet marked 'done'
//         const highlightColor = isOverdue && item.status !== 'done' ? 'red' : statusColor;

//         return (
//             <View
//                 style={[
//                     styles.taskCard,
//                     {
//                         backgroundColor: theme.colors.card,
//                         borderColor: theme.colors.card, 
//                         borderLeftColor: highlightColor,   // Status/Overdue color applied to the left border
//                     }
//                 ]}
//             >
//                 <Text style={[styles.taskTitle, { color: theme.colors.text }]}>{item.title}</Text>

//                 <Text style={{ color: theme.colors.text + 'aa', marginBottom: 4, fontStyle: 'italic', fontSize: 13 }}>
//                     <Ionicons name="person-outline" size={13} color={theme.colors.text + 'aa'} /> Assigned by: {assignerName}
//                 </Text>

//                 {deadline && (
//                     <Text style={{ color: isOverdue ? 'red' : theme.colors.primary, marginBottom: 8, fontWeight: '600' }}>
//                         <Ionicons name="calendar-outline" size={14} color={isOverdue ? 'red' : theme.colors.primary} /> Deadline: {deadline.toDateString()}
//                     </Text>
//                 )}

//                 <Text style={{ color: theme.colors.text, marginBottom: 4 }}>{item.description}</Text>
//                 <View style={{flex:1,flexDirection:"row", marginTop:10}}>
//                     <Text style={{ color: theme.colors.text, marginBottom: 8 ,fontWeight:"900",fontSize:14}}>Current Status : </Text>
//                     <Text style={{ color: theme.colors.text, marginBottom: 8, fontStyle: "italic" }}>{item.status.toUpperCase()}</Text>

//                 </View>
//                 {/* <Text style={{ color: theme.colors.text, marginBottom: 8 }}>Current Status: {item.status.toUpperCase()}</Text> */}

//                 <View style={styles.statusButtons}>
//                     {['todo', 'inprogress', 'done'].map(status => (
//                         <TouchableOpacity
//                             key={status}
//                             style={[
//                                 styles.statusButton,
//                                 { backgroundColor: item.status === status ? statusColor : theme.colors.border + '33' }
//                             ]}
//                             onPress={() => changeStatus(item, status)}
//                         >
//                             <Text style={{ color: item.status === status ? '#ffffff' : theme.colors.text, fontWeight: 'bold', fontSize: 12 }}>
//                                 {status.toUpperCase()}
//                             </Text>
//                         </TouchableOpacity>
//                     ))}
//                 </View>
//             </View>
//         );
//     };

//     if (loading) {
//         return (
//             <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
//                 <ActivityIndicator size="large" color={theme.colors.primary} />
//                 <Text style={{ color: theme.colors.text, marginTop: 10 }}>Loading tasks...</Text>
//             </View>
//         );
//     }

//     if (tasks.length === 0) {
//         return (
//             <View style={[styles.noTasksContainer, { backgroundColor: theme.colors.background }]}>
//                 <Text style={{ color: theme.colors.text, fontSize: 18, marginBottom: 8 }}>No tasks assigned 🎉</Text>
//                 <Text style={{ color: theme.colors.text + 'aa', textAlign: 'center' }}>
//                     Any tasks assigned to you by a Super Admin or another Admin will appear here.
//                 </Text>
//             </View>
//         );
//     }

//     return (
//         <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
//             <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
//                 {/* Heading */}
//                 <Text style={[styles.heading, { color: theme.colors.text }]}>
//                     Your Assigned Tasks
//                 </Text>

//                 <FlatList
//                     data={tasks.sort((a, b) => (a.deadline?.toDate?.() || 0) - (b.deadline?.toDate?.() || 0))} // Sort by nearest deadline
//                     keyExtractor={(item) => item.taskId}
//                     renderItem={renderTask}
//                     contentContainerStyle={{ paddingBottom: 20 }}
//                 />
//             </View>
//         </SafeAreaView>
//     );
// };

// export default TasksScreen;

// const styles = StyleSheet.create({
//     container: { flex: 1, padding: 16 },
//     loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//     noTasksContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
//     taskCard: {
//         padding: 16,
//         borderRadius: 8,
//         marginBottom: 12,
//         borderWidth: 1, // General border thickness
//         borderLeftWidth: 5, // Thicker border for the status indicator
//         elevation: 2,
//     },
//     taskTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
//     statusButtons: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         marginTop: 10
//     },
//     statusButton: {
//         flex: 1,
//         paddingInline: 2,
//         paddingBlock:10,
//         marginHorizontal: 4,
//         borderRadius: 4,
//         alignItems: 'center'
//     },
//     heading: {
//         fontSize: 24,
//         fontWeight: 'bold',
//         marginBottom: 16,
//     }
// });














// import React, { useState, useEffect, useContext } from 'react';
// import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
// import firestore from '@react-native-firebase/firestore';
// import { ThemeContext } from '../../context/ThemeContext';
// import auth from '@react-native-firebase/auth';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import DatePicker from 'react-native-date-picker'; // Import DatePicker

// // Utility function to determine the color based on task status
// const getStatusBorderColor = (status) => {
//     switch (status) {
//         case 'todo':
//             return '#1e90ff'; // Dodger Blue (Planning/Pending)
//         case 'inprogress':
//             return '#ffb300'; // Amber/Orange (Active Work)
//         case 'done':
//             return '#228b22'; // Forest Green (Completed)
//         default:
//             return '#cccccc'; // Default light grey
//     }
// };

// const formatDate = (date) => {
//     if (!date) return 'Not set';
//     return date.toLocaleString('en-US', {
//         weekday: 'short',
//         month: 'short',
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit',
//     });
// };


// const TasksScreen = ({ route }) => {
//     const { theme } = useContext(ThemeContext);
//     const adminUid = auth().currentUser?.uid;

//     const [tasks, setTasks] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [userNames, setUserNames] = useState({});

//     // ⭐️ NEW Reminder State ⭐️
//     const [showReminderPicker, setShowReminderPicker] = useState(false);
//     const [currentReminderDate, setCurrentReminderDate] = useState(new Date()); // Date for the picker
//     const [taskToEditReminder, setTaskToEditReminder] = useState(null); // Task being edited

//     // --- EFFECT: Fetch Tasks and Assigner Names ---
//     useEffect(() => {
//         if (!adminUid) {
//             setTasks([]);
//             setLoading(false);
//             return;
//         }

//         const unsubscribe = firestore()
//             .collection('tasks')
//             .where('assignedTo', '==', adminUid)
//             .onSnapshot(
//                 async snapshot => {
//                     const data = snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }));
//                     setTasks(data);

//                     const assignerUids = [...new Set(data.map(t => t.assignedBy))];

//                     if (assignerUids.length > 0) {
//                         try {
//                             const userDocs = await firestore()
//                                 .collection('users')
//                                 .where(firestore.FieldPath.documentId(), 'in', assignerUids.slice(0, 10))
//                                 .get();

//                             const namesMap = {};
//                             userDocs.forEach(doc => {
//                                 const userData = doc.data();
//                                 namesMap[doc.id] = userData.name || userData.email || 'Unknown User';
//                             });
//                             setUserNames(namesMap);

//                         } catch (error) {
//                             console.error('Error fetching assigner names:', error);
//                         }
//                     }

//                     setLoading(false);
//                 },
//                 error => {
//                     console.error('Firestore error:', error);
//                     setLoading(false);
//                     Alert.alert('Error', 'Failed to load tasks.');
//                 }
//             );

//         return () => unsubscribe();
//     }, [adminUid]);


//     // ⭐️ NEW HANDLER: Open Reminder Picker ⭐️
//     const openReminderPicker = (task) => {
//         setTaskToEditReminder(task);
//         // Set picker to existing reminder or current date
//         const initialDate = task.reminder?.toDate ? task.reminder.toDate() : new Date();
//         setCurrentReminderDate(initialDate);
//         setShowReminderPicker(true);
//     };

//     // ⭐️ NEW HANDLER: Update Task Reminder in 'tasks' collection ⭐️
//     const handleUpdateReminder = async (newDate) => {
//         setShowReminderPicker(false);

//         if (!taskToEditReminder) return;

//         const reminderTimestamp = firestore.Timestamp.fromDate(newDate);

//         try {
//             await firestore()
//                 .collection('tasks')
//                 .doc(taskToEditReminder.taskId)
//                 .update({
//                     reminder: reminderTimestamp,
//                     updatedAt: firestore.FieldValue.serverTimestamp(),
//                 });
//             Alert.alert("Success", `Reminder set for "${taskToEditReminder.title}"`);
//         } catch (error) {
//             console.error('Error updating reminder:', error);
//             Alert.alert('Error', 'Failed to set task reminder.');
//         } finally {
//             setTaskToEditReminder(null); // Clear context
//         }
//     };

//     // ⭐️ NEW HANDLER: Clear Task Reminder in 'tasks' collection ⭐️
//     const handleClearReminder = async (task) => {
//         try {
//             await firestore()
//                 .collection('tasks')
//                 .doc(task.taskId)
//                 .update({
//                     reminder: firestore.FieldValue.delete(), // Remove the field
//                     updatedAt: firestore.FieldValue.serverTimestamp(),
//                 });
//             Alert.alert("Success", `Reminder cleared for "${task.title}"`);
//         } catch (error) {
//             console.error('Error clearing reminder:', error);
//             Alert.alert('Error', 'Failed to clear task reminder.');
//         }
//     };


//     const changeStatus = async (task, newStatus) => {
//         try {
//             await firestore()
//                 .collection('tasks')
//                 .doc(task.taskId)
//                 .update({
//                     status: newStatus,
//                     updatedAt: firestore.FieldValue.serverTimestamp(),
//                 });
//         } catch (error) {
//             console.error('Error updating task status:', error);
//             Alert.alert('Error', 'Failed to update task status');
//         }
//     };

//     const renderTask = ({ item }) => {
//         const assignerName = userNames[item.assignedBy] || 'Admin/Super Admin';

//         const deadline = item.deadline?.toDate ? item.deadline.toDate() : null;
//         const reminder = item.reminder?.toDate ? item.reminder.toDate() : null; // ⭐️ Get Reminder ⭐️

//         const now = new Date();
//         const isOverdue = deadline && deadline < now;

//         const statusColor = getStatusBorderColor(item.status);
//         const highlightColor = isOverdue && item.status !== 'done' ? 'red' : statusColor;

//         return (
//             <View
//                 style={[
//                     styles.taskCard,
//                     {
//                         backgroundColor: theme.colors.card,
//                         borderColor: theme.colors.card,
//                         borderLeftColor: highlightColor,
//                     }
//                 ]}
//             >
//                 <View style={styles.cardHeader}>
//                     <Text style={[styles.taskTitle, { color: theme.colors.text }]}>{item.title}</Text>

//                     {/* ⭐️ Reminder Action Button ⭐️ */}
//                     <TouchableOpacity
//                         onPress={() => openReminderPicker(item)}
//                         style={styles.reminderButton}
//                         hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//                     >
//                         <Ionicons
//                             name={reminder ? "alarm" : "alarm-outline"}
//                             size={24}
//                             color={reminder ? theme.colors.primary : theme.colors.text + '99'}
//                         />
//                     </TouchableOpacity>
//                 </View>

//                 <Text style={{ color: theme.colors.text + 'aa', marginBottom: 4, fontStyle: 'italic', fontSize: 13 }}>
//                     <Ionicons name="person-outline" size={13} color={theme.colors.text + 'aa'} /> Assigned by: {assignerName}
//                 </Text>

//                 {deadline && (
//                     <Text style={{ color: isOverdue ? 'red' : theme.colors.primary, marginBottom: 8, fontWeight: '600' }}>
//                         <Ionicons name="calendar-outline" size={14} color={isOverdue ? 'red' : theme.colors.primary} /> Deadline: {deadline.toDateString()}
//                     </Text>
//                 )}

//                 {/* ⭐️ Display Reminder Time ⭐️ */}
//                 {reminder && (
//                     <View style={styles.reminderDisplay}>
//                         <Text style={{ color: theme.colors.text, fontWeight: '500', fontSize: 14 }}>
//                             <Ionicons name="notifications-outline" size={14} color={theme.colors.text} /> Reminder: {formatDate(reminder)}
//                         </Text>
//                         <TouchableOpacity onPress={() => handleClearReminder(item)}>
//                             <Ionicons name="close-circle" size={18} color={theme.colors.primary} />
//                         </TouchableOpacity>
//                     </View>
//                 )}


//                 <Text style={{ color: theme.colors.text, marginBottom: 4 }}>{item.description}</Text>
//                 <View style={{ flex: 1, flexDirection: "row", marginTop: 10 }}>
//                     <Text style={{ color: theme.colors.text, marginBottom: 8, fontWeight: "900", fontSize: 14 }}>Current Status : </Text>
//                     <Text style={{ color: theme.colors.text, marginBottom: 8, fontStyle: "italic" }}>{item.status.toUpperCase()}</Text>
//                 </View>

//                 <View style={styles.statusButtons}>
//                     {['todo', 'inprogress', 'done'].map(status => (
//                         <TouchableOpacity
//                             key={status}
//                             style={[
//                                 styles.statusButton,
//                                 { backgroundColor: item.status === status ? statusColor : theme.colors.border + '33' }
//                             ]}
//                             onPress={() => changeStatus(item, status)}
//                         >
//                             <Text style={{ color: item.status === status ? '#ffffff' : theme.colors.text, fontWeight: 'bold', fontSize: 12 }}>
//                                 {status.toUpperCase()}
//                             </Text>
//                         </TouchableOpacity>
//                     ))}
//                 </View>
//             </View>
//         );
//     };

//     if (loading) {
//         return (
//             <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
//                 <ActivityIndicator size="large" color={theme.colors.primary} />
//                 <Text style={{ color: theme.colors.text, marginTop: 10 }}>Loading tasks...</Text>
//             </View>
//         );
//     }

//     if (tasks.length === 0) {
//         return (
//             <View style={[styles.noTasksContainer, { backgroundColor: theme.colors.background }]}>
//                 <Text style={{ color: theme.colors.text, fontSize: 18, marginBottom: 8 }}>No tasks assigned 🎉</Text>
//                 <Text style={{ color: theme.colors.text + 'aa', textAlign: 'center' }}>
//                     Any tasks assigned to you by a Super Admin or another Admin will appear here.
//                 </Text>
//             </View>
//         );
//     }

//     return (
//         <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
//             <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
//                 <Text style={[styles.heading, { color: theme.colors.text }]}>
//                     Your Assigned Tasks
//                 </Text>

//                 <FlatList
//                     data={tasks.sort((a, b) => (a.deadline?.toDate?.() || 0) - (b.deadline?.toDate?.() || 0))}
//                     keyExtractor={(item) => item.taskId}
//                     renderItem={renderTask}
//                     contentContainerStyle={{ paddingBottom: 20 }}
//                 />
//             </View>

//             {/* ⭐️ DatePicker Component for Reminder ⭐️ */}
//             <DatePicker
//                 modal
//                 open={showReminderPicker}
//                 date={currentReminderDate}
//                 onConfirm={handleUpdateReminder}
//                 onCancel={() => {
//                     setShowReminderPicker(false);
//                     setTaskToEditReminder(null);
//                 }}
//                 minimumDate={new Date()}
//                 mode="datetime"
//                 title={`Set Reminder for "${taskToEditReminder?.title || 'Task'}"`}
//                 textColor={theme.colors.text}
//             />
//         </SafeAreaView>
//     );
// };

// export default TasksScreen;

// const styles = StyleSheet.create({
//     container: { flex: 1, padding: 16 },
//     loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//     noTasksContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
//     taskCard: {
//         padding: 16,
//         borderRadius: 8,
//         marginBottom: 12,
//         borderWidth: 1,
//         borderLeftWidth: 5,
//         elevation: 2,
//     },
//     cardHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 4,
//     },
//     taskTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         flex: 1, // Allow title to take space
//         marginRight: 10,
//     },
//     reminderButton: {
//         padding: 5,
//         marginLeft: 10,
//     },
//     reminderDisplay: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingVertical: 5,
//         paddingHorizontal: 8,
//         marginBottom: 8,
//         borderRadius: 4,
//         backgroundColor: '#228b2220', // Light background for visibility
//         borderLeftWidth: 3,
//         borderLeftColor: '#228b22',
//     },
//     statusButtons: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         marginTop: 10
//     },
//     statusButton: {
//         flex: 1,
//         paddingHorizontal: 2,
//         paddingVertical: 10,
//         marginHorizontal: 4,
//         borderRadius: 4,
//         alignItems: 'center'
//     },
//     heading: {
//         fontSize: 24,
//         fontWeight: 'bold',
//         marginBottom: 16,
//     }
// });




















// import React, { useState, useEffect, useContext, useRef } from 'react';
// import {
//     View,
//     Text,
//     FlatList,
//     TouchableOpacity,
//     StyleSheet,
//     Alert,
//     ActivityIndicator,
//     Modal,
//     TextInput,
//     Pressable,
//     Animated,
//     Easing
// } from 'react-native';
// import firestore from '@react-native-firebase/firestore';
// import { ThemeContext } from '../../context/ThemeContext';
// import auth from '@react-native-firebase/auth';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import DatePicker from 'react-native-date-picker';

// // ---------- Request Feature Helper ----------
// const submitRequest = async (currentUserId, requestType, requestDescription, userRole, recipientRole) => {
//     if (requestDescription.trim() === '') {
//         Alert.alert('Missing Info', 'Please provide a description for your request.');
//         return false;
//     }

//     const requestId = firestore().collection('_').doc().id;

//     const newRequestData = {
//         requestId,
//         requestType,
//         description: requestDescription.trim(),
//         status: 'new',
//         requesterRole: userRole,
//         recipientRole,
//         createdAt: new Date(),
//     };

//     try {
//         await firestore()
//             .collection('users')
//             .doc(currentUserId)
//             .update({
//                 userRequests: firestore.FieldValue.arrayUnion(newRequestData),
//             });

//         Alert.alert('Success 🎉', `Your request has been sent to the ${recipientRole} and is pending review.`);
//         return true;
//     } catch (error) {
//         if (error.code === 'firestore/not-found' || error.message.includes('No document to update')) {
//             try {
//                 await firestore()
//                     .collection('users')
//                     .doc(currentUserId)
//                     .set({ userRequests: [newRequestData] }, { merge: true });
//                 Alert.alert('Success 🎉', `Your request has been sent to the ${recipientRole} and is pending review.`);
//                 return true;
//             } catch (e) {
//                 console.error('Error initializing request:', e);
//                 Alert.alert('Error', 'Failed to send request. Please try again.');
//                 return false;
//             }
//         }
//         console.error('Error submitting request:', error);
//         Alert.alert('Error', 'Failed to send request. Please try again.');
//         return false;
//     }
// };

// // Utility function for color mapping based on task status
// const getStatusBorderColor = (status) => {
//     switch (status) {
//         case 'todo':
//             return '#1e90ff';
//         case 'inprogress':
//             return '#ffb300';
//         case 'done':
//             return '#228b22';
//         default:
//             return '#cccccc';
//     }
// };

// const formatDate = (date) => {
//     if (!date) return 'Not set';
//     return date.toLocaleString('en-US', {
//         weekday: 'short',
//         month: 'short',
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit',
//     });
// };

// // ---------- Main Screen ----------
// const TasksScreen = () => {
//     const { theme } = useContext(ThemeContext);
//     const adminUid = auth().currentUser?.uid;

//     const [tasks, setTasks] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [userNames, setUserNames] = useState({});
//     const [userRole, setUserRole] = useState('user');

//     const bounceValue = useRef(new Animated.Value(0)).current;

//     // Request Modal States
//     const [requestModalVisible, setRequestModalVisible] = useState(false);
//     const [requestType, setRequestType] = useState('Help');
//     const [requestDescription, setRequestDescription] = useState('');
//     const [recipientRole, setRecipientRole] = useState('admin');

//     // Reminder States
//     const [showReminderPicker, setShowReminderPicker] = useState(false);
//     const [currentReminderDate, setCurrentReminderDate] = useState(new Date());
//     const [taskToEditReminder, setTaskToEditReminder] = useState(null);

//     useEffect(() => {
//         Animated.loop(
//             Animated.sequence([
//                 Animated.timing(bounceValue, {
//                     toValue: -10,
//                     duration: 600,
//                     easing: Easing.inOut(Easing.ease),
//                     useNativeDriver: true,
//                 }),
//                 Animated.timing(bounceValue, {
//                     toValue: 0,
//                     duration: 600,
//                     easing: Easing.inOut(Easing.ease),
//                     useNativeDriver: true,
//                 }),
//             ])
//         ).start();
//     }, [bounceValue]);

//     useEffect(() => {
//         if (!adminUid) return;
//         const unsubUser = firestore()
//             .collection('users')
//             .doc(adminUid)
//             .onSnapshot(doc => {
//                 if (doc.exists) setUserRole(doc.data()?.role || 'user');
//             });
//         return () => unsubUser();
//     }, [adminUid]);

//     useEffect(() => {
//         if (!adminUid) {
//             setTasks([]);
//             setLoading(false);
//             return;
//         }

//         const unsubscribe = firestore()
//             .collection('tasks')
//             .where('assignedTo', '==', adminUid)
//             .onSnapshot(
//                 async snapshot => {
//                     const data = snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }));
//                     setTasks(data);

//                     const assignerUids = [...new Set(data.map(t => t.assignedBy))];
//                     if (assignerUids.length > 0) {
//                         try {
//                             const userDocs = await firestore()
//                                 .collection('users')
//                                 .where(firestore.FieldPath.documentId(), 'in', assignerUids.slice(0, 10))
//                                 .get();

//                             const namesMap = {};
//                             userDocs.forEach(doc => {
//                                 const userData = doc.data();
//                                 namesMap[doc.id] = userData.name || userData.email || 'Unknown User';
//                             });
//                             setUserNames(namesMap);
//                         } catch (error) {
//                             console.error('Error fetching assigner names:', error);
//                         }
//                     }
//                     setLoading(false);
//                 },
//                 () => {
//                     Alert.alert('Error', 'Failed to load tasks.');
//                     setLoading(false);
//                 }
//             );

//         return () => unsubscribe();
//     }, [adminUid]);

//     const openReminderPicker = (task) => {
//         setTaskToEditReminder(task);
//         const initialDate = task.reminder?.toDate ? task.reminder.toDate() : new Date();
//         setCurrentReminderDate(initialDate);
//         setShowReminderPicker(true);
//     };

//     const handleUpdateReminder = async (newDate) => {
//         setShowReminderPicker(false);
//         if (!taskToEditReminder) return;

//         const reminderTimestamp = firestore.Timestamp.fromDate(newDate);
//         try {
//             await firestore()
//                 .collection('tasks')
//                 .doc(taskToEditReminder.taskId)
//                 .update({
//                     reminder: reminderTimestamp,
//                     updatedAt: firestore.FieldValue.serverTimestamp(),
//                 });
//             Alert.alert("Success", `Reminder set for "${taskToEditReminder.title}"`);
//         } catch {
//             Alert.alert('Error', 'Failed to set task reminder.');
//         } finally {
//             setTaskToEditReminder(null);
//         }
//     };

//     const handleClearReminder = async (task) => {
//         try {
//             await firestore()
//                 .collection('tasks')
//                 .doc(task.taskId)
//                 .update({
//                     reminder: firestore.FieldValue.delete(),
//                     updatedAt: firestore.FieldValue.serverTimestamp(),
//                 });
//             Alert.alert("Success", `Reminder cleared for "${task.title}"`);
//         } catch {
//             Alert.alert('Error', 'Failed to clear task reminder.');
//         }
//     };

//     const handleSubmitRequest = async () => {
//         if (!recipientRole) {
//             Alert.alert('Select Recipient', 'Please select a recipient for this request.');
//             return;
//         }
//         if (adminUid) {
//             const success = await submitRequest(adminUid, requestType, requestDescription, userRole, recipientRole);
//             if (success) {
//                 setRequestModalVisible(false);
//                 setRequestDescription('');
//                 setRequestType('Help');
//                 setRecipientRole('admin');
//             }
//         }
//     };

//     const changeStatus = async (task, newStatus) => {
//         try {
//             await firestore()
//                 .collection('tasks')
//                 .doc(task.taskId)
//                 .update({
//                     status: newStatus,
//                     updatedAt: firestore.FieldValue.serverTimestamp(),
//                 });
//         } catch {
//             Alert.alert('Error', 'Failed to update task status');
//         }
//     };

//     const renderTask = ({ item }) => {
//         const assignerName = userNames[item.assignedBy] || 'Admin/Super Admin';
//         const deadline = item.deadline?.toDate ? item.deadline.toDate() : null;
//         const reminder = item.reminder?.toDate ? item.reminder.toDate() : null;
//         const isOverdue = deadline && deadline < new Date();
//         const statusColor = getStatusBorderColor(item.status);
//         const highlightColor = isOverdue && item.status !== 'done' ? 'red' : statusColor;

//         return (
//             <View style={[styles.taskCard, { backgroundColor: theme.colors.card, borderLeftColor: highlightColor }]}>
//                 <View style={styles.cardHeader}>
//                     <Text style={[styles.taskTitle, { color: theme.colors.text }]}>{item.title}</Text>
//                     <TouchableOpacity onPress={() => openReminderPicker(item)} style={styles.reminderButton}>
//                         <Ionicons
//                             name={reminder ? "alarm" : "alarm-outline"}
//                             size={22}
//                             color={reminder ? theme.colors.primary : theme.colors.text + '99'}
//                         />
//                     </TouchableOpacity>
//                 </View>
//                 <Text style={{ color: theme.colors.text + 'aa', marginBottom: 4, fontStyle: 'italic', fontSize: 13 }}>
//                     <Ionicons name="person-outline" size={13} /> Assigned by: {assignerName}
//                 </Text>
//                 {deadline && (
//                     <Text style={{ color: isOverdue ? 'red' : theme.colors.primary, fontWeight: '600' }}>
//                         <Ionicons name="calendar-outline" size={14} color={isOverdue ? 'red' : theme.colors.primary} /> Deadline: {deadline.toDateString()}
//                     </Text>
//                 )}
//                 {reminder && (
//                     <View style={styles.reminderDisplay}>
//                         <Text style={{ color: theme.colors.text, fontWeight: '500' }}>
//                             <Ionicons name="notifications-outline" size={14} color={theme.colors.text} /> Reminder: {formatDate(reminder)}
//                         </Text>
//                         <TouchableOpacity onPress={() => handleClearReminder(item)}>
//                             <Ionicons name="close-circle" size={18} color={theme.colors.primary} />
//                         </TouchableOpacity>
//                     </View>
//                 )}
//                 <Text style={{ color: theme.colors.text }}>{item.description}</Text>
//                 <View style={{ flexDirection: 'row', marginTop: 10 }}>
//                     <Text style={{ color: theme.colors.text, fontWeight: '900' }}>Current Status : </Text>
//                     <Text style={{ color: theme.colors.text, fontStyle: 'italic' }}>{item.status.toUpperCase()}</Text>
//                 </View>
//                 <View style={styles.statusButtons}>
//                     {['todo', 'inprogress', 'done'].map(status => (
//                         <TouchableOpacity
//                             key={status}
//                             style={[
//                                 styles.statusButton,
//                                 { backgroundColor: item.status === status ? statusColor : theme.colors.border + '33' }
//                             ]}
//                             onPress={() => changeStatus(item, status)}
//                         >
//                             <Text style={{ color: item.status === status ? '#fff' : theme.colors.text, fontWeight: 'bold' }}>
//                                 {status.toUpperCase()}
//                             </Text>
//                         </TouchableOpacity>
//                     ))}
//                 </View>
//             </View>
//         );
//     };

//     if (loading) {
//         return (
//             <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
//                 <ActivityIndicator size="large" color={theme.colors.primary} />
//                 <Text style={{ color: theme.colors.text, marginTop: 10 }}>Loading tasks...</Text>
//             </View>
//         );
//     }

//     return (
//         <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
//             <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
//                 <Text style={[styles.heading, { color: theme.colors.text }]}>Your Assigned Tasks</Text>
//                 <FlatList
//                     data={tasks.sort((a, b) => (a.deadline?.toDate?.() || 0) - (b.deadline?.toDate?.() || 0))}
//                     keyExtractor={item => item.taskId}
//                     renderItem={renderTask}
//                 />
//             </View>

//             {/* Floating Request Button */}
//             <Pressable
//                 style={[styles.floatingButton, { backgroundColor: theme.colors.primary }]}
//                 onPress={() => setRequestModalVisible(true)}
//             >
//                 <Ionicons name="receipt-outline" size={26} color="#fff" />
//             </Pressable>

//             {/* Request Modal */}
//             <Modal visible={requestModalVisible} transparent animationType="slide" onRequestClose={() => setRequestModalVisible(false)}>
//                 <View style={styles.modalBackground}>
//                     <View style={[styles.modalContainer, { backgroundColor: theme.colors.card }]}>
//                         <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Submit New Request</Text>
//                         <Text style={[styles.label, { color: theme.colors.text }]}>Request To</Text>
//                         <View style={styles.requestTypeContainer}>
//                             <Pressable
//                                 onPress={() => setRecipientRole('admin')}
//                                 style={[styles.typeButton, { backgroundColor: recipientRole === 'admin' ? theme.colors.primary : theme.colors.border }]}
//                             >
//                                 <Text style={{ color: recipientRole === 'admin' ? '#fff' : theme.colors.text }}>Admin</Text>
//                             </Pressable>
//                             <Pressable
//                                 onPress={() => setRecipientRole('superadmin')}
//                                 style={[styles.typeButton, { backgroundColor: recipientRole === 'superadmin' ? theme.colors.primary : theme.colors.border }]}
//                             >
//                                 <Text style={{ color: recipientRole === 'superadmin' ? '#fff' : theme.colors.text }}>SuperAdmin</Text>
//                             </Pressable>
//                         </View>

//                         <Text style={[styles.label, { color: theme.colors.text }]}>Request Type</Text>
//                         <View style={styles.requestTypeContainer}>
//                             {['Help', 'Item', 'Other'].map(type => (
//                                 <Pressable
//                                     key={type}
//                                     onPress={() => setRequestType(type)}
//                                     style={[styles.typeButton, { backgroundColor: requestType === type ? theme.colors.primary : theme.colors.border }]}
//                                 >
//                                     <Text style={{ color: requestType === type ? '#fff' : theme.colors.text }}>{type}</Text>
//                                 </Pressable>
//                             ))}
//                         </View>

//                         <Text style={[styles.label, { color: theme.colors.text }]}>Description</Text>
//                         <TextInput
//                             placeholder={`Describe your ${requestType} request...`}
//                             placeholderTextColor="#888"
//                             value={requestDescription}
//                             onChangeText={setRequestDescription}
//                             multiline
//                             style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, height: 100, textAlignVertical: 'top' }]}
//                         />
//                         <View style={{ flexDirection: 'row', marginTop: 16 }}>
//                             <Pressable style={[styles.modalButton, { backgroundColor: '#bdc3c7', flex: 1, marginRight: 6 }]} onPress={() => setRequestModalVisible(false)}>
//                                 <Text style={styles.modalButtonText}>Cancel</Text>
//                             </Pressable>
//                             <Pressable
//                                 style={[styles.modalButton, { flex: 1, marginLeft: 6, backgroundColor: recipientRole && requestDescription.trim() ? theme.colors.primary : '#ccc' }]}
//                                 onPress={handleSubmitRequest}
//                                 disabled={!recipientRole || !requestDescription.trim()}
//                             >
//                                 <Text style={styles.modalButtonText}>Submit</Text>
//                             </Pressable>
//                         </View>
//                     </View>
//                 </View>
//             </Modal>

//             <DatePicker
//                 modal
//                 open={showReminderPicker}
//                 date={currentReminderDate}
//                 onConfirm={handleUpdateReminder}
//                 onCancel={() => setShowReminderPicker(false)}
//                 minimumDate={new Date()}
//                 mode="datetime"
//             />
//         </SafeAreaView>
//     );
// };

// export default TasksScreen;

// const styles = StyleSheet.create({
//     container: { flex: 1, padding: 16 },
//     taskCard: { padding: 16, borderWidth: 1, borderRadius: 8, marginBottom: 12, borderLeftWidth: 5 },
//     cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//     taskTitle: { fontSize: 18, fontWeight: 'bold', flex: 1 },
//     statusButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
//     statusButton: { flex: 1, paddingVertical: 4, marginHorizontal: 2, borderRadius: 4, alignItems: 'center' },
//     reminderDisplay: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, padding: 6, borderRadius: 4, backgroundColor: '#228b2220' },
//     heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
//     floatingButton: {
//         position: 'absolute',
//         bottom: 80,
//         right: 20,
//         width: 60,
//         height: 60,
//         borderRadius: 30,
//         alignItems: 'center',
//         justifyContent: 'center',
//         elevation: 6,
//     },
//     modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
//     modalContainer: { width: '85%', padding: 20, borderRadius: 12 },
//     modalTitle: { fontWeight: 'bold', marginBottom: 12, fontSize: 18 },
//     input: { borderWidth: 1, borderRadius: 8, padding: 10 },
//     modalButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
//     modalButtonText: { color: '#fff', fontWeight: 'bold' },
//     label: { fontWeight: '600', marginBottom: 6 },
//     requestTypeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
//     typeButton: { flex: 1, paddingVertical: 10, marginHorizontal: 4, borderRadius: 8, alignItems: 'center' },
// });
























import React, { useState, useEffect, useContext, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    Pressable,
    Animated,
    Easing
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext';
import auth from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';


// ---------- Request Feature Helper ----------
const submitRequest = async (currentUserId, requestType, requestDescription, userRole, recipientRole) => {
    if (requestDescription.trim() === '') {
        Alert.alert('Missing Info', 'Please provide a description for your request.');
        return false;
    }

    const requestId = firestore().collection('_').doc().id;

    const newRequestData = {
        requestId,
        requestType,
        description: requestDescription.trim(),
        status: 'new',
        requesterRole: userRole,
        recipientRole,
        createdAt: new Date(),
    };

    try {
        await firestore()
            .collection('users')
            .doc(currentUserId)
            .update({
                userRequests: firestore.FieldValue.arrayUnion(newRequestData),
            });

        Alert.alert('Success 🎉', `Your request has been sent to the ${recipientRole} and is pending review.`);
        return true;
    } catch (error) {
        if (error.code === 'firestore/not-found' || error.message.includes('No document to update')) {
            try {
                await firestore()
                    .collection('users')
                    .doc(currentUserId)
                    .set({ userRequests: [newRequestData] }, { merge: true });
                Alert.alert('Success 🎉', `Your request has been sent to the ${recipientRole} and is pending review.`);
                return true;
            } catch (e) {
                console.error('Error initializing request:', e);
                Alert.alert('Error', 'Failed to send request. Please try again.');
                return false;
            }
        }
        console.error('Error submitting request:', error);
        Alert.alert('Error', 'Failed to send request. Please try again.');
        return false;
    }
};

const getStatusBorderColor = (status) => {
    switch (status) {
        case 'todo': return '#1e90ff';
        case 'inprogress': return '#ffb300';
        case 'done': return '#228b22';
        default: return '#cccccc';
    }
};

const formatDate = (date) => {
    if (!date) return 'Not set';
    return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const TasksScreen = () => {
    const { theme } = useContext(ThemeContext);
    const adminUid = auth().currentUser?.uid;

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userNames, setUserNames] = useState({});
    const [userRole, setUserRole] = useState('user');

    const bounceValue = useRef(new Animated.Value(0)).current;

    const [requestModalVisible, setRequestModalVisible] = useState(false);
    const [requestType, setRequestType] = useState('Help');
    const [requestDescription, setRequestDescription] = useState('');
    const [recipientRole, setRecipientRole] = useState('superadmin');

    const [showReminderPicker, setShowReminderPicker] = useState(false);
    const [currentReminderDate, setCurrentReminderDate] = useState(new Date());
    const [taskToEditReminder, setTaskToEditReminder] = useState(null);


    // Animations
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(bounceValue, {
                    toValue: -10,
                    duration: 600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(bounceValue, {
                    toValue: 0,
                    duration: 600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [bounceValue]);

    useEffect(() => {
        if (!adminUid) return;
        const unsubUser = firestore()
            .collection('users')
            .doc(adminUid)
            .onSnapshot(doc => {
                if (doc.exists) setUserRole(doc.data()?.role || 'user');
            });
        return () => unsubUser();
    }, [adminUid]);

    // Firestore subscription for tasks
    useEffect(() => {
        if (!adminUid) {
            setTasks([]);
            setLoading(false);
            return;
        }

        const unsubscribe = firestore()
            .collection('tasks')
            .where('assignedTo', '==', adminUid)
            .onSnapshot(
                async snapshot => {
                    const data = snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }));
                    setTasks(data);

                    const assignerUids = [...new Set(data.map(t => t.assignedBy))];
                    if (assignerUids.length > 0) {
                        try {
                            const userDocs = await firestore()
                                .collection('users')
                                .where(firestore.FieldPath.documentId(), 'in', assignerUids.slice(0, 10))
                                .get();

                            const namesMap = {};
                            userDocs.forEach(doc => {
                                const userData = doc.data();
                                namesMap[doc.id] = userData.name || userData.email || 'Unknown User';
                            });
                            setUserNames(namesMap);
                        } catch (error) {
                            console.error('Error fetching assigner names:', error);
                        }
                    }
                    setLoading(false);
                },
                () => {
                    Alert.alert('Error', 'Failed to load tasks.');
                    setLoading(false);
                }
            );

        return () => unsubscribe();
    }, [adminUid]);


    // Reminder Handlers
    const openReminderPicker = (task) => {
        setTaskToEditReminder(task);
        const initialDate = task.reminder?.toDate ? task.reminder.toDate() : new Date();
        setCurrentReminderDate(initialDate);
        setShowReminderPicker(true);
    };

    const handleUpdateReminder = async (newDate) => {
        setShowReminderPicker(false);
        if (!taskToEditReminder) return;

        const reminderTimestamp = firestore.Timestamp.fromDate(newDate);
        try {
            await firestore()
                .collection('tasks')
                .doc(taskToEditReminder.taskId)
                .update({
                    reminder: reminderTimestamp,
                    updatedAt: firestore.FieldValue.serverTimestamp(),
                });
            Alert.alert("Success", `Reminder set for "${taskToEditReminder.title}"`);
        } catch {
            Alert.alert('Error', 'Failed to set task reminder.');
        } finally {
            setTaskToEditReminder(null);
        }
    };

    const handleClearReminder = async (task) => {
        try {
            await firestore()
                .collection('tasks')
                .doc(task.taskId)
                .update({
                    reminder: firestore.FieldValue.delete(),
                    updatedAt: firestore.FieldValue.serverTimestamp(),
                });
            Alert.alert("Success", `Reminder cleared for "${task.title}"`);
        } catch {
            Alert.alert('Error', 'Failed to clear task reminder.');
        }
    };


    const handleSubmitRequest = async () => {
        if (adminUid) {
            const success = await submitRequest(adminUid, requestType, requestDescription, userRole, recipientRole);
            if (success) {
                setRequestModalVisible(false);
                setRequestDescription('');
                setRequestType('Help');
            }
        }
    };


    // Change Task Status
    const changeStatus = async (task, newStatus) => {
        try {
            await firestore()
                .collection('tasks')
                .doc(task.taskId)
                .update({
                    status: newStatus,
                    updatedAt: firestore.FieldValue.serverTimestamp(),
                });
        } catch {
            Alert.alert('Error', 'Failed to update task status');
        }
    };


    // Render Task Card
    const renderTask = ({ item }) => {
        const assignerName = userNames[item.assignedBy] || 'Admin/Super Admin';
        const deadline = item.deadline?.toDate ? item.deadline.toDate() : null;
        const reminder = item.reminder?.toDate ? item.reminder.toDate() : null;
        const isOverdue = deadline && deadline < new Date();
        const statusColor = getStatusBorderColor(item.status);
        const highlightColor = isOverdue && item.status !== 'done' ? 'red' : statusColor;

        return (
            <View style={[styles.taskCard, { backgroundColor: theme.colors.card, borderLeftColor: highlightColor }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.taskTitle, { color: theme.colors.text }]}>{item.title}</Text>
                    <TouchableOpacity onPress={() => openReminderPicker(item)} style={styles.reminderButton}>
                        <Ionicons
                            name={reminder ? "alarm" : "alarm-outline"}
                            size={22}
                            color={reminder ? theme.colors.primary : theme.colors.text + '99'}
                        />
                    </TouchableOpacity>
                </View>
                <Text style={{ color: theme.colors.text + 'aa', marginBottom: 4, fontStyle: 'italic', fontSize: 13 }}>
                    <Ionicons name="person-outline" size={13} /> Assigned by: {assignerName}
                </Text>
                {deadline && (
                    <Text style={{ color: isOverdue ? 'red' : theme.colors.primary, fontWeight: '600' }}>
                        <Ionicons name="calendar-outline" size={14} color={isOverdue ? 'red' : theme.colors.primary} /> Deadline: {deadline.toDateString()}
                    </Text>
                )}
                {reminder && (
                    <View style={styles.reminderDisplay}>
                        <Text style={{ color: theme.colors.text, fontWeight: '500' }}>
                            <Ionicons name="notifications-outline" size={14} color={theme.colors.text} /> Reminder: {formatDate(reminder)}
                        </Text>
                        <TouchableOpacity onPress={() => handleClearReminder(item)}>
                            <Ionicons name="close-circle" size={18} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                )}
                <Text style={{ color: theme.colors.text }}>{item.description}</Text>
                <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <Text style={{ color: theme.colors.text, fontWeight: '900' }}>Current Status : </Text>
                    <Text style={{ color: theme.colors.text, fontStyle: 'italic' }}>{item.status.toUpperCase()}</Text>
                </View>
                <View style={styles.statusButtons}>
                    {['todo', 'pending', 'done'].map(status => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.statusButton,
                                { backgroundColor: item.status === status ? statusColor : theme.colors.border + '33' }
                            ]}
                            onPress={() => changeStatus(item, status)}
                        >
                            <Text style={{ color: item.status === status ? '#fff' : theme.colors.text, fontWeight: 'bold' }}>
                                {status.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };


    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ color: theme.colors.text, marginTop: 10 }}>Loading tasks...</Text>
            </View>
        );
    }


    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.heading, { color: theme.colors.text }]}>Your Assigned Tasks</Text>
                <FlatList
                    data={tasks.sort((a, b) => (a.deadline?.toDate?.() || 0) - (b.deadline?.toDate?.() || 0))}
                    keyExtractor={item => item.taskId}
                    renderItem={renderTask}
                />
            </View>

            {/* Floating Request Button */}
            <Pressable
                style={[styles.floatingButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setRequestModalVisible(true)}
            >
                <Ionicons name="receipt-outline" size={26} color="#fff" />
            </Pressable>

            {/* Request Modal */}
            <Modal visible={requestModalVisible} transparent animationType="slide" onRequestClose={() => setRequestModalVisible(false)}>
                <View style={styles.modalBackground}>
                    <View style={[styles.modalContainer, { backgroundColor: theme.colors.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Submit New Request</Text>

                        {/* Fixed SuperAdmin Recipient */}
                        <Text style={[styles.label, { color: theme.colors.text, marginBottom: 6 }]}>Request will be sent to</Text>
                        <View style={styles.requestTypeContainer}>
                            <View style={[styles.typeButton, { backgroundColor: theme.colors.primary }]}>
                                <Text style={{ color: '#fff', fontWeight: '600' }}>SuperAdmin</Text>
                            </View>
                        </View>

                        <Text style={[styles.label, { color: theme.colors.text }]}>Request Type</Text>
                        <View style={styles.requestTypeContainer}>
                            {['Help', 'Item', 'Other'].map(type => (
                                <Pressable
                                    key={type}
                                    onPress={() => setRequestType(type)}
                                    style={[styles.typeButton, { backgroundColor: requestType === type ? theme.colors.primary : theme.colors.border }]}
                                >
                                    <Text style={{ color: requestType === type ? '#fff' : theme.colors.text }}>{type}</Text>
                                </Pressable>
                            ))}
                        </View>

                        <Text style={[styles.label, { color: theme.colors.text }]}>Description</Text>
                        <TextInput
                            placeholder={`Describe your ${requestType} request...`}
                            placeholderTextColor="#888"
                            value={requestDescription}
                            onChangeText={setRequestDescription}
                            multiline
                            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, height: 100, textAlignVertical: 'top' }]}
                        />
                        <View style={{ flexDirection: 'row', marginTop: 16 }}>
                            <Pressable style={[styles.modalButton, { backgroundColor: '#bdc3c7', flex: 1, marginRight: 6 }]} onPress={() => setRequestModalVisible(false)}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, { flex: 1, marginLeft: 6, backgroundColor: requestDescription.trim() ? theme.colors.primary : '#ccc' }]}
                                onPress={handleSubmitRequest}
                                disabled={!requestDescription.trim()}
                            >
                                <Text style={styles.modalButtonText}>Submit</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Date Picker */}
            <DatePicker
                modal
                open={showReminderPicker}
                date={currentReminderDate}
                onConfirm={handleUpdateReminder}
                onCancel={() => setShowReminderPicker(false)}
                minimumDate={new Date()}
                mode="datetime"
            />
        </SafeAreaView>
    );
};


export default TasksScreen;


// ---------- Styles ----------
const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    taskCard: {
        padding: 16,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 12,
        borderLeftWidth: 5,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    taskTitle: { fontSize: 18, fontWeight: 'bold', flex: 1 },
    reminderButton: { padding: 5, marginLeft: 10 },
    reminderDisplay: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 8,
        marginBottom: 8,
        borderRadius: 4,
        backgroundColor: '#228b2220',
        borderLeftWidth: 3,
        borderLeftColor: '#228b22',
    },
    statusButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    statusButton: { flex: 1, paddingVertical: 6, marginHorizontal: 4, borderRadius: 4, alignItems: 'center' },
    heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
    floatingButton: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        right: 20,
        bottom: 100,
        elevation: 6,
    },
    modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '85%', padding: 20, borderRadius: 12 },
    modalTitle: { fontWeight: 'bold', marginBottom: 12, fontSize: 18 },
    input: { borderWidth: 1, borderRadius: 8, padding: 10 },
    modalButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    modalButtonText: { color: '#fff', fontWeight: 'bold' },
    label: { fontWeight: '600', marginBottom: 6 },
    requestTypeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    typeButton: { flex: 1, paddingVertical: 10, marginHorizontal: 4, borderRadius: 8, alignItems: 'center' },
});
