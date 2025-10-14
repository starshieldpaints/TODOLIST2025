// import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Pressable,
//   StyleSheet,
//   Dimensions,
//   Modal,
//   TextInput,
//   Animated,
//   Easing,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import firestore from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';
// import { ThemeContext } from '../../context/ThemeContext';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// const useScreenWidth = () => {
//   const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
//   useEffect(() => {
//     const onChange = ({ window }) => setScreenWidth(window.width);
//     const sub = Dimensions.addEventListener('change', onChange);
//     return () => sub.remove();
//   }, []);
//   return screenWidth;
// };
// const getLatestRemark = (remarks) => {
//   if (!remarks || remarks.length === 0) return null;
//   const validRemarks = remarks.filter(r => r && r.createdAt);
//   if (validRemarks.length === 0) return null;
//   const sortedRemarks = validRemarks.sort((a, b) => {
//     const timeA = a.createdAt
//       ? (a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime())
//       : 0;
//     const timeB = b.createdAt
//       ? (b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime())
//       : 0;
//     return timeB - timeA; 
//   });
//   return sortedRemarks[0].text;
// };
// const UserTasksScreen = () => {
//   const { theme } = useContext(ThemeContext);
//   const screenWidth = useScreenWidth();
//   const scale = screenWidth / 375; 
//   const [tasks, setTasks] = useState([]);
//   const [activeTab, setActiveTab] = useState('New');
//   const [rejectModalVisible, setRejectModalVisible] = useState(false);
//   const [rejectRemark, setRejectRemark] = useState('');
//   const [selectedTaskId, setSelectedTaskId] = useState(null);
//   const currentUserId = auth().currentUser?.uid;
//   const bounceValue = useRef(new Animated.Value(0)).current;
//   useEffect(() => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(bounceValue, {
//           toValue: -10,
//           duration: 500,
//           easing: Easing.inOut(Easing.ease),
//           useNativeDriver: true,
//         }),
//         Animated.timing(bounceValue, {
//           toValue: 0,
//           duration: 500,
//           easing: Easing.inOut(Easing.ease),
//           useNativeDriver: true,
//         }),
//       ])
//     ).start();
//   }, [bounceValue]);
//   useEffect(() => {
//     if (!currentUserId) return;
//     const unsubscribe = firestore()
//       .collection('tasks')
//       .where('assignedTo', '==', currentUserId)
//       .onSnapshot(snapshot => {
//         const data = snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }));
//         setTasks(data);
//       });
//     return () => unsubscribe();
//   }, [currentUserId]);
//   const filteredTasks = useMemo(() => {
//     const now = new Date();
//     const allInProgress = tasks.filter(t => t.status === 'inprogress');
//     const allCompleted = tasks.filter(t => t.status === 'completed');
//     const allRejected = tasks.filter(t => t.status === 'rejected');

//     switch (activeTab) {
//       case 'New':
//         return tasks.filter(t => t.status === 'pending');
//       case 'Due':
//         return allInProgress
//           .filter(t => {
//             const deadlineDate = t.deadline?.toDate?.() || t.deadline;
//             return deadlineDate && new Date(deadlineDate) >= now;
//           })
//           .sort((a, b) => {
//             const dateA = a.deadline?.toDate?.() || a.deadline;
//             const dateB = b.deadline?.toDate?.() || b.deadline;
//             return new Date(dateA).getTime() - new Date(dateB).getTime();
//           });
//       case 'All Tasks':
//         return [...allInProgress, ...allCompleted, ...allRejected]
//           .sort((a, b) => {
//             const dateA = a.createdAt?.toDate?.() || a.createdAt;
//             const dateB = b.createdAt?.toDate?.() || b.createdAt;
//             return new Date(dateA).getTime() - new Date(dateB).getTime();
//           });
//       default:
//         return tasks;
//     }
//   }, [tasks, activeTab]);
//   const handleAccept = async taskId => {
//     try {
//       await firestore().collection('tasks').doc(taskId).update({ status: 'inprogress', updatedAt: firestore.FieldValue.serverTimestamp() });
//     } catch (err) {
//       console.error(err);
//     }
//   };
//   const handleReject = taskId => {
//     setSelectedTaskId(taskId);
//     setRejectRemark('');
//     setRejectModalVisible(true);
//   };
//   const submitReject = async () => {
//     if (!selectedTaskId || rejectRemark.trim() === '') return;
//     const newRemarkEntry = {
//       text: rejectRemark,
//       createdAt: new Date(),
//       userId: currentUserId
//     };
//     try {
//       await firestore().collection('tasks').doc(selectedTaskId).update({
//         status: 'rejected',
//         remarks: firestore.FieldValue.arrayUnion(newRemarkEntry),
//         updatedAt: firestore.FieldValue.serverTimestamp()
//       });
//       setRejectModalVisible(false);
//       setSelectedTaskId(null);
//       setRejectRemark('');
//     } catch (err) {
//       console.error(err);
//     }
//   };
//   const formatDate = (date) => {
//     if (!date) return 'No Deadline Set';
//     try {
//       const dateOptions = { month: 'short', day: 'numeric' };
//       const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
//       return `${date.toLocaleDateString(undefined, dateOptions)} at ${date.toLocaleTimeString(undefined, timeOptions)}`;
//     } catch (e) {
//       return 'Invalid Date';
//     }
//   };
//   const renderTaskItem = ({ item }) => {
//     const deadlineTimestamp = item.deadline?.toDate ? item.deadline.toDate() : item.deadline;
//     const deadline = deadlineTimestamp ? new Date(deadlineTimestamp) : null;
//     const isOverdue = item.status === 'inprogress' && deadline && deadline < new Date();

//     const statusColors = {
//       pending: theme.colors.primary || '#3498db', 
//       inprogress: isOverdue ? '#e74c3c' : '#f1c40f', 
//       completed: '#2ecc71',
//       rejected: '#808080', 
//     };
//     const statusColor = statusColors[item.status] || theme.colors.primary;
//     const latestRemark = getLatestRemark(item.remarks);

