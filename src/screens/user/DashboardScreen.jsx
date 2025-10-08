// import React, { useState, useEffect, useContext, useMemo } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Pressable,
//   StyleSheet,
//   Dimensions,
//   TextInput,
//   Modal,
//   ScrollView, // Changed to ScrollView for Summary + List
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

// // --- MAIN COMPONENT ---
// const DashboardScreen = () => {
//   const { theme } = useContext(ThemeContext);
//   const screenWidth = useScreenWidth();
//   const scale = screenWidth / 375;

//   const [tasks, setTasks] = useState([]);
//   const [updateModalVisible, setUpdateModalVisible] = useState(false);
//   const [selectedTask, setSelectedTask] = useState(null);
//   const [updateRemark, setUpdateRemark] = useState('');
//   const [updateStatus, setUpdateStatus] = useState('');

//   const currentUserId = auth().currentUser?.uid;

//   useEffect(() => {
//     if (!currentUserId) return;
//     const unsubscribe = firestore()
//       .collection('tasks')
//       .where('assignedTo', '==', currentUserId)
//       .onSnapshot(snapshot => {
//         // Filter out tasks with 'pending' status from the main dashboard list
//         const data = snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() })).filter(t => t.status !== 'pending');
//         setTasks(data);
//       });
//     return () => unsubscribe();
//   }, [currentUserId]);

//   // Count tasks by status (filtered)
//   const totalTasks = tasks.length;
//   const inProgressTasks = tasks.filter(t => t.status === 'inprogress').length;
//   const completedTasks = tasks.filter(t => t.status === 'completed').length;
//   const rejectedTasks = tasks.filter(t => t.status === 'rejected').length;

//   const handleOpenUpdate = (task) => {
//     setSelectedTask(task);
//     setUpdateRemark(task.remark || '');
//     setUpdateStatus(task.status);
//     setUpdateModalVisible(true);
//   };

//   const handleSubmitUpdate = async () => {
//     if (!selectedTask) return;
//     try {
//       await firestore().collection('tasks').doc(selectedTask.taskId).update({
//         status: updateStatus,
//         remark: updateRemark,
//         updatedAt: firestore.FieldValue.serverTimestamp(),
//       });
//       setUpdateModalVisible(false);
//       setSelectedTask(null);
//       setUpdateRemark('');
//       setUpdateStatus('');
//     } catch (err) {
//       console.error("Error submitting update:", err);
//     }
//   };

//   // Helper for deadline formatting
//   const formatDate = (deadline) => {
//     if (!deadline) return 'No Deadline Set';
//     try {
//       // Ensure we handle Firestore Timestamp objects correctly
//       const date = deadline.toDate ? deadline.toDate() : new Date(deadline);
//       const dateOptions = { month: 'short', day: 'numeric' };
//       return date.toLocaleDateString(undefined, dateOptions);
//     } catch (e) {
//       return 'Invalid Date';
//     }
//   };

//   // Render task card with modern design
//   const renderTaskItem = ({ item }) => {
//     const deadline = item.deadline ? (item.deadline.toDate ? item.deadline.toDate() : new Date(item.deadline)) : null;
//     const isOverdue = item.status === 'inprogress' && deadline && deadline < new Date();

//     const statusColors = {
//       inprogress: isOverdue ? '#e74c3c' : '#f1c40f', // Red if overdue, Yellow if active
//       completed: '#2ecc71',
//       rejected: '#808080',
//     };

//     const statusColor = statusColors[item.status] || '#555555';

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

//           {/* Description */}
//           <Text
//             style={[styles.modernDescription, { color: theme.colors.text, fontSize: 14 * scale, marginTop: 4 * scale }]}
//             numberOfLines={2}
//           >
//             {item.description || 'No description provided.'}
//           </Text>

//           {/* Deadline & Remark Info Row */}
//           <View style={[styles.modernInfoRow, { marginTop: 12 * scale }]}>
//             <Ionicons name="calendar-outline" size={14 * scale} color={theme.colors.text} style={{ marginRight: 4 * scale }} />
//             <Text style={[styles.modernInfoText, { color: theme.colors.text, fontSize: 13 * scale, fontWeight: isOverdue ? 'bold' : '500' }]}>
//               Due: {formatDate(item.deadline)}
//             </Text>
//             {item.remark && (
//               <Text style={[styles.modernInfoText, { color: statusColor, fontSize: 13 * scale, fontWeight: '600', marginLeft: 16 * scale }]}>
//                 <Ionicons name="chatbox-outline" size={14 * scale} color={statusColor} style={{ marginRight: 4 * scale }} />
//                 {` Remark: ${item.remark.length > 20 ? item.remark.substring(0, 17) + '...' : item.remark}`}
//               </Text>
//             )}
//           </View>

