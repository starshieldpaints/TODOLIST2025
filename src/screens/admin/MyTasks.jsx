import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Modal, Portal, Provider as PaperProvider, TextInput as PaperTextInput, Button as PaperButton, useTheme as usePaperTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import DatePicker from 'react-native-date-picker';

import { useTheme } from '../../hooks/useTheme';
import TaskItem from '../user/components/TaskItems';


const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const TasksScreen = () => {
    const theme = useTheme();
    const paperTheme = usePaperTheme();
    const styles = createStyles(theme, paperTheme);

    const [user, setUser] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal and form state
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // State to hold the array of existing remarks for display in the modal
    const [currentRemarksArray, setCurrentRemarksArray] = useState([]);
    // State to hold the new remark being added in the modal
    const [newRemarkText, setNewRemarkText] = useState('');

    const [deadline, setDeadline] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
    });
    const [showDatePicker, setShowDatePicker] = useState(false);


    useEffect(() => {
        const currentUser = auth().currentUser;
        if (currentUser) {
            setUser(currentUser);
        }
    }, []);

    useEffect(() => {
        if (!user) return;
        setLoading(true);

        const subscriber = firestore()
            .collection('users')
            .doc(user.uid)
            .onSnapshot(documentSnapshot => {
                const userData = documentSnapshot.data();
                let userTasks = userData?.myTasks || [];

                // Sort by creation date (newest first)
                userTasks.sort((a, b) => {
                    if (a.createdAt && b.createdAt) {
                        return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
                    }
                    return 0;
                });

                setTasks(userTasks);
                setLoading(false);
            }, error => {
                console.error("Error fetching tasks: ", error);
                Alert.alert("Error", "Could not fetch tasks.");
                setLoading(false);
            });

        return () => subscriber();
    }, [user]);

    const handleAddTask = async () => {
        if (!title.trim() || !description.trim()) {
            Alert.alert("Validation Error", "Title and description cannot be empty.");
            return;
        }

        const newId = firestore().collection('users').doc().id;

        // Prepare the initial remarks array
        const initialRemarks = newRemarkText.trim()
            ? [{
                text: newRemarkText.trim(),
                addedBy: user.uid,
                timestamp: firestore.Timestamp.now(),
            }]
            : [];

        const newTask = {
            id: newId,
            title,
            description,
            status: 'Pending', // Default status
            assignedBy: user.uid,
            assignedTo: user.uid,
            createdAt: firestore.Timestamp.now(),
            updatedAt: firestore.Timestamp.now(),
            deadline: firestore.Timestamp.fromDate(deadline),
            remarks: initialRemarks, // Use the prepared array
        };

        try {
            await firestore()
                .collection('users')
                .doc(user.uid)
                .update({
                    myTasks: firestore.FieldValue.arrayUnion(newTask)
                });
            closeModal();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to create task.");
        }
    };

    const handleUpdateTask = async () => {
        if (!currentTask || !title.trim() || !description.trim()) {
            Alert.alert("Validation Error", "Title and description cannot be empty.");
            return;
        }

        let remarksToSave = [...(currentTask.remarks || [])];


        if (newRemarkText.trim()) {
            const newRemark = {
                text: newRemarkText.trim(),
                addedBy: user.uid,
                timestamp: firestore.Timestamp.now(),
            };
            // Prepend new remark for latest-to-oldest order
            remarksToSave = [newRemark, ...remarksToSave];
        }

        // Map and update the array
        const updatedTasks = tasks.map(task => {
            if (task.id === currentTask.id) {
                return {
                    ...task,
                    title,
                    description,
                    deadline: firestore.Timestamp.fromDate(deadline),
                    remarks: remarksToSave, // Use the new/updated remarks array
                    updatedAt: firestore.Timestamp.now(),
                };
            }
            return task;
        });

        try {
            await firestore().collection('users').doc(user.uid).update({
                myTasks: updatedTasks
            });
            closeModal();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to update task.");
        }
    };

    const handleDeleteTask = (taskId) => {
        Alert.alert(
            "Delete Task",
            "Are you sure you want to delete this task? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const filteredTasks = tasks.filter(task => task.id !== taskId);
                            await firestore().collection('users').doc(user.uid).update({
                                myTasks: filteredTasks
                            });
                        } catch (error) {
                            console.error("Error deleting task: ", error);
                            Alert.alert("Error", "Failed to delete task.");
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };


    // IMPLEMENTATION OF handleStatusChange
    const handleStatusChange = async (taskId, nextStatus) => {
        if (!user) return;

        // Map over tasks to update the status of the specific task
        const updatedTasks = tasks.map(task => {
            if (task.id === taskId) {
                return {
                    ...task,
                    status: nextStatus,
                    updatedAt: firestore.Timestamp.now(),
                };
            }
            return task;
        });

        // Write the entire updated array back to Firestore
        try {
            await firestore()
                .collection('users')
                .doc(user.uid)
                .update({
                    myTasks: updatedTasks
                });
        } catch (error) {
            console.error("Error updating status: ", error);
            Alert.alert("Error", "Failed to update task status.");
        }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setCurrentTask(null);
        setTitle('');
        setDescription('');
        setNewRemarkText('');
        setCurrentRemarksArray([]);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDeadline(tomorrow);
        setModalVisible(true);
    };

    const openEditModal = (task) => {
        setIsEditing(true);
        setCurrentTask(task);
        setTitle(task.title);
        setDescription(task.description);
        setDeadline(task.deadline?.toDate() || new Date());
        setCurrentRemarksArray(task.remarks || []);
        setNewRemarkText(''); 

        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setShowDatePicker(false);
        // Clear all remark states on close
        setNewRemarkText('');
        setCurrentRemarksArray([]);
    };


    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <PaperProvider theme={paperTheme} >
            <SafeAreaView style={[styles.safeArea,{flex:1}]} >
                <View style={[styles.innerContainer,{flex:1}]}>
                    <Text style={styles.header}>My Personal Tasks </Text>

                    <FlatList
                        data={tasks}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TaskItem
                                item={item}
                                onEdit={openEditModal}
                                onDelete={handleDeleteTask}
                                onStatusChange={handleStatusChange}
                            />
                        )}
                        ListEmptyComponent={<Text style={styles.emptyText}>You haven't created any tasks. Tap '+' to add one!</Text>}
                    />
                </View>

                <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
                    <Icon name="add" size={30} color="#FFFFFF" />
                </TouchableOpacity>

                {/* REACT NATIVE PAPER MODAL IMPLEMENTATION */}
                <Portal>
                    <Modal
                        visible={modalVisible}
                        onDismiss={closeModal}
                        contentContainerStyle={[styles.modalView, { backgroundColor: theme.colors.card }]}
                    >
                        <Text style={styles.modalTitle}>{isEditing ? 'Edit Task' : 'Create New Task'}</Text>

                        <PaperTextInput
                            label="Task Title"
                            value={title}
                            onChangeText={setTitle}
                            mode="outlined"
                            style={styles.paperInput}
                            activeOutlineColor={theme.colors.border}
                            outlineColor={theme.colors.text}
                            theme={{ colors: { background: theme.colors.card } }}
                        />

                        <PaperTextInput
                            label="Task Description"
                            value={description}
                            onChangeText={setDescription}
                            mode="outlined"
                            multiline
                            style={styles.paperInput}
                            activeOutlineColor={theme.colors.border}
                            outlineColor={theme.colors.text}
                            theme={{ colors: { background: theme.colors.card } }}
                            textColor={theme.colors.text}
                        />

                        {/* DEADLINE INPUT */}
                        <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
                            <Text style={styles.dateLabel}>
                                <Text style={styles.dateValue}>{formatDate(deadline)}</Text>
                            </Text>
                            <Icon name="calendar-outline" size={20} color={theme.colors.text} />
                        </TouchableOpacity>

                        {/* Input for NEW remark */}
                        <PaperTextInput
                            label={isEditing ? "Add New Remark" : "Initial Remark (Optional)"}
                            value={newRemarkText}
                            onChangeText={setNewRemarkText}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            style={[styles.paperInput, styles.remarksInput]}
                            activeOutlineColor={theme.colors.border}
                            outlineColor={theme.colors.text}
                            theme={{ colors: { background: theme.colors.card } }}
                        />

                        {/* Show existing remarks in edit mode (Latest 3) */}
                        {isEditing && currentRemarksArray.length > 0 && (
                            <View style={styles.existingRemarksContainer}>
                                <Text style={styles.existingRemarksTitle}>Existing Remarks ({currentRemarksArray.length})</Text>
                                <FlatList
                                    data={currentRemarksArray.slice(0, 3)} // Show max 3 for modal brevity
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={({ item, index }) => (
                                        <Text
                                            key={index}
                                            style={styles.existingRemarkText}
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                        >
                                            {index === 0 ? 'LATEST' : `#${index + 1}`} : {item.text}
                                        </Text>
                                    )}
                                />
                            </View>
                        )}


                        <View style={styles.buttonRow}>
                            <PaperButton
                                mode="outlined"
                                onPress={closeModal}
                                style={styles.paperButton}
                                labelStyle={{ color: '#999' }}
                                icon="close-circle-outline"
                            >
                                Cancel
                            </PaperButton>

                            <PaperButton
                                mode="contained"
                                onPress={isEditing ? handleUpdateTask : handleAddTask}
                                style={[styles.paperButton, { backgroundColor: theme.colors.border }]}
                                icon={isEditing ? "content-save-outline" : "plus-circle-outline"}
                                textColor={theme.colors.text}
                            >
                                {isEditing ? 'Update' : 'Save'}
                            </PaperButton>
                        </View>
                    </Modal>
                </Portal>

                {/* DatePicker Component */}
                <DatePicker
                    modal
                    open={showDatePicker}
                    date={deadline}
                    onConfirm={(date) => {
                        setShowDatePicker(false);
                        setDeadline(date);
                    }}
                    onCancel={() => {
                        setShowDatePicker(false);
                    }}
                    minimumDate={new Date()}
                    mode="datetime"
                    title="Select Task Deadline"
                    textColor={theme.colors.text}
                />

            </SafeAreaView>
        </PaperProvider>
    );
};