//     return (
//       <View style={[styles.modernCardWrapper, { marginVertical: 8 * scale }]}>
//         <View style={[styles.statusStripe, { backgroundColor: statusColor }]} />
//         <View style={[styles.modernTaskCard, { backgroundColor: theme.colors.card, padding: 16 * scale, borderRadius: 12 * scale }]}>
//           <View style={styles.modernTaskHeader}>
//             <Text
//               style={[styles.modernTaskTitle, { color: theme.colors.text, fontSize: 18 * scale }]}
//               numberOfLines={1}
//             >
//               {item.title}
//             </Text>
//             <View
//               style={[
//                 styles.modernStatusBadge,
//                 {
//                   backgroundColor: statusColor + '20',
//                   borderColor: statusColor,
//                   paddingHorizontal: 10 * scale,
//                 }
//               ]}
//             >
//               <Text style={[styles.modernStatusText, { color: statusColor, fontSize: 12 * scale }]}>
//                 {isOverdue ? 'OVERDUE' : item.status.toUpperCase()}
//               </Text>
//             </View>
//           </View>
//           <Text
//             style={[styles.modernDescription, { color: theme.colors.text, fontSize: 14 * scale, marginTop: 4 * scale }]}
//             numberOfLines={2}
//           >
//             {item.description || 'No description provided.'}
//           </Text>
//           <View style={[styles.modernInfoRow, { marginTop: 12 * scale }]}>
//             <Ionicons name="calendar-outline" size={14 * scale} color={theme.colors.text} style={{ marginRight: 4 * scale }} />
//             <Text style={[styles.modernInfoText, { color: theme.colors.text, fontSize: 13 * scale, fontWeight: isOverdue ? 'bold' : '500' }]}>
//               Due: {formatDate(deadline)}
//             </Text>
//           </View>
//           {latestRemark && (
//             <View style={[styles.modernInfoRow, { marginTop: 8 * scale }]}>
//               <Ionicons name="chatbox-outline" size={14 * scale} color={statusColor} style={{ marginRight: 4 * scale }} />
//               <Text style={[styles.modernInfoText, { color: statusColor, fontSize: 13 * scale, fontWeight: '600' }]}>
//                 {`Remark: ${latestRemark.length > 30 ? latestRemark.substring(0, 27) + '...' : latestRemark}`}
//               </Text>
//             </View>
//           )}
//           {item.status === 'pending' && activeTab === 'New' && (
//             <View style={[styles.modernActionRow, { marginTop: 16 * scale, borderTopColor: theme.colors.border }]}>
//               <Pressable
//                 style={[styles.modernActionButton, { backgroundColor: '#2ecc71', marginHorizontal: 0, marginRight: 8 * scale }]}
//                 onPress={() => handleAccept(item.taskId)}
//               >
//                 <Ionicons name="checkmark-circle-outline" size={20 * scale} color="#fff" />
//                 <Text style={[styles.modernActionButtonText, { fontSize: 14 * scale }]}>Accept</Text>
//               </Pressable>
//               <Pressable
//                 style={[styles.modernActionButton, { backgroundColor: '#e74c3c', marginHorizontal: 0 }]}
//                 onPress={() => handleReject(item.taskId)}
//               >
//                 <Ionicons name="close-circle-outline" size={20 * scale} color="#fff" />
//                 <Text style={[styles.modernActionButtonText, { fontSize: 14 * scale }]}>Reject</Text>
//               </Pressable>
//             </View>
//           )}
//         </View>
//       </View>
//     );
//   };
//   const getEmptyMessage = () => {
//     if (activeTab === 'New') return 'No new tasks assigned by Admin';
//     if (activeTab === 'Due') return 'No tasks currently due.';
//     return 'No in-progress or completed tasks found.';
//   };

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
//       <View style={styles.tabContainer}>
//         {['New', 'Due', 'All Tasks'].map(tab => {
//           let iconName = 'alert-circle-outline';
//           if (tab === 'New') iconName = 'notifications-outline';
//           else if (tab === 'Due') iconName = 'time-outline';
//           else if (tab === 'All Tasks') iconName = 'list-outline';
//           return (
//             <Pressable
//               key={tab}
//               onPress={() => setActiveTab(tab)}
//               style={[
//                 styles.tabButtonResponsive,
//                 {
//                   backgroundColor: activeTab === tab ? theme.colors.primary : theme.colors.card,
//                   borderColor: activeTab === tab ? theme.colors.primary : theme.colors.border,
//                   borderWidth: activeTab === tab ? 0 : 1, // Highlight active tab more clearly
//                 }
//               ]}
//             >
//               <Ionicons name={iconName} size={20 * scale} color={activeTab === tab ? '#fff' : theme.colors.text} />
//               <Text
//                 style={{
//                   color: activeTab === tab ? '#fff' : theme.colors.text,
//                   fontWeight: 'bold',
//                   fontSize: 10 * scale,
//                   marginTop: 2 * scale,
//                 }}
//                 numberOfLines={1}
//               >
//                 {tab}
//               </Text>
//             </Pressable>
//           );
//         })}
//       </View>
//       {filteredTasks.length === 0 ? (
//         <View style={styles.emptyContainer}>
//           <Animated.View style={{ transform: [{ translateY: bounceValue }] }}>
//             <Ionicons
//               name={activeTab === 'New' ? 'notifications-off-outline' : activeTab === 'Due' ? 'time-outline' : 'list-outline'}
//               size={50 * scale}
//               color="#ccc"
//             />
//           </Animated.View>
//           <Text style={[styles.emptyText, { color: theme.colors.text, fontSize: 16 * scale }]}>{getEmptyMessage()}</Text>
//         </View>
//       ) : (
//         <FlatList
//           data={filteredTasks}
//           renderItem={renderTaskItem}
//           keyExtractor={item => item.taskId}
//           contentContainerStyle={{ paddingHorizontal: 16 * scale, paddingBottom: 16 * scale }}
//         />
//       )}
//       <Modal visible={rejectModalVisible} transparent animationType="slide" onRequestClose={() => setRejectModalVisible(false)}>
//         <View style={styles.modalBackground}>
//           <View style={[styles.modalContainer, { backgroundColor: theme.colors.card, padding: 20 * scale, borderRadius: 12 * scale }]}>
//             <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: 16 * scale }]}>Enter rejection remark</Text>
//             <TextInput
//               placeholder="Remark..."
//               placeholderTextColor="#888"
//               style={[
//                 styles.input,
//                 { color: theme.colors.text, borderColor: theme.colors.border, fontSize: 14 * scale, padding: 12 * scale, borderRadius: 8 * scale },
//               ]}
//               value={rejectRemark}
//               onChangeText={setRejectRemark}
//               multiline
//             />
//             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 * scale }}>
//               <Pressable style={[styles.modalButton, { backgroundColor: '#bdc3c7', flex: 1, marginRight: 6 * scale }]} onPress={() => setRejectModalVisible(false)}>
//                 <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Cancel</Text>
//               </Pressable>
//               <Pressable style={[styles.modalButton, { backgroundColor: '#e74c3c', flex: 1, marginLeft: 6 * scale }]} onPress={submitReject}>
//                 <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Submit</Text>
//               </Pressable>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// };
// const styles = StyleSheet.create({
//   tabContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12, paddingTop: 8, paddingHorizontal: 16 },
//   tabButtonResponsive: { flex: 1, paddingVertical: 10, marginHorizontal: 3, borderRadius: 12, elevation: 1, alignItems: 'center' },
//   emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
//   emptyText: { marginTop: 16, textAlign: 'center' },
//   modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
//   modalContainer: { width: '85%' },
//   modalTitle: { fontWeight: 'bold', marginBottom: 12 },
//   input: { borderWidth: 1 },
//   modalButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
//   modalButtonText: { color: '#fff', fontWeight: 'bold' },

//   // NEW MODERN TASK CARD STYLES
//   modernCardWrapper: {
//     flexDirection: 'row',
//     elevation: 6, // Increased elevation for better depth
//     shadowColor: '#000',
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 4 },
//     backgroundColor: 'transparent',
//   },
//   statusStripe: {
//     width: 6, // Vertical colored stripe
//     borderTopLeftRadius: 12,
//     borderBottomLeftRadius: 12,
//   },
//   modernTaskCard: {
//     flex: 1,
//     borderTopRightRadius: 12,
//     borderBottomRightRadius: 12,
//     borderTopLeftRadius: 0,
//     borderBottomLeftRadius: 0,
//     overflow: 'hidden',
//   },
//   modernTaskHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   modernTaskTitle: {
//     fontWeight: '800',
//     flex: 1,
//     marginRight: 10,
//   },
//   modernStatusBadge: {
//     borderRadius: 20,
//     borderWidth: 1,
//     alignSelf: 'flex-start',
//     paddingVertical: 2,
//   },
//   modernStatusText: {
//     fontWeight: '700',
//     textTransform: 'capitalize',
//   },
//   modernDescription: {
//     fontWeight: '400',
//   },
//   modernInfoRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   modernInfoText: {
//     fontWeight: '500',
//   },
//   modernActionRow: {
//     flexDirection: 'row',
//     justifyContent: 'flex-start',
//     paddingTop: 12,
//     borderTopWidth: 1,
//   },
//   modernActionButton: {
//     flexDirection: 'row',
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     elevation: 2,
//   },
//   modernActionButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//     marginLeft: 6,
//   },
// });

// export default UserTasksScreen;


















// import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Pressable,
//   StyleSheet,
//   Dimensions,
//   Modal,
//   TextInput,
//   Animated,
//   Easing,
//   Alert, // Added Alert for feedback
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import firestore from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';
// import { ThemeContext } from '../../context/ThemeContext';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// const useScreenWidth = () => {
//   const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
//   useEffect(() => {
//     const onChange = ({ window }) => setScreenWidth(window.width);
//     const sub = Dimensions.addEventListener('change', onChange);
//     const initialWidth = Dimensions.get('window').width;
//     setScreenWidth(initialWidth);
//     return () => sub.remove();
//   }, []);
//   return screenWidth;
// };

// const getLatestRemark = (remarks) => {
//   if (!remarks || remarks.length === 0) return null;
//   const validRemarks = remarks.filter(r => r && r.createdAt);
//   if (validRemarks.length === 0) return null;
//   const sortedRemarks = validRemarks.sort((a, b) => {
//     const timeA = a.createdAt
//       ? (a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime())
//       : 0;
//     const timeB = b.createdAt
//       ? (b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime())
//       : 0;
//     return timeB - timeA;
//   });
//   return sortedRemarks[0].text;
// };

// // --- NEW REQUEST MODAL LOGIC START ---

// // Function to submit the request
// const submitRequest = async (currentUserId, requestType, requestDescription, userRole) => {
//   if (requestDescription.trim() === '') {
//     Alert.alert('Missing Info', 'Please provide a description for your request.');
//     return false;
//   }

//   try {
//     await firestore().collection('requests').add({
//       requesterId: currentUserId,
//       requestType: requestType,
//       description: requestDescription.trim(),
//       status: 'new', // New status for admin review
//       role: userRole,
//       createdAt: firestore.FieldValue.serverTimestamp(),
//     });
//     Alert.alert('Success', 'Your request has been sent to the Admin/SuperAdmin.');
//     return true;
//   } catch (error) {
//     console.error("Error submitting request:", error);
//     Alert.alert('Error', 'Failed to send request. Please try again.');
//     return false;
//   }
// };

// // --- NEW REQUEST MODAL LOGIC END ---


// const UserTasksScreen = () => {
//   const { theme } = useContext(ThemeContext);
//   const screenWidth = useScreenWidth();
//   const scale = screenWidth / 375;
//   const [tasks, setTasks] = useState([]);
//   const [activeTab, setActiveTab] = useState('New');
//   const [rejectModalVisible, setRejectModalVisible] = useState(false);
//   const [requestModalVisible, setRequestModalVisible] = useState(false); // NEW STATE
//   const [requestType, setRequestType] = useState('Help'); // NEW STATE
//   const [requestDescription, setRequestDescription] = useState(''); // NEW STATE
//   const [rejectRemark, setRejectRemark] = useState('');
//   const [selectedTaskId, setSelectedTaskId] = useState(null);
//   const [userRole, setUserRole] = useState('user'); // State to store user role/info
//   const currentUserId = auth().currentUser?.uid;
//   const bounceValue = useRef(new Animated.Value(0)).current;

//   // Fetch user details for the request (e.g., role)
//   useEffect(() => {
//     if (!currentUserId) return;
//     const unsubscribe = firestore()
//       .collection('users')
//       .doc(currentUserId)
//       .onSnapshot(doc => {
//         if (doc.exists) {
//           setUserRole(doc.data().role || 'user');
//         }
//       });
//     return () => unsubscribe();
//   }, [currentUserId]);

//   useEffect(() => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(bounceValue, {
//           toValue: -10,
//           duration: 500,
//           easing: Easing.inOut(Easing.ease),
//           useNativeDriver: true,
//         }),
//         Animated.timing(bounceValue, {
//           toValue: 0,
//           duration: 500,
//           easing: Easing.inOut(Easing.ease),
//           useNativeDriver: true,
//         }),
//       ])
//     ).start();
//   }, [bounceValue]);

//   useEffect(() => {
//     if (!currentUserId) return;
//     const unsubscribe = firestore()
//       .collection('tasks')
//       .where('assignedTo', '==', currentUserId)
//       .onSnapshot(snapshot => {
//         const data = snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }));
//         setTasks(data);
//       });
//     return () => unsubscribe();
//   }, [currentUserId]);