//           {/* Action Button */}
//           <Pressable
//             style={[styles.modernActionButton, { backgroundColor: theme.colors.primary, marginTop: 16 * scale, borderTopColor: theme.colors.border }]}
//             onPress={() => handleOpenUpdate(item)}
//           >
//             <Ionicons name="create-outline" size={20 * scale} color="#fff" />
//             <Text style={[styles.modernActionButtonText, { fontSize: 14 * scale }]}>Update Status/Remark</Text>
//           </Pressable>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
//       <FlatList
//         data={tasks}
//         renderItem={renderTaskItem}
//         keyExtractor={item => item.taskId}
//         contentContainerStyle={{ paddingHorizontal: 16 * scale, paddingBottom: 16 * scale }}
//         ListHeaderComponent={() => (
//           <>
//             {/* Summary Cards */}
//             <View style={[styles.summaryContainer, { marginTop: 16 * scale }]}>
//               {/* Note: Colors are hardcoded for visibility but can be theme-linked */}
//               <View style={[styles.summaryCard, { backgroundColor: '#3498db', padding: 12 * scale, borderRadius: 12 * scale }]}>
//                 <Ionicons name="list-outline" size={24 * scale} color="#fff" />
//                 <Text style={[styles.summaryText, { fontSize: 14 * scale }]}>Total: {totalTasks}</Text>
//               </View>
//               <View style={[styles.summaryCard, { backgroundColor: '#f1c40f', padding: 12 * scale, borderRadius: 12 * scale }]}>
//                 <Ionicons name="time-outline" size={24 * scale} color="#fff" />
//                 <Text style={[styles.summaryText, { fontSize: 14 * scale }]}>In Progress: {inProgressTasks}</Text>
//               </View>
//               <View style={[styles.summaryCard, { backgroundColor: '#2ecc71', padding: 12 * scale, borderRadius: 12 * scale }]}>
//                 <Ionicons name="checkmark-done-outline" size={24 * scale} color="#fff" />
//                 <Text style={[styles.summaryText, { fontSize: 14 * scale }]}>Completed: {completedTasks}</Text>
//               </View>
//               <View style={[styles.summaryCard, { backgroundColor: '#e74c3c', padding: 12 * scale, borderRadius: 12 * scale }]}>
//                 <Ionicons name="close-circle-outline" size={24 * scale} color="#fff" />
//                 <Text style={[styles.summaryText, { fontSize: 14 * scale }]}>Rejected: {rejectedTasks}</Text>
//               </View>
//             </View>
//             <Text style={[styles.listHeader, { color: theme.colors.text, fontSize: 18 * scale, marginTop: 16 * scale, marginBottom: 4 * scale }]}>
//               Task List
//             </Text>
//           </>
//         )}
//         ListEmptyComponent={() => (
//           <View style={styles.emptyContainer}>
//             <Ionicons name="document-text-outline" size={50 * scale} color="#ccc" />
//             <Text style={[styles.emptyText, { color: theme.colors.text, fontSize: 16 * scale }]}>No active tasks found.</Text>
//           </View>
//         )}
//       />