// Styles 
const createStyles = (theme, paperTheme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    innerContainer: {
     
        alignContent:"space-between",
        paddingHorizontal: 12,
        paddingVertical: 0,
        backfaceVisibility:"hidden"

    },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
    header: { fontSize: 28, fontWeight: 'bold', color: theme.colors.text, marginBottom: 16, marginTop: 10 },
    emptyText: { textAlign: 'center', marginTop: 50, color: theme.colors.text, fontSize: 16 },
    fab: {
        position: 'absolute',
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        right: 20,
        bottom: 90,
        backgroundColor: theme.colors.primary,
        borderRadius: 28,
        elevation: 8
    },

    // REACT NATIVE PAPER MODAL STYLES
    modalView: {
        width: '100%',
        height: "100%",
        alignSelf: 'center',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        elevation: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        color: theme.colors.text
    },
    paperInput: {
        width: '100%',
        marginBottom: 15,
        backgroundColor: theme.colors.card,
    },
    datePickerButton: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: theme.dark ? '#333' : '#eee',
        borderRadius: 8,
        marginBottom: 15,
    },
    dateLabel: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '500'
    },
    dateValue: {
        fontWeight: 'bold',
        fontSize: 16,
        color: theme.colors.text,
    },
    remarksInput: {
        minHeight: 80,
    },

    // NEW STYLES FOR MODAL EXISTING REMARKS
    existingRemarksContainer: {
        width: '100%',
        marginTop: 5,
        padding: 10,
        backgroundColor: theme.dark ? '#222' : '#f0f0f0',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
        marginBottom: 15,
        maxHeight: 150,
    },
    existingRemarksTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: theme.dark ? '#333' : '#ddd',
        paddingBottom: 5,
    },
    existingRemarkText: {
        fontSize: 12,
        color: theme.dark ? '#bbb' : '#444',
        marginBottom: 4,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 15
    },
    paperButton: {
        flex: 1,
        marginHorizontal: 5,
        borderRadius: 8,
        paddingVertical: 5,

    }
});

export default TasksScreen;