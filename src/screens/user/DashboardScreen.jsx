import React, { useState, useEffect, useContext, useMemo } from 'react';
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

const useScreenWidth = () => {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  useEffect(() => {
    const onChange = ({ window }) => setScreenWidth(window.width);
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);
  return screenWidth;
};

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
        const data = snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }));
        setTasks(data);
      });
    return () => unsubscribe();
  }, [currentUserId]);

  // Count tasks by status
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(t => t.status === 'inprogress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const rejectedTasks = tasks.filter(t => t.status === 'rejected').length;

  const handleOpenUpdate = (task) => {
    setSelectedTask(task);
    setUpdateRemark(task.remark || '');
    setUpdateStatus(task.status);
    setUpdateModalVisible(true);
  };

  const handleSubmitUpdate = async () => {
    if (!selectedTask) return;
    try {
      await firestore().collection('tasks').doc(selectedTask.taskId).update({
        status: updateStatus,
        remark: updateRemark,
      });
      setUpdateModalVisible(false);
      setSelectedTask(null);
      setUpdateRemark('');
      setUpdateStatus('');
    } catch (err) {
      console.error(err);
    }
  };

  const renderTaskItem = ({ item }) => {
    const statusColors = {
      pending: '#f1c40f',
      inprogress: '#3498db',
      completed: '#2ecc71',
      rejected: '#e74c3c',
    };

    return (
      <View style={[styles.taskCard, { backgroundColor: theme.colors.card, padding: 16 * scale, borderRadius: 12 * scale }]}>
        <View style={styles.taskHeader}>
          <Text style={[styles.taskTitle, { color: theme.colors.text, fontSize: 16 * scale }]}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] }]}>
            <Text style={[styles.statusText, { fontSize: 12 * scale }]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        {item.remark ? (
          <Text style={[styles.taskRemark, { color: theme.colors.text, fontSize: 14 * scale }]}>Remark: {item.remark}</Text>
        ) : null}
        <Pressable style={[styles.updateButton, { padding: 10 * scale, borderRadius: 8 * scale }]} onPress={() => handleOpenUpdate(item)}>
          <Ionicons name="create-outline" size={20 * scale} color="#fff" />
          <Text style={[styles.updateButtonText, { fontSize: 14 * scale }]}>Update</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: '#3498db', padding: 12 * scale, borderRadius: 12 * scale }]}>
          <Ionicons name="list-outline" size={24 * scale} color="#fff" />
          <Text style={[styles.summaryText, { fontSize: 16 * scale }]}>Total Tasks: {totalTasks}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#3498db', padding: 12 * scale, borderRadius: 12 * scale }]}>
          <Ionicons name="time-outline" size={24 * scale} color="#fff" />
          <Text style={[styles.summaryText, { fontSize: 16 * scale }]}>In Progress: {inProgressTasks}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#2ecc71', padding: 12 * scale, borderRadius: 12 * scale }]}>
          <Ionicons name="checkmark-done-outline" size={24 * scale} color="#fff" />
          <Text style={[styles.summaryText, { fontSize: 16 * scale }]}>Completed: {completedTasks}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#e74c3c', padding: 12 * scale, borderRadius: 12 * scale }]}>
          <Ionicons name="close-circle-outline" size={24 * scale} color="#fff" />
          <Text style={[styles.summaryText, { fontSize: 16 * scale }]}>Rejected: {rejectedTasks}</Text>
        </View>
      </View>

      {/* Task List */}
      <FlatList
        data={tasks}
        renderItem={renderTaskItem}
        keyExtractor={item => item.taskId}
        contentContainerStyle={{ paddingHorizontal: 16 * scale, paddingBottom: 16 * scale, paddingTop: 12 * scale }}
      />

      {/* Update Modal */}
      <Modal visible={updateModalVisible} transparent animationType="slide" onRequestClose={() => setUpdateModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.card, padding: 20 * scale, borderRadius: 12 * scale }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: 16 * scale }]}>Update Task</Text>
            <TextInput
              placeholder="Remark..."
              placeholderTextColor="#888"
              style={[styles.input, { color: theme.colors.text, fontSize: 14 * scale, borderColor: theme.colors.text, padding: 12 * scale, borderRadius: 8 * scale }]}
              value={updateRemark}
              onChangeText={setUpdateRemark}
            />
            <Text style={{ color: theme.colors.text, marginTop: 12 * scale, fontSize: 14 * scale }}>Status:</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 * scale }}>
              {['pending', 'inprogress', 'completed', 'rejected'].map(status => (
                <Pressable
                  key={status}
                  onPress={() => setUpdateStatus(status)}
                  style={{
                    backgroundColor: updateStatus === status ? theme.colors.primary : theme.colors.card,
                    paddingVertical: 8 * scale,
                    paddingHorizontal: 12 * scale,
                    borderRadius: 8 * scale,
                    marginRight: 8 * scale,
                  }}
                >
                  <Text style={{ color: updateStatus === status ? '#fff' : theme.colors.text, fontSize: 12 * scale }}>{status}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 * scale }}>
              <Pressable style={[styles.modalButton, { backgroundColor: '#bdc3c7', flex: 1, marginRight: 6 * scale }]} onPress={() => setUpdateModalVisible(false)}>
                <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, { backgroundColor: '#3498db', flex: 1, marginLeft: 6 * scale }]} onPress={handleSubmitUpdate}>
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
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  summaryCard: {
    flexBasis: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  summaryText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
  taskCard: {
    marginVertical: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskTitle: { fontWeight: '700', flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { color: '#fff', fontWeight: '700' },
  taskRemark: { marginTop: 6 },
  updateButton: { flexDirection: 'row', marginTop: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#3498db' },
  updateButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 6 },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: {},
  modalTitle: { fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1 },
  modalButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default DashboardScreen;
