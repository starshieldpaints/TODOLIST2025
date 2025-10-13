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
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { ThemeContext } from '../../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker'; // ⭐️ Import DatePicker

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

// --- CONSTANTS ---
const WORK_LOCATIONS = [
  { label: 'Home', value: 'wfh', icon: 'home-outline' },
  { label: 'Office', value: 'office', icon: 'business-outline' },
  { label: 'Field', value: 'field', icon: 'navigate-outline' },
];

const MAX_PHOTOS = 10; // Define a max photo limit

const getLatestRemark = (remarks) => {
  if (!remarks || remarks.length === 0) return null;
  const validRemarks = remarks.filter(r => r && r.createdAt);
  if (validRemarks.length === 0) return null;

  const sortedRemarks = validRemarks.sort((a, b) => {
    const timeA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()) : 0;
    const timeB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()) : 0;
    return timeB - timeA;
  });
  return sortedRemarks[0].text;
};

const formatDate = (deadline) => {
  if (!deadline) return 'No Deadline Set';
  try {
    const date = deadline.toDate ? deadline.toDate() : new Date(deadline);
    const dateOptions = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, dateOptions);
  } catch (e) {
    return 'Invalid Date';
  }
};

// ⭐️ NEW: Reminder formatting function
const formatReminderTime = (reminder) => {
  if (!reminder) return 'Set Reminder';
  try {
    const date = reminder.toDate ? reminder.toDate() : new Date(reminder);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return 'Set Reminder';
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
  const [updateWorkLocation, setUpdateWorkLocation] = useState('wfh');
  const [fieldImageUris, setFieldImageUris] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const currentUserId = auth().currentUser?.uid;

  // ⭐️ NEW Reminder States ⭐️
  const [reminderDate, setReminderDate] = useState(null); // The selected Date object for the task
  const [showReminderPicker, setShowReminderPicker] = useState(false);


  useEffect(() => {
    if (!currentUserId) return;

    // Task Listener 
    const taskUnsubscribe = firestore()
      .collection('tasks')
      .where('assignedTo', '==', currentUserId)
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() })).filter(t => t.status !== 'pending');
        setTasks(data);
      });

    return () => taskUnsubscribe();
  }, [currentUserId]);

  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(t => t.status === 'inprogress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const rejectedTasks = tasks.filter(t => t.status === 'rejected').length;

  const handleOpenUpdate = (task) => {
    setSelectedTask(task);
    setUpdateRemark(getLatestRemark(task.remarks) || '');
    setUpdateStatus(task.status);
    setUpdateWorkLocation(task.workLocation || 'wfh');

    // Load existing reminder 
    const existingReminder = task.reminder?.toDate ? task.reminder.toDate() : null;
    setReminderDate(existingReminder);

    // Load existing image URLs for display
    const initialUris = task.workLocation === 'field' && task.fieldProof && Array.isArray(task.fieldProof)
      ? task.fieldProof.map(proof => proof.url)
      : [];

    setFieldImageUris(initialUris);

    setUpdateModalVisible(true);
  };


  // --- Image Picker Functions ---
  const selectPhoto = () => {
    // ... (Image picker functions remain unchanged) ...
    if (fieldImageUris.length >= MAX_PHOTOS) {
      Alert.alert("Limit Reached", `You can upload a maximum of ${MAX_PHOTOS} photos.`);
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.7,
      saveToPhotos: false,
    };

    Alert.alert(
      "Upload Field Photo",
      "Choose a method to upload your field picture.",
      [
        { text: "Take Photo", onPress: () => launchCamera(options, handleImageResponse) },
        { text: "Choose from Gallery", onPress: () => launchImageLibrary(options, handleImageResponse) },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleImageResponse = (response) => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
    } else if (response.errorCode) {
      console.error('ImagePicker Error: ', response.errorMessage);
      Alert.alert("Error", `Failed to get image: ${response.errorMessage}`);
    } else if (response.assets && response.assets.length > 0) {
      const uri = response.assets[0].uri;
      // Append the new URI to the existing array
      setFieldImageUris(prevUris => {
        const newUris = [...prevUris, uri];
        // Ensure we don't exceed the limit
        return newUris.slice(0, MAX_PHOTOS);
      });
    }
  };

  // Function to remove an image from the local selection array
  const removeImage = (uriToRemove) => {
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove", style: "destructive", onPress: () => {
            setFieldImageUris(prevUris => prevUris.filter(uri => uri !== uriToRemove));
          }
        },
      ]
    );
  };

  // --- Image Upload to Firebase Storage ---
  const uploadImages = async (uris, taskId, userId) => {
    // ... (Image upload function remains unchanged) ...
    if (!uris || uris.length === 0) return [];

    const uploadPromises = uris.map(async (uri, index) => {
      // Only upload new local files (URIs that don't start with http/s)
      if (uri.startsWith('http')) {
        return null;
      }

      // Path: tasks/{taskId}/field_proof/{userId}_{timestamp}_{index}.jpg
      const timestamp = new Date().getTime();
      const filename = `tasks/${taskId}/field_proof/${userId}_${timestamp}_${index}.jpg`;
      const storageRef = storage().ref(filename);

      await storageRef.putFile(uri);
      const downloadURL = await storageRef.getDownloadURL();

      return {
        url: downloadURL,
        path: filename,
        uploadedAt: new Date(),
      };
    });

    // Wait for all uploads to complete and filter out nulls (for existing URLs)
    const uploadedInfos = await Promise.all(uploadPromises);
    return uploadedInfos.filter(info => info !== null);
  };

  // ⭐️ Submission Handler - MODIFIED ⭐️
  const handleSubmitUpdate = async () => {
    if (!selectedTask || !currentUserId || isUploading) return;

    // 1. Separation and Validation remain the same...

    const localNewUris = fieldImageUris.filter(uri => !uri.startsWith('http'));
    const existingProofs = selectedTask.fieldProof && Array.isArray(selectedTask.fieldProof)
      ? selectedTask.fieldProof.filter(proof => fieldImageUris.includes(proof.url))
      : [];

    if (updateWorkLocation === 'field' && fieldImageUris.length === 0) {
      Alert.alert("Field Photo Required", "Please upload at least one photo to verify your location for 'Field' work status.");
      return;
    }

    setIsUploading(true);
    let uploadedProofs = [];

    try {
      // 2. Image Upload
      if (updateWorkLocation === 'field' && localNewUris.length > 0) {
        uploadedProofs = await uploadImages(localNewUris, selectedTask.taskId, currentUserId);
      }

      const allFieldProofs = [...existingProofs, ...uploadedProofs];


      // 3. Prepare Firestore Payload
      const updatePayload = {
        status: updateStatus,
        workLocation: updateWorkLocation,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      // ⭐️ ADD REMINDER TO PAYLOAD ⭐️
      if (reminderDate) {
        // Convert the local Date object to a Firestore Timestamp
        updatePayload.reminder = firestore.Timestamp.fromDate(reminderDate);
      } else if (selectedTask.reminder) {
        // If the user cleared the reminder but the task previously had one
        updatePayload.reminder = firestore.FieldValue.delete();
      }

      // Update/Clear fieldProof array
      if (updateWorkLocation === 'field') {
        updatePayload.fieldProof = allFieldProofs;
      } else {
        updatePayload.fieldProof = firestore.FieldValue.delete();
      }

      // Remarks
      if (updateRemark.trim() !== '') {
        const newRemarkEntry = {
          text: updateRemark,
          createdAt: new Date(),
          userId: currentUserId
        };
        updatePayload.remarks = firestore.FieldValue.arrayUnion(newRemarkEntry);
      }

      // 4. Commit to Firestore
      await firestore().collection('tasks').doc(selectedTask.taskId).update(updatePayload);

      Alert.alert("Success", `Task updated! ${allFieldProofs.length} proof photo(s) saved.`);

      // Reset states
      setUpdateModalVisible(false);
      setSelectedTask(null);
      setUpdateRemark('');
      setUpdateStatus('');
      setUpdateWorkLocation('wfh');
      setFieldImageUris([]);
      setReminderDate(null); // ⭐️ Reset reminder state ⭐️

    } catch (err) {
      console.error("Error submitting update:", err);
      Alert.alert("Error", err.message || "Failed to submit task update. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };


  // Render task item (same as before)
  const renderTaskItem = ({ item }) => {
    // ... (renderTaskItem logic remains unchanged) ...
    const deadline = item.deadline ? (item.deadline.toDate ? item.deadline.toDate() : new Date(item.deadline)) : null;
    const isOverdue = item.status === 'inprogress' && deadline && deadline < new Date();

    const statusColors = {
      inprogress: isOverdue ? '#e74c3c' : '#f1c40f',
      completed: '#2ecc71',
      rejected: '#808080',
    };

    const statusColor = statusColors[item.status] || '#555555';
    const latestRemark = getLatestRemark(item.remarks);
    const taskLocation = (item.workLocation || 'wfh').toUpperCase();
    const locationIcon = WORK_LOCATIONS.find(loc => loc.value === item.workLocation)?.icon || 'alert-circle-outline';

    // ⭐️ Get Reminder time for display
    const reminderTime = item.reminder;
    const isReminderSet = !!reminderTime;


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
              style={[styles.modernStatusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor, paddingHorizontal: 10 * scale, }]}
            >
              <Text style={[styles.modernStatusText, { color: statusColor, fontSize: 12 * scale }]}>
                {isOverdue ? 'OVERDUE' : item.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={[styles.modernInfoRow, { marginTop: 8 * scale, marginBottom: 4 * scale }]}>
            <Ionicons name={locationIcon} size={14 * scale} color={theme.colors.primary} style={{ marginRight: 4 * scale }} />
            <Text style={[styles.modernInfoText, { color: theme.colors.primary, fontSize: 13 * scale, fontWeight: '700' }]}>
              Location: {taskLocation}
            </Text>
          </View>

     
          {isReminderSet && (
            <View style={[styles.modernInfoRow, { marginBottom: 4 * scale }]}>
              <Ionicons name="notifications-outline" size={14 * scale} color={theme.colors.text} style={{ marginRight: 4 * scale }} />
              <Text style={[styles.modernInfoText, { color: theme.colors.text, fontSize: 13 * scale, fontWeight: '500' }]}>
                Reminder: {formatReminderTime(reminderTime)}
              </Text>
            </View>
          )}

          <Text
            style={[styles.modernDescription, { color: theme.colors.text, fontSize: 14 * scale, marginTop: 4 * scale }]}
            numberOfLines={2}
          >
            {item.description || 'No description provided.'}
          </Text>

          <View style={[styles.modernInfoRow, { marginTop: 12 * scale }]}>
            <Ionicons name="calendar-outline" size={14 * scale} color={theme.colors.text} style={{ marginRight: 4 * scale }} />
            <Text style={[styles.modernInfoText, { color: theme.colors.text, fontSize: 13 * scale, fontWeight: isOverdue ? 'bold' : '500' }]}>
              Due: {formatDate(item.deadline)}
            </Text>
            {latestRemark && (
              <Text style={[styles.modernInfoText, { color: statusColor, fontSize: 13 * scale, fontWeight: '600', marginLeft: 16 * scale }]}>
                <Ionicons name="chatbox-outline" size={14 * scale} color={statusColor} style={{ marginRight: 4 * scale }} />
                {` Remark: ${latestRemark.length > 20 ? latestRemark.substring(0, 17) + '...' : latestRemark}`}
              </Text>
            )}
          </View>

          {/* Show Proof count if available */}
          {item.workLocation === 'field' && item.fieldProof && Array.isArray(item.fieldProof) && item.fieldProof.length > 0 && (
            <View style={[styles.modernInfoRow, { marginTop: 8 * scale }]}>
              <Ionicons name="images-outline" size={14 * scale} color={theme.colors.text} style={{ marginRight: 4 * scale }} />
              <Text style={[styles.modernInfoText, { color: theme.colors.text, fontSize: 13 * scale, fontWeight: '500' }]}>
                {item.fieldProof.length} Proof Photo(s) Attached
              </Text>
            </View>
          )}

          <Pressable
            style={[styles.modernActionButton, { backgroundColor: theme.colors.primary, marginTop: 16 * scale, borderTopColor: theme.colors.border }]}
            onPress={() => handleOpenUpdate(item)}
          >
            <Ionicons name="reorder-four-outline" size={20 * scale} color="#fff" />
            <Text style={[styles.modernActionButtonText, { fontSize: 14 * scale }]}>Update Task Details</Text>
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

      {/* --- TASK Update Modal --- */}
      <Modal visible={updateModalVisible} transparent animationType="slide" onRequestClose={() => setUpdateModalVisible(false)} >
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.card, padding: 20 * scale, borderRadius: 12 * scale }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: 18 * scale, marginBottom: 12 * scale }]}>
              Update Task: {selectedTask?.title}
            </Text>

            {/* ⭐️ REMINDER SECTION ⭐️ */}
            <Text style={{ color: theme.colors.text, marginTop: 12 * scale, fontSize: 14 * scale, fontWeight: '600' }}>
              Set Task Reminder:
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 * scale }}>
              <Pressable
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: reminderDate ? theme.colors.primary : theme.colors.border,
                    flex: 3,
                    marginRight: 8 * scale,
                  }
                ]}
                onPress={() => setShowReminderPicker(true)}
              >
                <Text style={[styles.modalButtonText, { fontSize: 13 * scale }]}>
                  {reminderDate ? formatReminderTime(reminderDate) : 'Tap to Set Date & Time'}
                </Text>
              </Pressable>
              {reminderDate && (
                <Pressable
                  style={[styles.modalButton, { backgroundColor: '#e74c3c', flex: 1, }]}
                  onPress={() => setReminderDate(null)} // Clear the reminder
                >
                  <Ionicons name="trash-outline" size={18 * scale} color="#fff" />
                </Pressable>
              )}
            </View>
            {/* END REMINDER SECTION */}


            {/* Work Location Update */}
            <Text style={{ color: theme.colors.text, marginTop: 12 * scale, fontSize: 14 * scale, fontWeight: '600' }}>
              Working From:
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 8 * scale, justifyContent: 'space-between', flexWrap: 'wrap' }}>
              {WORK_LOCATIONS.map(location => (
                <Pressable
                  key={location.value}
                  onPress={() => { setUpdateWorkLocation(location.value); if (location.value !== 'field') setFieldImageUris([]); }}
                  style={{
                    backgroundColor: updateWorkLocation === location.value ? theme.colors.primary + '20' : theme.colors.card,
                    borderColor: updateWorkLocation === location.value ? theme.colors.primary : theme.colors.border,
                    borderWidth: 1.5,
                    paddingVertical: 10 * scale,
                    paddingHorizontal: 8 * scale,
                    borderRadius: 8 * scale,
                    width: '32%',
                    alignItems: 'center',
                    marginBottom: 8 * scale,
                  }}
                >
                  <Ionicons
                    name={location.icon}
                    size={20 * scale}
                    color={updateWorkLocation === location.value ? theme.colors.primary : theme.colors.text}
                  />
                  <Text style={{
                    color: updateWorkLocation === location.value ? theme.colors.primary : theme.colors.text,
                    fontSize: 10 * scale,
                    fontWeight: '600',
                    marginTop: 4 * scale
                  }}>
                    {location.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* FIELD PHOTO UPLOAD SECTION */}
            {updateWorkLocation === 'field' && (
              <View style={{ marginTop: 15 * scale, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8 * scale, padding: 10 * scale }}>
                <Text style={{ color: theme.colors.text, fontSize: 14 * scale, fontWeight: '700', marginBottom: 8 * scale, color: theme.colors.primary }}>
                  Field Work Proof ({fieldImageUris.length}/{MAX_PHOTOS} photos)
                </Text>

                <Pressable
                  style={[styles.photoButton, { backgroundColor: theme.colors.primary, padding: 10 * scale, borderRadius: 8 * scale }]}
                  onPress={selectPhoto}
                  disabled={isUploading || fieldImageUris.length >= MAX_PHOTOS}
                >
                  <Ionicons name={"camera-outline"} size={20 * scale} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 14 * scale, fontWeight: '600', marginLeft: 10 * scale }}>
                    {fieldImageUris.length >= MAX_PHOTOS ? `Max Photos (${MAX_PHOTOS}) Reached` : 'Add Photo (Camera/Gallery)'}
                  </Text>
                </Pressable>

                {/* Image Gallery ScrollView */}
                {fieldImageUris.length > 0 && (
                  <ScrollView horizontal style={{ marginTop: 8 * scale, height: 80 * scale }} contentContainerStyle={{ alignItems: 'center' }}>
                    {fieldImageUris.map((uri, index) => (
                      <View key={index} style={{ marginRight: 10 * scale }}>
                        <Image source={{ uri: uri }} style={{ width: 60 * scale, height: 60 * scale, borderRadius: 6 * scale }} />
                        <Pressable
                          style={styles.removeButton}
                          onPress={() => removeImage(uri)}
                        >
                          <Ionicons name="close-circle" size={18 * scale} color="#e74c3c" />
                        </Pressable>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}


            {/* Task Status Update */}
            <Text style={{ color: theme.colors.text, marginTop: 12 * scale, fontSize: 14 * scale, fontWeight: '600' }}>
              Select New Status:
            </Text>
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


            {/* Remark Update */}
            <TextInput
              placeholder="Add/Update Remark (optional)..."
              placeholderTextColor="#888"
              style={[styles.input, {
                color: theme.colors.text,
                fontSize: 14 * scale,
                borderColor: theme.colors.border,
                padding: 12 * scale,
                borderRadius: 8 * scale,
                marginTop: 12 * scale
              }]}
              value={updateRemark}
              onChangeText={setUpdateRemark}
              multiline
              numberOfLines={3}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 * scale }}>
              <Pressable style={[styles.modalButton, { backgroundColor: '#bdc3c7', flex: 1, marginRight: 6 * scale }]} onPress={() => setUpdateModalVisible(false)} disabled={isUploading}>
                <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, { backgroundColor: theme.colors.primary, flex: 1, marginLeft: 6 * scale }]} onPress={handleSubmitUpdate} disabled={isUploading}>
                {isUploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, { fontSize: 14 * scale }]}>Submit Update</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ⭐️ DatePicker Component for Reminder ⭐️ */}
      <DatePicker
        modal
        open={showReminderPicker}
        date={reminderDate || new Date()} // Use existing date or current date
        onConfirm={(date) => {
          setShowReminderPicker(false);
          setReminderDate(date); // Save the selected Date object
        }}
        onCancel={() => {
          setShowReminderPicker(false);
        }}
        minimumDate={new Date()}
        mode="datetime"
        title={`Set Reminder for "${selectedTask?.title || 'Task'}"`}
        textColor={theme.colors.text}
      />

    </SafeAreaView>
  );
};

// --- STYLESHEET (Only one new style for reminder display in the modal) ---
const styles = StyleSheet.create({
  // ... existing styles remain the same ...
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

  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%' },
  modalTitle: { fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1 },
  modalButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: 'bold' },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 10,
  },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  emptyText: { marginTop: 16, textAlign: 'center' },
});

export default DashboardScreen;