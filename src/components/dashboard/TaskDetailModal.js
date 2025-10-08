// import React, { useContext } from 'react';
// import { View, Text, Modal, Pressable, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { ThemeContext } from '../../context/ThemeContext';

// const DetailCard = ({ iconName, label, value, valueStyle, onPress, isLink = false, theme }) => (
//     <View style={redesignStyles.detailCard}>
//         <View style={redesignStyles.detailContent}>
//             <Text style={[redesignStyles.detailLabel, { color: theme.colors.text }]}>{label}</Text>
//             {onPress ? (
//                 <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
//                     <Text
//                         style={[
//                             redesignStyles.detailValue,
//                             isLink ? { color: theme.colors.primary, fontWeight: '600' } : null,
//                             valueStyle
//                         ]}
//                         numberOfLines={1}
//                         ellipsizeMode="tail"
//                     >
//                         {value}
//                     </Text>
//                 </TouchableOpacity>
//             ) : (
//                 <Text style={[redesignStyles.detailValue, valueStyle]}>{value}</Text>
//             )}
//         </View>
//     </View>
// );


// export const TaskDetailModal = ({ selectedTaskDetail, usersMap, getUserLabel, getStatusColor, setSelectedTaskDetail, setSelectedUserDetail }) => {
//     const { theme } = useContext(ThemeContext);
//     if (!selectedTaskDetail) return null;
//     const task = selectedTaskDetail;

//     const assignerName = getUserLabel(task.assignedBy);
//     const assigneeName = getUserLabel(task.assignedTo);

//     const getStatusStyle = (status) => ({
//         color: getStatusColor(status),
//         backgroundColor: getStatusColor(status) + '15',
//         borderColor: getStatusColor(status),
//     });

//     return (
//         <Modal
//             visible={!!selectedTaskDetail}
//             animationType="slide"
//             transparent={true}
//         >
//             <Pressable style={redesignStyles.modalOverlay} onPress={() => setSelectedTaskDetail(null)} />

//             <SafeAreaView style={[redesignStyles.bottomSheetContainer, { backgroundColor: theme.colors.background }]}>
//                 <View style={[redesignStyles.modalContent, { backgroundColor: theme.colors.card }]}>

//                     <View style={redesignStyles.handleBar} />

//                     <Pressable
//                         style={({ pressed }) => [redesignStyles.dismissButton, { opacity: pressed ? 0.6 : 1 }]}
//                         onPress={() => setSelectedTaskDetail(null)}
//                     >
//                         <Text style={[redesignStyles.dismissText, { color: theme.colors.text }]}>✕</Text>
//                     </Pressable>


//                     <View style={redesignStyles.headerContainer}>
//                         <Text style={[redesignStyles.modalTitle, { color: theme.colors.text }]}>{task.title}</Text>

//                         <View style={[redesignStyles.statusBadge, getStatusStyle(task.status)]}>
//                             <Text style={[redesignStyles.statusText, { color: getStatusColor(task.status) }]}>{task.status}</Text>
//                         </View>
//                     </View>

//                     <ScrollView showsVerticalScrollIndicator={false} style={redesignStyles.scrollArea}>

//                         <View style={redesignStyles.section}>
//                             <Text style={[redesignStyles.sectionHeader, { color: theme.colors.text }]}>Description</Text>
//                             <Text style={[redesignStyles.descriptionText, { color: theme.colors.text }]}>{task.description}</Text>
//                         </View>

//                         <View style={redesignStyles.divider} />

//                         <View style={redesignStyles.section}>
//                             <Text style={[redesignStyles.sectionHeader, { color: theme.colors.text }]}>Key Details</Text>

//                             <DetailCard
//                                 iconName="calendar-clock"
//                                 label="Deadline"
//                                 value={task.deadline?.toDate().toLocaleString() || 'N/A'}
//                                 theme={theme}
//                                 valueStyle={{ color: theme.colors.text }}
//                             />

//                             <DetailCard
//                                 iconName="account-check-outline"
//                                 label="Assigned To"
//                                 value={assigneeName}
//                                 isLink={true}
//                                 theme={theme}
//                                 onPress={() => {
//                                     const user = usersMap[String(task.assignedTo).trim()];
//                                     if (user) setSelectedUserDetail(user);
//                                 }}
//                             />

