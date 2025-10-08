import React, { useContext } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Dimensions, Image } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

const useTheme = () => {
    const { theme } = useContext(ThemeContext);
    return theme;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const REFERENCE_WIDTH = 375;
const scale = SCREEN_WIDTH / REFERENCE_WIDTH;
const normalize = (size) => Math.round(size * scale);

export const UserDetailModal = ({ selectedUserDetail, tasks, setSelectedUserDetail }) => {
    const theme = useTheme();

    if (!selectedUserDetail) return null;

    const user = selectedUserDetail;
    const userName = user.name || 'User Profile';
    const hasProfilePic = user.profilePicUrl && typeof user.profilePicUrl === 'string' && user.profilePicUrl.startsWith('http');

    const userTasks = tasks.filter(t => t.assignedTo === user.uid);

    const pendingCount = userTasks.filter(t => t.status === 'pending' || t.status === 'Pending').length;
    const inProgressCount = userTasks.filter(t => t.status === 'in progress' || t.status === 'In Progress').length;
    const completedCount = userTasks.filter(t => t.status === 'completed' || t.status === 'Completed').length;

    const chartColors = {
        pending: theme.colors.warning || '#f39c12',
        inProgress: theme.colors.info || '#3498db',
        completed: theme.colors.success || '#2ecc71',
    };

    const geometricStyles = StyleSheet.create({
        modalOverlay: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.background + 'EE',
        },
        modalContent: {
            width: '95%',
            maxWidth: 600,
            borderRadius: normalize(20),
            backgroundColor: theme.colors.card,
            overflow: 'hidden',
            elevation: 20,
            shadowColor: theme.colors.shadow || '#000',
            shadowOffset: { width: 0, height: normalize(10) },
            shadowOpacity: 0.3,
            shadowRadius: normalize(15),
        },
        headerContainer: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingTop: normalize(15),
            paddingHorizontal: normalize(15),
        },
        profileCard: {
            padding: normalize(20),
            paddingBottom: normalize(25),
            alignItems: 'center',
            backgroundColor: theme.colors.card,
        },
        profileImage: {
            width: normalize(100),
            height: normalize(100),
            borderRadius: normalize(50),
            borderWidth: normalize(4),
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.primary + '50',
            marginBottom: normalize(10),
        },
        profileIconContainer: {
            width: normalize(100),
            height: normalize(100),
            borderRadius: normalize(50),
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.sectionBackground,
            marginBottom: normalize(10),
            borderWidth: normalize(2),
            borderColor: theme.colors.primary + 'AA',
        },
        profileName: {
            fontSize: normalize(28),
            fontWeight: '900',
            color: theme.colors.text,
        },
        contact: {
            fontSize: normalize(16),
            fontWeight: '400',
            color: theme.colors.text,
        },
        contentContainer: {
            paddingHorizontal: normalize(20),
            paddingBottom: normalize(30),
            paddingTop: normalize(5),
        },
        statsRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: normalize(10),
        },
        statCard: {
            flex: 1,
            alignItems: 'center',
            paddingVertical: normalize(12),
            paddingHorizontal: normalize(8),
            borderRadius: normalize(12),
            backgroundColor: theme.colors.sectionBackground,
            borderWidth: 1,
            borderColor: theme.colors.border + '30',
        },
        statValue: {
            fontSize: normalize(24),
            fontWeight: '900',
        },
        statLabel: {
            fontSize: normalize(12),
            fontWeight: '600',
            color: theme.colors.textSecondary,
            marginTop: normalize(2),
            textAlign: 'center',
        },
    });

    const TaskStatCard = ({ label, count, color }) => (
        <View style={geometricStyles.statCard}>
            <Text style={[geometricStyles.statValue, { color }]}>{count}</Text>
            <Text style={[geometricStyles.statLabel, { color: theme.colors.text }]}>{label}</Text>
        </View>
    );

    return (
        <Modal
            visible={!!selectedUserDetail}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setSelectedUserDetail(null)}
        >
            <Pressable
                style={geometricStyles.modalOverlay}
                onPress={() => setSelectedUserDetail(null)}
            >
                <View style={geometricStyles.modalContent} onStartShouldSetResponder={() => true}>

                    <View style={geometricStyles.headerContainer}>
                        <Pressable onPress={() => setSelectedUserDetail(null)} hitSlop={normalize(15)}>
                            <Ionicons name="close-circle" size={normalize(30)} color={theme.colors.text || '#999'} />
                        </Pressable>
                    </View>

                    <View style={geometricStyles.profileCard}>
                        {hasProfilePic ? (
                            <Image
                                source={{ uri: user.profilePicUrl }}
                                style={geometricStyles.profileImage}
                                accessibilityLabel={`${userName}'s profile picture`}
                            />
                        ) : (
                            <View style={geometricStyles.profileIconContainer}>
                                <Ionicons name="person-circle-outline" size={normalize(88)} color={theme.colors.primary} />
                            </View>
                        )}
                        <Text style={geometricStyles.profileName}>{userName}</Text>
                        <Text style={[geometricStyles.contact,]}>{user.email || user.phone}</Text>
                    </View>

                    <View style={geometricStyles.contentContainer}>

                        <View style={geometricStyles.statsRow}>
                            <TaskStatCard
                                label="Completed"
                                count={completedCount}
                                color={chartColors.completed}
                            />
                            <TaskStatCard
                                label="In Progress"
                                count={inProgressCount}
                                color={chartColors.inProgress}
                            />
                            <TaskStatCard
                                label="Pending"
                                count={pendingCount}
                                color={chartColors.pending}
                            />
                        </View>

                    </View>
                </View>
            </Pressable>
        </Modal>
    );
};