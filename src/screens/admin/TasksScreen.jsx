import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext';
import auth from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';

const TasksScreen = ({ route }) => {
    const { theme } = useContext(ThemeContext);
    const adminUid = auth().currentUser.uid; // make sure this is passed via navigation

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!adminUid || typeof adminUid !== 'string') {
            setTasks([]);
            setLoading(false);
            return;
        }

        const unsubscribe = firestore()
            .collection('tasks')
            .where('assignedTo', '==', adminUid)
            .onSnapshot(
                snapshot => {
                    const data = snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }));
                    setTasks(data);
                    setLoading(false);
                },
                error => {
                    console.error('Firestore error:', error);
                    setLoading(false);
                }
            );

        return () => unsubscribe();
    }, [adminUid]);


    const changeStatus = async (task, newStatus) => {
        try {
            await firestore()
                .collection('tasks')
                .doc(task.taskId)
                .update({
                    status: newStatus,
                    updatedAt: firestore.FieldValue.serverTimestamp(),
                });
        } catch (error) {
            console.error('Error updating task status:', error);
            Alert.alert('Error', 'Failed to update task status');
        }
    };

    const renderTask = ({ item }) => (
        <View style={[styles.taskCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.taskTitle, { color: theme.colors.text }]}>{item.title}</Text>
            <Text style={{ color: theme.colors.text, marginBottom: 4 }}>{item.description}</Text>
            <Text style={{ color: theme.colors.text, marginBottom: 8 }}>Status: {item.status}</Text>

            <View style={styles.statusButtons}>
                {['todo', 'inprogress', 'done'].map(status => (
                    <TouchableOpacity
                        key={status}
                        style={[
                            styles.statusButton,
                            { backgroundColor: item.status === status ? theme.colors.primary : theme.colors.border }
                        ]}
                        onPress={() => changeStatus(item, status)}
                    >
                        <Text style={{ color: theme.colors.background, fontWeight: 'bold' }}>{status}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <Text style={{ color: theme.colors.text }}>Loading tasks...</Text>
            </View>
        );
    }

    if (tasks.length === 0) {
        return (
            <View style={[styles.noTasksContainer, { backgroundColor: theme.colors.background }]}>
                <Text style={{ color: theme.colors.text, fontSize: 18 }}>No tasks assigned</Text>
                <Text style={{ color: theme.colors.text + 'aa', marginTop: 8 }}>Tasks assigned by the Superadmin will appear here.</Text>
            </View>
        );
    }

    // return (
    //     <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
    //     <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
    //         <FlatList
    //             data={tasks}
    //             keyExtractor={(item) => item.taskId}
    //             renderItem={renderTask}
    //             contentContainerStyle={{ paddingBottom: 20 }}
    //         />
    //     </View>
    //     </SafeAreaView>
    // );
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                {/* Heading */}
                <Text style={[styles.heading, { color: theme.colors.text }]}>
                    Tasks Assigned for you By Super Admin
                </Text>

                <FlatList
                    data={tasks}
                    keyExtractor={(item) => item.taskId}
                    renderItem={renderTask}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </View>
        </SafeAreaView>
    );


};

export default TasksScreen;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    noTasksContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    taskCard: { padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1 },
    taskTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    statusButtons: { flexDirection: 'row', justifyContent: 'space-between' },
    statusButton: { flex: 1, padding: 8, marginHorizontal: 4, borderRadius: 4, alignItems: 'center' },
    heading: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
    }

});