//                             <DetailCard
//                                 iconName="account-arrow-left-outline"
//                                 label="Assigned By"
//                                 value={assignerName}
//                                 isLink={true}
//                                 theme={theme}
//                                 onPress={() => {
//                                     const user = usersMap[String(task.assignedBy).trim()];
//                                     if (user) setSelectedUserDetail(user);
//                                 }}
//                             />
//                         </View>

//                         {(task.remark || task.rejectRemark || task.remarks?.length > 0) && (
//                             <>
//                                 <View style={redesignStyles.divider} />
//                                 <View style={redesignStyles.section}>
//                                     <Text style={[redesignStyles.sectionHeader, { color: theme.colors.text }]}>Remarks History</Text>

//                                     {(task.remark || task.rejectRemark) && (
//                                         <View style={[redesignStyles.latestRemark, { backgroundColor: theme.colors.backgroundLight }]}>
//                                             <Text style={[redesignStyles.latestRemarkText, { color: theme.colors.text }]}>
//                                                 <Text style={{ fontWeight: '700' }}>Latest Note:</Text> {task.remark || task.rejectRemark}
//                                             </Text>
//                                         </View>
//                                     )}

//                                     {task.remarks?.length > 0 && (
//                                         <View style={redesignStyles.remarksListContainer}>
//                                             {task.remarks.map((r, i) => (
//                                                 <Text key={i} style={[redesignStyles.remarkListItem, { color: theme.colors.text }]}>• {r}</Text>
//                                             ))}
//                                         </View>
//                                     )}
//                                 </View>
//                             </>
//                         )}

//                         <View style={{ height: 30 }} />

//                     </ScrollView>


//                 </View>
//             </SafeAreaView>
//         </Modal>
//     );
// };

// const redesignStyles = StyleSheet.create({
//     modalOverlay: {
//         flex: 1,
//         backgroundColor: 'rgba(0, 0, 0, 0.4)',
//     },
//     bottomSheetContainer: {
//         position: 'absolute',
//         bottom: 0,
//         width: '100%',
//         maxHeight: '85%',
//         borderTopLeftRadius: 20,
//         borderTopRightRadius: 20,
//         ...Platform.select({
//             ios: {
//                 shadowOffset: { width: 0, height: -5 },
//                 shadowOpacity: 0.05,
//                 shadowRadius: 10,
//             },
//             android: {
//                 elevation: 20,
//             },
//         }),
//     },
//     modalContent: {
//         paddingHorizontal: 20,
//         flex: 1,
//     },
//     handleBar: {
//         width: 40,
//         height: 5,
//         backgroundColor: '#ccc',
//         borderRadius: 2.5,
//         alignSelf: 'center',
//         marginVertical: 10,
//     },
//     dismissButton: {
//         position: 'absolute',
//         top: 10,
//         right: 15,
//         zIndex: 10,
//         padding: 10,
//     },
//     dismissText: {
//         fontSize: 20,
//         fontWeight: '500',
//     },
//     scrollArea: {
//         flex: 1,
//         paddingBottom: 20,
//     },

//     headerContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'flex-start',
//         paddingVertical: 15,
//         marginRight: 35,
//     },
//     modalTitle: {
//         fontSize: 26,
//         fontWeight: '800',
//         flex: 1,
//         paddingRight: 10,
//     },
//     statusBadge: {
//         paddingVertical: 6,
//         paddingHorizontal: 12,
//         borderRadius: 6,
//         borderWidth: 1,
//         alignSelf: 'center',
//     },
//     statusText: {
//         fontSize: 13,
//         fontWeight: '700',
//         textTransform: 'uppercase',
//     },

//     section: {
//         marginBottom: 10,
//     },
//     sectionHeader: {
//         fontSize: 14,
//         fontWeight: '700',
//         marginBottom: 8,
//         textTransform: 'uppercase',
//         letterSpacing: 0.5,
//         color: 'gray',
//     },
//     descriptionText: {
//         fontSize: 16,
//         lineHeight: 24,
//     },

//     detailCard: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         paddingVertical: 12,
//         paddingHorizontal: 0,
//         borderBottomWidth: StyleSheet.hairlineWidth,
//         borderBottomColor: '#eee',
//     },
//     detailIcon: {
//         marginRight: 15,
//         opacity: 0.8,
//     },
//     detailContent: {
//         flex: 1,
//     },
//     detailLabel: {
//         fontSize: 12,
//         fontWeight: '500',
//         textTransform: 'uppercase',
//         marginBottom: 2,
//     },
//     detailValue: {
//         fontSize: 16,
//     },

