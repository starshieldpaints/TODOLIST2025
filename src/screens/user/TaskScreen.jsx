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

// // Hook to get screen width and calculate scaling factor
// const useScreenWidth = () => {
//   const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
//   useEffect(() => {
//     const onChange = ({ window }) => setScreenWidth(window.width);
//     const sub = Dimensions.addEventListener('change', onChange);
//     return () => sub.remove();
//   }, []);
//   return screenWidth;
// };

// const UserTasksScreen = () => {
//   const { theme } = useContext(ThemeContext);
//   const screenWidth = useScreenWidth();
//   const scale = screenWidth / 375; // Base scale from iPhone 11 width

//   const [tasks, setTasks] = useState([]);
//   // Note: 'Due' and 'InProgress' tabs have been simplified to 'Tasks' for the default view
//   const [activeTab, setActiveTab] = useState('New');
//   const [rejectModalVisible, setRejectModalVisible] = useState(false);
//   const [rejectRemark, setRejectRemark] = useState('');
//   const [selectedTaskId, setSelectedTaskId] = useState(null);

//   const currentUserId = auth().currentUser?.uid;

//   // Animated bounce value for empty state icon
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

//   // Fetch tasks for current user
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

//   // Filter tasks based on active tab
//   const filteredTasks = useMemo(() => {
//     const now = new Date();
//     // Filter tasks based on status for the main list
//     const allInProgress = tasks.filter(t => t.status === 'inprogress');
//     const allCompleted = tasks.filter(t => t.status === 'completed');
//     const allRejected = tasks.filter(t => t.status === 'rejected');

//     switch (activeTab) {
//       case 'New':
//         return tasks.filter(t => t.status === 'pending');
//       case 'Due':
//         // Filter tasks that are in-progress and sort them by nearest deadline
//         return allInProgress
//           .filter(t => new Date(t.deadline?.toDate?.() || t.deadline) >= now)
//           .sort((a, b) => new Date(a.deadline?.toDate?.() || a.deadline) - new Date(b.deadline?.toDate?.() || b.deadline));
//       case 'All Tasks':
//         // Show all tasks except 'New' (pending)
//         return [...allInProgress, ...allCompleted, ...allRejected]
//           .sort((a, b) => (a.createdAt?.toDate?.() || a.createdAt) - (b.createdAt?.toDate?.() || b.createdAt));
//       default:
//         return tasks;
//     }
//   }, [tasks, activeTab]);

//   // Accept task
//   const handleAccept = async taskId => {
//     try {
//       await firestore().collection('tasks').doc(taskId).update({ status: 'inprogress', updatedAt: firestore.FieldValue.serverTimestamp() });
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // Reject task (open modal)
//   const handleReject = taskId => {
//     setSelectedTaskId(taskId);
//     setRejectRemark('');
//     setRejectModalVisible(true);
//   };

//   // Submit reject remark
//   const submitReject = async () => {
//     if (!selectedTaskId) return;
//     try {
//       await firestore().collection('tasks').doc(selectedTaskId).update({
//         status: 'rejected',
//         rejectRemark: rejectRemark || 'No remark provided',
//         updatedAt: firestore.FieldValue.serverTimestamp()
//       });
//       setRejectModalVisible(false);
//       setSelectedTaskId(null);
//       setRejectRemark('');
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // Helper for deadline formatting
//   const formatDate = (date) => {
//     try {
//       const dateOptions = { month: 'short', day: 'numeric' };
//       const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
//       return `${date.toLocaleDateString(undefined, dateOptions)} at ${date.toLocaleTimeString(undefined, timeOptions)}`;
//     } catch (e) {
//       return 'Invalid Date';
//     }
//   };

//   // Render task card with modern design
//   const renderTaskItem = ({ item }) => {
//     const deadline = item.deadline?.toDate?.() || new Date(item.deadline);
//     const isOverdue = item.status === 'inprogress' && deadline < new Date();

//     const statusColors = {
//       pending: theme.colors.primary || '#3498db', // Blue/Primary for New Tasks
//       inprogress: isOverdue ? '#e74c3c' : '#f1c40f', // Red if overdue, Yellow if active
//       completed: '#2ecc71',
//       rejected: '#808080', // Gray for rejected/closed
//     };

//     const statusColor = statusColors[item.status] || theme.colors.primary;

//     return (
//       <View style={[styles.modernCardWrapper, { marginVertical: 8 * scale }]}>
//         {/* Status Indicator Stripe */}
//         <View style={[styles.statusStripe, { backgroundColor: statusColor }]} />

//         <View style={[styles.modernTaskCard, { backgroundColor: theme.colors.card, padding: 16 * scale, borderRadius: 12 * scale }]}>

//           {/* Header: Title and Status Badge */}
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
//                   backgroundColor: statusColor + '20', // Lighter background tint
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

