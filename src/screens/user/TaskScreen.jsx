// import React, { useState, useEffect, useContext, useMemo } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Pressable,
//   StyleSheet,
//   Dimensions,
//   Modal,
//   TextInput,
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

//   // State hooks
//   const [tasks, setTasks] = useState([]);
//   const [activeTab, setActiveTab] = useState('New');
//   const [rejectModalVisible, setRejectModalVisible] = useState(false);
//   const [rejectRemark, setRejectRemark] = useState('');
//   const [selectedTaskId, setSelectedTaskId] = useState(null);

//   const currentUserId = auth().currentUser?.uid;

//   // Fetch tasks assigned to user
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
//     switch (activeTab) {
//       case 'New':
//         return tasks.filter(t => t.status === 'pending');
//       case 'Due':
//         return tasks
//           .filter(t => t.status === 'inprogress' && new Date(t.deadline?.toDate || t.deadline) >= now)
//           .sort((a, b) => new Date(a.deadline?.toDate || a.deadline) - new Date(b.deadline?.toDate || b.deadline));
//       case 'InProgress':
//         return tasks.filter(t => t.status === 'inprogress' || t.status === 'completed');
//       default:
//         return tasks;
//     }
//   }, [tasks, activeTab]);

//   // Accept task
//   const handleAccept = async (taskId) => {
//     try {
//       await firestore().collection('tasks').doc(taskId).update({ status: 'inprogress' });
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // Open reject modal
//   const handleReject = (taskId) => {
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
//       });
//       setRejectModalVisible(false);
//       setSelectedTaskId(null);
//       setRejectRemark('');
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // Render individual task
//   const renderTaskItem = ({ item }) => {
//     const deadline = item.deadline?.toDate?.() || new Date(item.deadline);
//     const statusColors = {
//       pending: '#f1c40f',
//       inprogress: '#3498db',
//       completed: '#2ecc71',
//       rejected: '#e74c3c',
//     };

//     return (
//       <View style={[styles.taskCard, { backgroundColor: theme.colors.card, padding: 16 * scale, borderRadius: 12 * scale }]}>
//         <View style={styles.taskHeader}>
//           <Text style={[styles.taskTitle, { color: theme.colors.text, fontSize: 16 * scale }]}>
//             {item.title}
//           </Text>
//           <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status], paddingHorizontal: 8 * scale, paddingVertical: 4 * scale }]}>
//             <Text style={[styles.statusText, { fontSize: 12 * scale }]}>{item.status.toUpperCase()}</Text>
//           </View>
//         </View>
//         <Text style={[styles.taskInfo, { color: theme.colors.text, fontSize: 14 * scale }]}>
//           Due: {deadline.toDateString()}
//         </Text>

//         {item.status === 'pending' && activeTab === 'New' && (
//           <View style={styles.actionRow}>
//             <Pressable
//               style={[styles.actionButton, { backgroundColor: '#2ecc71', padding: 10 * scale, borderRadius: 8 * scale }]}
//               onPress={() => handleAccept(item.taskId)}
//             >
//               <Ionicons name="checkmark-circle" size={20 * scale} color="#fff" />
//             </Pressable>
//             <Pressable
//               style={[styles.actionButton, { backgroundColor: '#e74c3c', padding: 10 * scale, borderRadius: 8 * scale }]}
//               onPress={() => handleReject(item.taskId)}
//             >
//               <Ionicons name="close-circle" size={20 * scale} color="#fff" />
//             </Pressable>
//           </View>
//         )}
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
//       {/* Tabs */}
//       <View style={styles.tabContainer}>
//         {['New', 'Due', 'InProgress'].map(tab => {
//           let iconName = tab === 'New' ? 'notifications-outline' : tab === 'Due' ? 'time-outline' : 'checkmark-done-outline';
//           return (
//             <Pressable
//               key={tab}
//               onPress={() => setActiveTab(tab)}
//               style={[
//                 styles.tabButtonResponsive,
//                 { backgroundColor: activeTab === tab ? theme.colors.primary : theme.colors.card },
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
//                 {tab === 'InProgress' ? 'In Progress' : tab}
//               </Text>
//             </Pressable>
//           );
//         })}
//       </View>