//     latestRemark: {
//         padding: 15,
//         borderRadius: 10,
//         marginBottom: 10,
//     },
//     latestRemarkText: {
//         fontSize: 15,
//         lineHeight: 22,
//     },
//     remarksListContainer: {
//         paddingTop: 5,
//         paddingLeft: 5,
//     },
//     remarkListItem: {
//         fontSize: 14,
//         paddingVertical: 3,
//     },

//     divider: {
//         height: 1,
//         backgroundColor: '#f0f0f0',
//         marginVertical: 15,
//     },

//     footer: {
//         paddingVertical: 15,
//         borderTopWidth: StyleSheet.hairlineWidth,
//         borderTopColor: '#f0f0f0',
//         paddingBottom: Platform.OS === 'ios' ? 0 : 15,
//     },
//     actionButton: {
//         borderRadius: 12,
//         padding: 16,
//         alignItems: 'center',
//     },
//     actionButtonText: {
//         color: '#fff',
//         fontSize: 17,
//         fontWeight: '700',
//     },
// });










import React, { useContext } from 'react';
import { View, Text, Modal, Pressable, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../../context/ThemeContext';

// DetailCard component remains the same
const DetailCard = ({ iconName, label, value, valueStyle, onPress, isLink = false, theme }) => (
    <View style={redesignStyles.detailCard}>
        <View style={redesignStyles.detailContent}>
            <Text style={[redesignStyles.detailLabel, { color: theme.colors.text }]}>{label}</Text>
            {onPress ? (
                <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                    <Text
                        style={[
                            redesignStyles.detailValue,
                            isLink ? { color: theme.colors.primary, fontWeight: '600' } : null,
                            valueStyle
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {value}
                    </Text>
                </TouchableOpacity>
            ) : (
                <Text style={[redesignStyles.detailValue, valueStyle]}>{value}</Text>
            )}
        </View>
    </View>
);


export const TaskDetailModal = ({ selectedTaskDetail, usersMap, getUserLabel, getStatusColor, setSelectedTaskDetail, setSelectedUserDetail }) => {
    const { theme } = useContext(ThemeContext);
    if (!selectedTaskDetail) return null;
    const task = selectedTaskDetail;

    const assignerName = getUserLabel(task.assignedBy);
    const assigneeName = getUserLabel(task.assignedTo);

    const getStatusStyle = (status) => ({
        color: getStatusColor(status),
        backgroundColor: getStatusColor(status) + '15',
        borderColor: getStatusColor(status),
    });

    return (
        <Modal
            visible={!!selectedTaskDetail}
            animationType="slide"
            transparent={true}
        >
            <Pressable style={redesignStyles.modalOverlay} onPress={() => setSelectedTaskDetail(null)} />

            {/* The outer container still sets max height and positions the modal */}
            <SafeAreaView style={[redesignStyles.bottomSheetContainer, { backgroundColor: theme.colors.card }]}>

                {/* KEY CHANGE: Use ScrollView as the primary content container.
                  The contentContainerStyle is used for padding instead of a wrapper View.
                */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1, width: '100%' }}
                    contentContainerStyle={redesignStyles.scrollContent}
                >
                    <View style={redesignStyles.handleBar} />

                    {/* Dismiss button is positioned absolutely relative to the ScrollView's contentContainer */}
                    <Pressable
                        style={({ pressed }) => [redesignStyles.dismissButton, { opacity: pressed ? 0.6 : 1 }]}
                        onPress={() => setSelectedTaskDetail(null)}
                    >
                        <Text style={[redesignStyles.dismissText, { color: theme.colors.text }]}>✕</Text>
                    </Pressable>


                    {/* Header is now the first scrollable content */}
                    <View style={redesignStyles.headerContainer}>
                        <Text style={[redesignStyles.modalTitle, { color: theme.colors.text }]}>{task.title}</Text>

                        <View style={[redesignStyles.statusBadge, getStatusStyle(task.status)]}>
                            <Text style={[redesignStyles.statusText, { color: getStatusColor(task.status) }]}>{task.status}</Text>
                        </View>
                    </View>

                    {/* Start of Details Section */}
                    <View style={redesignStyles.section}>
                        <Text style={[redesignStyles.sectionHeader, { color: theme.colors.text }]}>Description</Text>
                        <Text style={[redesignStyles.descriptionText, { color: theme.colors.text }]}>{task.description}</Text>
                    </View>

                    <View style={redesignStyles.divider} />

                    <View style={redesignStyles.section}>
                        <Text style={[redesignStyles.sectionHeader, { color: theme.colors.text }]}>Key Details</Text>

                        <DetailCard
                            iconName="calendar-clock"
                            label="Deadline"
                            value={task.deadline?.toDate().toLocaleString() || 'N/A'}
                            theme={theme}
                            valueStyle={{ color: theme.colors.text }}
                        />

                        <DetailCard
                            iconName="account-check-outline"
                            label="Assigned To"
                            value={assigneeName}
                            isLink={true}
                            theme={theme}
                            onPress={() => {
                                const user = usersMap[String(task.assignedTo).trim()];
                                if (user) setSelectedUserDetail(user);
                            }}
                        />

                        <DetailCard
                            iconName="account-arrow-left-outline"
                            label="Assigned By"
                            value={assignerName}
                            isLink={true}
                            theme={theme}
                            onPress={() => {
                                const user = usersMap[String(task.assignedBy).trim()];
                                if (user) setSelectedUserDetail(user);
                            }}
                        />
                    </View>

                    {(task.remark || task.rejectRemark || task.remarks?.length > 0) && (
                        <>
                            <View style={redesignStyles.divider} />
                            <View style={redesignStyles.section}>
                                <Text style={[redesignStyles.sectionHeader, { color: theme.colors.text }]}>Remarks History</Text>

                                {(task.remark || task.rejectRemark) && (
                                    <View style={[redesignStyles.latestRemark, { backgroundColor: theme.colors.backgroundLight }]}>
                                        <Text style={[redesignStyles.latestRemarkText, { color: theme.colors.text }]}>
                                            <Text style={{ fontWeight: '700' }}>Latest Note:</Text> {task.remark || task.rejectRemark}
                                        </Text>
                                    </View>
                                )}

                                {task.remarks?.length > 0 && (
                                    <View style={redesignStyles.remarksListContainer}>
                                        {task.remarks.map((r, i) => (
                                            <Text key={i} style={[redesignStyles.remarkListItem, { color: theme.colors.text }]}>• {r}</Text>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </>
                    )}

                    <View style={{ height: 30 }} />

                </ScrollView>

            </SafeAreaView>
        </Modal>
    );
};


const redesignStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    bottomSheetContainer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        maxHeight: '85%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        // The card background color is now applied here
        ...Platform.select({
            ios: {
                shadowOffset: { width: 0, height: -5 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
            },
            android: {
                elevation: 20,
            },
        }),
    },
    // Removed modalContent styles (as ScrollView is now the main container)
    scrollContent: {
        flexGrow: 1, // Ensures ScrollView content expands
        paddingHorizontal: 20, // Applies the necessary horizontal padding to all content
        paddingBottom: 20,
    },
    handleBar: {
        width: 40,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 2.5,
        alignSelf: 'center',
        marginVertical: 10,
    },
    // Dismiss button needs slightly adjusted positioning since its parent is now ScrollView content
    dismissButton: {
        position: 'absolute',
        top: 10,
        right: 15,
        zIndex: 10,
        padding: 10,
    },
    dismissText: {
        fontSize: 20,
        fontWeight: '500',
    },

    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 15,
        marginRight: 35,
    },
    modalTitle: {
        fontSize: 26,
        fontWeight: '800',
        flex: 1,
        paddingRight: 10,
    },
    statusBadge: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        alignSelf: 'center',
    },
    statusText: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
    },

    section: {
        marginBottom: 10,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: 'gray',
    },
    descriptionText: {
        fontSize: 16,
        lineHeight: 24,
    },

    detailCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 0,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 16,
    },

    latestRemark: {
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    latestRemarkText: {
        fontSize: 15,
        lineHeight: 22,
    },
    remarksListContainer: {
        paddingTop: 5,
        paddingLeft: 5,
    },
    remarkListItem: {
        fontSize: 14,
        paddingVertical: 3,
    },

    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 15,
    },

    footer: {
        paddingVertical: 15,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#f0f0f0',
        paddingBottom: Platform.OS === 'ios' ? 0 : 15,
    },
    actionButton: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
});