//           {/* Description/Details */}
//           <Text
//             style={[styles.modernDescription, { color: theme.colors.text, fontSize: 14 * scale, marginTop: 4 * scale }]}
//             numberOfLines={2}
//           >
//             {item.description || 'No description provided.'}
//           </Text>

//           {/* Deadline Info */}
//           <View style={[styles.modernInfoRow, { marginTop: 12 * scale }]}>
//             <Ionicons name="calendar-outline" size={14 * scale} color={theme.colors.text} style={{ marginRight: 4 * scale }} />
//             <Text style={[styles.modernInfoText, { color: theme.colors.text, fontSize: 13 * scale, fontWeight: isOverdue ? 'bold' : '500' }]}>
//               Due: {formatDate(deadline)}
//             </Text>
//           </View>

//           {/* Action Buttons (Only visible for 'New' tasks) */}
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

//   // Empty state message
//   const getEmptyMessage = () => {
//     if (activeTab === 'New') return 'No new tasks assigned by Admin';
//     if (activeTab === 'Due') return 'No tasks currently due.';
//     return 'No in-progress or completed tasks found.';
//   };

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
//       {/* Tabs */}
//       <View style={styles.tabContainer}>
//         {['New', 'Due', 'All Tasks'].map(tab => {
//           let iconName = 'alert-circle-outline'; // Default icon
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

//       {/* Task List or Empty State */}
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

//       {/* Reject Modal (Kept as is) */}
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