//       {/* Task List */}
//       {activeTab === 'New' && filteredTasks.length === 0 ? (
//         <View style={styles.emptyContainer}>
//           <Ionicons name="notifications-off-outline" size={50 * scale} color="#ccc" />
//           <Text style={[styles.emptyText, { color: theme.colors.text, fontSize: 16 * scale }]}>
//             No new tasks assigned by Admin
//           </Text>
//         </View>
//       ) : (
//         <FlatList
//           data={filteredTasks}
//           renderItem={renderTaskItem}
//           keyExtractor={item => item.taskId}
//           contentContainerStyle={{ paddingHorizontal: 16 * scale, paddingBottom: 16 * scale }}
//         />
//       )}

//       {/* Reject Modal */}
//       <Modal visible={rejectModalVisible} transparent animationType="slide" onRequestClose={() => setRejectModalVisible(false)}>
//         <View style={styles.modalBackground}>
//           <View style={[styles.modalContainer, { backgroundColor: theme.colors.card, padding: 20 * scale, borderRadius: 12 * scale }]}>
//             <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: 16 * scale }]}>
//               Enter rejection remark
//             </Text>
//             <TextInput
//               placeholder="Remark..."
//               placeholderTextColor="#888"
//               style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.text, fontSize: 14 * scale, padding: 12 * scale, borderRadius: 8 * scale }]}
//               value={rejectRemark}
//               onChangeText={setRejectRemark}
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
//   tabContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12, paddingTop: 8 },
//   tabButtonResponsive: { flex: 1, paddingVertical: 6, marginHorizontal: 3, borderRadius: 16, elevation: 1, alignItems: 'center' },
//   taskCard: { marginVertical: 8, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
//   taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//   taskTitle: { fontWeight: '700', flex: 1, marginRight: 8 },
//   taskInfo: { marginTop: 8 },
//   statusBadge: { borderRadius: 12 },
//   statusText: { color: '#fff', fontWeight: '700' },
//   actionRow: { flexDirection: 'row', marginTop: 12, justifyContent: 'flex-end' },
//   actionButton: { flexDirection: 'row', marginHorizontal: 4, justifyContent: 'center', alignItems: 'center' },
//   emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
//   emptyText: { marginTop: 16, textAlign: 'center' },
//   modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
//   modalContainer: {},
//   modalTitle: { fontWeight: 'bold', marginBottom: 12 },
//   input: { borderWidth: 1 },
//   modalButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
//   modalButtonText: { color: '#fff', fontWeight: 'bold' },
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