//   const filteredTasks = useMemo(() => {
//     const now = new Date();
//     const allInProgress = tasks.filter(t => t.status === 'inprogress');
//     const allCompleted = tasks.filter(t => t.status === 'completed');
//     const allRejected = tasks.filter(t => t.status === 'rejected');

//     switch (activeTab) {
//       case 'New':
//         return tasks.filter(t => t.status === 'pending');
//       case 'Due':
//         return allInProgress
//           .filter(t => {
//             const deadlineDate = t.deadline?.toDate?.() || t.deadline;
//             return deadlineDate && new Date(deadlineDate) >= now;
//           })
//           .sort((a, b) => {
//             const dateA = a.deadline?.toDate?.() || a.deadline;
//             const dateB = b.deadline?.toDate?.() || b.deadline;
//             return new Date(dateA).getTime() - new Date(dateB).getTime();
//           });
//       case 'All Tasks':
//         return [...allInProgress, ...allCompleted, ...allRejected]
//           .sort((a, b) => {
//             const dateA = a.createdAt?.toDate?.() || a.createdAt;
//             const dateB = b.createdAt?.toDate?.() || b.createdAt;
//             return new Date(dateA).getTime() - new Date(dateB).getTime();
//           });
//       default:
//         return tasks;
//     }
//   }, [tasks, activeTab]);

//   const handleAccept = async taskId => {
//     try {
//       await firestore().collection('tasks').doc(taskId).update({ status: 'inprogress', updatedAt: firestore.FieldValue.serverTimestamp() });
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleReject = taskId => {
//     setSelectedTaskId(taskId);
//     setRejectRemark('');
//     setRejectModalVisible(true);
//   };

//   const submitReject = async () => {
//     if (!selectedTaskId || rejectRemark.trim() === '') return;
//     const newRemarkEntry = {
//       text: rejectRemark,
//       createdAt: new Date(),
//       userId: currentUserId
//     };
//     try {
//       await firestore().collection('tasks').doc(selectedTaskId).update({
//         status: 'rejected',
//         remarks: firestore.FieldValue.arrayUnion(newRemarkEntry),
//         updatedAt: firestore.FieldValue.serverTimestamp()
//       });
//       setRejectModalVisible(false);
//       setSelectedTaskId(null);
//       setRejectRemark('');
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // --- NEW REQUEST SUBMISSION HANDLER ---
//   const handleSubmitRequest = async () => {
//     if (currentUserId) {
//       const success = await submitRequest(currentUserId, requestType, requestDescription, userRole);
//       if (success) {
//         setRequestModalVisible(false);
//         setRequestDescription('');
//         setRequestType('Help'); // Reset
//       }
//     }
//   };
//   // --- END NEW REQUEST SUBMISSION HANDLER ---

//   const formatDate = (date) => {
//     if (!date) return 'No Deadline Set';
//     try {
//       const dateOptions = { month: 'short', day: 'numeric' };
//       const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
//       return `${date.toLocaleDateString(undefined, dateOptions)} at ${date.toLocaleTimeString(undefined, timeOptions)}`;
//     } catch (e) {
//       return 'Invalid Date';
//     }
//   };

//   const renderTaskItem = ({ item }) => {
//     const deadlineTimestamp = item.deadline?.toDate ? item.deadline.toDate() : item.deadline;
//     const deadline = deadlineTimestamp ? new Date(deadlineTimestamp) : null;
//     const isOverdue = item.status === 'inprogress' && deadline && deadline < new Date();

//     const statusColors = {
//       pending: theme.colors.primary || '#3498db',
//       inprogress: isOverdue ? '#e74c3c' : '#f1c40f',
//       completed: '#2ecc71',
//       rejected: '#808080',
//     };
//     const statusColor = statusColors[item.status] || theme.colors.primary;
//     const latestRemark = getLatestRemark(item.remarks);

//     return (
//       <View style={[styles.modernCardWrapper, { marginVertical: 8 * scale }]}>
//         <View style={[styles.statusStripe, { backgroundColor: statusColor }]} />
//         <View style={[styles.modernTaskCard, { backgroundColor: theme.colors.card, padding: 16 * scale, borderRadius: 12 * scale }]}>
//           <View style={styles.modernTaskHeader}>
//             <Text
//               style={[styles.modernTaskTitle, { color: theme.colors.text, fontSize: 18 * scale }]}
//               numberOfLines={1}
//             >
//               {item.title}
//             </Text>
//             <View
//               style={[
//                 styles.modernStatusBadge,
//                 {
//                   backgroundColor: statusColor + '20',
//                   borderColor: statusColor,
//                   paddingHorizontal: 10 * scale,
//                 }
//               ]}
//             >
//               <Text style={[styles.modernStatusText, { color: statusColor, fontSize: 12 * scale }]}>
//                 {isOverdue ? 'OVERDUE' : item.status.toUpperCase()}
//               </Text>
//             </View>
//           </View>
//           <Text
//             style={[styles.modernDescription, { color: theme.colors.text, fontSize: 14 * scale, marginTop: 4 * scale }]}
//             numberOfLines={2}
//           >
//             {item.description || 'No description provided.'}
//           </Text>
//           <View style={[styles.modernInfoRow, { marginTop: 12 * scale }]}>
//             <Ionicons name="calendar-outline" size={14 * scale} color={theme.colors.text} style={{ marginRight: 4 * scale }} />
//             <Text style={[styles.modernInfoText, { color: theme.colors.text, fontSize: 13 * scale, fontWeight: isOverdue ? 'bold' : '500' }]}>
//               Due: {formatDate(deadline)}
//             </Text>
//           </View>
//           {latestRemark && (
//             <View style={[styles.modernInfoRow, { marginTop: 8 * scale }]}>
//               <Ionicons name="chatbox-outline" size={14 * scale} color={statusColor} style={{ marginRight: 4 * scale }} />
//               <Text style={[styles.modernInfoText, { color: statusColor, fontSize: 13 * scale, fontWeight: '600' }]}>
//                 {`Remark: ${latestRemark.length > 30 ? latestRemark.substring(0, 27) + '...' : latestRemark}`}
//               </Text>
//             </View>
//           )}
//           {item.status === 'pending' && activeTab === 'New' && (
//             <View style={[styles.modernActionRow, { marginTop: 16 * scale, borderTopColor: theme.colors.border }]}>
//               <Pressable
//                 style={[styles.modernActionButton, { backgroundColor: '#2ecc71', marginHorizontal: 0, marginRight: 8 * scale }]}
//                 onPress={() => handleAccept(item.taskId)}
//               >
//                 <Ionicons name="checkmark-circle-outline" size={20 * scale} color="#fff" />
//                 <Text style={[styles.modernActionButtonText, { fontSize: 14 * scale }]}>Accept</Text>
//               </Pressable>
//               <Pressable
//                 style={[styles.modernActionButton, { backgroundColor: '#e74c3c', marginHorizontal: 0 }]}
//                 onPress={() => handleReject(item.taskId)}
//               >
//                 <Ionicons name="close-circle-outline" size={20 * scale} color="#fff" />
//                 <Text style={[styles.modernActionButtonText, { fontSize: 14 * scale }]}>Reject</Text>
//               </Pressable>
//             </View>
//           )}
//         </View>
//       </View>
//     );
//   };

//   const getEmptyMessage = () => {
//     if (activeTab === 'New') return 'No new tasks assigned by Admin';
//     if (activeTab === 'Due') return 'No tasks currently due.';
//     return 'No in-progress or completed tasks found.';
//   };

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
//       <View style={styles.tabContainer}>
//         {['New', 'Due', 'All Tasks'].map(tab => {
//           let iconName = 'alert-circle-outline';
//           if (tab === 'New') iconName = 'notifications-outline';
//           else if (tab === 'Due') iconName = 'time-outline';
//           else if (tab === 'All Tasks') iconName = 'list-outline';
//           return (
//             <Pressable
//               key={tab}
//               onPress={() => setActiveTab(tab)}
//               style={[
//                 styles.tabButtonResponsive,
//                 {
//                   backgroundColor: activeTab === tab ? theme.colors.primary : theme.colors.card,
//                   borderColor: activeTab === tab ? theme.colors.primary : theme.colors.border,
//                   borderWidth: activeTab === tab ? 0 : 1,
//                 }
//               ]}
//             >
//               <Ionicons name={iconName} size={20 * scale} color={activeTab === tab ? '#fff' : theme.colors.text} />
//               <Text
//                 style={{
//                   color: activeTab === tab ? '#fff' : theme.colors.text,
//                   fontWeight: 'bold',
//                   fontSize: 10 * scale,
//                   marginTop: 2 * scale,
//                 }}
//                 numberOfLines={1}
//               >
//                 {tab}
//               </Text>
//             </Pressable>
//           );
//         })}
//       </View>
//       {filteredTasks.length === 0 ? (
//         <View style={styles.emptyContainer}>
//           <Animated.View style={{ transform: [{ translateY: bounceValue }] }}>
//             <Ionicons
//               name={activeTab === 'New' ? 'notifications-off-outline' : activeTab === 'Due' ? 'time-outline' : 'list-outline'}
//               size={50 * scale}
//               color="#ccc"
//             />
//           </Animated.View>
//           <Text style={[styles.emptyText, { color: theme.colors.text, fontSize: 16 * scale }]}>{getEmptyMessage()}</Text>
//         </View>
//       ) : (
//         <FlatList
//           data={filteredTasks}
//           renderItem={renderTaskItem}
//           keyExtractor={item => item.taskId}
//           contentContainerStyle={{ paddingHorizontal: 16 * scale, paddingBottom: 16 * scale + 80 }} // Added padding for FAB
//         />
//       )}

//       {/* --- NEW FLOATING ACTION BUTTON (FAB) START --- */}
//       <Pressable
//         style={[styles.floatingButton, { backgroundColor: theme.colors.primary, bottom: 100, right: 20 * scale }]}
//         onPress={() => setRequestModalVisible(true)}
//       >
//         <Ionicons name="chatbubbles-outline" size={28 * scale} color="#fff" />
//       </Pressable>
//       {/* --- NEW FLOATING ACTION BUTTON (FAB) END --- */}


//       {/* Reject Modal (Existing) */}
//       <Modal visible={rejectModalVisible} transparent animationType="slide" onRequestClose={() => setRejectModalVisible(false)}>
//         <View style={styles.modalBackground}>
//           <View style={[styles.modalContainer, { backgroundColor: theme.colors.card, padding: 20 * scale, borderRadius: 12 * scale }]}>
//             <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: 16 * scale }]}>Enter rejection remark</Text>
//             <TextInput
//               placeholder="Remark..."
//               placeholderTextColor="#888"
//               style={[
//                 styles.input,
//                 { color: theme.colors.text, borderColor: theme.colors.border, fontSize: 14 * scale, padding: 12 * scale, borderRadius: 8 * scale },
//               ]}
//               value={rejectRemark}
//               onChangeText={setRejectRemark}
//               multiline
//             />
//             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 * scale }}>
//               <Pressable style={[styles.modalButton, { backgroundColor: '#bdc3c7', flex: 1, marginRight: 6 * scale }]} onPress={() => setRejectModalVisible(false)}>
//                 <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Cancel</Text>
//               </Pressable>
//               <Pressable style={[styles.modalButton, { backgroundColor: '#e74c3c', flex: 1, marginLeft: 6 * scale }]} onPress={submitReject}>
//                 <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Submit</Text>
//               </Pressable>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {/* --- NEW REQUEST MODAL START --- */}
//       <Modal visible={requestModalVisible} transparent animationType="slide" onRequestClose={() => setRequestModalVisible(false)}>
//         <View style={styles.modalBackground}>
//           <View style={[styles.modalContainer, { backgroundColor: theme.colors.card, padding: 20 * scale, borderRadius: 12 * scale }]}>
//             <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: 18 * scale, marginBottom: 12 * scale }]}>
//               Request Admin Help/Item
//             </Text>

//             {/* Request Type Selector */}
//             <Text style={[styles.label, { color: theme.colors.text, fontSize: 14 * scale }]}>Request Type</Text>
//             <View style={styles.requestTypeContainer}>
//               {['Help', 'Item', 'Other'].map(type => (
//                 <Pressable
//                   key={type}
//                   onPress={() => setRequestType(type)}
//                   style={[
//                     styles.typeButton,
//                     {
//                       backgroundColor: requestType === type ? theme.colors.primary : theme.colors.border,
//                       borderColor: theme.colors.border,
//                       marginHorizontal: 4,
//                     }
//                   ]}
//                 >
//                   <Text style={{ color: requestType === type ? '#fff' : theme.colors.text, fontWeight: '600' }}>{type}</Text>
//                 </Pressable>
//               ))}
//             </View>

//             {/* Description Input */}
//             <Text style={[styles.label, { color: theme.colors.text, fontSize: 14 * scale, marginTop: 12 * scale }]}>Description</Text>
//             <TextInput
//               placeholder={`Describe your request for ${requestType}...`}
//               placeholderTextColor="#888"
//               style={[
//                 styles.input,
//                 {
//                   color: theme.colors.text,
//                   borderColor: theme.colors.border,
//                   fontSize: 14 * scale,
//                   padding: 12 * scale,
//                   borderRadius: 8 * scale,
//                   height: 100 * scale,
//                   textAlignVertical: 'top'
//                 },
//               ]}
//               value={requestDescription}
//               onChangeText={setRequestDescription}
//               multiline
//             />
//             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 * scale }}>
//               <Pressable style={[styles.modalButton, { backgroundColor: '#bdc3c7', flex: 1, marginRight: 6 * scale }]} onPress={() => setRequestModalVisible(false)}>
//                 <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Cancel</Text>
//               </Pressable>
//               <Pressable style={[styles.modalButton, { backgroundColor: theme.colors.primary, flex: 1, marginLeft: 6 * scale }]} onPress={handleSubmitRequest}>
//                 <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Submit Request</Text>
//               </Pressable>
//             </View>
//           </View>
//         </View>
//       </Modal>
//       {/* --- NEW REQUEST MODAL END --- */}

//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   tabContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12, paddingTop: 8, paddingHorizontal: 16 },
//   tabButtonResponsive: { flex: 1, paddingVertical: 10, marginHorizontal: 3, borderRadius: 12, elevation: 1, alignItems: 'center' },
//   emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
//   emptyText: { marginTop: 16, textAlign: 'center' },
//   modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
//   modalContainer: { width: '85%' },
//   modalTitle: { fontWeight: 'bold', marginBottom: 12 },
//   input: { borderWidth: 1 },
//   modalButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
//   modalButtonText: { color: '#fff', fontWeight: 'bold' },

//   // NEW FAB STYLE
//   floatingButton: {
//     position: 'absolute',
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4.65,
//   },
//   // NEW MODAL STYLES
//   label: {
//     fontWeight: '600',
//     marginBottom: 6,
//   },
//   requestTypeContainer: {
//     flexDirection: 'row',
//     marginBottom: 10,
//     justifyContent: 'space-between',
//   },
//   typeButton: {
//     flex: 1,
//     paddingVertical: 10,
//     borderRadius: 8,
//     alignItems: 'center',
//     borderWidth: 1,
//   },

//   // EXISTING MODERN TASK CARD STYLES
//   modernCardWrapper: {
//     flexDirection: 'row',
//     elevation: 6,
//     shadowColor: '#000',
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 4 },
//     backgroundColor: 'transparent',
//   },
//   statusStripe: {
//     width: 6,
//     borderTopLeftRadius: 12,
//     borderBottomLeftRadius: 12,
//   },
//   modernTaskCard: {
//     flex: 1,
//     borderTopRightRadius: 12,
//     borderBottomRightRadius: 12,
//     borderTopLeftRadius: 0,
//     borderBottomLeftRadius: 0,
//     overflow: 'hidden',
//   },
//   modernTaskHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   modernTaskTitle: {
//     fontWeight: '800',
//     flex: 1,
//     marginRight: 10,
//   },
//   modernStatusBadge: {
//     borderRadius: 20,
//     borderWidth: 1,
//     alignSelf: 'flex-start',
//     paddingVertical: 2,
//   },
//   modernStatusText: {
//     fontWeight: '700',
//     textTransform: 'capitalize',
//   },
//   modernDescription: {
//     fontWeight: '400',
//   },
//   modernInfoRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   modernInfoText: {
//     fontWeight: '500',
//   },
//   modernActionRow: {
//     flexDirection: 'row',
//     justifyContent: 'flex-start',
//     paddingTop: 12,
//     borderTopWidth: 1,
//   },
//   modernActionButton: {
//     flexDirection: 'row',
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     elevation: 2,
//   },
//   modernActionButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//     marginLeft: 6,
//   },
// });

