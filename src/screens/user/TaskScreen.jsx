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
  ScrollView,
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

const submitRequest = async (currentUserId, requestType, requestDescription, userRole, recipientRole) => {
  if (requestDescription.trim() === '') {
    Alert.alert('Missing Info', 'Please provide a description for your request.');
    return false;
  }

  const requestId = firestore().collection('_').doc().id;

  const newRequestData = {
    requestId: requestId,
    requestType: requestType,
    description: requestDescription.trim(),
    status: 'new',
    requesterRole: userRole,
    recipientRole: recipientRole,
    createdAt: new Date(),
  };

  try {
    await firestore()
      .collection('users')
      .doc(currentUserId)
      .update({
        userRequests: firestore.FieldValue.arrayUnion(newRequestData)
      });

    Alert.alert('Success 🎉', `Your request has been sent to the ${recipientRole} and is pending review.`);
    return true;
  } catch (error) {
    if (error.code === 'firestore/not-found' || error.message.includes('No document to update') || error.message.includes('arrayUnion failed')) {
      try {
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

const UserTasksScreen = () => {
  const { theme } = useContext(ThemeContext);
  const screenWidth = useScreenWidth();
  const scale = screenWidth / 375;
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('New');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);

  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestType, setRequestType] = useState('Help');
  const [requestDescription, setRequestDescription] = useState('');
  const [recipientRole, setRecipientRole] = useState('admin');

  const [userRequests, setUserRequests] = useState([]);

  const [rejectRemark, setRejectRemark] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const currentUserId = auth().currentUser?.uid;
  const bounceValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!currentUserId) return;
    const unsubscribe = firestore()
      .collection('users')
      .doc(currentUserId)
      .onSnapshot(doc => {
        if (doc.exists) {
          const userData = doc.data();
          setUserRole(userData.role || 'user');

          const requests = userData.userRequests || [];
          requests.sort((a, b) => {
            const timeA = a.createdAt?.toDate?.()?.getTime() || a.createdAt?.getTime() || 0;
            const timeB = b.createdAt?.toDate?.()?.getTime() || b.createdAt?.getTime() || 0;
            return timeB - timeA;
          });
          setUserRequests(requests);
        }
      });
    return () => unsubscribe();
  }, [currentUserId]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceValue, { toValue: -10, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bounceValue, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [bounceValue]);

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
        setRequestType('Help');
        setRecipientRole('admin');
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return 'No Deadline Set';
    try {
      const dateToUse = date.toDate ? date.toDate() : new Date(date);
      const dateOptions = { month: 'short', day: 'numeric' };
      const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
      return `${dateToUse.toLocaleDateString(undefined, dateOptions)} at ${dateToUse.toLocaleTimeString(undefined, timeOptions)}`;
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const renderUserRequestItem = ({ item }) => {
    const statusColors = {
      new: '#3498db',
      pending: '#3498db',
      completed: '#2ecc71',
      rejected: '#e74c3c',
      approved: '#2ecc71',
    };
    const statusKey = item.status.toLowerCase();
    const statusColor = statusColors[statusKey] || theme.colors.text;

    const dateToDisplay = item.createdAt?.toDate ? item.createdAt.toDate() : item.createdAt;
    const formattedDate = dateToDisplay ? new Date(dateToDisplay).toLocaleDateString() : 'N/A';

    return (
      <View style={styles.requestListItemModern}>
        <View style={[styles.modernStatusStripe, { backgroundColor: statusColor }]} />
        <View style={styles.requestItemContent}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={[styles.requestTypeModern, { color: theme.colors.text, fontSize: 15 * scale }]} numberOfLines={1}>
              <Text style={{ color: theme.colors.border, fontFamily: 'Poppins' }}>{item.requestType}</Text> from <Text style={{ color: theme.colors.primary }}>{item.recipientRole}</Text> 
            </Text>
            <View style={[styles.modernStatusBadge, {
              backgroundColor: statusColor + '20',
              borderColor: statusColor,
              paddingHorizontal: 8 * scale,
              paddingVertical: 2 * scale,
            }]}>
              <Text style={[styles.modernStatusText, { color: statusColor, fontSize: 11 * scale, textTransform: 'uppercase', fontWeight: 'bold' }]}>
                {item.status}
              </Text>
            </View>
          </View>

          <Text style={[styles.requestDescription, { color: theme.colors.text, fontSize: 13 * scale, marginTop: 4 * scale }]} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.requestFooter}>
            <Ionicons name="calendar-outline" size={12 * scale} color={theme.colors.text} style={{ marginRight: 4 * scale }} />
            <Text style={[styles.requestDate, { color: theme.colors.text, fontSize: 11 * scale }]}>
              Submitted on {formattedDate}
            </Text>
          </View>
        </View>
      </View>
    );
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
              <Text style={[styles.remarkText, { color: statusColor, fontSize: 13 * scale, fontWeight: '600' }]}>
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
                style={[
                  styles.tabButtonText,
                  {
                    color: activeTab === tab ? '#fff' : theme.colors.text,
                    fontSize: 10 * scale,
                  }
                ]}
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


      <Pressable
        style={[styles.floatingButton, { backgroundColor: theme.colors.primary, bottom: 100, right: 20 * scale }]}
        onPress={() => setRequestModalVisible(true)}
      >
        <Ionicons name="receipt-outline" size={28 * scale} color="#fff" />
      </Pressable>


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


      <Modal visible={requestModalVisible} transparent animationType="slide" onRequestClose={() => setRequestModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={[styles.modernModalContainer, { backgroundColor: theme.colors.card, maxHeight: '90%' }]}>

            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 * scale }}>


              <Text style={[styles.modernModalTitle, { color: theme.colors.text, fontSize: 20 * scale }]}>
                New Request
              </Text>
              <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />


              <Text style={[styles.label, { color: theme.colors.text, fontSize: 14 * scale }]}>Request To</Text>
              <View style={[styles.modernToggleGroup, { marginBottom: 15 * scale, borderColor: theme.colors.border }]}>

                <Pressable
                  onPress={() => setRecipientRole('admin')}
                  style={[
                    styles.modernToggleButton,
                    {
                      backgroundColor: recipientRole === 'admin' ? theme.colors.primary : theme.colors.background,
                      borderColor: recipientRole === 'admin' ? theme.colors.primary : 'transparent',
                      borderRightWidth: recipientRole === 'admin' ? 0 : StyleSheet.hairlineWidth,
                      borderRightColor: theme.colors.border,
                    }
                  ]}
                >

                  <Ionicons name="person-circle-outline" size={16 * scale} color={recipientRole === 'admin' ? '#fff' : theme.colors.text} />
                  <Text style={[styles.modernToggleButtonText, { color: recipientRole === 'admin' ? '#fff' : theme.colors.text }]}>
                    Admin
                  </Text>
                </Pressable>


                <Pressable
                  onPress={() => setRecipientRole('superadmin')}
                  style={[
                    styles.modernToggleButton,
                    {
                      backgroundColor: recipientRole === 'superadmin' ? theme.colors.primary : theme.colors.background,
                      borderColor: recipientRole === 'superadmin' ? theme.colors.primary : 'transparent',
                      borderLeftWidth: recipientRole === 'superadmin' ? 0 : StyleSheet.hairlineWidth,
                      borderLeftColor: theme.colors.border,
                    }
                  ]}
                >

                  <Ionicons name="shield-checkmark-outline" size={16 * scale} color={recipientRole === 'superadmin' ? '#fff' : theme.colors.text} />
                  <Text style={[styles.modernToggleButtonText, { color: recipientRole === 'superadmin' ? '#fff' : theme.colors.text }]}>
                    SuperAdmin
                  </Text>
                </Pressable>
              </View>


              <Text style={[styles.label, { color: theme.colors.text, fontSize: 14 * scale, marginTop: 12 * scale }]}>Category</Text>
              <View style={[styles.modernToggleGroup, { borderColor: theme.colors.border }]}>
                {['Help', 'Item', 'Other'].map((type, index) => (
                  <Pressable
                    key={type}
                    onPress={() => setRequestType(type)}
                    style={[
                      styles.modernCategoryButton,
                      {
                        backgroundColor: requestType === type ? theme.colors.primary + '10' : theme.colors.background,
                        borderColor: requestType === type ? theme.colors.primary : 'transparent',
                        borderRightWidth: index < 2 ? StyleSheet.hairlineWidth : 0,
                        borderRightColor: theme.colors.border,
                      }
                    ]}
                  >

                    <Text style={[styles.typeButtonText, { color: requestType === type ? theme.colors.primary : theme.colors.text, fontWeight: requestType === type ? 'bold' : '500' }]}>{type}</Text>
                  </Pressable>
                ))}
              </View>


              <Text style={[styles.label, { color: theme.colors.text, fontSize: 14 * scale, marginTop: 15 * scale }]}>Description</Text>
              <TextInput
                placeholder={`E.g., I need a new monitor due to screen burn-in...`}
                placeholderTextColor="#888"
                style={[
                  styles.modernInput,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.background,
                    fontSize: 14 * scale,
                    height: 100 * scale,
                  },
                ]}
                value={requestDescription}
                onChangeText={setRequestDescription}
                multiline
              />


              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 * scale }}>
                <Pressable style={[styles.modernActionModalButton, { backgroundColor: '#bdc3c7', flex: 1, marginRight: 6 * scale }]} onPress={() => setRequestModalVisible(false)}>
                  <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.modernActionModalButton,
                    {
                      backgroundColor: recipientRole && requestDescription.trim() ? theme.colors.primary : '#ccc',
                      flex: 1,
                      marginLeft: 6 * scale
                    }
                  ]}
                  onPress={handleSubmitRequest}
                  disabled={!recipientRole || requestDescription.trim() === ''}
                >
                  <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Submit Request</Text>
                </Pressable>
              </View>


              <Text style={[styles.modernModalTitle, { color: theme.colors.text, fontSize: 20 * scale, marginTop: 30 * scale, marginBottom: 10 * scale }]}>
                My Previous Requests
              </Text>

              <View style={[styles.historyCardContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                {userRequests.length > 0 ? (
                  <FlatList
                    data={userRequests}
                    renderItem={renderUserRequestItem}
                    keyExtractor={(item) => item.requestId}
                    scrollEnabled={false}
                    ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.colors.border + '50' }} />}
                  />
                ) : (
                  <Text style={[styles.requestEmptyText, { color: theme.colors.subtext, fontSize: 14 * scale, textAlign: 'center', marginVertical: 15 * scale }]}>
                    You haven't submitted any requests yet.
                  </Text>
                )}
              </View>

              <View style={{ height: 20 * scale }} />
            </ScrollView>
          </View>
        </View>
      </Modal>


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12, paddingTop: 8, paddingHorizontal: 16 },
  tabButtonResponsive: { flex: 1, paddingVertical: 10, marginHorizontal: 3, borderRadius: 12, elevation: 1, alignItems: 'center' },

  tabButtonText: {
    fontWeight: 'bold',
    fontFamily: 'Poppins',
    marginTop: 2,
  },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  emptyText: { marginTop: 16, textAlign: 'center', fontFamily: 'SecularOne' },

  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },

  modernModalContainer: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
  },
  modalContainer: { width: '85%' },

  modernModalTitle: {
    fontWeight: 'bold',
    fontFamily: 'SecularOne',
    marginBottom: 8,
  },
  separator: {
    height: 1,
    marginBottom: 15,
  },

  input: { borderWidth: 1, fontFamily: 'Kalam' },

  modernInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    textAlignVertical: 'top',
    fontFamily: 'Kalam',
  },

  modalButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: 'bold', fontFamily: 'Poppins' },

  modernActionModalButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },

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
    marginBottom: 8,
    fontFamily: 'Poppins',
  },

  modernToggleGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  modernToggleButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',

  },
  modernToggleButtonText: {
    fontWeight: '600',
    fontFamily: 'Poppins',
    marginLeft: 5,
  },
  modernCategoryButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonText: {
    fontWeight: '600',
    fontFamily: 'Poppins',
  },

  descriptionInput: {
    textAlignVertical: 'top',
    fontFamily: 'Kalam',
  },

  historyCardContainer: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  requestListItemModern: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: 'stretch',
  },
  modernStatusStripe: {
    width: 4,
    borderRadius: 2,
    marginRight: 10,
  },
  requestItemContent: {
    flex: 1,
  },
  requestTypeModern: {
    fontWeight: 'bold',
    textTransform: 'capitalize',
    fontFamily: 'Poppins',
  },
  requestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  requestDescription: {
    fontFamily: 'Poppins',
  },
  requestDate: {
    fontFamily: 'Poppins',
  },
  requestEmptyText: {
    fontFamily: 'Poppins',
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
    fontFamily: 'SecularOne',
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
    fontFamily: 'Poppins',
  },

  modernDescription: {
    fontWeight: '400',
    fontFamily: 'Poppins',
  },
  modernInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  modernInfoText: {
    fontWeight: '500',
    fontFamily: 'Poppins',
  },

  remarkText: {
    fontWeight: '600',
    fontFamily: 'Kalam',
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
    fontFamily: 'Poppins',
  },
});

export default UserTasksScreen;