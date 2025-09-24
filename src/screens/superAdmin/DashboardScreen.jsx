import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Modal,
    Pressable,
    ScrollView,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DashboardCharts from "./DashBoardCharts"

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

    // States
    const [admins, setAdmins] = useState([]);
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [usersMap, setUsersMap] = useState({});
    const [selectedModal, setSelectedModal] = useState(null); // 'admins', 'users', 'pending', etc.
    const [selectedTaskDetail, setSelectedTaskDetail] = useState(null); // detailed task modal
    const [selectedUserDetail, setSelectedUserDetail] = useState(null); // user/admin detail modal

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

    // Create UID → user map (admins + users)
    useEffect(() => {
        const map = {};
        [...admins, ...users].forEach(u => {
            map[u.uid] = u;
        });
        setUsersMap(map);
    }, [admins, users]);

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

    const taskStats = {
        pending: tasks.filter(t => t.status === 'pending'),
        inprogress: tasks.filter(t => t.status === 'inprogress'),
        completed: tasks.filter(t => t.status === 'completed'),
        rejected: tasks.filter(t => t.status === 'rejected'),
    };

    const getUserLabel = uid => {
        const user = usersMap[uid];
        if (!user) return uid;
        return `${user.name || 'Unknown'} (${user.email || 'no email'})`;
    };

    const getStatusColor = status => {
        switch (status) {
            case 'pending': return '#f1c40f';
            case 'inprogress': return '#2980b9';
            case 'completed': return '#27ae60';
            case 'rejected': return '#e74c3c';
            default: return '#999';
        }
    };

    const renderStatCard = (title, value, iconName, bgColor, modalKey) => (
        <TouchableOpacity
            onPress={() => setSelectedModal(modalKey)}
            style={[styles.statCard, { backgroundColor: bgColor, padding: 16 * scale, borderRadius: 12 * scale }]}
        >
            <Ionicons name={iconName} size={28 * scale} color="#fff" />
            <Text style={[styles.statTitle, { fontSize: 14 * scale }]}>{title}</Text>
            <Text style={[styles.statValue, { fontSize: 18 * scale }]}>{Array.isArray(value) ? value.length : value}</Text>
        </TouchableOpacity>
    );
    // Task/List Modal
    const renderTaskListModal = () => {
        if (!selectedModal) return null;

        let data = [];
        let title = '';
        switch (selectedModal) {
            case 'admins':
                data = admins;
                title = 'Admins';
                break;
            case 'users':
                data = users;
                title = 'Users';
                break;
            case 'pending':
            case 'inprogress':
            case 'completed':
            case 'rejected':
                data = taskStats[selectedModal];
                title = `${selectedModal.charAt(0).toUpperCase() + selectedModal.slice(1)} Tasks`;
                break;
            default:
                break;
        }

        const renderLegend = () =>
            ['pending', 'inprogress', 'completed', 'rejected'].includes(selectedModal) && (
                <View style={styles.legendContainer}>
                    {['pending', 'inprogress', 'completed', 'rejected'].map((status, index) => (
                        <View key={index} style={styles.legendItem}>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]} />
                            <Text style={[styles.legendLabel, { color: theme.colors.text }]}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Text>
                        </View>
                    ))}
                </View>
            );

        return (
            <Modal visible={!!selectedModal} animationType="slide" transparent={true}>
                <View style={[styles.modalOverlay, { backgroundColor: theme.colors.background + 'DD' }]}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{title}</Text>
                        {renderLegend()}

                        <FlatList
                            data={data}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.cardItem,
                                        {
                                            backgroundColor: theme.colors.card,
                                            borderLeftColor: ['pending', 'inprogress', 'completed', 'rejected'].includes(selectedModal)
                                                ? getStatusColor(item.status)
                                                : theme.colors.border,
                                        },
                                    ]}
                                    onPress={() =>
                                        ['pending', 'inprogress', 'completed', 'rejected'].includes(selectedModal)
                                            ? setSelectedTaskDetail(item)
                                            : null
                                    }
                                >
                                    {selectedModal === 'admins' || selectedModal === 'users' ? (
                                        <>
                                            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{item.name}</Text>
                                            <Text style={[styles.cardSubtitle, { color: theme.colors.text }]}>{item.email}</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{item.title}</Text>
                                            <Text style={[styles.cardSubtitle, { color: theme.colors.text }]}>
                                                Status: {item.status}
                                            </Text>
                                            <Text style={[styles.cardSubtitle, { color: theme.colors.text }]}>
                                                Assigned By:{' '}
                                                <Text
                                                    style={{ color: theme.colors.primary }}
                                                    onPress={() => setSelectedUserDetail(usersMap[item.assignedBy])}
                                                >
                                                    {getUserLabel(item.assignedBy)}
                                                </Text>
                                            </Text>
                                            <Text style={[styles.cardSubtitle, { color: theme.colors.text }]}>
                                                Assigned To:{' '}
                                                <Text
                                                    style={{ color: theme.colors.primary }}
                                                    onPress={() => setSelectedUserDetail(usersMap[item.assignedTo])}
                                                >
                                                    {getUserLabel(item.assignedTo)}
                                                </Text>
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={{ color: theme.colors.text }}>No records found.</Text>}
                        />

                        <Pressable style={[styles.closeButton, { backgroundColor: theme.colors.primary }]} onPress={() => setSelectedModal(null)}>
                            <Text style={{ color: '#fff', fontWeight: '600' }}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        );
    };

    const renderTaskDetailModal = () => {
        if (!selectedTaskDetail) return null;
        const task = selectedTaskDetail;

        return (
            <Modal visible={!!selectedTaskDetail} animationType="slide" transparent={true}>
                <View style={[styles.modalOverlay, { backgroundColor: theme.colors.background + 'DD' }]}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
                        <ScrollView>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{task.title}</Text>

                            <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Description:</Text>
                            <Text style={[styles.detailText, { color: theme.colors.text }]}>{task.description}</Text>

                            <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Status:</Text>
                            <Text style={[styles.detailText, { color: getStatusColor(task.status) }]}>{task.status}</Text>

                            <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Assigned By:</Text>
                            <TouchableOpacity onPress={() => setSelectedUserDetail(usersMap[task.assignedBy])}>
                                <Text style={[styles.detailText, { color: theme.colors.primary }]}>{getUserLabel(task.assignedBy)}</Text>
                            </TouchableOpacity>

                            <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Assigned To:</Text>
                            <TouchableOpacity onPress={() => setSelectedUserDetail(usersMap[task.assignedTo])}>
                                <Text style={[styles.detailText, { color: theme.colors.primary }]}>{getUserLabel(task.assignedTo)}</Text>
                            </TouchableOpacity>

                            <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Created At:</Text>
                            <Text style={[styles.detailText, { color: theme.colors.text }]}>{task.createdAt?.toDate().toLocaleString()}</Text>

                            <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Deadline:</Text>
                            <Text style={[styles.detailText, { color: theme.colors.text }]}>{task.deadline?.toDate().toLocaleString()}</Text>

                            {task.remark && (
                                <>
                                    <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Remark:</Text>
                                    <Text style={[styles.detailText, { color: theme.colors.text }]}>{task.remark}</Text>
                                </>
                            )}

                            {task.rejectRemark && (
                                <>
                                    <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Reject Remark:</Text>
                                    <Text style={[styles.detailText, { color: theme.colors.text }]}>{task.rejectRemark}</Text>
                                </>
                            )}

                            {task.remarks?.length > 0 && (
                                <>
                                    <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Remarks List:</Text>
                                    {task.remarks.map((r, i) => (
                                        <Text key={i} style={[styles.detailText, { color: theme.colors.text }]}>
                                            - {r}
                                        </Text>
                                    ))}
                                </>
                            )}
                        </ScrollView>

                        <Pressable
                            style={[styles.closeButton, { backgroundColor: theme.colors.primary }]}
                            onPress={() => setSelectedTaskDetail(null)}
                        >
                            <Text style={{ color: '#fff', fontWeight: '600' }}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        );
    };

    const renderUserDetailModal = () => {
        if (!selectedUserDetail) return null;

        const user = selectedUserDetail;
        const assignedTasksCount = tasks.filter(t => t.assignedTo === user.uid).length;

        const handleDeleteUser = async () => {
            Alert.alert(
                'Delete User',
                `Are you sure you want to delete ${user.name}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                await firestore().collection('users').doc(user.id).delete();
                                setSelectedUserDetail(null);
                                Alert.alert('Deleted', 'User deleted successfully.');
                            } catch (error) {
                                console.error(error);
                                Alert.alert('Error', 'Failed to delete user.');
                            }
                        },
                    },
                ]
            );
        };

        return (
            <Modal visible={!!selectedUserDetail} animationType="slide" transparent={true}>
                <View style={[styles.modalOverlay, { backgroundColor: theme.colors.background + 'CC' }]}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
                        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>User Details</Text>

                            <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Name:</Text>
                            <Text style={[styles.detailText, { color: theme.colors.text }]}>{user.name}</Text>

                            <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Role:</Text>
                            <Text style={[styles.detailText, { color: theme.colors.text }]}>{user.role}</Text>

                            <Text style={[styles.detailLabel, { color: theme.colors.text }]}>No. of Tasks:</Text>
                            <Text style={[styles.detailText, { color: theme.colors.text }]}>{assignedTasksCount}</Text>

                            <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Email / Phone:</Text>
                            <Text style={[styles.detailText, { color: theme.colors.text }]}>
                                {user.email || 'N/A'}{user.phone ? ` / ${user.phone}` : ''}
                            </Text>

                            {/* Delete Button */}
                            <Pressable
                                style={[
                                    styles.closeButton,
                                    {
                                        backgroundColor: assignedTasksCount > 0 ? '#95a5a6' : '#e74c3c',
                                        marginTop: 20,
                                        opacity: assignedTasksCount > 0 ? 0.6 : 1,
                                    },
                                ]}
                                disabled={assignedTasksCount > 0}
                                onPress={handleDeleteUser}
                            >
                                <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>
                                    {assignedTasksCount > 0 ? 'Cannot delete (tasks assigned)' : 'Delete User'}
                                </Text>
                            </Pressable>

                            {/* Close Button */}
                            <Pressable
                                style={[styles.closeButton, { backgroundColor: theme.colors.primary, marginTop: 12 }]}
                                onPress={() => setSelectedUserDetail(null)}
                            >
                                <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>Close</Text>
                            </Pressable>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    };


    return (

        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {renderStatCard('Admins', admins, 'shield-outline', '#3498db', 'admins')}
                    {renderStatCard('Users', users, 'people-outline', '#2ecc71', 'users')}
                    {renderStatCard('Pending Tasks', taskStats.pending, 'time-outline', '#f1c40f', 'pending')}
                    {renderStatCard('In Progress', taskStats.inprogress, 'construct-outline', '#2980b9', 'inprogress')}
                    {renderStatCard('Completed', taskStats.completed, 'checkmark-done-outline', '#27ae60', 'completed')}
                    {renderStatCard('Rejected', taskStats.rejected, 'close-circle-outline', '#e74c3c', 'rejected')}
                </View>

                {/* Charts */}
                <DashboardCharts tasks={tasks} admins={admins} users={users} />
            </ScrollView>

            {/* Modals */}
            {renderTaskListModal()}
            {renderTaskDetailModal()}
            {renderUserDetailModal()}
        </SafeAreaView>

    );
};

const styles = StyleSheet.create({
    statCard: { width: '48%', marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
    statTitle: { color: '#fff', marginTop: 8, fontWeight: '600' },
    statValue: { color: '#fff', fontWeight: '700', marginTop: 4 },
    modalOverlay: { flex: 1, justifyContent: 'center', padding: 16 },
    modalContent: { borderRadius: 12, padding: 16, maxHeight: '90%' },
    modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
    cardItem: {
        marginBottom: 10,
        borderRadius: 10,
        padding: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        borderLeftWidth: 6,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    cardSubtitle: { fontSize: 14 },
    legendContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendLabel: { marginLeft: 6, fontSize: 12 },
    statusBadge: { width: 12, height: 12, borderRadius: 6 },
    closeButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
    detailLabel: { fontWeight: '700', marginTop: 10, marginBottom: 4 },
    detailText: { fontSize: 14, lineHeight: 20 },
});

export default DashboardScreen;
