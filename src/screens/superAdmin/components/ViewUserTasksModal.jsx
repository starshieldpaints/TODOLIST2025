import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Dimensions,
    ScrollView
} from 'react-native';
import { Modal, Portal } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const STATUS_COLORS = {
    completed: '#2ecc71',  
    inprogress: '#f39c12', 
    pending: '#f1c40f',    
    rejected: '#e74c3c',   
    todo: '#3498db',       
};

const BORDER_COLORS = {
    completed: '#27ae60',
    inprogress: '#d35400', 
    pending: '#e67e22',    
    rejected: '#c0392b',
    todo: '#2980b9',
};

const ViewUserTasksModal = ({ isVisible, onDismiss, user, theme }) => {
    const [loading, setLoading] = useState(true);
    const [userTasks, setUserTasks] = useState([]);
    const [assignedTasks, setAssignedTasks] = useState([]);

    useEffect(() => {
        if (!user || !isVisible) return;

        const fetchTasks = async () => {
            try {
                setLoading(true);
                const userDoc = await firestore().collection('users').doc(user.uid).get();
                const userData = userDoc.data();
                setUserTasks(userData?.myTasks || []);

                const taskSnap = await firestore()
                    .collection('tasks')
                    .where('assignedTo', '==', user.uid)
                    .get();

                const assigned = taskSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAssignedTasks(assigned);

            } catch (err) {
                console.error("Error fetching user tasks:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [user, isVisible]);

    const renderTask = ({ item }) => {
        const statusColor = STATUS_COLORS[item.status] || theme.colors.primary;
        const borderColor = BORDER_COLORS[item.status] || theme.colors.border;

        return (
            <View style={[styles.taskCard, { backgroundColor: theme.colors.card, borderColor }]}>
                <View style={styles.taskHeader}>
                    <Text style={[styles.taskTitle, { color: theme.colors.text }]}>{item.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>
                            {(item.status ? item.status : 'N/A').toUpperCase()}
                        </Text>
                    </View>
                </View>
                {item.description ? (
                    <Text style={[styles.taskDesc, { color: theme.colors.text }]}>{item.description}</Text>
                ) : null}
                {item.deadline ? (
                    <Text style={[styles.deadlineText, { color: theme.colors.text }]}>
                        Deadline: {item.deadline instanceof Date ? item.deadline.toLocaleString() : new Date(item.deadline.toDate()).toLocaleString()}
                    </Text>
                ) : null}
            </View>
        );
    };

    const TaskSection = ({ title, tasks }) => (
        <View style={{ marginBottom: 20 }}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
            {tasks.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary || '#999' }]}>
                    No tasks found.
                </Text>
            ) : (
                <FlatList
                    data={tasks}
                    renderItem={renderTask}
                    keyExtractor={(task, idx) => task.id || idx.toString()}
                    scrollEnabled={false}
                />
            )}
        </View>
    );

    return (
        <Portal>
            <Modal
                visible={isVisible}
                onDismiss={onDismiss}
                contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.background }]}
            >

                <LinearGradient
                    colors={[theme.colors.background,theme.colors.primary, theme.colors.card + 'CC']}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.headerGradient}
                >
                    <Text style={styles.modalTitle}>{user?.name || 'User'}'s Tasks</Text>
                </LinearGradient>

                {loading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ padding: 16 }}
                    >
                        <TaskSection title="Currently Working " tasks={userTasks} />
                        <TaskSection title="Assigned Tasks" tasks={assignedTasks} />
                    </ScrollView>
                )}

                <Pressable
                    onPress={onDismiss}
                    style={[styles.closeButton, { backgroundColor: theme.colors.primary }]}
                >
                    <Ionicons name="close" size={22} color="#fff" />

                </Pressable>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        marginHorizontal: 12,
        borderRadius: 20,
        maxHeight: '85%',
        overflow: 'hidden',
    },
    headerGradient: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    loadingBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 20,
    },
    taskCard: {
        borderWidth: 1.5,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        alignItems: 'center',
    },
    taskTitle: {
        fontWeight: '700',
        fontSize: 16,
        flexShrink: 1,
    },
    taskDesc: {
        fontSize: 14,
        marginBottom: 6,
    },
    deadlineText: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    statusBadge: {
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    emptyText: {
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 6,
        color: '#999',
    },
    closeButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 16,
        margin: 16,
        alignSelf: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 3 },
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: '700',
        marginLeft: 8,
        fontSize: 14,
    },
});

export default ViewUserTasksModal;