//       {/* Update Modal */}
//       <Modal visible={updateModalVisible} transparent animationType="slide" onRequestClose={() => setUpdateModalVisible(false)}>
//         <View style={styles.modalBackground}>
//           <View style={[styles.modalContainer, { backgroundColor: theme.colors.card, padding: 20 * scale, borderRadius: 12 * scale }]}>
//             <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: 18 * scale }]}>Update Task: {selectedTask?.title}</Text>
//             <TextInput
//               placeholder="Add/Update Remark..."
//               placeholderTextColor="#888"
//               style={[styles.input, { color: theme.colors.text, fontSize: 14 * scale, borderColor: theme.colors.border, padding: 12 * scale, borderRadius: 8 * scale }]}
//               value={updateRemark}
//               onChangeText={setUpdateRemark}
//               multiline
//             />
//             <Text style={{ color: theme.colors.text, marginTop: 12 * scale, fontSize: 14 * scale, fontWeight: '600' }}>Select New Status:</Text>
//             <View style={{ flexDirection: 'row', marginTop: 8 * scale, flexWrap: 'wrap' }}>
//               {['inprogress', 'completed', 'rejected'].map(status => (
//                 <Pressable
//                   key={status}
//                   onPress={() => setUpdateStatus(status)}
//                   style={{
//                     backgroundColor: updateStatus === status ? '#3498db' : theme.colors.card,
//                     borderColor: updateStatus === status ? '#3498db' : theme.colors.border,
//                     borderWidth: 1,
//                     paddingVertical: 8 * scale,
//                     paddingHorizontal: 12 * scale,
//                     borderRadius: 8 * scale,
//                     marginRight: 8 * scale,
//                     marginBottom: 8 * scale,
//                   }}
//                 >
//                   <Text style={{ color: updateStatus === status ? '#fff' : theme.colors.text, fontSize: 12 * scale, fontWeight: '600' }}>{status.toUpperCase()}</Text>
//                 </Pressable>
//               ))}
//             </View>
//             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 * scale }}>
//               <Pressable style={[styles.modalButton, { backgroundColor: '#bdc3c7', flex: 1, marginRight: 6 * scale }]} onPress={() => setUpdateModalVisible(false)}>
//                 <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Cancel</Text>
//               </Pressable>
//               <Pressable style={[styles.modalButton, { backgroundColor: '#3498db', flex: 1, marginLeft: 6 * scale }]} onPress={handleSubmitUpdate}>
//                 <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Submit Update</Text>
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
//   // Summary Styles (Adjusted for responsiveness)
//   summaryContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   summaryCard: {
//     flexBasis: '48%',
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     shadowOffset: { width: 0, height: 2 },
//   },
//   summaryText: {
//     color: '#fff',
//     fontWeight: '700',
//     marginLeft: 8,
//   },

//   // NEW MODERN TASK CARD STYLES (Copied/Adjusted from UserTasksScreen)
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
//     marginBottom: 4,
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
//     flexWrap: 'wrap',
//   },
//   modernInfoText: {
//     fontWeight: '500',
//   },
//   modernActionButton: {
//     flexDirection: 'row',
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     elevation: 2,
//   },
//   modernActionButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//     marginLeft: 6,
//   },

//   // Modal Styles
//   modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
//   modalContainer: { width: '85%' },
//   modalTitle: { fontWeight: 'bold', marginBottom: 12 },
//   input: { borderWidth: 1 },
//   modalButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
//   modalButtonText: { color: '#fff', fontWeight: 'bold' },

//   // Empty State
//   emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
//   emptyText: { marginTop: 16, textAlign: 'center' },
// });

// export default DashboardScreen;

















import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  TextInput,
  Modal,
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
    // 🛑 FIX: Safely determine the timestamp value for comparison
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

// Helper for deadline formatting
const formatDate = (deadline) => {
  // 🛑 FIX: Safely check if deadline is missing
  if (!deadline) return 'No Deadline Set';

  try {
    // Ensure we handle Firestore Timestamp objects correctly
    const date = deadline.toDate ? deadline.toDate() : new Date(deadline);
    const dateOptions = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, dateOptions);
  } catch (e) {
    return 'Invalid Date';
  }
};