// export default UserTasksScreen;



















// import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Pressable,
//   StyleSheet,
//   Dimensions,
//   Modal,
//   TextInput,
//   Animated,
//   Easing,
//   Alert,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import firestore from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';
// import { ThemeContext } from '../../context/ThemeContext';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// const useScreenWidth = () => {
//   const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
//   useEffect(() => {
//     const onChange = ({ window }) => setScreenWidth(window.width);
//     const sub = Dimensions.addEventListener('change', onChange);
//     const initialWidth = Dimensions.get('window').width;
//     setScreenWidth(initialWidth);
//     return () => sub.remove();
//   }, []);
//   return screenWidth;
// };

// const getLatestRemark = (remarks) => {
//   if (!remarks || remarks.length === 0) return null;
//   const validRemarks = remarks.filter(r => r && r.createdAt);
//   if (validRemarks.length === 0) return null;
//   const sortedRemarks = validRemarks.sort((a, b) => {
//     const timeA = a.createdAt
//       ? (a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime())
//       : 0;
//     const timeB = b.createdAt
//       ? (b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime())
//       : 0;
//     return timeB - timeA;
//   });
//   return sortedRemarks[0].text;
// };

// // --- UPDATED SUBMIT REQUEST FUNCTION ---
// const submitRequest = async (currentUserId, requestType, requestDescription, userRole, recipientRole) => {
//   if (requestDescription.trim() === '') {
//     Alert.alert('Missing Info', 'Please provide a description for your request.');
//     return false;
//   }

//   try {
//     await firestore().collection('requests').add({
//       requesterId: currentUserId,
//       requestType: requestType,
//       description: requestDescription.trim(),
//       status: 'new',
//       requesterRole: userRole,
//       recipientRole: recipientRole, // Target role (Admin or SuperAdmin)
//       createdAt: firestore.FieldValue.serverTimestamp(),
//     });
//     Alert.alert('Success', `Your request has been sent to the ${recipientRole}.`);
//     return true;
//   } catch (error) {
//     console.error("Error submitting request:", error);
//     Alert.alert('Error', 'Failed to send request. Please try again.');
//     return false;
//   }
// };
// // --- END UPDATED SUBMIT REQUEST FUNCTION ---


// const UserTasksScreen = () => {
//   const { theme } = useContext(ThemeContext);
//   const screenWidth = useScreenWidth();
//   const scale = screenWidth / 375;
//   const [tasks, setTasks] = useState([]);
//   const [activeTab, setActiveTab] = useState('New');
//   const [rejectModalVisible, setRejectModalVisible] = useState(false);

//   // NEW STATES for Request
//   const [requestModalVisible, setRequestModalVisible] = useState(false);
//   const [requestType, setRequestType] = useState('Help');
//   const [requestDescription, setRequestDescription] = useState('');
//   const [recipientRole, setRecipientRole] = useState('admin'); // NEW: 'admin' or 'superadmin'

