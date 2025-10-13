

import React, { useContext } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Dimensions, Image, ScrollView } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

// --- UTILITY FUNCTIONS (Copied from DashboardScreen for self-containment) ---

const safeDate = (timestamp) => {
    if (!timestamp) return new Date();

    // If it's a Firestore timestamp
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }

    // If it's already a Date object
    if (timestamp instanceof Date) {
        return timestamp;
    }

    // If it's a string or number
    return new Date(timestamp);
};

// Calculate hours between two Date objects
const hoursBetween = (start, end) => (end - start) / 1000 / 3600;

// --------------------------------------------------------------------------

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

    // --- TASK ANALYTICS CALCULATIONS ---
    const totalTasks = userTasks.length;
    const todoCount = userTasks.filter(t => t.status === 'todo' || t.status === 'pending').length;
    const inProgressCount = userTasks.filter(t => t.status === 'in progress' || t.status === 'In Progress' || t.status === 'inprogress').length;
    const completedTasks = userTasks.filter(t => t.status === 'completed' || t.status === 'Completed');
    const completedCount = completedTasks.length;

    // Completion Time Analysis
    const completedOnTime = completedTasks.filter(t => safeDate(t.updatedAt) <= safeDate(t.deadline)).length;

    const totalCompletionHours = completedTasks.reduce((sum, t) => {
        // Only calculate time for tasks that have a completion and creation date
        if (t.createdAt && t.updatedAt) {
            return sum + hoursBetween(safeDate(t.createdAt), safeDate(t.updatedAt));
        }
        return sum;
    }, 0);

    const avgCompletionTime = completedCount > 0 ? totalCompletionHours / completedCount : 0;

    // Rate Calculations
    const completionRate = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;
    const onTimeRate = completedCount > 0 ? (completedOnTime / completedCount) * 100 : 0;
    // --- END ANALYTICS CALCULATIONS ---

    const chartColors = {
        todo: theme.colors.textSecondary || '#7f8c8d',
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
            gap: normalize(15), // Add gap for sections
        },
        sectionTitle: {
            fontSize: normalize(18),
            fontWeight: '800',
            color: theme.colors.text,
            marginBottom: normalize(10),
            paddingTop: normalize(5),
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border + '50',
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
        analyticsCard: {
            flex: 1,
            paddingVertical: normalize(10),
            paddingHorizontal: normalize(10),
            borderRadius: normalize(12),
            backgroundColor: theme.colors.sectionBackground,
            borderWidth: 1,
            borderColor: theme.colors.border + '30',
        },
        analyticsLabel: {
            fontSize: normalize(13),
            color: theme.colors.text,
            fontWeight: '600',
        },
        analyticsValue: {
            fontSize: normalize(18),
            fontWeight: '900',
            color: theme.colors.text,
            marginTop: normalize(2),
        }
    });

    const TaskStatCard = ({ label, count, color }) => (
        <View style={geometricStyles.statCard}>
            <Text style={[geometricStyles.statValue, { color }]}>{count}</Text>
            <Text style={[geometricStyles.statLabel, { color: theme.colors.text }]}>{label}</Text>
        </View>
    );

    const AnalyticsCard = ({ label, value, unit, color }) => (
        <View style={geometricStyles.analyticsCard}>
            <Text style={geometricStyles.analyticsLabel}>{label}</Text>
            <Text style={[geometricStyles.analyticsValue, { color: color || theme.colors.text }]}>
                {value}
                {unit && <Text style={{ fontSize: normalize(14), fontWeight: '600', color: theme.colors.text }}>{unit}</Text>}
            </Text>
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

                    <ScrollView contentContainerStyle={geometricStyles.contentContainer}>
                        <Text style={geometricStyles.sectionTitle}>Task Summary (Total Tasks : {totalTasks})</Text>

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
                                label="To Do"
                                count={todoCount}
                                color={chartColors.todo}
                            />
                        </View>

                        {/* --- Analytics Section --- */}
                        <Text style={geometricStyles.sectionTitle}>Performance Analytics</Text>

                        <View style={geometricStyles.statsRow}>
                            <AnalyticsCard
                                label="Completion Rate"
                                value={completionRate.toFixed(1)}
                                unit="%"
                                color={completionRate >= 80 ? chartColors.completed : chartColors.inProgress}
                            />
                            <AnalyticsCard
                                label="On-Time Rate"
                                value={onTimeRate.toFixed(1)}
                                unit="%"
                                color={onTimeRate >= 80 ? chartColors.completed : chartColors.todo}
                            />
                        </View>

                        <View style={geometricStyles.statsRow}>
                            <AnalyticsCard
                                label="Completed On-Time"
                                value={completedOnTime}
                                color={chartColors.completed}
                            />
                            <AnalyticsCard
                                label="Avg. Time to Complete"
                                value={avgCompletionTime.toFixed(1)}
                                unit=" hrs"
                                color={theme.colors.primary}
                            />
                        </View>

                    </ScrollView>
                </View>
            </Pressable>
        </Modal>
    );
};