// // --- STYLESHEET ---
// const styles = StyleSheet.create({
//   // Existing Styles (Adjusted)
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
//     // Ensure shadow only appears on the card itself (not the stripe)
//     // If using separate wrapper/card for elevation, adjust elevation/shadow properties carefully
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
//     // Reduced vertical padding
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { ThemeContext } from '../../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Hook to get screen width and calculate scaling factor
const useScreenWidth = () => {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  useEffect(() => {
    const onChange = ({ window }) => setScreenWidth(window.width);
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);
  return screenWidth;
};

// --- HELPER FUNCTION: Get the latest remark from the array ---
const getLatestRemark = (remarks) => {
  if (!remarks || remarks.length === 0) return null;

  // Filter out any malformed remark entries that might be missing 'createdAt'
  const validRemarks = remarks.filter(r => r && r.createdAt);

  if (validRemarks.length === 0) return null;

  // Sort by createdAt timestamp (newest first)
  const sortedRemarks = validRemarks.sort((a, b) => {
    // Safely determine the timestamp value for comparison
    const timeA = a.createdAt
      ? (a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime())
      : 0;
    const timeB = b.createdAt
      ? (b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime())
      : 0;

    return timeB - timeA; // Descending order (newest first)
  });

  // Return the text of the latest remark
  return sortedRemarks[0].text;
};

// --- MAIN COMPONENT ---
const UserTasksScreen = () => {
  const { theme } = useContext(ThemeContext);
  const screenWidth = useScreenWidth();
  const scale = screenWidth / 375; // Base scale from iPhone 11 width

  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('New');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectRemark, setRejectRemark] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const currentUserId = auth().currentUser?.uid;

  // Animated bounce value for empty state icon
  const bounceValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceValue, {
          toValue: -10,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceValue, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bounceValue]);

  // Fetch tasks for current user
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

  // Filter tasks based on active tab
  const filteredTasks = useMemo(() => {
    const now = new Date();
    // Filter tasks based on status for the main list
    const allInProgress = tasks.filter(t => t.status === 'inprogress');
    const allCompleted = tasks.filter(t => t.status === 'completed');
    const allRejected = tasks.filter(t => t.status === 'rejected');

    switch (activeTab) {
      case 'New':
        return tasks.filter(t => t.status === 'pending');
      case 'Due':
        // Filter tasks that are in-progress and sort them by nearest deadline
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
        // Show all tasks except 'New' (pending)
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

  // Accept task
  const handleAccept = async taskId => {
    try {
      await firestore().collection('tasks').doc(taskId).update({ status: 'inprogress', updatedAt: firestore.FieldValue.serverTimestamp() });
    } catch (err) {
      console.error(err);
    }
  };

  // Reject task (open modal)
  const handleReject = taskId => {
    setSelectedTaskId(taskId);
    setRejectRemark('');
    setRejectModalVisible(true);
  };

  // Submit reject remark
  const submitReject = async () => {
    if (!selectedTaskId || rejectRemark.trim() === '') return;

    // 1. Create the new remark object
    const newRemarkEntry = {
      text: rejectRemark,
      // Use client Date object to avoid NativeFirebaseError
      createdAt: new Date(),
      userId: currentUserId
    };

    try {
      await firestore().collection('tasks').doc(selectedTaskId).update({
        status: 'rejected',
        // ✅ Push the new remark object into the 'remarks' array
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

  // Helper for deadline formatting
  const formatDate = (date) => {
    if (!date) return 'No Deadline Set';
    try {
      const dateOptions = { month: 'short', day: 'numeric' };
      const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
      return `${date.toLocaleDateString(undefined, dateOptions)} at ${date.toLocaleTimeString(undefined, timeOptions)}`;
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Render task card with modern design
  const renderTaskItem = ({ item }) => {
    // Safely extract deadline date
    const deadlineTimestamp = item.deadline?.toDate ? item.deadline.toDate() : item.deadline;
    const deadline = deadlineTimestamp ? new Date(deadlineTimestamp) : null;

    const isOverdue = item.status === 'inprogress' && deadline && deadline < new Date();

    const statusColors = {
      pending: theme.colors.primary || '#3498db', // Blue/Primary for New Tasks
      inprogress: isOverdue ? '#e74c3c' : '#f1c40f', // Red if overdue, Yellow if active
      completed: '#2ecc71',
      rejected: '#808080', // Gray for rejected/closed
    };

    const statusColor = statusColors[item.status] || theme.colors.primary;

    // ✅ Get the latest remark text
    const latestRemark = getLatestRemark(item.remarks);

    return (
      <View style={[styles.modernCardWrapper, { marginVertical: 8 * scale }]}>
        {/* Status Indicator Stripe */}
        <View style={[styles.statusStripe, { backgroundColor: statusColor }]} />

        <View style={[styles.modernTaskCard, { backgroundColor: theme.colors.card, padding: 16 * scale, borderRadius: 12 * scale }]}>

          {/* Header: Title and Status Badge */}
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
                  backgroundColor: statusColor + '20', // Lighter background tint
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

          {/* Description/Details */}
          <Text
            style={[styles.modernDescription, { color: theme.colors.text, fontSize: 14 * scale, marginTop: 4 * scale }]}
            numberOfLines={2}
          >
            {item.description || 'No description provided.'}
          </Text>

          {/* Deadline Info */}
          <View style={[styles.modernInfoRow, { marginTop: 12 * scale }]}>
            <Ionicons name="calendar-outline" size={14 * scale} color={theme.colors.text} style={{ marginRight: 4 * scale }} />
            <Text style={[styles.modernInfoText, { color: theme.colors.text, fontSize: 13 * scale, fontWeight: isOverdue ? 'bold' : '500' }]}>
              Due: {formatDate(deadline)}
            </Text>
          </View>

          {/* ✅ LATEST REMARK DISPLAY ROW */}
          {latestRemark && (
            <View style={[styles.modernInfoRow, { marginTop: 8 * scale }]}>
              <Ionicons name="chatbox-outline" size={14 * scale} color={statusColor} style={{ marginRight: 4 * scale }} />
              <Text style={[styles.modernInfoText, { color: statusColor, fontSize: 13 * scale, fontWeight: '600' }]}>
                {`Remark: ${latestRemark.length > 30 ? latestRemark.substring(0, 27) + '...' : latestRemark}`}
              </Text>
            </View>
          )}

          {/* Action Buttons (Only visible for 'New' tasks) */}
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

  // Empty state message
  const getEmptyMessage = () => {
    if (activeTab === 'New') return 'No new tasks assigned by Admin';
    if (activeTab === 'Due') return 'No tasks currently due.';
    return 'No in-progress or completed tasks found.';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['New', 'Due', 'All Tasks'].map(tab => {
          let iconName = 'alert-circle-outline'; // Default icon
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
                  borderWidth: activeTab === tab ? 0 : 1, // Highlight active tab more clearly
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

      {/* Task List or Empty State */}
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
          contentContainerStyle={{ paddingHorizontal: 16 * scale, paddingBottom: 16 * scale }}
        />
      )}

      {/* Reject Modal (Kept as is) */}
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
    </SafeAreaView>
  );
};

// --- STYLESHEET ---
const styles = StyleSheet.create({
  // Existing Styles (Adjusted)
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12, paddingTop: 8, paddingHorizontal: 16 },
  tabButtonResponsive: { flex: 1, paddingVertical: 10, marginHorizontal: 3, borderRadius: 12, elevation: 1, alignItems: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  emptyText: { marginTop: 16, textAlign: 'center' },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%' },
  modalTitle: { fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1 },
  modalButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: 'bold' },

  // NEW MODERN TASK CARD STYLES
  modernCardWrapper: {
    flexDirection: 'row',
    elevation: 6, // Increased elevation for better depth
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    backgroundColor: 'transparent',
  },
  statusStripe: {
    width: 6, // Vertical colored stripe
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
    // Ensure shadow only appears on the card itself (not the stripe)
    // If using separate wrapper/card for elevation, adjust elevation/shadow properties carefully
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
    // Reduced vertical padding
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