//   const [rejectRemark, setRejectRemark] = useState('');
//   const [selectedTaskId, setSelectedTaskId] = useState(null);
//   const [userRole, setUserRole] = useState('user');
//   const currentUserId = auth().currentUser?.uid;
//   const bounceValue = useRef(new Animated.Value(0)).current;

//   // Fetch user details
//   useEffect(() => {
//     if (!currentUserId) return;
//     const unsubscribe = firestore()
//       .collection('users')
//       .doc(currentUserId)
//       .onSnapshot(doc => {
//         if (doc.exists) {
//           setUserRole(doc.data().role || 'user');
//         }
//       });
//     return () => unsubscribe();
//   }, [currentUserId]);

//   // Bounce Animation (Existing)
//   useEffect(() => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(bounceValue, { toValue: -10, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
//         Animated.timing(bounceValue, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
//       ])
//     ).start();
//   }, [bounceValue]);

//   // Fetch Tasks (Existing)
//   useEffect(() => {
//     if (!currentUserId) return;
//     const unsubscribe = firestore()
//       .collection('tasks')
//       .where('assignedTo', '==', currentUserId)
//       .onSnapshot(snapshot => {
//         const data = snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }));
//         setTasks(data);
//       });
//     return () => unsubscribe();
//   }, [currentUserId]);

//   const filteredTasks = useMemo(() => {
//     // ... (Existing filteredTasks logic remains the same)
//     const now = new Date();
//     const allInProgress = tasks.filter(t => t.status === 'inprogress');
//     const allCompleted = tasks.filter(t => t.status === 'completed');
//     const allRejected = tasks.filter(t => t.status === 'rejected');

//     switch (activeTab) {
//       case 'New':
//         return tasks.filter(t => t.status === 'pending');
//       case 'Due':
//         return allInProgress
//           .filter(t => {
//             const deadlineDate = t.deadline?.toDate?.() || t.deadline;
//             return deadlineDate && new Date(deadlineDate) >= now;
//           })
//           .sort((a, b) => {
//             const dateA = a.deadline?.toDate?.() || a.deadline;
//             const dateB = b.deadline?.toDate?.() || b.deadline;
//             return new Date(dateA).getTime() - new Date(dateB).getTime();
//           });
//       case 'All Tasks':
//         return [...allInProgress, ...allCompleted, ...allRejected]
//           .sort((a, b) => {
//             const dateA = a.createdAt?.toDate?.() || a.createdAt;
//             const dateB = b.createdAt?.toDate?.() || b.createdAt;
//             return new Date(dateA).getTime() - new Date(dateB).getTime();
//           });
//       default:
//         return tasks;
//     }
//   }, [tasks, activeTab]);

