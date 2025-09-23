import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
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

    const [admins, setAdmins] = useState([]);
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);

    // Fetch admins
    useEffect(() => {
        const unsubscribe = firestore()
            .collection('users')
            .where('role', '==', 'admin')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAdmins(data);
            });
        return () => unsubscribe();
    }, []);

    // Fetch users
    useEffect(() => {
        const unsubscribe = firestore()
            .collection('users')
            .where('role', '==', 'user')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUsers(data);
            });
        return () => unsubscribe();
    }, []);

    // Fetch tasks
    useEffect(() => {
        const unsubscribe = firestore()
            .collection('tasks')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTasks(data);
            });
        return () => unsubscribe();
    }, []);

    // Compute task stats
    const taskStats = {
        pending: tasks.filter(t => t.status === 'pending').length,
        inprogress: tasks.filter(t => t.status === 'inprogress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        rejected: tasks.filter(t => t.status === 'rejected').length,
    };

    const renderStatCard = (title, value, iconName, bgColor) => (
        <View style={[styles.statCard, { backgroundColor: bgColor, padding: 16 * scale, borderRadius: 12 * scale }]}>
            <Ionicons name={iconName} size={28 * scale} color="#fff" />
            <Text style={[styles.statTitle, { fontSize: 14 * scale }]}>{title}</Text>
            <Text style={[styles.statValue, { fontSize: 18 * scale }]}>{value}</Text>
        </View>
    );

    const renderTaskItem = ({ item }) => (
        <View style={[styles.taskCard, { backgroundColor: theme.colors.card, padding: 12 * scale, borderRadius: 12 * scale }]}>
            <Text style={[styles.taskTitle, { color: theme.colors.text, fontSize: 16 * scale }]}>{item.title}</Text>
            <Text style={[styles.taskInfo, { color: theme.colors.text, fontSize: 14 * scale }]}>Status: {item.status}</Text>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 16 }}>
                {renderStatCard('Admins', admins.length, 'shield-outline', '#3498db')}
                {renderStatCard('Users', users.length, 'people-outline', '#2ecc71')}
                {renderStatCard('Pending Tasks', taskStats.pending, 'time-outline', '#f1c40f')}
                {renderStatCard('In Progress', taskStats.inprogress, 'construct-outline', '#2980b9')}
                {renderStatCard('Completed', taskStats.completed, 'checkmark-done-outline', '#27ae60')}
                {renderStatCard('Rejected', taskStats.rejected, 'close-circle-outline', '#e74c3c')}
            </View>

            <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: 16 * scale, marginLeft: 16 }]}>
                Latest Tasks
            </Text>

            <FlatList
                data={tasks.slice(0, 10).reverse()}
                renderItem={renderTaskItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-outline" size={50 * scale} color="#ccc" />
                        <Text style={[styles.emptyText, { color: theme.colors.text, fontSize: 16 * scale }]}>No tasks available</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    statCard: {
        width: '48%',
        marginBottom: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statTitle: {
        color: '#fff',
        marginTop: 8,
        fontWeight: '600',
    },
    statValue: {
        color: '#fff',
        fontWeight: '700',
        marginTop: 4,
    },
    sectionTitle: {
        fontWeight: '700',
        marginVertical: 8,
    },
    taskCard: {
        marginVertical: 6,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        padding: 12,
    },
    taskTitle: { fontWeight: '700' },
    taskInfo: { marginTop: 4 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
    emptyText: { marginTop: 16, textAlign: 'center' },
});

export default DashboardScreen;