const useScreenWidth = () => {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  useEffect(() => {
    const onChange = ({ window }) => setScreenWidth(window.width);
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);
  return screenWidth;
};

const UserTasksScreen = () => {
  const { theme } = useContext(ThemeContext);
  const screenWidth = useScreenWidth();
  const scale = screenWidth / 375;

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
    switch (activeTab) {
      case 'New':
        return tasks.filter(t => t.status === 'pending');
      case 'Due':
        return tasks
          .filter(t => t.status === 'inprogress' && new Date(t.deadline?.toDate || t.deadline) >= now)
          .sort((a, b) => new Date(a.deadline?.toDate || a.deadline) - new Date(b.deadline?.toDate || b.deadline));
      case 'InProgress':
        return tasks.filter(t => t.status === 'inprogress' || t.status === 'completed');
      default:
        return tasks;
    }
  }, [tasks, activeTab]);

  // Accept task
  const handleAccept = async taskId => {
    try {
      await firestore().collection('tasks').doc(taskId).update({ status: 'inprogress' });
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
    if (!selectedTaskId) return;
    try {
      await firestore().collection('tasks').doc(selectedTaskId).update({
        status: 'rejected',
        rejectRemark: rejectRemark || 'No remark provided',
      });
      setRejectModalVisible(false);
      setSelectedTaskId(null);
      setRejectRemark('');
    } catch (err) {
      console.error(err);
    }
  };

  // Render task card
  const renderTaskItem = ({ item }) => {
    const deadline = item.deadline?.toDate?.() || new Date(item.deadline);
    const statusColors = {
      pending: '#f1c40f',
      inprogress: '#3498db',
      completed: '#2ecc71',
      rejected: '#e74c3c',
    };

    return (
      <View
        style={[
          styles.taskCard,
          { backgroundColor: theme.colors.card, padding: 16 * scale, borderRadius: 12 * scale },
        ]}
      >
        <View style={styles.taskHeader}>
          <Text style={[styles.taskTitle, { color: theme.colors.text, fontSize: 16 * scale }]}>
            {item.title}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusColors[item.status],
                paddingHorizontal: 8 * scale,
                paddingVertical: 4 * scale,
              },
            ]}
          >
            <Text style={[styles.statusText, { fontSize: 12 * scale }]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={[styles.taskInfo, { color: theme.colors.text, fontSize: 14 * scale }]}>
          Due: {deadline.toDateString()}
        </Text>

        {item.status === 'pending' && activeTab === 'New' && (
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: '#2ecc71', padding: 10 * scale, borderRadius: 8 * scale }]}
              onPress={() => handleAccept(item.taskId)}
            >
              <Ionicons name="checkmark-circle" size={20 * scale} color="#fff" />
            </Pressable>
            <Pressable
              style={[styles.actionButton, { backgroundColor: '#e74c3c', padding: 10 * scale, borderRadius: 8 * scale }]}
              onPress={() => handleReject(item.taskId)}
            >
              <Ionicons name="close-circle" size={20 * scale} color="#fff" />
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  // Empty state message
  const getEmptyMessage = () => {
    if (activeTab === 'New') return 'No new tasks assigned by Admin';
    if (activeTab === 'Due') return 'No Due Tasks';
    return 'No tasks in progress or completed';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['New', 'Due', 'InProgress'].map(tab => {
          const iconName = tab === 'New' ? 'notifications-outline' : tab === 'Due' ? 'time-outline' : 'checkmark-done-outline';
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabButtonResponsive,
                { backgroundColor: activeTab === tab ? theme.colors.primary : theme.colors.card },
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
                {tab === 'InProgress' ? 'In Progress' : tab}
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
              name={activeTab === 'New' ? 'notifications-off-outline' : activeTab === 'Due' ? 'time-outline' : 'checkmark-done-outline'}
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

      {/* Reject Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="slide" onRequestClose={() => setRejectModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.card, padding: 20 * scale, borderRadius: 12 * scale }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: 16 * scale }]}>Enter rejection remark</Text>
            <TextInput
              placeholder="Remark..."
              placeholderTextColor="#888"
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.text, fontSize: 14 * scale, padding: 12 * scale, borderRadius: 8 * scale },
              ]}
              value={rejectRemark}
              onChangeText={setRejectRemark}
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

const styles = StyleSheet.create({
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12, paddingTop: 8 },
  tabButtonResponsive: { flex: 1, paddingVertical: 6, marginHorizontal: 3, borderRadius: 16, elevation: 1, alignItems: 'center' },
  taskCard: { marginVertical: 8, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskTitle: { fontWeight: '700', flex: 1, marginRight: 8 },
  taskInfo: { marginTop: 8 },
  statusBadge: { borderRadius: 12 },
  statusText: { color: '#fff', fontWeight: '700' },
  actionRow: { flexDirection: 'row', marginTop: 12, justifyContent: 'flex-end' },
  actionButton: { flexDirection: 'row', marginHorizontal: 4, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  emptyText: { marginTop: 16, textAlign: 'center' },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: {},
  modalTitle: { fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1 },
  modalButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default UserTasksScreen;