//   const handleAccept = async taskId => {
//     // ... (Existing handleAccept logic remains the same)
//     try {
//       await firestore().collection('tasks').doc(taskId).update({ status: 'inprogress', updatedAt: firestore.FieldValue.serverTimestamp() });
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleReject = taskId => {
//     // ... (Existing handleReject logic remains the same)
//     setSelectedTaskId(taskId);
//     setRejectRemark('');
//     setRejectModalVisible(true);
//   };

//   const submitReject = async () => {
//     // ... (Existing submitReject logic remains the same)
//     if (!selectedTaskId || rejectRemark.trim() === '') return;
//     const newRemarkEntry = {
//       text: rejectRemark,
//       createdAt: new Date(),
//       userId: currentUserId
//     };
//     try {
//       await firestore().collection('tasks').doc(selectedTaskId).update({
//         status: 'rejected',
//         remarks: firestore.FieldValue.arrayUnion(newRemarkEntry),
//         updatedAt: firestore.FieldValue.serverTimestamp()
//       });
//       setRejectModalVisible(false);
//       setSelectedTaskId(null);
//       setRejectRemark('');
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // --- UPDATED REQUEST SUBMISSION HANDLER ---
//   const handleSubmitRequest = async () => {
//     if (!recipientRole) {
//       Alert.alert('Select Recipient', 'Please select whether you are requesting from Admin or SuperAdmin.');
//       return;
//     }
//     if (currentUserId) {
//       const success = await submitRequest(currentUserId, requestType, requestDescription, userRole, recipientRole);
//       if (success) {
//         setRequestModalVisible(false);
//         setRequestDescription('');
//         setRequestType('Help'); // Reset
//         setRecipientRole('admin'); // Reset
//       }
//     }
//   };
//   // --- END UPDATED REQUEST SUBMISSION HANDLER ---

//   const formatDate = (date) => {
//     // ... (Existing formatDate logic remains the same)
//     if (!date) return 'No Deadline Set';
//     try {
//       const dateOptions = { month: 'short', day: 'numeric' };
//       const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
//       return `${date.toLocaleDateString(undefined, dateOptions)} at ${date.toLocaleTimeString(undefined, timeOptions)}`;
//     } catch (e) {
//       return 'Invalid Date';
//     }
//   };

//   const renderTaskItem = ({ item }) => {
//     // ... (Existing renderTaskItem logic remains the same)
//     const deadlineTimestamp = item.deadline?.toDate ? item.deadline.toDate() : item.deadline;
//     const deadline = deadlineTimestamp ? new Date(deadlineTimestamp) : null;
//     const isOverdue = item.status === 'inprogress' && deadline && deadline < new Date();

//     const statusColors = {
//       pending: theme.colors.primary || '#3498db',
//       inprogress: isOverdue ? '#e74c3c' : '#f1c40f',
//       completed: '#2ecc71',
//       rejected: '#808080',
//     };
//     const statusColor = statusColors[item.status] || theme.colors.primary;
//     const latestRemark = getLatestRemark(item.remarks);

//     return (
//       <View style={[styles.modernCardWrapper, { marginVertical: 8 * scale }]}>
//         <View style={[styles.statusStripe, { backgroundColor: statusColor }]} />
//         <View style={[styles.modernTaskCard, { backgroundColor: theme.colors.card, padding: 16 * scale, borderRadius: 12 * scale }]}>
//           <View style={styles.modernTaskHeader}>
//             <Text
//               style={[styles.modernTaskTitle, { color: theme.colors.text, fontSize: 18 * scale }]}
//               numberOfLines={1}
//             >
//               {item.title}
//             </Text>
//             <View
//               style={[
//                 styles.modernStatusBadge,
//                 {
//                   backgroundColor: statusColor + '20',
//                   borderColor: statusColor,
//                   paddingHorizontal: 10 * scale,
//                 }
//               ]}
//             >
//               <Text style={[styles.modernStatusText, { color: statusColor, fontSize: 12 * scale }]}>
//                 {isOverdue ? 'OVERDUE' : item.status.toUpperCase()}
//               </Text>
//             </View>
//           </View>
//           <Text
//             style={[styles.modernDescription, { color: theme.colors.text, fontSize: 14 * scale, marginTop: 4 * scale }]}
//             numberOfLines={2}
//           >
//             {item.description || 'No description provided.'}
//           </Text>
//           <View style={[styles.modernInfoRow, { marginTop: 12 * scale }]}>
//             <Ionicons name="calendar-outline" size={14 * scale} color={theme.colors.text} style={{ marginRight: 4 * scale }} />
//             <Text style={[styles.modernInfoText, { color: theme.colors.text, fontSize: 13 * scale, fontWeight: isOverdue ? 'bold' : '500' }]}>
//               Due: {formatDate(deadline)}
//             </Text>
//           </View>
//           {latestRemark && (
//             <View style={[styles.modernInfoRow, { marginTop: 8 * scale }]}>
//               <Ionicons name="chatbox-outline" size={14 * scale} color={statusColor} style={{ marginRight: 4 * scale }} />
//               <Text style={[styles.modernInfoText, { color: statusColor, fontSize: 13 * scale, fontWeight: '600' }]}>
//                 {`Remark: ${latestRemark.length > 30 ? latestRemark.substring(0, 27) + '...' : latestRemark}`}
//               </Text>
//             </View>
//           )}
//           {item.status === 'pending' && activeTab === 'New' && (
//             <View style={[styles.modernActionRow, { marginTop: 16 * scale, borderTopColor: theme.colors.border }]}>
//               <Pressable
//                 style={[styles.modernActionButton, { backgroundColor: '#2ecc71', marginHorizontal: 0, marginRight: 8 * scale }]}
//                 onPress={() => handleAccept(item.taskId)}
//               >
//                 <Ionicons name="checkmark-circle-outline" size={20 * scale} color="#fff" />
//                 <Text style={[styles.modernActionButtonText, { fontSize: 14 * scale }]}>Accept</Text>
//               </Pressable>
//               <Pressable
//                 style={[styles.modernActionButton, { backgroundColor: '#e74c3c', marginHorizontal: 0 }]}
//                 onPress={() => handleReject(item.taskId)}
//               >
//                 <Ionicons name="close-circle-outline" size={20 * scale} color="#fff" />
//                 <Text style={[styles.modernActionButtonText, { fontSize: 14 * scale }]}>Reject</Text>
//               </Pressable>
//             </View>
//           )}
//         </View>
//       </View>
//     );
//   };

//   const getEmptyMessage = () => {
//     // ... (Existing getEmptyMessage logic remains the same)
//     if (activeTab === 'New') return 'No new tasks assigned by Admin';
//     if (activeTab === 'Due') return 'No tasks currently due.';
//     return 'No in-progress or completed tasks found.';
//   };

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
//       <View style={styles.tabContainer}>
//         {['New', 'Due', 'All Tasks'].map(tab => {
//           let iconName = 'alert-circle-outline';
//           if (tab === 'New') iconName = 'notifications-outline';
//           else if (tab === 'Due') iconName = 'time-outline';
//           else if (tab === 'All Tasks') iconName = 'list-outline';
//           return (
//             <Pressable
//               key={tab}
//               onPress={() => setActiveTab(tab)}
//               style={[
//                 styles.tabButtonResponsive,
//                 {
//                   backgroundColor: activeTab === tab ? theme.colors.primary : theme.colors.card,
//                   borderColor: activeTab === tab ? theme.colors.primary : theme.colors.border,
//                   borderWidth: activeTab === tab ? 0 : 1,
//                 }
//               ]}
//             >
//               <Ionicons name={iconName} size={20 * scale} color={activeTab === tab ? '#fff' : theme.colors.text} />
//               <Text
//                 style={{
//                   color: activeTab === tab ? '#fff' : theme.colors.text,
//                   fontWeight: 'bold',
//                   fontSize: 10 * scale,
//                   marginTop: 2 * scale,
//                 }}
//                 numberOfLines={1}
//               >
//                 {tab}
//               </Text>
//             </Pressable>
//           );
//         })}
//       </View>
//       {filteredTasks.length === 0 ? (
//         <View style={styles.emptyContainer}>
//           <Animated.View style={{ transform: [{ translateY: bounceValue }] }}>
//             <Ionicons
//               name={activeTab === 'New' ? 'notifications-off-outline' : activeTab === 'Due' ? 'time-outline' : 'list-outline'}
//               size={50 * scale}
//               color="#ccc"
//             />
//           </Animated.View>
//           <Text style={[styles.emptyText, { color: theme.colors.text, fontSize: 16 * scale }]}>{getEmptyMessage()}</Text>
//         </View>
//       ) : (
//         <FlatList
//           data={filteredTasks}
//           renderItem={renderTaskItem}
//           keyExtractor={item => item.taskId}
//           contentContainerStyle={{ paddingHorizontal: 16 * scale, paddingBottom: 16 * scale + 80 }}
//         />
//       )}

//       {/* Floating Action Button (FAB) */}
//       <Pressable
//         style={[styles.floatingButton, { backgroundColor: theme.colors.primary, bottom: 20 * scale, right: 20 * scale }]}
//         onPress={() => setRequestModalVisible(true)}
//       >
//         <Ionicons name="chatbubbles-outline" size={28 * scale} color="#fff" />
//       </Pressable>


//       {/* Reject Modal (Existing) */}
//       <Modal visible={rejectModalVisible} transparent animationType="slide" onRequestClose={() => setRejectModalVisible(false)}>
//         <View style={styles.modalBackground}>
//           <View style={[styles.modalContainer, { backgroundColor: theme.colors.card, padding: 20 * scale, borderRadius: 12 * scale }]}>
//             <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: 16 * scale }]}>Enter rejection remark</Text>
//             <TextInput
//               placeholder="Remark..."
//               placeholderTextColor="#888"
//               style={[
//                 styles.input,
//                 { color: theme.colors.text, borderColor: theme.colors.border, fontSize: 14 * scale, padding: 12 * scale, borderRadius: 8 * scale },
//               ]}
//               value={rejectRemark}
//               onChangeText={setRejectRemark}
//               multiline
//             />
//             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 * scale }}>
//               <Pressable style={[styles.modalButton, { backgroundColor: '#bdc3c7', flex: 1, marginRight: 6 * scale }]} onPress={() => setRejectModalVisible(false)}>
//                 <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Cancel</Text>
//               </Pressable>
//               <Pressable style={[styles.modalButton, { backgroundColor: '#e74c3c', flex: 1, marginLeft: 6 * scale }]} onPress={submitReject}>
//                 <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Submit</Text>
//               </Pressable>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {/* --- MODIFIED REQUEST MODAL START --- */}
//       <Modal visible={requestModalVisible} transparent animationType="slide" onRequestClose={() => setRequestModalVisible(false)}>
//         <View style={styles.modalBackground}>
//           <View style={[styles.modalContainer, { backgroundColor: theme.colors.card, padding: 20 * scale, borderRadius: 12 * scale }]}>
//             <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: 18 * scale, marginBottom: 12 * scale }]}>
//               Submit New Request 📝
//             </Text>

//             {/* Recipient Role Selector */}
//             <Text style={[styles.label, { color: theme.colors.text, fontSize: 14 * scale }]}>Request To</Text>
//             <View style={styles.requestTypeContainer}>
//               {/* Option 1: Request from Admin */}
//               <Pressable
//                 onPress={() => setRecipientRole('admin')}
//                 style={[
//                   styles.typeButton,
//                   {
//                     backgroundColor: recipientRole === 'admin' ? theme.colors.primary : theme.colors.border,
//                     borderColor: theme.colors.primary,
//                     marginRight: 8,
//                     borderWidth: 1,
//                   }
//                 ]}
//               >
//                 <Text style={{ color: recipientRole === 'admin' ? '#fff' : theme.colors.text, fontWeight: '600' }}>
//                   Admin
//                 </Text>
//               </Pressable>

//               {/* Option 2: Request from SuperAdmin */}
//               <Pressable
//                 onPress={() => setRecipientRole('superadmin')}
//                 style={[
//                   styles.typeButton,
//                   {
//                     backgroundColor: recipientRole === 'superadmin' ? theme.colors.primary : theme.colors.border,
//                     borderColor: theme.colors.primary,
//                     borderWidth: 1,
//                   }
//                 ]}
//               >
//                 <Text style={{ color: recipientRole === 'superadmin' ? '#fff' : theme.colors.text, fontWeight: '600' }}>
//                   SuperAdmin
//                 </Text>
//               </Pressable>
//             </View>

//             {/* Request Type Selector */}
//             <Text style={[styles.label, { color: theme.colors.text, fontSize: 14 * scale, marginTop: 12 * scale }]}>Request Type</Text>
//             <View style={styles.requestTypeContainer}>
//               {['Help', 'Item', 'Other'].map(type => (
//                 <Pressable
//                   key={type}
//                   onPress={() => setRequestType(type)}
//                   style={[
//                     styles.typeButton,
//                     {
//                       backgroundColor: requestType === type ? theme.colors.primary : theme.colors.border,
//                       borderColor: theme.colors.border,
//                       marginHorizontal: 4,
//                     }
//                   ]}
//                 >
//                   <Text style={{ color: requestType === type ? '#fff' : theme.colors.text, fontWeight: '600' }}>{type}</Text>
//                 </Pressable>
//               ))}
//             </View>

//             {/* Description Input */}
//             <Text style={[styles.label, { color: theme.colors.text, fontSize: 14 * scale, marginTop: 12 * scale }]}>Description</Text>
//             <TextInput
//               placeholder={`Describe your request for ${requestType}...`}
//               placeholderTextColor="#888"
//               style={[
//                 styles.input,
//                 {
//                   color: theme.colors.text,
//                   borderColor: theme.colors.border,
//                   fontSize: 14 * scale,
//                   padding: 12 * scale,
//                   borderRadius: 8 * scale,
//                   height: 100 * scale,
//                   textAlignVertical: 'top'
//                 },
//               ]}
//               value={requestDescription}
//               onChangeText={setRequestDescription}
//               multiline
//             />
//             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 * scale }}>
//               <Pressable style={[styles.modalButton, { backgroundColor: '#bdc3c7', flex: 1, marginRight: 6 * scale }]} onPress={() => setRequestModalVisible(false)}>
//                 <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Cancel</Text>
//               </Pressable>
//               <Pressable
//                 style={[
//                   styles.modalButton,
//                   {
//                     backgroundColor: recipientRole && requestDescription.trim() ? theme.colors.primary : '#ccc',
//                     flex: 1,
//                     marginLeft: 6 * scale
//                   }
//                 ]}
//                 onPress={handleSubmitRequest}
//                 disabled={!recipientRole || requestDescription.trim() === ''}
//               >
//                 <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Send to {recipientRole || '...'}</Text>
//               </Pressable>
//             </View>
//           </View>
//         </View>
//       </Modal>
//       {/* --- MODIFIED REQUEST MODAL END --- */}

//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   tabContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12, paddingTop: 8, paddingHorizontal: 16 },
//   tabButtonResponsive: { flex: 1, paddingVertical: 10, marginHorizontal: 3, borderRadius: 12, elevation: 1, alignItems: 'center' },
//   emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
//   emptyText: { marginTop: 16, textAlign: 'center' },
//   modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
//   modalContainer: { width: '85%' },
//   modalTitle: { fontWeight: 'bold', marginBottom: 12 },
//   input: { borderWidth: 1 },
//   modalButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
//   modalButtonText: { color: '#fff', fontWeight: 'bold' },

//   // NEW FAB STYLE
//   floatingButton: {
//     position: 'absolute',
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4.65,
//   },
//   // NEW MODAL STYLES
//   label: {
//     fontWeight: '600',
//     marginBottom: 6,
//   },
//   requestTypeContainer: {
//     flexDirection: 'row',
//     marginBottom: 10,
//     justifyContent: 'space-between',
//   },
//   typeButton: {
//     flex: 1,
//     paddingVertical: 10,
//     borderRadius: 8,
//     alignItems: 'center',
//     borderWidth: 1,
//   },

//   // EXISTING MODERN TASK CARD STYLES
//   modernCardWrapper: {
//     flexDirection: 'row',
//     elevation: 6,
//     shadowColor: '#000',
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 4 },
//     backgroundColor: 'transparent',
//   },
//   statusStripe: {
//     width: 6,
//     borderTopLeftRadius: 12,
//     borderBottomLeftRadius: 12,
//   },
//   modernTaskCard: {
//     flex: 1,
//     borderTopRightRadius: 12,
//     borderBottomRightRadius: 12,
//     borderTopLeftRadius: 0,
//     borderBottomLeftRadius: 0,
//     overflow: 'hidden',
//   },
//   modernTaskHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   modernTaskTitle: {
//     fontWeight: '800',
//     flex: 1,
//     marginRight: 10,
//   },
//   modernStatusBadge: {
//     borderRadius: 20,
//     borderWidth: 1,
//     alignSelf: 'flex-start',
//     paddingVertical: 2,
//   },
//   modernStatusText: {
//     fontWeight: '700',
//     textTransform: 'capitalize',
//   },
//   modernDescription: {
//     fontWeight: '400',
//   },
//   modernInfoRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   modernInfoText: {
//     fontWeight: '500',
//   },
//   modernActionRow: {
//     flexDirection: 'row',
//     justifyContent: 'flex-start',
//     paddingTop: 12,
//     borderTopWidth: 1,
//   },
//   modernActionButton: {
//     flexDirection: 'row',
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     elevation: 2,
//   },
//   modernActionButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//     marginLeft: 6,
//   },
// });