// --- MAIN COMPONENT ---
const DashboardScreen = () => {
  const { theme } = useContext(ThemeContext);
  const screenWidth = useScreenWidth();
  const scale = screenWidth / 375;

  const [tasks, setTasks] = useState([]);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [updateRemark, setUpdateRemark] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');

  const currentUserId = auth().currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) return;
    const unsubscribe = firestore()
      .collection('tasks')
      .where('assignedTo', '==', currentUserId)
      .onSnapshot(snapshot => {
        // Filter out tasks with 'pending' status from the main dashboard list
        const data = snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() })).filter(t => t.status !== 'pending');
        setTasks(data);
      });
    return () => unsubscribe();
  }, [currentUserId]);

  // Count tasks by status (filtered)
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(t => t.status === 'inprogress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const rejectedTasks = tasks.filter(t => t.status === 'rejected').length;

  const handleOpenUpdate = (task) => {
    setSelectedTask(task);
    // Pre-fill the remark with the LATEST remark, or empty string
    setUpdateRemark(getLatestRemark(task.remarks) || '');
    setUpdateStatus(task.status);
    setUpdateModalVisible(true);
  };

  const handleSubmitUpdate = async () => {
    if (!selectedTask) return;

    // Only update if status changed OR a new remark was added
    if (updateRemark.trim() === '' && updateStatus === selectedTask.status) {
      setUpdateModalVisible(false);
      return;
    }

    // 1. Create the new remark object (if present)
    const newRemarkEntry = {
      text: updateRemark,
      // FIX for NativeFirebaseError: Use client Date object, which is valid for arrayUnion()
      createdAt: new Date(),
      userId: currentUserId
    };

    try {
      const updatePayload = {
        status: updateStatus,
        // Keep serverTimestamp for the document's last update time
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      // 2. Only add the remarks array update if a new remark text was provided
      if (updateRemark.trim() !== '') {
        // Use arrayUnion to safely append the new remark object
        updatePayload.remarks = firestore.FieldValue.arrayUnion(newRemarkEntry);
      }

      await firestore().collection('tasks').doc(selectedTask.taskId).update(updatePayload);

      // Reset states
      setUpdateModalVisible(false);
      setSelectedTask(null);
      setUpdateRemark('');
      setUpdateStatus('');
    } catch (err) {
      console.error("Error submitting update:", err);
    }
  };


  // Render task card with modern design
  const renderTaskItem = ({ item }) => {
    // 🛑 Pass the deadline value directly to the safe formatDate helper
    const deadline = item.deadline ? (item.deadline.toDate ? item.deadline.toDate() : new Date(item.deadline)) : null;
    const isOverdue = item.status === 'inprogress' && deadline && deadline < new Date();

    const statusColors = {
      inprogress: isOverdue ? '#e74c3c' : '#f1c40f', // Red if overdue, Yellow if active
      completed: '#2ecc71',
      rejected: '#808080',
    };

    const statusColor = statusColors[item.status] || '#555555';

    // Display the latest remark text
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

          {/* Description */}
          <Text
            style={[styles.modernDescription, { color: theme.colors.text, fontSize: 14 * scale, marginTop: 4 * scale }]}
            numberOfLines={2}
          >
            {item.description || 'No description provided.'}
          </Text>

          {/* Deadline & Remark Info Row */}
          <View style={[styles.modernInfoRow, { marginTop: 12 * scale }]}>
            <Ionicons name="calendar-outline" size={14 * scale} color={theme.colors.text} style={{ marginRight: 4 * scale }} />
            <Text style={[styles.modernInfoText, { color: theme.colors.text, fontSize: 13 * scale, fontWeight: isOverdue ? 'bold' : '500' }]}>
              Due: {formatDate(item.deadline)}
            </Text>
            {/* Display the latestRemark from the array */}
            {latestRemark && (
              <Text style={[styles.modernInfoText, { color: statusColor, fontSize: 13 * scale, fontWeight: '600', marginLeft: 16 * scale }]}>
                <Ionicons name="chatbox-outline" size={14 * scale} color={statusColor} style={{ marginRight: 4 * scale }} />
                {` Remark: ${latestRemark.length > 20 ? latestRemark.substring(0, 17) + '...' : latestRemark}`}
              </Text>
            )}
          </View>

          {/* Action Button */}
          <Pressable
            style={[styles.modernActionButton, { backgroundColor: theme.colors.primary, marginTop: 16 * scale, borderTopColor: theme.colors.border }]}
            onPress={() => handleOpenUpdate(item)}
          >
            <Ionicons name="reorder-four-outline" size={20 * scale} color="#fff" />
            <Text style={[styles.modernActionButtonText, { fontSize: 14 * scale }]}>Update</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <FlatList
        data={tasks}
        renderItem={renderTaskItem}
        keyExtractor={item => item.taskId}
        contentContainerStyle={{ paddingHorizontal: 16 * scale, paddingBottom: 16 * scale }}
        ListHeaderComponent={() => (
          <>
            {/* Summary Cards */}
            <View style={[styles.summaryContainer, { marginTop: 16 * scale }]}>
              {/* Note: Colors are hardcoded for visibility but can be theme-linked */}
              <View style={[styles.summaryCard, { backgroundColor: '#3498db', padding: 12 * scale, borderRadius: 12 * scale }]}>
                <Ionicons name="list-outline" size={24 * scale} color="#fff" />
                <Text style={[styles.summaryText, { fontSize: 14 * scale }]}>Total: {totalTasks}</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#f1c40f', padding: 12 * scale, borderRadius: 12 * scale }]}>
                <Ionicons name="time-outline" size={24 * scale} color="#fff" />
                <Text style={[styles.summaryText, { fontSize: 14 * scale }]}>In Progress: {inProgressTasks}</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#2ecc71', padding: 12 * scale, borderRadius: 12 * scale }]}>
                <Ionicons name="checkmark-done-outline" size={24 * scale} color="#fff" />
                <Text style={[styles.summaryText, { fontSize: 14 * scale }]}>Completed: {completedTasks}</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#e74c3c', padding: 12 * scale, borderRadius: 12 * scale }]}>
                <Ionicons name="close-circle-outline" size={24 * scale} color="#fff" />
                <Text style={[styles.summaryText, { fontSize: 14 * scale }]}>Rejected: {rejectedTasks}</Text>
              </View>
            </View>
            <Text style={[styles.listHeader, { color: theme.colors.text, fontSize: 18 * scale, marginTop: 16 * scale, marginBottom: 4 * scale }]}>
              Task List
            </Text>
          </>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={50 * scale} color="#ccc" />
            <Text style={[styles.emptyText, { color: theme.colors.text, fontSize: 16 * scale }]}>No active tasks found.</Text>
          </View>
        )}
      />

      {/* Update Modal */}
      <Modal visible={updateModalVisible} transparent animationType="slide" onRequestClose={() => setUpdateModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.card, padding: 20 * scale, borderRadius: 12 * scale }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: 18 * scale }]}>Update Task: {selectedTask?.title}</Text>
            <TextInput
              placeholder="Add/Update Remark..."
              placeholderTextColor="#888"
              style={[styles.input, { color: theme.colors.text, fontSize: 14 * scale, borderColor: theme.colors.border, padding: 12 * scale, borderRadius: 8 * scale }]}
              value={updateRemark}
              onChangeText={setUpdateRemark}
              multiline
            />
            <Text style={{ color: theme.colors.text, marginTop: 12 * scale, fontSize: 14 * scale, fontWeight: '600' }}>Select New Status:</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 * scale, flexWrap: 'wrap' }}>
              {['inprogress', 'completed', 'rejected'].map(status => (
                <Pressable
                  key={status}
                  onPress={() => setUpdateStatus(status)}
                  style={{
                    backgroundColor: updateStatus === status ? '#3498db' : theme.colors.card,
                    borderColor: updateStatus === status ? '#3498db' : theme.colors.border,
                    borderWidth: 1,
                    paddingVertical: 8 * scale,
                    paddingHorizontal: 12 * scale,
                    borderRadius: 8 * scale,
                    marginRight: 8 * scale,
                    marginBottom: 8 * scale,
                  }}
                >
                  <Text style={{ color: updateStatus === status ? '#fff' : theme.colors.text, fontSize: 12 * scale, fontWeight: '600' }}>{status.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 * scale }}>
              <Pressable style={[styles.modalButton, { backgroundColor: '#bdc3c7', flex: 1, marginRight: 6 * scale }]} onPress={() => setUpdateModalVisible(false)}>
                <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, { backgroundColor: '#3498db', flex: 1, marginLeft: 6 * scale }]} onPress={handleSubmitUpdate}>
                <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Submit Update</Text>
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
  // Summary Styles (Adjusted for responsiveness)
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flexBasis: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },

  // NEW MODERN TASK CARD STYLES (Copied/Adjusted from UserTasksScreen)
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
    marginBottom: 4,
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
    flexWrap: 'wrap',
  },
  modernInfoText: {
    fontWeight: '500',
  },
  modernActionButton: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  modernActionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },

  // Modal Styles
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%' },
  modalTitle: { fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1 },
  modalButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: 'bold' },

  // Empty State
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  emptyText: { marginTop: 16, textAlign: 'center' },
});

export default DashboardScreen;