import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Portal, Modal, Card, Text, IconButton, TextInput, Menu } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';

const { height } = Dimensions.get('window');

const PremiumTasksModal = ({ visible, onDismiss, selectedUser, theme }) => {
    const [remarkModalVisible, setRemarkModalVisible] = useState(false);
    const [remarkText, setRemarkText] = useState('');
    const [currentTaskId, setCurrentTaskId] = useState(null);

    // Menu state for status updates
    const [menuVisible, setMenuVisible] = useState(null);

    const deleteTask = async (taskId) => {
        await firestore().collection('tasks').doc(taskId).delete();
        selectedUser.tasks = selectedUser.tasks.filter(task => task.taskId !== taskId);
    };

    const openAddRemark = (taskId) => {
        setCurrentTaskId(taskId);
        setRemarkText('');
        setRemarkModalVisible(true);
    };

    const saveRemark = async () => {
        if (!remarkText) return;
        const taskRef = firestore().collection('tasks').doc(currentTaskId);
        const taskDoc = await taskRef.get();
        const updatedRemarks = [remarkText, ...(taskDoc.data().remarks || [])];

        await taskRef.update({ remarks: updatedRemarks, updatedAt: firestore.FieldValue.serverTimestamp() });
        selectedUser.tasks = selectedUser.tasks.map(task =>
            task.taskId === currentTaskId ? { ...task, remarks: updatedRemarks } : task
        );
        setRemarkText('');
        setRemarkModalVisible(false);
    };

    const updateStatus = async (taskId, newStatus) => {
        const taskRef = firestore().collection('tasks').doc(taskId);
        await taskRef.update({ status: newStatus, updatedAt: firestore.FieldValue.serverTimestamp() });

        selectedUser.tasks = selectedUser.tasks.map(task =>
            task.taskId === taskId ? { ...task, status: newStatus } : task
        );

        setMenuVisible(null);
    };

    const statusColors = {
        pending: '#FFB300',
        'in-progress': '#2196F3',
        completed: '#4CAF50',
    };

    const statusOptions = ['pending', 'in-progress', 'completed'];

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={[
                    styles.modalContent,
                    { backgroundColor: theme.colors.card, maxHeight: height * 0.8 }
                ]}
            >
                {/* Header */}
                <View style={styles.headerRow}>
                    <Ionicons name="briefcase-outline" size={22} color={theme.colors.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.headerText, { color: theme.colors.text }]}>
                        {selectedUser?.name}'s Tasks
                    </Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {selectedUser?.tasks?.length ? (
                        selectedUser.tasks.map((task) => {
                            const isOverdue = task.deadline?.toDate?.() < new Date() && task.status !== 'completed';

                            return (
                                <Card
                                    key={task.taskId}
                                    style={[
                                        styles.taskCard,
                                        {
                                            backgroundColor: theme.colors.background,
                                            borderColor: isOverdue ? '#FF3B30' : 'transparent',
                                            borderWidth: isOverdue ? 1 : 0,
                                        }
                                    ]}
                                >
                                    <Card.Content>
                                        {/* Task Title */}
                                        <View style={styles.taskHeader}>
                                            <Ionicons name="list-circle-outline" size={22} color={theme.colors.primary} style={{ marginRight: 8 }} />
                                            <Text style={[styles.taskTitle, { color: theme.colors.text }]}>{task.title}</Text>
                                        </View>

                                        {/* Deadline */}
                                        <View style={styles.row}>
                                            <Ionicons name="calendar-outline" size={18} color={isOverdue ? '#FF3B30' : theme.colors.text} style={{ marginRight: 6 }} />
                                            <Text style={{ color: isOverdue ? '#FF3B30' : theme.colors.text, fontSize: 15 }}>
                                                {task.deadline?.toDate?.()?.toDateString?.() || 'N/A'}
                                            </Text>
                                        </View>

                                        {/* Description */}
                                        {task.description ? (
                                            <View style={styles.row}>
                                                <Ionicons name="document-text-outline" size={18} color={theme.colors.text} style={{ marginRight: 6, marginTop: 2 }} />
                                                <Text style={{ color: theme.colors.text, fontSize: 15, flexShrink: 1 }}>{task.description}</Text>
                                            </View>
                                        ) : null}

                                        {/* Remarks */}
                                        {task.remarks?.length > 0 && (
                                            <View style={styles.remarksWrapper}>
                                                {task.remarks.map((remark, index) => (
                                                    <View key={index} style={styles.remarkChip}>
                                                        <Ionicons name="chatbubble-ellipses-outline" size={14} color="#333" style={{ marginRight: 4 }} />
                                                        <Text style={{ fontSize: 13, color: '#333' }}>{remark}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}

                                        {/* Actions Row */}
                                        <View style={styles.actionsRow}>
                                            <IconButton
                                                icon="trash-can-outline"
                                                iconColor="#FF3B30"
                                                size={26}
                                                onPress={() => deleteTask(task.taskId)}
                                            />
                                            <IconButton
                                                icon="pencil-outline"
                                                iconColor={theme.colors.primary}
                                                size={26}
                                                onPress={() => openAddRemark(task.taskId)}
                                            />

                                            {/* Status Dropdown */}
                                            <Menu
                                                visible={menuVisible === task.taskId}
                                                onDismiss={() => setMenuVisible(null)}
                                                anchor={
                                                    <View style={styles.statusContainer}>
                                                        <Ionicons name="ellipse" size={12} color={statusColors[task.status]} style={{ marginRight: 6 }} />
                                                        <Text
                                                            style={{ fontSize: 13, color: statusColors[task.status], fontWeight: '600' }}
                                                            onPress={() => setMenuVisible(task.taskId)}
                                                        >
                                                            {task.status.toUpperCase()}
                                                        </Text>
                                                    </View>
                                                }
                                            >
                                                {statusOptions.map((status) => (
                                                    <Menu.Item
                                                        key={status}
                                                        onPress={() => updateStatus(task.taskId, status)}
                                                        title={status.toUpperCase()}
                                                        leadingIcon={() => (
                                                            <Ionicons name="ellipse" size={12} color={statusColors[status]} />
                                                        )}
                                                    />
                                                ))}
                                            </Menu>
                                        </View>
                                    </Card.Content>
                                </Card>
                            );
                        })
                    ) : (
                        <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20, fontSize: 15 }}>
                            No tasks assigned
                        </Text>
                    )}
                </ScrollView>

                {/* Close Button */}
                <IconButton
                    icon="close-circle-outline"
                    iconColor={theme.colors.primary}
                    size={38}
                    style={{ alignSelf: 'center', marginTop: 16 }}
                    onPress={onDismiss}
                />

                {/* Add Remark Modal */}
                <Portal>
                    <Modal
                        visible={remarkModalVisible}
                        onDismiss={() => setRemarkModalVisible(false)}
                        contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.card }]}
                    >
                        <Text style={[styles.headerText, { fontSize: 18, color: theme.colors.text }]}>Add Remark</Text>
                        <TextInput
                            placeholder="Enter your remark"
                            value={remarkText}
                            onChangeText={setRemarkText}
                            style={[styles.remarkInput, { backgroundColor: theme.colors.background }]}
                        />
                        <IconButton
                            icon="checkmark-circle-outline"
                            iconColor={theme.colors.primary}
                            size={34}
                            onPress={saveRemark}
                            style={{ alignSelf: 'center', marginTop: 10 }}
                        />
                    </Modal>
                </Portal>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalContent: { padding: 22, borderRadius: 18, marginHorizontal: 18 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    headerText: { fontSize: 22, fontWeight: '700' },
    taskCard: { borderRadius: 16, elevation: 3, marginBottom: 18, padding: 6 },
    taskHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    taskTitle: { fontSize: 18, fontWeight: '600' },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    remarksWrapper: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    remarkChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0E0E0',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        marginRight: 8,
        marginBottom: 8
    },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14
    },
    remarkInput: { borderRadius: 10, paddingHorizontal: 14, marginBottom: 14 }
});

export default PremiumTasksModal;
