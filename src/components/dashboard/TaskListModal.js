import React, { useContext, useMemo } from 'react';
import { View, Text, Modal, Pressable, FlatList, StyleSheet } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import { styles } from './DashboardStyles'; // Assuming this provides correct styling
import { RenderListCardItem } from './RenderListCardItem';
import Ionicons from 'react-native-vector-icons/Ionicons';

export const TaskListModal = ({ 
    selectedModal, 
    taskStats, 
    admins, 
    users, 
    usersMap, 
    getUserLabel, 
    getStatusColor, 
    setSelectedModal, 
    setSelectedTaskDetail, 
    setSelectedUserDetail,
    overdueTasksList 
}) => {
    const { theme } = useContext(ThemeContext);

    const { data, title } = useMemo(() => {
        switch (selectedModal) {
            case 'admins': return { data: admins, title: 'Admins' };
            case 'users': return { data: users, title: 'Users' };
            
            case 'overdue': 
                return { data: overdueTasksList || [], title: 'Overdue Tasks' };
                
            case 'pending':
            case 'inprogress':
            case 'completed':
            case 'rejected':
                return {
                    data: taskStats[selectedModal] || [],
                    title: `${selectedModal.charAt(0).toUpperCase() + selectedModal.slice(1)} Tasks`
                };
            default: 
                // Return default/empty state if selectedModal is null or unrecognized
                return { data: [], title: 'Dashboard List' }; 
        }
    }, [selectedModal, taskStats, admins, users, overdueTasksList]);

    // --- Conditional Return is now safe ---
    if (!selectedModal) return null;

    const isTaskStatusModal = ['pending', 'inprogress', 'completed', 'rejected', 'overdue'].includes(selectedModal);

    const renderLegend = () => isTaskStatusModal && (
        <View style={styles.legendContainer}>
            {['pending', 'inprogress', 'completed', 'rejected'].map((status) => (
                <View key={status} style={styles.legendItem}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]} />
                    <Text style={[styles.legendLabel, { color: theme.colors.text }]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                </View>
            ))}
        </View>
    );

    const renderEmptyComponent = () => {
        let emptyMessage;
        let iconName = 'file-tray-outline';

        if (selectedModal === 'overdue') {
            emptyMessage = 'No record found in over due tasks.';
            iconName = 'checkmark-circle-outline';
        } else if (isTaskStatusModal) {
            emptyMessage = `No ${selectedModal} tasks found.`;
        } else if (selectedModal === 'admins') {
            emptyMessage = 'No admin accounts found.';
            iconName = 'shield-outline';
        } else if (selectedModal === 'users') {
            emptyMessage = 'No user accounts found.';
            iconName = 'people-outline';
        } else {
            emptyMessage = 'No records found.';
        }

        return (
            <View style={styles.emptyContainer}>
                <Ionicons 
                    name={iconName} 
                    size={50} 
                    color={theme.colors.border || theme.colors.text}
                />
                <Text style={[styles.emptyText, { color: theme.colors.text, marginTop: 10 }]}>{emptyMessage}</Text>
            </View>
        );
    };

    return (
        <Modal visible={!!selectedModal} animationType="slide" transparent={true}>
            <Pressable style={styles.modalOverlay} onPress={() => setSelectedModal(null)}>
                <Pressable style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                    
                    <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{title}</Text>
                    
                    <Pressable style={styles.modalCloseIcon} onPress={() => setSelectedModal(null)}>
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                    </Pressable>

                    {renderLegend()}

                    <FlatList
                        data={data}
                        keyExtractor={(item, index) => item.uid || item.id || item.taskId || index.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={data.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : {}}
                        renderItem={({ item }) => (
                            <RenderListCardItem
                                {...{
                                    item,
                                    selectedModal,
                                    theme,
                                    usersMap,
                                    getUserLabel,
                                    getStatusColor,
                                    setSelectedTaskDetail,
                                    setSelectedUserDetail
                                }}
                            />
                        )}
                        ListEmptyComponent={renderEmptyComponent}
                    />
                </Pressable>
            </Pressable>
        </Modal>
    );
};