// export default UserTasksScreen;






























import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { ThemeContext } from '../../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

const useScreenWidth = () => {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  useEffect(() => {
    const onChange = ({ window }) => setScreenWidth(window.width);
    const sub = Dimensions.addEventListener('change', onChange);
    const initialWidth = Dimensions.get('window').width;
    setScreenWidth(initialWidth);
    return () => sub.remove();
  }, []);
  return screenWidth;
};

const getLatestRemark = (remarks) => {
  if (!remarks || remarks.length === 0) return null;
  const validRemarks = remarks.filter(r => r && r.createdAt);
  if (validRemarks.length === 0) return null;
  const sortedRemarks = validRemarks.sort((a, b) => {
    const timeA = a.createdAt
      ? (a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime())
      : 0;
    const timeB = b.createdAt
      ? (b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime())
      : 0;
    return timeB - timeA;
  });
  return sortedRemarks[0].text;
};

// --- UPDATED SUBMIT REQUEST FUNCTION WITH FIX ---
const submitRequest = async (currentUserId, requestType, requestDescription, userRole, recipientRole) => {
  if (requestDescription.trim() === '') {
    Alert.alert('Missing Info', 'Please provide a description for your request.');
    return false;
  }

  // Create a unique request ID for easy reference/management
  const requestId = firestore().collection('_').doc().id;

  const newRequestData = {
    requestId: requestId,
    requestType: requestType,
    description: requestDescription.trim(),
    status: 'new', // Status specifically for requests
    requesterRole: userRole,
    recipientRole: recipientRole, // Target role (Admin or SuperAdmin)
    // FIX APPLIED HERE: Using new Date() instead of firestore.FieldValue.serverTimestamp()
    // because this object is being added to an array via arrayUnion.
    createdAt: new Date(),
  };

  try {
    // Attempt to update the user's document by adding a new request object to the array
    await firestore()
      .collection('users')
      .doc(currentUserId)
      .update({
        userRequests: firestore.FieldValue.arrayUnion(newRequestData)
      });

    Alert.alert('Success 🎉', `Your request has been sent to the ${recipientRole} and is pending review.`);
    return true;
  } catch (error) {
    // Handle the case where the 'userRequests' field might not exist initially
    // The original error message "Error submittindg request: Error:[firestore/unknown] invalid data..." 
    // is likely caught here if the arrayUnion failed due to the FieldValue.serverTimestamp() misuse.
    if (error.code === 'firestore/not-found' || error.message.includes('No document to update') || error.message.includes('arrayUnion failed')) {
      try {
        // Use set with merge to safely create the 'userRequests' field as an array with the first request
        await firestore()
          .collection('users')
          .doc(currentUserId)
          .set({ userRequests: [newRequestData] }, { merge: true });
        Alert.alert('Success 🎉', `Your request has been sent to the ${recipientRole} and is pending review.`);
        return true;
      } catch (e) {
        console.error("Error setting initial request field:", e);
        Alert.alert('Error', 'Failed to initialize and send request. Please try again.');
        return false;
      }
    }
    console.error("Error submitting request:", error);
    Alert.alert('Error', 'Failed to send request. Please try again.');
    return false;
  }
};
// --- END UPDATED SUBMIT REQUEST FUNCTION ---


