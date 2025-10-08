import React, { useContext } from 'react';
import { View, Text, Modal, Pressable, FlatList } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import { styles } from './DashboardStyles';
import { RenderListCardItem } from './RenderListCardItem';

export const TaskListModal = ({ selectedModal, taskStats, admins, users, usersMap, getUserLabel, getStatusColor, setSelectedModal, setSelectedTaskDetail, setSelectedUserDetail }) => {
    const { theme } = useContext(ThemeContext);
    if (!selectedModal) return null;

    let data = [];
    let title = '';
    const isTaskStatusModal = ['pending', 'inprogress', 'completed', 'rejected'].includes(selectedModal);

    switch (selectedModal) {
        case 'admins': data = admins; title = 'Admins'; break;
        case 'users': data = users; title = 'Users'; break;
        case 'pending':
        case 'inprogress':
        case 'completed':
        case 'rejected':
            data = taskStats[selectedModal];
            title = `${selectedModal.charAt(0).toUpperCase() + selectedModal.slice(1)} Tasks`;
            break;
        default: break;
    }

    const renderLegend = () => isTaskStatusModal && (
        <View style={styles.legendContainer}>
            {/* FIX 1: Use the 'status' string itself as the key. It's stable and unique. */}
            {['pending', 'inprogress', 'completed', 'rejected'].map((status) => (
                <View key={status} style={styles.legendItem}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]} />
                    <Text style={[styles.legendLabel, { color: theme.colors.text }]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                </View>
            ))}
        </View>
    );

    return (
        <Modal visible={!!selectedModal} animationType="slide" transparent={true}>
            <View style={[styles.modalOverlay, { backgroundColor: theme.colors.background + 'DD' }]}>
                <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{title}</Text>
                    {renderLegend()}

                    <FlatList
                        data={data}
                        keyExtractor={item => item.uid || item.id}
                        showsVerticalScrollIndicator={false}
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