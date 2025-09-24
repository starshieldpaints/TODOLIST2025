import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Modal, TouchableOpacity, Pressable } from 'react-native';
import { Card } from 'react-native-paper';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const hoursBetween = (start, end) => (end - start) / 1000 / 3600;

const DashboardScreen = () => {
    const { theme } = useContext(ThemeContext);
    const screenWidth = useScreenWidth();
    const scale = screenWidth / 375;
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const currentAdminId = auth().currentUser?.uid;
    const now = new Date();

    useEffect(() => {
        if (!currentAdminId) return;

        const unsubscribeUsers = firestore()
            .collection('users')
            .where('adminId', '==', currentAdminId)
            .onSnapshot(snapshot => setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }))));

        const unsubscribeTasks = firestore()
            .collection('tasks')
            .where('assignedBy', '==', currentAdminId)
            .onSnapshot(snapshot => setTasks(snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() }))));

        return () => {
            unsubscribeUsers();
            unsubscribeTasks();
        };
    }, [currentAdminId]);

    // Unified task statuses
    const todoTasks = tasks.filter(t => t.status === 'todo' || t.status === 'pending').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'inprogress').length;
    const rejectedTasks = tasks.filter(t => t.status === 'rejected').length;

    const overdueTasks = tasks.filter(t => {
        const deadline = t.deadline?.toDate?.() || new Date(t.deadline);
        return deadline < now && t.status !== 'completed';
    });

    const tasksPerUser = users.map(u => {
        const userTasks = tasks.filter(t => t.assignedTo === u.uid);
        const userCompleted = userTasks.filter(t => t.status === 'completed').length;
        const userInProgress = userTasks.filter(t => t.status === 'inprogress').length;
        const userTodo = userTasks.filter(t => t.status === 'todo' || t.status === 'pending').length;
        const userRejected = userTasks.filter(t => t.status === 'rejected').length;
        const userOverdue = userTasks.filter(t => {
            const deadline = t.deadline?.toDate?.() || new Date(t.deadline);
            return deadline < now && t.status !== 'completed';
        }).length;

        const completedOnTime = userTasks.filter(t => {
            const deadline = t.deadline?.toDate?.() || new Date(t.deadline);
            const updated = t.updatedAt?.toDate?.() || new Date(t.updatedAt);
            return t.status === 'completed' && updated <= deadline;
        }).length;

        const avgCompletion = userTasks.filter(t => t.status === 'completed').reduce((sum, t) => {
            const created = t.createdAt?.toDate?.() || new Date(t.createdAt);
            const updated = t.updatedAt?.toDate?.() || new Date(t.updatedAt);
            return sum + hoursBetween(created, updated);
        }, 0) / (userTasks.filter(t => t.status === 'completed').length || 1);

        return {
            name: u.name || 'Unnamed',
            count: userTasks.length,
            completed: userCompleted,
            inProgress: userInProgress,
            todo: userTodo,
            rejected: userRejected,
            overdue: userOverdue,
            completedOnTime,
            avgCompletion
        };
    });

    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const tasksPerDay = last7Days.map(day =>
        tasks.filter(t => (t.createdAt?.toDate?.() || new Date(t.createdAt)).toISOString().split('T')[0] === day).length
    );

    const chartConfig = {
        backgroundGradientFrom: theme.colors.background,
        backgroundGradientTo: theme.colors.background,
        decimalPlaces: 0,
        color: (opacity = 1) => theme.colors.text,
        labelColor: (opacity = 1) => theme.colors.text,
    };

  

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScrollView style={{ flex: 1, padding: 16 }}>
                {/* KPI Cards */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 }}>
                    {[tasks.length, completedTasks, inProgressTasks, todoTasks, rejectedTasks, overdueTasks.length].map((value, idx) => (
                        <Card key={idx} style={[styles.kpiCard, { width: screenWidth < 400 ? '48%' : '30%', backgroundColor: theme.colors.card }]}>
                            <Card.Content style={{ alignItems: 'center' }}>
                                <Text style={[styles.kpiValue, { fontSize: 18 * scale, color: theme.colors.text }]}>{value}</Text>
                                <Text style={[styles.kpiLabel, { fontSize: 12 * scale, color: theme.colors.text }]}>
                                    {['Total', 'Completed', 'In Progress', 'To Do', 'Rejected', 'Overdue'][idx]}
                                </Text>
                            </Card.Content>
                        </Card>
                    ))}
                </View>

                {/* Task Status PieChart */}
                <Text style={[styles.sectionTitle, { fontSize: 18 * scale, color: theme.colors.text }]}>Task Status</Text>
                <PieChart
                    data={[
                        { name: 'To Do', count: todoTasks, color: '#f39c12', legendFontColor: theme.colors.text, legendFontSize: 12 },
                        { name: 'In Progress', count: inProgressTasks, color: '#3498db', legendFontColor: theme.colors.text, legendFontSize: 12 },
                        { name: 'Completed', count: completedTasks, color: '#2ecc71', legendFontColor: theme.colors.text, legendFontSize: 12 },
                        { name: 'Rejected', count: rejectedTasks, color: '#e74c3c', legendFontColor: theme.colors.text, legendFontSize: 12 },
                    ]}
                    width={screenWidth - 32}
                    height={220}
                    chartConfig={chartConfig}
                    accessor="count"
                    backgroundColor="transparent"
                    paddingLeft="10"
                />

                {/* Tasks per User BarChart */}
                <Text style={[styles.sectionTitle, { fontSize: 18 * scale, color: theme.colors.text }]}>Tasks per User</Text>
                <BarChart
                    data={{ labels: tasksPerUser.map(u => u.name), datasets: [{ data: tasksPerUser.map(u => u.count) }] }}
                    width={screenWidth - 32}
                    height={300}
                    chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(52,152,219,${opacity})` }}
                    verticalLabelRotation={20}
                />

                {/* Average Completion */}
                <Text style={[styles.sectionTitle, { fontSize: 18 * scale, color: theme.colors.text }]}>Average Completion Time (hrs)</Text>
                <BarChart
                    data={{ labels: tasksPerUser.map(u => u.name), datasets: [{ data: tasksPerUser.map(u => u.avgCompletion) }] }}
                    width={screenWidth - 32}
                    height={300}
                    chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(46,204,113,${opacity})` }}
                    verticalLabelRotation={20}
                />

                {/* Most Rejected User */}


                {/* Tasks Last 7 Days LineChart */}
                <Text style={[styles.sectionTitle, { fontSize: 18 * scale, color: theme.colors.text }]}>Tasks Created (Last 7 Days)</Text>
                <LineChart
                    data={{ labels: last7Days.map(d => d.slice(5)), datasets: [{ data: tasksPerDay }] }}
                    width={screenWidth - 32}
                    height={300}
                    chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(231,76,60,${opacity})` }}
                    bezier
                />

                {/* Users List */}
                <Text style={[styles.sectionTitle, { fontSize: 18 * scale, color: theme.colors.text }]}>Users</Text>
                {tasksPerUser.map(user => (
                    <TouchableOpacity
                        key={user.name}
                        style={[styles.userCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                        onPress={() => { setSelectedUser(user); setModalVisible(true); }}
                    >
                        <Text style={{ color: theme.colors.text, fontSize: 16 * scale }}>{user.name}</Text>
                    </TouchableOpacity>
                ))}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalBackground}>
                        <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                            <View style={styles.modalHeader}>
                                <Ionicons name="person-circle-outline" size={32 * scale} color={theme.colors.primary} />
                                <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: 20 * scale }]}>
                                    {selectedUser?.name}
                                </Text>
                            </View>

                            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

                            {/* Stats */}
                            <View style={styles.statsContainer}>
                                {[
                                    { icon: 'clipboard-outline', label: 'Total Tasks', value: selectedUser?.count, color: '#3498db' },
                                    { icon: 'checkmark-circle-outline', label: 'Completed', value: selectedUser?.completed, color: '#2ecc71' },
                                    { icon: 'sync-outline', label: 'In Progress', value: selectedUser?.inProgress, color: '#f1c40f' },
                                    { icon: 'time-outline', label: 'To Do', value: selectedUser?.todo, color: '#f39c12' },
                                    { icon: 'close-circle-outline', label: 'Rejected', value: selectedUser?.rejected, color: '#e74c3c' },
                                    { icon: 'alarm-outline', label: 'Overdue', value: selectedUser?.overdue, color: '#e67e22' },
                                    { icon: 'checkmark-done-circle-outline', label: 'Completed On Time', value: selectedUser?.completedOnTime, color: '#27ae60' },
                                    { icon: 'stopwatch-outline', label: 'Avg Completion (hrs)', value: selectedUser?.avgCompletion.toFixed(1), color: '#8e44ad' },
                                ].map((stat, idx) => (
                                    <View key={idx} style={styles.statRow}>
                                        <Ionicons name={stat.icon} size={20 * scale} color={stat.color} />
                                        <Text style={[styles.statText, { fontSize: 16 * scale, color: theme.colors.text }]}>
                                            {stat.label}: <Text style={{ fontWeight: 'bold' }}>{stat.value}</Text>
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* Close Button */}
                            <Pressable
                                style={[styles.closeButton, { backgroundColor: theme.colors.primary }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={[styles.closeButtonText, { fontSize: 16 * scale }]}>Close</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>


            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    sectionTitle: { fontWeight: 'bold', marginVertical: 12 },
    kpiCard: { marginBottom: 12, paddingVertical: 16, alignItems: 'center' },
    kpiValue: { fontWeight: 'bold', marginBottom: 4 },
    kpiLabel: {},
    userCard: { padding: 12, marginVertical: 6, borderRadius: 8 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
    closeButton: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 16,
    },
    modalContent: {
        width: '100%',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap:4,
        marginBottom: 12,
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 16,
    },
    statsContainer: {
        marginBottom: 24,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 6,
    },
    statText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 8,
        flexShrink: 1,
    },

    closeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default DashboardScreen;