const UserTasksScreen = () => {
  const { theme } = useContext(ThemeContext);
  const screenWidth = useScreenWidth();
  const scale = screenWidth / 375;
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('New');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);

  // STATES for Request
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestType, setRequestType] = useState('Help');
  const [requestDescription, setRequestDescription] = useState('');
  const [recipientRole, setRecipientRole] = useState('admin'); // 'admin' or 'superadmin'

  const [rejectRemark, setRejectRemark] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const currentUserId = auth().currentUser?.uid;
  const bounceValue = useRef(new Animated.Value(0)).current;

  // Fetch user details and role
  useEffect(() => {
    if (!currentUserId) return;
    const unsubscribe = firestore()
      .collection('users')
      .doc(currentUserId)
      .onSnapshot(doc => {
        if (doc.exists) {
          setUserRole(doc.data().role || 'user');
        }
      });
    return () => unsubscribe();
  }, [currentUserId]);

  // Bounce Animation (Existing)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceValue, { toValue: -10, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bounceValue, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [bounceValue]);

  // Fetch Tasks (Existing, only assigned tasks)
  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = firestore()
      .collection('tasks')
      .where('assignedTo', '==', currentUserId)
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }));
        setTasks(data);
      });

    return () => unsubscribe();
  }, [currentUserId]);

  const filteredTasks = useMemo(() => {
    const now = new Date();
    const allInProgress = tasks.filter(t => t.status === 'inprogress');
    const allCompleted = tasks.filter(t => t.status === 'completed');
    const allRejected = tasks.filter(t => t.status === 'rejected');

    switch (activeTab) {
      case 'New':
        return tasks.filter(t => t.status === 'pending');
      case 'Due':
        return allInProgress
          .filter(t => {
            const deadlineDate = t.deadline?.toDate?.() || t.deadline;
            return deadlineDate && new Date(deadlineDate) >= now;
          })
          .sort((a, b) => {
            const dateA = a.deadline?.toDate?.() || a.deadline;
            const dateB = b.deadline?.toDate?.() || b.deadline;
            return new Date(dateA).getTime() - new Date(dateB).getTime();
          });
      case 'All Tasks':
        return [...allInProgress, ...allCompleted, ...allRejected]
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || a.createdAt;
            const dateB = b.createdAt?.toDate?.() || b.createdAt;
            return new Date(dateA).getTime() - new Date(dateB).getTime();
          });
      default:
        return tasks;
    }
  }, [tasks, activeTab]);

  const handleAccept = async taskId => {
    try {
      await firestore().collection('tasks').doc(taskId).update({ status: 'inprogress', updatedAt: firestore.FieldValue.serverTimestamp() });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = taskId => {
    setSelectedTaskId(taskId);
    setRejectRemark('');
    setRejectModalVisible(true);
  };

  const submitReject = async () => {
    if (!selectedTaskId || rejectRemark.trim() === '') return;
    const newRemarkEntry = {
      text: rejectRemark,
      // Note: This is an array element, but it's being added via arrayUnion 
      // which is a top-level field update, so 'new Date()' is still the safest practice here 
      // to avoid client-side errors with FieldValue.serverTimestamp().
      createdAt: new Date(),
      userId: currentUserId
    };
    try {
      await firestore().collection('tasks').doc(selectedTaskId).update({
        status: 'rejected',
        remarks: firestore.FieldValue.arrayUnion(newRemarkEntry),
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
      setRejectModalVisible(false);
      setSelectedTaskId(null);
      setRejectRemark('');
    } catch (err) {
      console.error(err);
    }
  };

  // --- REQUEST SUBMISSION HANDLER ---
  const handleSubmitRequest = async () => {
    if (!recipientRole) {
      Alert.alert('Select Recipient', 'Please select whether you are requesting from Admin or SuperAdmin.');
      return;
    }
    if (currentUserId) {
      const success = await submitRequest(currentUserId, requestType, requestDescription, userRole, recipientRole);
      if (success) {
        setRequestModalVisible(false);
        setRequestDescription('');
        setRequestType('Help'); // Reset
        setRecipientRole('admin'); // Reset
      }
    }
  };
  // --- END REQUEST SUBMISSION HANDLER ---

  const formatDate = (date) => {
    if (!date) return 'No Deadline Set';
    try {
      // Check if date is a Firestore Timestamp object with a .toDate() method
      const dateToUse = date.toDate ? date.toDate() : new Date(date);
      const dateOptions = { month: 'short', day: 'numeric' };
      const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
      return `${dateToUse.toLocaleDateString(undefined, dateOptions)} at ${dateToUse.toLocaleTimeString(undefined, timeOptions)}`;
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const renderTaskItem = ({ item }) => {
    const deadlineTimestamp = item.deadline?.toDate ? item.deadline.toDate() : item.deadline;
    const deadline = deadlineTimestamp ? new Date(deadlineTimestamp) : null;
    const isOverdue = item.status === 'inprogress' && deadline && deadline < new Date();

    const statusColors = {
      pending: theme.colors.primary || '#3498db',
      inprogress: isOverdue ? '#e74c3c' : '#f1c40f',
      completed: '#2ecc71',
      rejected: '#808080',
    };
    const statusColor = statusColors[item.status] || theme.colors.primary;
    const latestRemark = getLatestRemark(item.remarks);

    return (
      <View style={[styles.modernCardWrapper, { marginVertical: 8 * scale }]}>
        <View style={[styles.statusStripe, { backgroundColor: statusColor }]} />
        <View style={[styles.modernTaskCard, { backgroundColor: theme.colors.card, padding: 16 * scale, borderRadius: 12 * scale }]}>
          <View style={styles.modernTaskHeader}>
            <Text
              style={[styles.modernTaskTitle, { color: theme.colors.text, fontSize: 18 * scale }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <View
              style={[
                styles.modernStatusBadge,
                {
                  backgroundColor: statusColor + '20',
                  borderColor: statusColor,
                  paddingHorizontal: 10 * scale,
                }
              ]}
            >
              <Text style={[styles.modernStatusText, { color: statusColor, fontSize: 12 * scale }]}>
                {isOverdue ? 'OVERDUE' : item.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text
            style={[styles.modernDescription, { color: theme.colors.text, fontSize: 14 * scale, marginTop: 4 * scale }]}
            numberOfLines={2}
          >
            {item.description || 'No description provided.'}
          </Text>
          <View style={[styles.modernInfoRow, { marginTop: 12 * scale }]}>
            <Ionicons name="calendar-outline" size={14 * scale} color={theme.colors.text} style={{ marginRight: 4 * scale }} />
            <Text style={[styles.modernInfoText, { color: theme.colors.text, fontSize: 13 * scale, fontWeight: isOverdue ? 'bold' : '500' }]}>
              Due: {formatDate(deadline)}
            </Text>
          </View>
          {latestRemark && (
            <View style={[styles.modernInfoRow, { marginTop: 8 * scale }]}>
              <Ionicons name="chatbox-outline" size={14 * scale} color={statusColor} style={{ marginRight: 4 * scale }} />
              <Text style={[styles.modernInfoText, { color: statusColor, fontSize: 13 * scale, fontWeight: '600' }]}>
                {`Remark: ${latestRemark.length > 30 ? latestRemark.substring(0, 27) + '...' : latestRemark}`}
              </Text>
            </View>
          )}
          {item.status === 'pending' && activeTab === 'New' && (
            <View style={[styles.modernActionRow, { marginTop: 16 * scale, borderTopColor: theme.colors.border }]}>
              <Pressable
                style={[styles.modernActionButton, { backgroundColor: '#2ecc71', marginHorizontal: 0, marginRight: 8 * scale }]}
                onPress={() => handleAccept(item.taskId)}
              >
                <Ionicons name="checkmark-circle-outline" size={20 * scale} color="#fff" />
                <Text style={[styles.modernActionButtonText, { fontSize: 14 * scale }]}>Accept</Text>
              </Pressable>
              <Pressable
                style={[styles.modernActionButton, { backgroundColor: '#e74c3c', marginHorizontal: 0 }]}
                onPress={() => handleReject(item.taskId)}
              >
                <Ionicons name="close-circle-outline" size={20 * scale} color="#fff" />
                <Text style={[styles.modernActionButtonText, { fontSize: 14 * scale }]}>Reject</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  };

  const getEmptyMessage = () => {
    if (activeTab === 'New') return 'No new tasks assigned by Admin';
    if (activeTab === 'Due') return 'No tasks currently due.';
    return 'No in-progress or completed tasks found.';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
      <View style={styles.tabContainer}>
        {['New', 'Due', 'All Tasks'].map(tab => {
          let iconName = 'alert-circle-outline';
          if (tab === 'New') iconName = 'notifications-outline';
          else if (tab === 'Due') iconName = 'time-outline';
          else if (tab === 'All Tasks') iconName = 'list-outline';
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabButtonResponsive,
                {
                  backgroundColor: activeTab === tab ? theme.colors.primary : theme.colors.card,
                  borderColor: activeTab === tab ? theme.colors.primary : theme.colors.border,
                  borderWidth: activeTab === tab ? 0 : 1,
                }
              ]}
            >
              <Ionicons name={iconName} size={20 * scale} color={activeTab === tab ? '#fff' : theme.colors.text} />
              <Text
                style={{
                  color: activeTab === tab ? '#fff' : theme.colors.text,
                  fontWeight: 'bold',
                  fontSize: 10 * scale,
                  marginTop: 2 * scale,
                }}
                numberOfLines={1}
              >
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {filteredTasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Animated.View style={{ transform: [{ translateY: bounceValue }] }}>
            <Ionicons
              name={activeTab === 'New' ? 'notifications-off-outline' : activeTab === 'Due' ? 'time-outline' : 'list-outline'}
              size={50 * scale}
              color="#ccc"
            />
          </Animated.View>
          <Text style={[styles.emptyText, { color: theme.colors.text, fontSize: 16 * scale }]}>{getEmptyMessage()}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={renderTaskItem}
          keyExtractor={item => item.taskId}
          contentContainerStyle={{ paddingHorizontal: 16 * scale, paddingBottom: 16 * scale + 80 }}
        />
      )}

      {/* Floating Action Button (FAB) */}
      <Pressable
        style={[styles.floatingButton, { backgroundColor: theme.colors.primary, bottom: 100, right: 20 * scale }]}
        onPress={() => setRequestModalVisible(true)}
      >
        <Ionicons name="receipt-outline" size={28 * scale} color="#fff" />
      </Pressable>


      {/* Reject Modal (Existing) */}
      <Modal visible={rejectModalVisible} transparent animationType="slide" onRequestClose={() => setRejectModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.card, padding: 20 * scale, borderRadius: 12 * scale }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: 16 * scale }]}>Enter rejection remark</Text>
            <TextInput
              placeholder="Remark..."
              placeholderTextColor="#888"
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.border, fontSize: 14 * scale, padding: 12 * scale, borderRadius: 8 * scale },
              ]}
              value={rejectRemark}
              onChangeText={setRejectRemark}
              multiline
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 * scale }}>
              <Pressable style={[styles.modalButton, { backgroundColor: '#bdc3c7', flex: 1, marginRight: 6 * scale }]} onPress={() => setRejectModalVisible(false)}>
                <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, { backgroundColor: '#e74c3c', flex: 1, marginLeft: 6 * scale }]} onPress={submitReject}>
                <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Submit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- REQUEST MODAL START --- */}
      <Modal visible={requestModalVisible} transparent animationType="slide" onRequestClose={() => setRequestModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.card, padding: 20 * scale, borderRadius: 12 * scale }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: 18 * scale, marginBottom: 12 * scale }]}>
              Submit New Request 
            </Text>

            {/* Recipient Role Selector */}
            <Text style={[styles.label, { color: theme.colors.text, fontSize: 14 * scale }]}>Request To</Text>
            <View style={styles.requestTypeContainer}>
              {/* Option 1: Request from Admin */}
              <Pressable
                onPress={() => setRecipientRole('admin')}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: recipientRole === 'admin' ? theme.colors.primary : theme.colors.border,
                    borderColor: theme.colors.text,
                    marginRight: 8,
                    borderWidth: 1,
                  }
                ]}
              >
                <Text style={{ color: recipientRole === 'admin' ? '#fff' : theme.colors.text, fontWeight: '600' }}>
                  Admin
                </Text>
              </Pressable>

              {/* Option 2: Request from SuperAdmin */}
              <Pressable
                onPress={() => setRecipientRole('superadmin')}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: recipientRole === 'superadmin' ? theme.colors.primary : theme.colors.border,
                    borderColor: theme.colors.text,
                    borderWidth: 1,
                  }
                ]}
              >
                <Text style={{ color: recipientRole === 'superadmin' ? '#fff' : theme.colors.text, fontWeight: '600' }}>
                  SuperAdmin
                </Text>
              </Pressable>
            </View>

            {/* Request Type Selector */}
            <Text style={[styles.label, { color: theme.colors.text, fontSize: 14 * scale, marginTop: 12 * scale }]}>Request Category</Text>
            <View style={styles.requestTypeContainer}>
              {['Help', 'Item', 'Other'].map(type => (
                <Pressable
                  key={type}
                  onPress={() => setRequestType(type)}
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: requestType === type ? theme.colors.primary : theme.colors.border,
                      borderColor: theme.colors.text,
                      marginHorizontal: 4,
                    }
                  ]}
                >
                  <Text style={{ color: requestType === type ? '#fff' : theme.colors.text, fontWeight: '600' }}>{type}</Text>
                </Pressable>
              ))}
            </View>

            {/* Description Input */}
            <Text style={[styles.label, { color: theme.colors.text, fontSize: 14 * scale, marginTop: 12 * scale }]}>Description</Text>
            <TextInput
              placeholder={`Describe your request for ${requestType}...`}
              placeholderTextColor="#888"
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  fontSize: 14 * scale,
                  padding: 12 * scale,
                  borderRadius: 8 * scale,
                  height: 100 * scale,
                  textAlignVertical: 'top'
                },
              ]}
              value={requestDescription}
              onChangeText={setRequestDescription}
              multiline
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 * scale }}>
              <Pressable style={[styles.modalButton, { backgroundColor: '#bdc3c7', flex: 1, marginRight: 6 * scale }]} onPress={() => setRequestModalVisible(false)}>
                <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: recipientRole && requestDescription.trim() ? theme.colors.primary : '#ccc',
                    flex: 1,
                    marginLeft: 6 * scale
                  }
                ]}
                onPress={handleSubmitRequest}
                disabled={!recipientRole || requestDescription.trim() === ''}
              >
                <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Request</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      {/* --- END REQUEST MODAL --- */}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12, paddingTop: 8, paddingHorizontal: 16 },
  tabButtonResponsive: { flex: 1, paddingVertical: 10, marginHorizontal: 3, borderRadius: 12, elevation: 1, alignItems: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  emptyText: { marginTop: 16, textAlign: 'center' },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%' },
  modalTitle: { fontWeight: 'bold', marginBottom: 12, fontSize:20 },
  input: { borderWidth: 1 },
  modalButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: 'bold' },
  floatingButton: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
  },
  requestTypeContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  modernCardWrapper: {
    flexDirection: 'row',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    backgroundColor: 'transparent',
  },
  statusStripe: {
    width: 6,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  modernTaskCard: {
    flex: 1,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    overflow: 'hidden',
  },
  modernTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernTaskTitle: {
    fontWeight: '800',
    flex: 1,
    marginRight: 10,
  },
  modernStatusBadge: {
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  modernStatusText: {
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  modernDescription: {
    fontWeight: '400',
  },
  modernInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernInfoText: {
    fontWeight: '500',
  },
  modernActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  modernActionButton: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  modernActionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default UserTasksScreen;