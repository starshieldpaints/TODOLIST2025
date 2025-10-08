import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// --- Responsive Utilities ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const REFERENCE_WIDTH = 375;
const scale = SCREEN_WIDTH / REFERENCE_WIDTH;
const normalize = (size) => Math.round(size * scale);

// Helper function to get status icon name
const getStatusIcon = (status) => {
    switch (status) {
        case 'pending':
            return 'time-outline';
        case 'inprogress':
            return 'sync-outline';
        case 'completed':
            return 'shield-checkmark-outline';
        case 'rejected':
            return 'alert-circle-outline';
        default:
            return 'document-text-outline';
    }
};

export const RenderListCardItem = ({ item, selectedModal, theme, usersMap, getUserLabel, getStatusColor, setSelectedTaskDetail, setSelectedUserDetail }) => {
    const isTaskModal = ['pending', 'inprogress', 'completed', 'rejected'].includes(selectedModal);
    const isUserModal = ['admins', 'users'].includes(selectedModal);

    const cardPressHandler = () => {
        if (isTaskModal) {
            setSelectedTaskDetail(item);
        } else if (isUserModal) {
            setSelectedUserDetail(item);
        }
    };

    // Calculate dynamic responsive styles
    const modernStyles = StyleSheet.create({
        cardContainer: {
            borderLeftWidth: normalize(6),
            borderRadius: normalize(16), // Softer, larger corner radius
            marginVertical: normalize(10), // Generous vertical margin
            marginHorizontal: normalize(10),
            padding: normalize(18),
            backgroundColor: theme.colors.card,

            // Premium Shadow
            elevation: 8,
            shadowColor: theme.colors.shadow || '#000',
            shadowOffset: { width: 0, height: normalize(4) },
            shadowOpacity: 0.1,
            shadowRadius: normalize(8),

            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        contentWrapper: {
            flex: 1,
            marginRight: normalize(15), // Increased separation from the chevron
        },
        // --- Task Styles (Focus on clear hierarchy) ---
        taskTitle: {
            fontSize: normalize(18),
            fontWeight: '800', // Primary header
            color: theme.colors.text,
            marginBottom: normalize(4), // Reduced space below title
        },
        taskSubtitle: {
            fontSize: normalize(13),
            fontWeight: '500',
            color: theme.colors.textSecondary || '#666',
            marginTop: normalize(4), // Consistent vertical rhythm
        },
        taskUserLink: {
            color: theme.colors.primary,
            fontWeight: '700',
            fontSize: normalize(13),
        },
        // Status Pill Refinement
        statusPill: {
            paddingHorizontal: normalize(12), // Wider horizontal padding
            paddingVertical: normalize(5),
            borderRadius: normalize(20),
            alignSelf: 'flex-start',
            marginBottom: normalize(10),
            marginTop: normalize(5),
            flexDirection: 'row',
            alignItems: 'center',
            minWidth: normalize(100),
            justifyContent: 'center',
        },
        statusText: {
            fontSize: normalize(12),
            fontWeight: '700',
            color: '#fff',
            marginLeft: normalize(6), // Increased space between icon and text
            textTransform: 'uppercase',
        },
        // --- User Styles (Focus on distinction) ---
        userIcon: {
            marginRight: normalize(15), // Increased space from the icon to the text
        },
        userName: {
            fontSize: normalize(20),
            fontWeight: '800',
            color: theme.colors.text,
            marginBottom: normalize(2),
        },
        userRole: {
            fontSize: normalize(14),
            fontWeight: '500',
            color: theme.colors.textSecondary,
        },
        actionIcon: {
            marginLeft: normalize(15),
        }
    });

    const taskStatusColor = isTaskModal ? getStatusColor(item.status) : theme.colors.primary;
    const userRoleColor = item.role === 'admin' ? theme.colors.success || '#2ecc71' : theme.colors.info || '#3498db';


    const renderTaskContent = () => (
        <View style={modernStyles.contentWrapper}>
            <Text style={modernStyles.taskTitle} numberOfLines={1} ellipsizeMode="tail">
                {item.title}
            </Text>

            {/* Status Pill */}
            <View style={[modernStyles.statusPill, { backgroundColor: taskStatusColor }]}>
                <Ionicons
                    name={getStatusIcon(item.status)}
                    size={normalize(12)}
                    color="#fff"
                />
                <Text style={modernStyles.statusText}>{item.status}</Text>
            </View>

            <Text style={modernStyles.taskSubtitle}>
                Assigned To:{' '}
                <Text style={modernStyles.taskUserLink} onPress={() => {
                    const user = usersMap[String(item.assignedTo).trim()];
                    if (user) setSelectedUserDetail(user);
                }}>
                    {getUserLabel(item.assignedTo)}
                </Text>
            </Text>
            <Text style={modernStyles.taskSubtitle}>
                Assigned By:{' '}
                <Text style={modernStyles.taskUserLink} onPress={() => {
                    const user = usersMap[String(item.assignedBy).trim()];
                    if (user) setSelectedUserDetail(user);
                }}>
                    {getUserLabel(item.assignedBy)}
                </Text>
            </Text>
        </View>
    );

    const renderUserContent = () => {
        const secondaryDetail = item.email
            ? item.email
            : item.phone
                ? item.phone
                : item.role === 'admin' ? 'Administrator' : 'General User';

        const userIconName = item.role === 'admin' ? 'medal-outline' : 'person-outline';
        const userIconColor = userRoleColor;

        return (
            <>
                <Ionicons
                    name={userIconName}
                    size={normalize(35)}
                    color={userIconColor}
                    style={modernStyles.userIcon}
                />
                <View style={modernStyles.contentWrapper}>
                    <Text style={modernStyles.userName} numberOfLines={2} ellipsizeMode="tail">
                        {item.name || 'Name Missing'}
                    </Text>
                    <Text style={[modernStyles.userRole,{color:theme.colors.text}]} numberOfLines={1} ellipsizeMode="tail">
                        {secondaryDetail}
                    </Text>
                </View>
            </>
        );
    };

    return (
        <TouchableOpacity
            style={[
                modernStyles.cardContainer,
                {
                    // Dynamic border color based on item type/status
                    borderLeftColor: isTaskModal ? taskStatusColor : userRoleColor,
                },
            ]}
            onPress={cardPressHandler}
        >
            {isUserModal ? renderUserContent() : renderTaskContent()}

            {/* Right-side Action Indicator (Chevron) */}
            <Ionicons
                name="chevron-forward-outline"
                size={normalize(24)}
                color={theme.colors.text}
                style={modernStyles.actionIcon}
            />
        </TouchableOpacity>
    );
};
