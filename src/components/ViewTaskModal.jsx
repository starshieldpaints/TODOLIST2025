import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Portal, Modal, Card, Text, IconButton, TextInput, Menu, Button } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import { useTheme } from "../hooks/useTheme";

const { height, width } = Dimensions.get('window');

const PremiumTasksModal = ({ visible, onDismiss, selectedUser }) => {
    const [remarkModalVisible, setRemarkModalVisible] = useState(false);
    const [remarkText, setRemarkText] = useState('');
    const [currentTaskId, setCurrentTaskId] = useState(null);
    const [menuVisible, setMenuVisible] = useState(null);


    console.log("Selected User :",selectedUser)

    // Use the theme context provided by the user
    const theme = useTheme();

    // --- Utility Functions ---

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

    // HARDCODED STATUS COLORS (since the theme object cannot be extended)
    const statusColors = {
        pending: '#FFB300',      // Hardcoded Warning/Amber
        'in-progress': '#2196F3',// Hardcoded Info/Blue
        completed: '#4CAF50',    // Hardcoded Success/Green
        error: '#FF3B30',        // Hardcoded Error/Red for overdue/delete
        textSecondary: theme.dark ? '#9CA3AF' : '#6B7280', // Inferred secondary text color
        backgroundVariant: theme.dark ? '#374151' : '#E5E7EB', // Inferred background variant
    };

    const statusOptions = ['pending', 'in-progress', 'completed'];

    // --- Component JSX (Modernized UI with strict theme usage) ---

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={[
                    styles.modalContent,
                    // Use theme.colors.card for the modal background
                    { backgroundColor: theme.colors.card, maxHeight: height * 0.9 }
                ]}
            >
                {/* Close Button at Top Right */}
                <IconButton
                    icon="close"
                    // Using inferred secondary color for close button
                    iconColor={statusColors.textSecondary}
                    size={28}
                    style={styles.closeButton}
                    onPress={onDismiss}
                />

                {/* Header */}
                <View style={styles.headerRow}>
                    <Ionicons name="briefcase-outline" size={24} color={theme.colors.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.headerText, { color: theme.colors.text }]}>
                        {selectedUser?.name}'s Tasks
                    </Text>
                </View>

                {/* Task List Scroll View */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 10 }}
                >
                    {selectedUser?.tasks?.length ? (
                        selectedUser.tasks.map((task) => {
                            const isOverdue = task.deadline?.toDate?.() < new Date() && task.status !== 'completed';

                            return (
                                <View key={task.taskId} style={styles.taskContainer}>
                                    <Card
                                        style={[
                                            styles.taskCard,
                                            {
                                                // Use theme.colors.background for the card content area
                                                backgroundColor: theme.colors.background,
                                                // Hardcoded shadow & overdue border
                                                shadowColor: theme.dark ? '#FFFFFF' : '#000000',
                                                shadowOpacity: theme.dark ? 0.2 : 0.08,
                                                borderColor: isOverdue ? statusColors.error : 'transparent',
                                                borderWidth: 1,
                                            }
                                        ]}
                                    >
                                        <Card.Content style={styles.cardInnerContent}>
                                            {/* Task Title */}
                                            <View style={styles.taskHeader}>
                                                <Text style={[styles.taskTitle, { color: theme.colors.text }]}>{task.title}</Text>

                                                {/* Status Dropdown */}
                                                <Menu
                                                    visible={menuVisible === task.taskId}
                                                    onDismiss={() => setMenuVisible(null)}
                                                    anchor={
                                                        <TouchableOpacity
                                                            style={[styles.statusContainer, { backgroundColor: statusColors.backgroundVariant }]}
                                                            onPress={() => setMenuVisible(task.taskId)}
                                                        >
                                                            <Ionicons name="ellipse" size={10} color={statusColors[task.status]} style={{ marginRight: 4 }} />
                                                            <Text style={{ fontSize: 13, color: statusColors[task.status], fontWeight: '700' }}>
                                                                {task.status.toUpperCase()}
                                                            </Text>
                                                            {/* Using inferred secondary color for icon */}
                                                            <Ionicons name="chevron-down" size={14} color={statusColors.textSecondary} style={{ marginLeft: 4 }} />
                                                        </TouchableOpacity>
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
                                                            // Menu items use card color for background, text color for text
                                                            style={{ backgroundColor: theme.colors.card }}
                                                            titleStyle={{ color: theme.colors.text }}
                                                        />
                                                    ))}
                                                </Menu>
                                            </View>

                                            {/* Description */}
                                            {task.description ? (
                                                <View style={styles.rowDetail}>
                                                    <Text style={[styles.detailText, { color: statusColors.textSecondary, flexShrink: 1 }]}>
                                                        {task.description}
                                                    </Text>
                                                </View>
                                            ) : null}

                                            {/* Deadline & Overdue Tag */}
                                            <View style={styles.rowDetail}>
                                                {/* Using hardcoded error color for overdue, secondary text otherwise */}
                                                <Ionicons name="time-outline" size={16} color={isOverdue ? statusColors.error : statusColors.textSecondary} style={{ marginRight: 6 }} />
                                                <Text style={{ color: isOverdue ? statusColors.error : statusColors.textSecondary, fontSize: 13, fontWeight: '500' }}>
                                                    {task.deadline?.toDate?.()?.toLocaleDateString?.() || 'No Deadline'}
                                                </Text>
                                                {isOverdue && (
                                                    <Text style={[styles.overdueTag, { backgroundColor: statusColors.error, color: '#FFFFFF' }]}>
                                                        OVERDUE
                                                    </Text>
                                                )}
                                            </View>

                                            {/* Remarks */}
                                            {task.remarks?.length > 0 && (
                                                <View style={styles.remarksWrapper}>
                                                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.colors.primary} style={{ marginRight: 6 }} />
                                                    <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>Remarks:</Text>
                                                    {task.remarks.slice(0, 1).map((remark, index) => (
                                                        <Text key={index} style={[styles.remarkText, { color: statusColors.textSecondary }]}>
                                                            {remark}
                                                        </Text>
                                                    ))}
                                                </View>
                                            )}

                                            {/* Actions Row */}
                                            {/* Using theme.colors.border (88C540) as the separator line, as it is the only border color provided */}
                                            <View style={[styles.actionsRow, { borderTopColor: theme.colors.border }]}>
                                                <Button
                                                    mode='outlined'
                                                    onPress={() => openAddRemark(task.taskId)}
                                                    icon="comment-plus-outline"
                                                    labelStyle={styles.actionButtonText}
                                                    textColor={theme.colors.primary}
                                                    style={[styles.actionButton, { borderColor: theme.colors.primary, borderWidth: 1 }]}
                                                >
                                                    Remark
                                                </Button>
                                                <Button
                                                    mode='outlined'
                                                    onPress={() => deleteTask(task.taskId)}
                                                    icon="trash-can-outline"
                                                    labelStyle={styles.actionButtonText}
                                                    // Using hardcoded error color for delete action
                                                    textColor={statusColors.error}
                                                    style={[styles.actionButton, { borderColor: statusColors.error, borderWidth: 1 }]}
                                                >
                                                    Delete
                                                </Button>
                                            </View>
                                        </Card.Content>
                                    </Card>
                                </View>
                            );
                        })
                    ) : (
                        <View style={{ paddingVertical: 40 }}>
                            <Ionicons name="file-tray-outline" size={50} color={statusColors.textSecondary} style={{ alignSelf: 'center', marginBottom: 10 }} />
                            <Text style={{ color: statusColors.textSecondary, textAlign: 'center', fontSize: 16 }}>
                                No tasks assigned to {selectedUser?.name}
                            </Text>
                        </View>
                    )}
                </ScrollView>

                {/* Add Remark Modal */}
                <Portal>
                    <Modal
                        visible={remarkModalVisible}
                        onDismiss={() => setRemarkModalVisible(false)}
                        contentContainerStyle={[styles.remarkModalContent, { backgroundColor: theme.colors.card }]}
                    >
                        <Text style={[styles.remarkModalHeader, { color: theme.colors.text }]}>Add Task Remark</Text>
                        <TextInput
                            placeholder="Enter your remark..."
                            placeholderTextColor={statusColors.textSecondary}
                            value={remarkText}
                            onChangeText={setRemarkText}
                            mode="outlined"
                            multiline
                            numberOfLines={4}
                            theme={{ colors: { primary: theme.colors.primary, background: theme.colors.background } }}
                            style={[styles.remarkInput]}
                        />

                        <Button
                            mode='contained'
                            onPress={saveRemark}
                            buttonColor={theme.colors.primary}
                            // Using hardcoded white text for button contrast
                            labelStyle={{ color: '#FFFFFF', fontWeight: '700' }}
                            style={{ borderRadius: 12, marginTop: 10 }}
                        >
                            Save Remark
                        </Button>
                    </Modal>
                </Portal>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalContent: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderRadius: 24,
        marginHorizontal: 16,
        width: width * 0.9,
        alignSelf: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    headerText: {
        fontSize: 24,
        fontWeight: '800'
    },
    taskContainer: {
        marginBottom: 16,
        borderRadius: 18,
    },
    taskCard: {
        borderRadius: 18,
        elevation: 6,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },
    cardInnerContent: {
        paddingVertical: 15,
    },
    taskHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: '700',
        flexShrink: 1,
        marginRight: 10,
    },
    rowDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        paddingHorizontal: 2,
    },
    detailText: {
        fontSize: 14,
        fontWeight: '400',
        marginLeft: 6,
    },
    overdueTag: {
        fontSize: 10,
        fontWeight: '800',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginLeft: 10,
        overflow: 'hidden',
    },
    remarksWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginTop: 10,
        paddingHorizontal: 2,
    },
    remarkText: {
        fontSize: 13,
        marginLeft: 4,
        flexShrink: 1,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 15,
        borderTopWidth: 1,
        paddingTop: 10,
    },
    actionButton: {
        borderRadius: 10,
        marginLeft: 10,
        minWidth: 100,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 18,
    },
    remarkModalContent: {
        padding: 24,
        borderRadius: 24,
        marginHorizontal: 30,
    },
    remarkModalHeader: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 15,
        textAlign: 'center',
    },
    remarkInput: {
        marginBottom: 15,
        borderRadius: 12,
        paddingHorizontal: 0,
    }
});

export default PremiumTasksModal;