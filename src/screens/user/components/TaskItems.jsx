import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../hooks/useTheme';

const TaskItem = ({ item, onEdit, onDelete, onStatusChange, onSetDeadline, onSetReminder }) => {
    const theme = useTheme();
    const styles = createStyles(theme);
    const [remarksExpanded, setRemarksExpanded] = useState(false);
    const formatDate = (timestamp) => {
        if (!timestamp) return 'No deadline';
        return timestamp.toDate().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatReminderTime = (timestamp) => {
        if (!timestamp) return null;
        return timestamp.toDate().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    const getDisplayStatus = (task) => {
        const now = new Date();
        const isOverdue = task.deadline && task.deadline.toDate() < now;

        if (task.status !== 'completed' && isOverdue) {
            return { text: 'OVERDUE', color: theme.colors.primary, icon: 'alert-circle' };
        }

        switch (task.status) {
            case 'completed':
                return { text: 'COMPLETED', color: theme.colors.border, icon: 'checkmark-circle' };
            case 'Inprogress':
                return { text: 'IN PROGRESS', color: styles.statusInProgressColor.backgroundColor, icon: 'time-outline' };
            case 'Pending':
            default:
                return { text: 'PENDING', color: '#999999', icon: 'pause-circle-outline' };
        }
    };

    const getNextStatus = (currentStatus) => {
        switch (currentStatus) {
            case 'Pending':
                return 'Inprogress';
            case 'Inprogress':
                return 'completed';
            case 'completed':
            default:
                return 'Pending';
        }
    };

    const statusInfo = getDisplayStatus(item);
    const cardAccentColor = statusInfo.color;
    const nextStatus = getNextStatus(item.status);

    const hasRemarks = item.remarks && item.remarks.length > 0;
    const reminderTime = formatReminderTime(item.reminder);

    return (
        <View style={[styles.card, { borderColor: cardAccentColor }]}>
            { }
            <View style={[styles.statusBar, { backgroundColor: cardAccentColor }]} />

            <View style={styles.contentContainer}>
                { }
                <View style={styles.cardHeader}>
                    <Text style={styles.title}>{item.title}</Text>
                    <View style={styles.actions}>

                        { }
                        <TouchableOpacity
                            onPress={() => onSetReminder(item)}
                            style={styles.iconButton}
                            accessibilityLabel={item.reminder ? "Change Reminder" : "Set Reminder"}
                        >
                            <Icon
                                name={item.reminder ? "alarm" : "alarm-outline"}
                                size={22}

                                color={item.reminder ? theme.colors.primary : theme.colors.text}
                            />
                        </TouchableOpacity>

                        { }
                        <TouchableOpacity onPress={() => onEdit(item)} style={styles.iconButton}>
                            <Icon name="create-outline" size={22} color={theme.colors.text} />
                        </TouchableOpacity>

                        { }
                        <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.iconButton}>
                            <Icon name="trash-outline" size={22} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                { }
                <Text style={styles.description}>{item.description}</Text>

                { }
                {item.reminder && (
                    <Text style={styles.reminderText}>
                        <Icon name="alarm-outline" size={14} color={theme.colors.text} /> Reminder: {formatDate(item.reminder)} @ {reminderTime}
                    </Text>
                )}

                { }
                <View style={styles.cardFooter}>

                    { }
                    <TouchableOpacity
                        onPress={() => onSetDeadline(item)}
                        style={styles.deadlineButton}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.deadline}>
                            <Icon name="calendar-outline" size={14} color={theme.colors.text} /> Due: <Text style={styles.deadlineText}>{formatDate(item.deadline)}</Text>
                        </Text>
                        <Icon name="chevron-forward" size={16} color={theme.colors.text} style={{ marginLeft: 5 }} />
                    </TouchableOpacity>

                    { }
                    <TouchableOpacity
                        onPress={() => onStatusChange(item.id, nextStatus)}
                        style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}
                        activeOpacity={0.7}
                        accessibilityLabel={`Change status from ${statusInfo.text} to ${nextStatus}`}
                    >
                        <Icon name={statusInfo.icon} size={12} color="#FFFFFF" />
                        <Text style={styles.statusText}>{statusInfo.text}</Text>
                    </TouchableOpacity>
                </View>

                { }
                {hasRemarks && (
                    <View style={styles.remarksSection}>
                        <TouchableOpacity
                            onPress={() => setRemarksExpanded(!remarksExpanded)}
                            style={styles.remarksToggle}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.remarksLabel}>
                                Remarks ({item.remarks.length})
                            </Text>
                            <Icon
                                name={remarksExpanded ? "chevron-up-outline" : "chevron-down-outline"}
                                size={18}
                                color={theme.colors.text}
                            />
                        </TouchableOpacity>

                        {remarksExpanded && (
                            <View style={styles.remarksContent}>
                                {item.remarks.map((remark, index) => (
                                    <Text
                                        key={index}
                                        style={styles.remarksText}
                                    >
                                        <Text style={{ fontWeight: 'bold' }}>
                                            {index === 0 ? 'LATEST' : `#${index + 1}`}:
                                        </Text>
                                        {' '}{remark.text}
                                    </Text>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
};

const createStyles = (theme) => StyleSheet.create({
    statusInProgressColor: {
        backgroundColor: '#5bc0de',
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        marginVertical: 8,
        flexDirection: 'row',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
        elevation: 5,
        shadowColor: theme.dark ? '#000' : '#888',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statusBar: {
        width: 6,
        height: '100%',
    },
    contentContainer: {
        flex: 1,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },

    title: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        flex: 1,
        paddingRight: 10,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 4,
    },
    iconButton: {
        marginLeft: 15,
    },
    description: {
        fontSize: 15,
        color: theme.dark ? '#ccc' : '#444',
        marginBottom: 8,
    },
    reminderText: {
        fontSize: 14,
        color: theme.colors.text,
        fontWeight: '500',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.dark ? '#333' : '#eee',
        paddingBottom: 5,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.dark ? '#333' : '#eee',
        paddingTop: 12,
    },
    deadlineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingRight: 10,
    },
    deadline: {
        fontSize: 14,
        color: theme.colors.text,
        fontWeight: '500',
    },
    deadlineText: {
        fontWeight: '700',
        color: theme.colors.text,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginLeft: 4,
    },
    remarksSection: {
        marginTop: 15,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: theme.dark ? '#333' : '#eee',
    },
    remarksToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    remarksLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
    },
    remarksContent: {
        marginTop: 5,
        backgroundColor: theme.dark ? '#333' : '#f5f5f5',
        borderRadius: 8,
        padding: 10,
    },
    remarksText: {
        fontSize: 14,
        color: theme.colors.text,
        lineHeight: 20,
        marginBottom: 5,
    },
});

export default TaskItem;