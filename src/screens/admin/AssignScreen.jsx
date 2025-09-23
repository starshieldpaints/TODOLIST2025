import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, TextInput as TextInputSearch, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Portal, Button, Card, Text, Provider as PaperProvider, Snackbar, Chip, Menu, TextInput, Modal } from 'react-native-paper';
import DatePicker from 'react-native-date-picker';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { ThemeContext } from '../../context/ThemeContext';
import PremiumTasksModal from "../../components/ViewTaskModal";
import { Animated, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

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
    const [taskRemarks, setTaskRemarks] = useState('');
    const [taskDeadline, setTaskDeadline] = useState(new Date());
    const [openDatePicker, setOpenDatePicker] = useState(false);

    const [searchText, setSearchText] = useState('');
    const [snackbarVisible, setSnackbarVisible] = useState(false);

    // Filters
    const [taskFilter, setTaskFilter] = useState(null); // upcoming | due | pending
    const [userFilter, setUserFilter] = useState(null); // most | least | idle

    // Load users
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

    // Load tasks
    useEffect(() => {
        if (!adminUid) return;
        const unsubscribe = firestore()
            .collection('tasks')
            .where('assignedBy', '==', adminUid)
            .onSnapshot(snapshot => setTasks(snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }))));

        return () => unsubscribe();
    }, [adminUid]);

    // Apply filters independently
    useEffect(() => {
        let filtered = [...users];

        // Apply search first
        if (searchText) {
            const lower = searchText.toLowerCase();
            filtered = filtered.filter(u => (u.name?.toLowerCase().includes(lower) || u.email?.toLowerCase().includes(lower)));
        }

        // Task filter
        if (taskFilter) {
            const now = new Date();
            filtered = filtered.filter(u => {
                const userTasks = tasks.filter(t => t.assignedTo === u.uid);
                if (taskFilter === 'upcoming') return userTasks.some(t => t.deadline?.toDate?.() > now && t.status !== 'completed');
                if (taskFilter === 'due') return userTasks.some(t => t.deadline?.toDate?.() < now && t.status !== 'completed');
                if (taskFilter === 'pending') return userTasks.some(t => t.status === 'pending');
                return true;
            });
        }

        // User filter
        if (userFilter) {
            filtered.sort((a, b) => {
                const aTasks = tasks.filter(t => t.assignedTo === a.uid).length;
                const bTasks = tasks.filter(t => t.assignedTo === b.uid).length;
                if (userFilter === 'most') return bTasks - aTasks;
                if (userFilter === 'least') return aTasks - bTasks;
                if (userFilter === 'idle') return aTasks - bTasks;
                return 0;
            });
            if (userFilter === 'idle') filtered = filtered.filter(u => tasks.filter(t => t.assignedTo === u.uid).length === 0);
        }

        setFilteredUsers(filtered);
    }, [searchText, users, tasks, taskFilter, userFilter]);

    const openAssignModal = user => {
        setSelectedUser(user);
        setTaskTitle('');
        setTaskDescription('');
        setTaskRemarks('');
        setTaskDeadline(new Date());
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
                status: "pending",
                assignedTo: selectedUser.uid,
                assignedBy: adminUid,
                deadline: firestore.Timestamp.fromDate(taskDeadline),
                createdAt: firestore.FieldValue.serverTimestamp(),
                updatedAt: firestore.FieldValue.serverTimestamp(),
                remarks: taskRemarks ? taskRemarks.split(',').map(r => r.trim()) : [],
            });

            setAssignModalVisible(false);
            setSnackbarVisible(true);
            setTaskTitle('');
            setTaskDescription('');
            setTaskRemarks('');
            setTaskDeadline(new Date());
        } catch (err) {
            console.error(err);
        }
    };


    // Inside your component...
    const renderUser = ({ item }) => {
        const userTasks = tasks.filter(t => t.assignedTo === item.uid);
        const pendingTasks = userTasks.filter(t => t.status === "pending");

        // Find the earliest pending deadline
        let nearestDeadline = null;
        if (pendingTasks.length > 0) {
            nearestDeadline = pendingTasks
                .map(t => t.deadline?.toDate?.())
                .filter(d => d) // only valid dates
                .sort((a, b) => a - b)[0];
        }

        // Deadline color logic
        let deadlineColor = theme.colors.text;
        let deadlineLabel = "No deadline";
        if (nearestDeadline) {
            const now = new Date();
            const diffHours = (nearestDeadline - now) / (1000 * 60 * 60);

            if (diffHours < 0) {
                deadlineColor = "red";
                deadlineLabel = "Deadline Passed";
            } else if (diffHours <= 24) {
                deadlineColor = "orange";
                deadlineLabel = "Due Soon ";
            } else {
                deadlineColor = "green";
                deadlineLabel = "Upcoming ";
            }
        }

        return (
            <Card style={[styles.userCard, { backgroundColor: theme.colors.card }]}>
                <Card.Content style={{ position: 'relative' }}>
                    {/* User Info */}
                    <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>
                        {item.name}
                    </Text>
                    <Text style={{ color: theme.colors.text, marginBottom: 8 }}>
                        {item.email || item.phone}
                    </Text>

                    {/* Badge for Pending */}
                    {pendingTasks.length > 0 && (
                        <View style={[styles.badge, { backgroundColor: theme.colors.notification }]}>
                            <Text style={styles.badgeText}>{pendingTasks.length}</Text>
                        </View>
                    )}

                    {/* Deadline Section */}
                    {nearestDeadline && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Ionicons name="calendar-outline" size={18} color={deadlineColor} style={{ marginRight: 6 }} />
                            <Text style={{ color: deadlineColor, fontWeight: '600' }}>
                                {nearestDeadline.toDateString()} • {deadlineLabel}
                            </Text>
                        </View>
                    )}

                    {/* Actions */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                        <Button
                            mode="contained"
                            onPress={() => openViewTasksModal(item)}
                            buttonColor={theme.colors.primary}
                            textColor={theme.colors.text}
                            style={{ borderRadius: 8 }}
                            icon={() => <Ionicons name="list-outline" size={18} color={theme.colors.text} />}
                        >
                            {userTasks.length} Tasks
                        </Button>
                        <Button
                            mode="contained"
                            onPress={() => openAssignModal(item)}
                            buttonColor={theme.colors.border}
                            textColor={theme.colors.text}
                            style={{ borderRadius: 8 }}
                            icon={() => <Ionicons name="add-circle-outline" size={18} color={theme.colors.text} />}
                        >
                            Assign
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
                    <TextInputSearch
                        placeholder="Search by name or email"
                        placeholderTextColor={theme.colors.text + '88'}
                        value={searchText}
                        onChangeText={setSearchText}
                        style={[styles.searchInput, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.card }]}
                    />

                    {/* Filters Container */}
                    <View style={{ marginBottom: 12 }}>
                     
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ alignItems: 'center', paddingVertical: 4 }}
                        >
                            {['upcoming', 'due', 'pending'].map(f => {
                                const isSelected = taskFilter === f;
                                const scaleAnim = new Animated.Value(1);

                                const handlePressIn = () => {
                                    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
                                };
                                const handlePressOut = () => {
                                    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
                                };

                                return (
                                    <Animated.View key={f} style={{ transform: [{ scale: scaleAnim }], marginRight: 8 }}>
                                        <Pressable
                                            onPress={() => {
                                                setTaskFilter(taskFilter === f ? null : f);
                                                setUserFilter(null);
                                            }}
                                            onPressIn={handlePressIn}
                                            onPressOut={handlePressOut}
                                            style={{
                                                backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
                                                paddingVertical: 6,
                                                paddingHorizontal: 16,
                                                borderRadius: 16,
                                                elevation: isSelected ? 4 : 1, // subtle shadow for selected
                                            }}
                                        >
                                            <Text style={{ color: isSelected ? '#fff' : theme.colors.text, fontWeight: '600' }}>
                                                {f.charAt(0).toUpperCase() + f.slice(1)}
                                            </Text>
                                        </Pressable>
                                    </Animated.View>
                                );
                            })}

                            {/* All chip */}
                            <Pressable
                                onPress={() => setTaskFilter(null)}
                                style={{
                                    backgroundColor: theme.colors.border,
                                    paddingVertical: 6,
                                    paddingHorizontal: 16,
                                    borderRadius: 16,
                                }}
                            >
                                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>All</Text>
                            </Pressable>
                        </ScrollView>


                        {/* User Filter Dropdown */}
                        <Menu
                            visible={!!userFilter}
                            onDismiss={() => setUserFilter(null)}
                            anchor={
                                <Button
                                    mode="outlined"
                                    onPress={() => setUserFilter(userFilter ? null : 'most')}
                                    style={{ marginTop: 8, alignSelf: 'flex-start' }}
                                >
                                    {userFilter ? { most: 'Most Tasks', least: 'Least Tasks', idle: 'Idle Users' }[userFilter] : 'Filter Users'}
                                </Button>
                            }
                        >
                            {['most', 'least', 'idle'].map(f => (
                                <Menu.Item
                                    key={f}
                                    title={{ most: 'Most Tasks', least: 'Least Tasks', idle: 'Idle Users' }[f]}
                                    onPress={() => {
                                        setUserFilter(f);
                                        setTaskFilter(null); // reset task filter
                                    }}
                                />
                            ))}
                        </Menu>
                    </View>

                    {loading ? (
                        <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20 }}>Loading users...</Text>
                    ) : (
                        <FlatList
                            data={filteredUsers}
                            keyExtractor={item => item.uid}
                            renderItem={renderUser}
                            contentContainerStyle={{ paddingBottom: 80 }}
                        />
                    )}

                    <Portal>
                        <Modal visible={assignModalVisible} onDismiss={() => setAssignModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                            <Text style={{ color: theme.colors.text, marginBottom: 12, fontSize: 20, fontWeight: '700' }}>Assign Task to {selectedUser?.name}</Text>

                            <TextInput
                                placeholder="Task Title"
                                value={taskTitle}
                                onChangeText={setTaskTitle}
                                style={[styles.input, { color: theme.colors.text }]}
                            />
                            <TextInput
                                placeholder="Task Description"
                                value={taskDescription}
                                onChangeText={setTaskDescription}
                                multiline
                                style={[styles.input, { color: theme.colors.text, height: 50 }]}
                            />

                            <Button mode="outlined" onPress={() => setOpenDatePicker(true)} style={{ marginBottom: 12, borderRadius: 8 }}>
                                Deadline: {taskDeadline.toDateString()}
                            </Button>
                            <DatePicker
                                modal
                                open={openDatePicker}
                                date={taskDeadline}
                                mode="date"
                                onConfirm={(date) => { setOpenDatePicker(false); setTaskDeadline(date); }}
                                onCancel={() => setOpenDatePicker(false)}
                            />

                            <TextInput
                                placeholder="Remarks (comma separated)"
                                value={taskRemarks}
                                onChangeText={setTaskRemarks}
                                style={[styles.input, { color: theme.colors.text }]}
                            />

                            <Button mode="contained" onPress={assignTask} style={{ marginBottom: 8, borderRadius: 8 }} buttonColor={theme.colors.primary}>
                                Assign Task
                            </Button>
                            <Button mode="text" onPress={() => setAssignModalVisible(false)} textColor={theme.colors.text}>
                                Cancel
                            </Button>
                        </Modal>
                    </Portal>

                    <PremiumTasksModal
                        visible={viewTasksModalVisible}
                        onDismiss={() => setViewTasksModalVisible(false)}
                        selectedUser={selectedUser}
                        theme={theme}
                    />

                    <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={2000}>
                        Task assigned successfully!
                    </Snackbar>
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
    badge: { position: 'absolute', top: 0, right: 0, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

export default AssignScreen;
