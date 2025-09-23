// import React, { useState } from 'react';
// import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
// import { Portal, Modal, Card, Text, Button, Menu, TextInput } from 'react-native-paper';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import firestore from '@react-native-firebase/firestore';

// const { height } = Dimensions.get('window');

// const PremiumTasksModal = ({ visible, onDismiss, selectedUser, theme }) => {
//     const [menuVisible, setMenuVisible] = useState({});
//     const [remarkModalVisible, setRemarkModalVisible] = useState(false);
//     const [remarkText, setRemarkText] = useState('');
//     const [currentTaskId, setCurrentTaskId] = useState(null);

//     const statusColors = { pending: '#FFB300', 'in-progress': '#2196F3', completed: '#4CAF50' };

//     const openMenu = (taskId) => setMenuVisible({ ...menuVisible, [taskId]: true });
//     const closeMenu = (taskId) => setMenuVisible({ ...menuVisible, [taskId]: false });

//     const updateTaskStatus = async (taskId, status) => {
//         await firestore().collection('tasks').doc(taskId).update({
//             status,
//             updatedAt: firestore.FieldValue.serverTimestamp(),
//         });
//         closeMenu(taskId);
//     };

//     const deleteTask = async (taskId) => {
//         await firestore().collection('tasks').doc(taskId).delete();
//     };

//     const openAddRemark = (taskId) => {
//         setCurrentTaskId(taskId);
//         setRemarkModalVisible(true);
//     };

//     const saveRemark = async () => {
//         if (!remarkText) return;
//         const taskRef = firestore().collection('tasks').doc(currentTaskId);
//         const taskDoc = await taskRef.get();
//         const updatedRemarks = [...(taskDoc.data().remarks || []), remarkText];
//         await taskRef.update({ remarks: updatedRemarks, updatedAt: firestore.FieldValue.serverTimestamp() });
//         setRemarkText('');
//         setRemarkModalVisible(false);
//     };

//     return (
//         <Portal>
//             <Modal
//                 visible={visible}
//                 onDismiss={onDismiss}
//                 contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.card, maxHeight: height * 0.85 }]}
//             >
//                 {/* Header */}
//                 <Text style={styles.headerText(theme)}>{selectedUser?.name}'s Tasks</Text>

//                 <ScrollView showsVerticalScrollIndicator={false}>
//                     {selectedUser?.tasks?.length ? selectedUser.tasks.map(task => {
//                         const isOverdue = task.deadline?.toDate?.() < new Date() && task.status !== 'completed';

//                         return (
//                             <Card key={task.taskId} style={[styles.card, { borderColor: isOverdue ? '#FF3B30' : 'transparent' }]}>
//                                 <Card.Content>
//                                     {/* Task Header */}
//                                     <View style={styles.taskHeader}>
//                                         <View style={{ flex: 1 }}>
//                                             <Text style={styles.taskTitle(theme)}>{task.title}</Text>
//                                             <Text style={styles.taskDescription(theme)} numberOfLines={2}>{task.description}</Text>
//                                         </View>

//                                         <View style={styles.actionButtons}>
//                                             <Menu
//                                                 visible={menuVisible[task.taskId]}
//                                                 onDismiss={() => closeMenu(task.taskId)}
//                                                 anchor={
//                                                     <Button
//                                                         mode="outlined"
//                                                         style={[styles.statusButton, { borderColor: statusColors[task.status] }]}
//                                                         textColor={statusColors[task.status]}
//                                                         icon="swap-vertical"
//                                                         onPress={() => openMenu(task.taskId)}
//                                                     >
//                                                         {task.status.toUpperCase()}
//                                                     </Button>
//                                                 }
//                                             >
//                                                 {['pending', 'in-progress', 'completed']
//                                                     .filter(s => s !== task.status)
//                                                     .map(s => (
//                                                         <Menu.Item
//                                                             key={s}
//                                                             title={s.toUpperCase()}
//                                                             leadingIcon={() => <View style={[styles.statusDot, { backgroundColor: statusColors[s] }]} />}
//                                                             onPress={() => updateTaskStatus(task.taskId, s)}
//                                                         />
//                                                     ))}
//                                             </Menu>

//                                             <Button
//                                                 icon="delete-outline"
//                                                 mode="contained-tonal"
//                                                 onPress={() => deleteTask(task.taskId)}
//                                                 style={{ marginTop: 8 }}
//                                                 buttonColor="#FF3B30"
//                                                 textColor="#fff"
//                                             >
//                                                 Delete
//                                             </Button>
//                                         </View>
//                                     </View>

//                                     {/* Deadline */}
//                                     <View style={styles.deadlineRow}>
//                                         <Ionicons name="calendar-outline" size={16} color={isOverdue ? '#FF3B30' : theme.colors.text} style={{ marginRight: 6 }} />
//                                         <Text style={[styles.deadlineText(theme), { color: isOverdue ? '#FF3B30' : theme.colors.text }]}>
//                                             {task.deadline?.toDate?.()?.toDateString?.() || 'N/A'}
//                                         </Text>
//                                     </View>

//                                     {/* Remarks */}
//                                     <View style={styles.remarksContainer}>
//                                         {task.remarks?.map((remark, index) => (
//                                             <View key={index} style={styles.remarkChip}>
//                                                 <Ionicons name="pencil-outline" size={12} color="#333" style={{ marginRight: 4 }} />
//                                                 <Text style={styles.remarkText}>{remark}</Text>
//                                             </View>
//                                         ))}
//                                         <Button
//                                             icon="plus"
//                                             mode="contained"
//                                             style={styles.addRemarkButton}
//                                             onPress={() => openAddRemark(task.taskId)}
//                                         >
//                                             Add Remark
//                                         </Button>
//                                     </View>
//                                 </Card.Content>
//                             </Card>
//                         );
//                     }) : (
//                         <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20, fontSize: 14 }}>
//                             No tasks assigned
//                         </Text>
//                     )}
//                 </ScrollView>

//                 {/* Close Button */}
//                 <Button
//                     mode="contained"
//                     onPress={onDismiss}
//                     style={styles.closeButton}
//                     buttonColor={theme.colors.primary}
//                     textColor={theme.colors.text}
//                 >
//                     Close
//                 </Button>

//                 {/* Add Remark Modal */}
//                 <Portal>
//                     <Modal
//                         visible={remarkModalVisible}
//                         onDismiss={() => setRemarkModalVisible(false)}
//                         contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.card }]}
//                     >
//                         <Text style={styles.headerText(theme, 18)}>Add Remark</Text>
//                         <TextInput
//                             placeholder="Enter your remark"
//                             value={remarkText}
//                             onChangeText={setRemarkText}
//                             style={[styles.remarkInput, { backgroundColor: theme.colors.background }]}
//                         />
//                         <Button mode="contained" onPress={saveRemark} style={styles.saveRemarkButton} buttonColor={theme.colors.primary}>
//                             Save
//                         </Button>
//                         <Button mode="text" onPress={() => setRemarkModalVisible(false)} textColor={theme.colors.text}>
//                             Cancel
//                         </Button>
//                     </Modal>
//                 </Portal>
//             </Modal>
//         </Portal>
//     );
// };

// const styles = StyleSheet.create({
//     modalContainer: { padding: 20, borderRadius: 16, marginHorizontal: 16 },
//     headerText: (theme, size = 24) => ({ fontSize: size, fontWeight: '700', marginBottom: 16, color: theme.colors.text }),
//     card: { borderRadius: 16, elevation: 5, marginBottom: 16, padding: 12 },
//     taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
//     taskTitle: (theme) => ({ fontSize: 18, fontWeight: '700', color: theme.colors.text }),
//     taskDescription: (theme) => ({ fontSize: 14, color: theme.colors.text, marginTop: 4 }),
//     actionButtons: { justifyContent: 'flex-start', marginLeft: 12 },
//     statusButton: { borderRadius: 12, paddingHorizontal: 12 },
//     statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
//     deadlineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
//     deadlineText: (theme) => ({ fontSize: 14 }),
//     remarksContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 8 },
//     remarkChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0E0E0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 6, marginBottom: 6 },
//     remarkText: { fontSize: 12, color: '#333' },
//     addRemarkButton: { borderRadius: 12, paddingHorizontal: 12 },
//     closeButton: { marginTop: 16, borderRadius: 8 },
//     remarkInput: { marginBottom: 12, borderRadius: 8, paddingHorizontal: 12 },
//     saveRemarkButton: { marginBottom: 8, borderRadius: 8 },
// });

// export default PremiumTasksModal;















// import React, { useState } from 'react';
// import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
// import { Portal, Modal, Card, Text, Menu, IconButton, TextInput } from 'react-native-paper';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import firestore from '@react-native-firebase/firestore';

// const { height } = Dimensions.get('window');

// const PremiumTasksModal = ({ visible, onDismiss, selectedUser, theme }) => {
//     const [menuVisible, setMenuVisible] = useState({});
//     const [remarkModalVisible, setRemarkModalVisible] = useState(false);
//     const [remarkText, setRemarkText] = useState('');
//     const [currentTaskId, setCurrentTaskId] = useState(null);

//     const statusColors = { pending: '#FFB300', 'in-progress': '#2196F3', completed: '#4CAF50' };

//     const openMenu = (taskId) => setMenuVisible({ ...menuVisible, [taskId]: true });
//     const closeMenu = (taskId) => setMenuVisible({ ...menuVisible, [taskId]: false });

//     const updateTaskStatus = async (taskId, status) => {
//         await firestore().collection('tasks').doc(taskId).update({
//             status,
//             updatedAt: firestore.FieldValue.serverTimestamp(),
//         });
//         closeMenu(taskId);
//     };

//     const deleteTask = async (taskId) => {
//         await firestore().collection('tasks').doc(taskId).delete();
//     };

//     const openAddRemark = (taskId) => {
//         setCurrentTaskId(taskId);
//         setRemarkModalVisible(true);
//     };

//     const saveRemark = async () => {
//         if (!remarkText) return;
//         const taskRef = firestore().collection('tasks').doc(currentTaskId);
//         const taskDoc = await taskRef.get();
//         const updatedRemarks = [...(taskDoc.data().remarks || []), remarkText];
//         await taskRef.update({ remarks: updatedRemarks, updatedAt: firestore.FieldValue.serverTimestamp() });
//         setRemarkText('');
//         setRemarkModalVisible(false);
//     };

//     return (
//         <Portal>
//             <Modal
//                 visible={visible}
//                 onDismiss={onDismiss}
//                 contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.card, maxHeight: height * 0.85 }]}
//             >
//                 {/* Header */}
//                 <Text style={styles.headerText(theme)}>{selectedUser?.name}'s Tasks</Text>

//                 <ScrollView showsVerticalScrollIndicator={false}>
//                     {selectedUser?.tasks?.length ? selectedUser.tasks.map(task => {
//                         const isOverdue = task.deadline?.toDate?.() < new Date() && task.status !== 'completed';

//                         return (
//                             <Card key={task.taskId} style={[styles.card, { borderColor: isOverdue ? '#FF3B30' : 'transparent' }]}>
//                                 <Card.Content>
//                                     {/* Task Header */}
//                                     <View style={styles.taskHeader}>
//                                         <View style={{ flex: 1 }}>
//                                             <Text style={styles.taskTitle(theme)}>{task.title}</Text>
//                                             <Text style={styles.taskDescription(theme)} numberOfLines={2}>{task.description}</Text>
//                                         </View>

//                                         <View style={styles.iconActions}>
//                                             {/* Status icon */}
//                                             <Menu
//                                                 visible={menuVisible[task.taskId]}
//                                                 onDismiss={() => closeMenu(task.taskId)}
//                                                 anchor={
//                                                     <IconButton
//                                                         icon="swap-vertical"
//                                                         iconColor={statusColors[task.status]}
//                                                         size={28}
//                                                         onPress={() => openMenu(task.taskId)}
//                                                     />
//                                                 }
//                                             >
//                                                 {['pending', 'in-progress', 'completed']
//                                                     .filter(s => s !== task.status)
//                                                     .map(s => (
//                                                         <Menu.Item
//                                                             key={s}
//                                                             title={s.toUpperCase()}
//                                                             leadingIcon={() => <View style={[styles.statusDot, { backgroundColor: statusColors[s] }]} />}
//                                                             onPress={() => updateTaskStatus(task.taskId, s)}
//                                                         />
//                                                     ))}
//                                             </Menu>

//                                             {/* Delete icon */}
//                                             <IconButton
//                                                 icon="trash-can-outline"
//                                                 iconColor="#FF3B30"
//                                                 size={28}
//                                                 onPress={() => deleteTask(task.taskId)}
//                                             />

//                                             {/* Add Remark icon */}
//                                             <IconButton
//                                                 icon="plus"
//                                                 iconColor={theme.colors.primary}
//                                                 size={28}
//                                                 onPress={() => openAddRemark(task.taskId)}
//                                             />
//                                         </View>
//                                     </View>

//                                     {/* Deadline */}
//                                     <View style={styles.deadlineRow}>
//                                         <Ionicons name="calendar-outline" size={16} color={isOverdue ? '#FF3B30' : theme.colors.text} style={{ marginRight: 6 }} />
//                                         <Text style={[styles.deadlineText(theme), { color: isOverdue ? '#FF3B30' : theme.colors.text }]}>
//                                             {task.deadline?.toDate?.()?.toDateString?.() || 'N/A'}
//                                         </Text>
//                                     </View>

//                                     {/* Remarks */}
//                                     <View style={styles.remarksContainer}>
//                                         {task.remarks?.map((remark, index) => (
//                                             <View key={index} style={styles.remarkChip}>
//                                                 <Ionicons name="pencil-outline" size={12} color="#333" style={{ marginRight: 4 }} />
//                                                 <Text style={styles.remarkText}>{remark}</Text>
//                                             </View>
//                                         ))}
//                                     </View>
//                                 </Card.Content>
//                             </Card>
//                         );
//                     }) : (
//                         <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20, fontSize: 14 }}>
//                             No tasks assigned
//                         </Text>
//                     )}
//                 </ScrollView>

//                 {/* Close Button */}
//                 <IconButton
//                     icon="close-circle-outline"
//                     iconColor={theme.colors.primary}
//                     size={36}
//                     style={{ alignSelf: 'center', marginTop: 16 }}
//                     onPress={onDismiss}
//                 />

//                 {/* Add Remark Modal */}
//                 <Portal>
//                     <Modal
//                         visible={remarkModalVisible}
//                         onDismiss={() => setRemarkModalVisible(false)}
//                         contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.card }]}
//                     >
//                         <Text style={styles.headerText(theme, 18)}>Add Remark</Text>
//                         <TextInput
//                             placeholder="Enter your remark"
//                             value={remarkText}
//                             onChangeText={setRemarkText}
//                             style={[styles.remarkInput, { backgroundColor: theme.colors.background }]}
//                         />
//                         <IconButton
//                             icon="content-save-outline"
//                             iconColor={theme.colors.primary}
//                             size={36}
//                             style={{ alignSelf: 'center', marginBottom: 8 }}
//                             onPress={saveRemark}
//                         />
//                         <IconButton
//                             icon="close-circle-outline"
//                             iconColor={theme.colors.text}
//                             size={36}
//                             style={{ alignSelf: 'center' }}
//                             onPress={() => setRemarkModalVisible(false)}
//                         />
//                     </Modal>
//                 </Portal>
//             </Modal>
//         </Portal>
//     );
// };

// const styles = StyleSheet.create({
//     modalContainer: { padding: 20, borderRadius: 16, marginHorizontal: 16 },
//     headerText: (theme, size = 24) => ({ fontSize: size, fontWeight: '700', marginBottom: 16, color: theme.colors.text }),
//     card: { borderRadius: 16, elevation: 5, marginBottom: 16, padding: 12 },
//     taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
//     taskTitle: (theme) => ({ fontSize: 18, fontWeight: '700', color: theme.colors.text }),
//     taskDescription: (theme) => ({ fontSize: 14, color: theme.colors.text, marginTop: 4 }),
//     iconActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
//     statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
//     deadlineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
//     deadlineText: (theme) => ({ fontSize: 14 }),
//     remarksContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 8 },
//     remarkChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0E0E0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 6, marginBottom: 6 },
//     remarkText: { fontSize: 12, color: '#333' },
//     remarkInput: { marginBottom: 12, borderRadius: 8, paddingHorizontal: 12 },
// });

// export default PremiumTasksModal;














// import React, { useState } from 'react';
// import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
// import { Portal, Modal, Card, Text, Menu, IconButton, TextInput } from 'react-native-paper';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import firestore from '@react-native-firebase/firestore';

// const { height } = Dimensions.get('window');

// const PremiumTasksModal = ({ visible, onDismiss, selectedUser, theme }) => {
//     const [menuVisible, setMenuVisible] = useState({});
//     const [remarkModalVisible, setRemarkModalVisible] = useState(false);
//     const [remarkText, setRemarkText] = useState('');
//     const [currentTaskId, setCurrentTaskId] = useState(null);

//     const statusColors = { pending: '#FFB300', 'in-progress': '#2196F3', completed: '#4CAF50' };

//     const openMenu = (taskId) => setMenuVisible({ ...menuVisible, [taskId]: true });
//     const closeMenu = (taskId) => setMenuVisible({ ...menuVisible, [taskId]: false });

//     const updateTaskStatus = async (taskId, status) => {
//         await firestore().collection('tasks').doc(taskId).update({
//             status,
//             updatedAt: firestore.FieldValue.serverTimestamp(),
//         });
//         closeMenu(taskId);
//     };

//     const deleteTask = async (taskId) => {
//         await firestore().collection('tasks').doc(taskId).delete();
//     };

//     const openAddRemark = (taskId) => {
//         setCurrentTaskId(taskId);
//         setRemarkModalVisible(true);
//     };

//     const saveRemark = async () => {
//         if (!remarkText) return;
//         const taskRef = firestore().collection('tasks').doc(currentTaskId);
//         const taskDoc = await taskRef.get();
//         const updatedRemarks = [...(taskDoc.data().remarks || []), remarkText];
//         await taskRef.update({ remarks: updatedRemarks, updatedAt: firestore.FieldValue.serverTimestamp() });
//         setRemarkText('');
//         setRemarkModalVisible(false);
//     };

//     return (
//         <Portal>
//             <Modal
//                 visible={visible}
//                 onDismiss={onDismiss}
//                 contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.card, maxHeight: height * 0.85 }]}
//             >
//                 {/* Header */}
//                 <Text style={styles.headerText(theme)}>{selectedUser?.name}'s Tasks</Text>

//                 <ScrollView showsVerticalScrollIndicator={false}>
//                     {selectedUser?.tasks?.length ? selectedUser.tasks.map(task => {
//                         const isOverdue = task.deadline?.toDate?.() < new Date() && task.status !== 'completed';

//                         return (
//                             <Card key={task.taskId} style={[styles.card, { borderColor: isOverdue ? '#FF3B30' : 'transparent' }]}>
//                                 <Card.Content>
//                                     <View style={styles.taskRow}>
//                                         <View style={{ flex: 1 }}>
//                                             <Text style={styles.taskTitle(theme)}>{task.title}</Text>
//                                             <Text style={styles.taskDescription(theme)} numberOfLines={2}>{task.description}</Text>
//                                             <View style={styles.deadlineRow}>
//                                                 <Ionicons name="calendar-outline" size={16} color={isOverdue ? '#FF3B30' : theme.colors.text} style={{ marginRight: 6 }} />
//                                                 <Text style={[styles.deadlineText(theme), { color: isOverdue ? '#FF3B30' : theme.colors.text }]}>
//                                                     {task.deadline?.toDate?.()?.toDateString?.() || 'N/A'}
//                                                 </Text>
//                                             </View>
//                                             <View style={styles.remarksContainer}>
//                                                 {task.remarks?.map((remark, index) => (
//                                                     <View key={index} style={styles.remarkChip}>
//                                                         <Ionicons name="pencil-outline" size={12} color="#333" style={{ marginRight: 4 }} />
//                                                         <Text style={styles.remarkText}>{remark}</Text>
//                                                     </View>
//                                                 ))}
//                                             </View>
//                                         </View>

//                                         {/* Vertical Action Buttons */}
//                                         <View style={styles.verticalIcons}>
//                                             <Menu
//                                                 visible={menuVisible[task.taskId]}
//                                                 onDismiss={() => closeMenu(task.taskId)}
//                                                 anchor={
//                                                     <IconButton
//                                                         icon="swap-vertical"
//                                                         iconColor={statusColors[task.status]}
//                                                         size={28}
//                                                         onPress={() => openMenu(task.taskId)}
//                                                     />
//                                                 }
//                                             >
//                                                 {['pending', 'in-progress', 'completed']
//                                                     .filter(s => s !== task.status)
//                                                     .map(s => (
//                                                         <Menu.Item
//                                                             key={s}
//                                                             title={s.toUpperCase()}
//                                                             leadingIcon={() => <View style={[styles.statusDot, { backgroundColor: statusColors[s] }]} />}
//                                                             onPress={() => updateTaskStatus(task.taskId, s)}
//                                                         />
//                                                     ))}
//                                             </Menu>

//                                             <IconButton
//                                                 icon="trash-can-outline"
//                                                 iconColor="#FF3B30"
//                                                 size={28}
//                                                 onPress={() => deleteTask(task.taskId)}
//                                             />

//                                             <IconButton
//                                                 icon="plus"
//                                                 iconColor={theme.colors.primary}
//                                                 size={28}
//                                                 onPress={() => openAddRemark(task.taskId)}
//                                             />
//                                         </View>
//                                     </View>
//                                 </Card.Content>
//                             </Card>
//                         );
//                     }) : (
//                         <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20, fontSize: 14 }}>
//                             No tasks assigned
//                         </Text>
//                     )}
//                 </ScrollView>

//                 <IconButton
//                     icon="close-circle-outline"
//                     iconColor={theme.colors.primary}
//                     size={36}
//                     style={{ alignSelf: 'center', marginTop: 16 }}
//                     onPress={onDismiss}
//                 />

//                 {/* Add Remark Modal */}
//                 <Portal>
//                     <Modal
//                         visible={remarkModalVisible}
//                         onDismiss={() => setRemarkModalVisible(false)}
//                         contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.card }]}
//                     >
//                         <Text style={styles.headerText(theme, 18)}>Add Remark</Text>
//                         <TextInput
//                             placeholder="Enter your remark"
//                             value={remarkText}
//                             onChangeText={setRemarkText}
//                             style={[styles.remarkInput, { backgroundColor: theme.colors.background }]}
//                         />
//                         <IconButton
//                             icon="content-save-outline"
//                             iconColor={theme.colors.primary}
//                             size={36}
//                             style={{ alignSelf: 'center', marginBottom: 8 }}
//                             onPress={saveRemark}
//                         />
//                         <IconButton
//                             icon="close-circle-outline"
//                             iconColor={theme.colors.text}
//                             size={36}
//                             style={{ alignSelf: 'center' }}
//                             onPress={() => setRemarkModalVisible(false)}
//                         />
//                     </Modal>
//                 </Portal>
//             </Modal>
//         </Portal>
//     );
// };

// const styles = StyleSheet.create({
//     modalContainer: { padding: 20, borderRadius: 16, marginHorizontal: 16 },
//     headerText: (theme, size = 24) => ({ fontSize: size, fontWeight: '700', marginBottom: 16, color: theme.colors.text }),
//     card: { borderRadius: 16, elevation: 5, marginBottom: 16, padding: 12 },
//     taskRow: { flexDirection: 'row', alignItems: 'flex-start' },
//     taskTitle: (theme) => ({ fontSize: 18, fontWeight: '700', color: theme.colors.text }),
//     taskDescription: (theme) => ({ fontSize: 14, color: theme.colors.text, marginTop: 4 }),
//     deadlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
//     deadlineText: (theme) => ({ fontSize: 14 }),
//     remarksContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 8 },
//     remarkChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0E0E0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 6, marginBottom: 6 },
//     remarkText: { fontSize: 12, color: '#333' },
//     remarkInput: { marginBottom: 12, borderRadius: 8, paddingHorizontal: 12 },
//     verticalIcons: { flexDirection: 'column', justifyContent: 'flex-start', marginLeft: 8 },
//     statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
// });

// export default PremiumTasksModal;


















// import React, { useState } from 'react';
// import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
// import { Portal, Modal, Card, Text, Menu, IconButton, TextInput } from 'react-native-paper';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import firestore from '@react-native-firebase/firestore';

// const { height } = Dimensions.get('window');

// const PremiumTasksModal = ({ visible, onDismiss, selectedUser, theme }) => {
//     const [menuVisible, setMenuVisible] = useState({});
//     const [remarkModalVisible, setRemarkModalVisible] = useState(false);
//     const [remarkText, setRemarkText] = useState('');
//     const [currentTaskId, setCurrentTaskId] = useState(null);

//     const statusColors = { pending: '#FFB300', 'in-progress': '#2196F3', completed: '#4CAF50' };

//     const openMenu = (taskId) => setMenuVisible({ ...menuVisible, [taskId]: true });
//     const closeMenu = (taskId) => setMenuVisible({ ...menuVisible, [taskId]: false });

//     const updateTaskStatus = async (taskId, status) => {
//         await firestore().collection('tasks').doc(taskId).update({
//             status,
//             updatedAt: firestore.FieldValue.serverTimestamp(),
//         });
//         closeMenu(taskId);
//     };

//     const deleteTask = async (taskId) => {
//         await firestore().collection('tasks').doc(taskId).delete();
//     };

//     const openAddRemark = (taskId) => {
//         setCurrentTaskId(taskId);
//         setRemarkModalVisible(true);
//     };

//     const saveRemark = async () => {
//         if (!remarkText) return;
//         const taskRef = firestore().collection('tasks').doc(currentTaskId);
//         const taskDoc = await taskRef.get();
//         const updatedRemarks = [...(taskDoc.data().remarks || []), remarkText];
//         await taskRef.update({ remarks: updatedRemarks, updatedAt: firestore.FieldValue.serverTimestamp() });
//         setRemarkText('');
//         setRemarkModalVisible(false);
//     };

//     return (
//         <Portal>
//             <Modal
//                 visible={visible}
//                 onDismiss={onDismiss}
//                 contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.card, maxHeight: height * 0.85 }]}
//             >
//                 {/* Header */}
//                 <Text style={styles.headerText(theme)}>{selectedUser?.name}'s Tasks</Text>

//                 <ScrollView showsVerticalScrollIndicator={false}>
//                     {selectedUser?.tasks?.length ? selectedUser.tasks.map(task => {
//                         const isOverdue = task.deadline?.toDate?.() < new Date() && task.status !== 'completed';

//                         return (
//                             <Card key={task.taskId} style={[styles.card, { borderColor: isOverdue ? '#FF3B30' : 'transparent' }]}>
//                                 <Card.Content>
//                                     <View style={styles.taskRow}>
//                                         {/* Left content */}
//                                         <View style={{ flex: 1 }}>
//                                             <View style={styles.titleRow}>
//                                                 <Ionicons name="list-circle" size={22} color={theme.colors.primary} style={{ marginRight: 6 }} />
//                                                 <Text style={styles.taskTitle(theme)}>{task.title}</Text>
//                                             </View>
//                                             <Text style={styles.taskDescription(theme)} numberOfLines={2}>{task.description}</Text>

//                                             {/* Deadline */}
//                                             <View style={styles.deadlineRow}>
//                                                 <Ionicons name="calendar-outline" size={16} color={isOverdue ? '#FF3B30' : theme.colors.text} style={{ marginRight: 6 }} />
//                                                 <Text style={[styles.deadlineText(theme), { color: isOverdue ? '#FF3B30' : theme.colors.text }]}>
//                                                     {task.deadline?.toDate?.()?.toDateString?.() || 'N/A'}
//                                                 </Text>
//                                             </View>

//                                             {/* Remarks */}
//                                             <View style={styles.remarksContainer}>
//                                                 {task.remarks?.map((remark, index) => (
//                                                     <View key={index} style={[styles.remarkChip, { backgroundColor: '#F2F2F2' }]}>
//                                                         <Ionicons name="pencil-outline" size={12} color="#555" style={{ marginRight: 4 }} />
//                                                         <Text style={styles.remarkText}>{remark}</Text>
//                                                     </View>
//                                                 ))}
//                                             </View>
//                                         </View>

//                                         {/* Right vertical buttons */}
//                                         <View style={styles.verticalIcons}>
//                                             <Menu
//                                                 visible={menuVisible[task.taskId]}
//                                                 onDismiss={() => closeMenu(task.taskId)}
//                                                 anchor={
//                                                     <IconButton
//                                                         icon="circle"
//                                                         iconColor={statusColors[task.status]}
//                                                         size={28}
//                                                         onPress={() => openMenu(task.taskId)}
//                                                     />
//                                                 }
//                                             >
//                                                 {['pending', 'in-progress', 'completed']
//                                                     .filter(s => s !== task.status)
//                                                     .map(s => (
//                                                         <Menu.Item
//                                                             key={s}
//                                                             title={s.toUpperCase()}
//                                                             leadingIcon={() => <View style={[styles.statusDot, { backgroundColor: statusColors[s] }]} />}
//                                                             onPress={() => updateTaskStatus(task.taskId, s)}
//                                                         />
//                                                     ))}
//                                             </Menu>

//                                             <IconButton
//                                                 icon="trash-can-outline"
//                                                 iconColor="#FF3B30"
//                                                 size={28}
//                                                 onPress={() => deleteTask(task.taskId)}
//                                             />

//                                             <IconButton
//                                                 icon="plus"
//                                                 iconColor={theme.colors.primary}
//                                                 size={28}
//                                                 onPress={() => openAddRemark(task.taskId)}
//                                             />
//                                         </View>
//                                     </View>
//                                 </Card.Content>
//                             </Card>
//                         );
//                     }) : (
//                         <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20, fontSize: 14 }}>
//                             No tasks assigned
//                         </Text>
//                     )}
//                 </ScrollView>

//                 {/* Close Modal Button */}
//                 <IconButton
//                     icon="close-circle-outline"
//                     iconColor={theme.colors.primary}
//                     size={36}
//                     style={{ alignSelf: 'center', marginTop: 16 }}
//                     onPress={onDismiss}
//                 />

//                 {/* Add Remark Modal */}
//                 <Portal>
//                     <Modal
//                         visible={remarkModalVisible}
//                         onDismiss={() => setRemarkModalVisible(false)}
//                         contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.card }]}
//                     >
//                         <Text style={styles.headerText(theme, 18)}>Add Remark</Text>
//                         <TextInput
//                             placeholder="Enter your remark"
//                             value={remarkText}
//                             onChangeText={setRemarkText}
//                             style={[styles.remarkInput, { backgroundColor: theme.colors.background }]}
//                         />
//                         <IconButton
//                             icon="content-save-outline"
//                             iconColor={theme.colors.primary}
//                             size={36}
//                             style={{ alignSelf: 'center', marginBottom: 8 }}
//                             onPress={saveRemark}
//                         />
//                         <IconButton
//                             icon="close-circle-outline"
//                             iconColor={theme.colors.text}
//                             size={36}
//                             style={{ alignSelf: 'center' }}
//                             onPress={() => setRemarkModalVisible(false)}
//                         />
//                     </Modal>
//                 </Portal>
//             </Modal>
//         </Portal>
//     );
// };

// const styles = StyleSheet.create({
//     modalContainer: { padding: 20, borderRadius: 16, marginHorizontal: 16 },
//     headerText: (theme, size = 24) => ({ fontSize: size, fontWeight: '700', marginBottom: 16, color: theme.colors.text }),
//     card: { borderRadius: 16, elevation: 6, marginBottom: 16, padding: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
//     taskRow: { flexDirection: 'row', alignItems: 'flex-start' },
//     titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
//     taskTitle: (theme) => ({ fontSize: 18, fontWeight: '700', color: theme.colors.text }),
//     taskDescription: (theme) => ({ fontSize: 14, color: '#555', marginBottom: 6 }),
//     deadlineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
//     deadlineText: (theme) => ({ fontSize: 14 }),
//     remarksContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
//     remarkChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 6, marginBottom: 6 },
//     remarkText: { fontSize: 12, color: '#555' },
//     remarkInput: { marginBottom: 12, borderRadius: 8, paddingHorizontal: 12 },
//     verticalIcons: { flexDirection: 'column', justifyContent: 'flex-start', marginLeft: 12 },
//     statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
// });

// export default PremiumTasksModal;













import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Portal, Modal, Card, Text, Menu, IconButton, TextInput } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';

const { height } = Dimensions.get('window');

const PremiumTasksModal = ({ visible, onDismiss, selectedUser, theme }) => {
    const [menuVisible, setMenuVisible] = useState({});
    const [remarkModalVisible, setRemarkModalVisible] = useState(false);
    const [remarkText, setRemarkText] = useState('');
    const [currentTaskId, setCurrentTaskId] = useState(null);

    const statusColors = { pending: '#FFB300', 'in-progress': '#2196F3', completed: '#4CAF50' };

    const openMenu = (taskId) => setMenuVisible({ ...menuVisible, [taskId]: true });
    const closeMenu = (taskId) => setMenuVisible({ ...menuVisible, [taskId]: false });

    const updateTaskStatus = async (taskId, status) => {
        await firestore().collection('tasks').doc(taskId).update({
            status,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        closeMenu(taskId);
    };

    const deleteTask = async (taskId) => {
        await firestore().collection('tasks').doc(taskId).delete();
    };

    const openAddRemark = (taskId) => {
        setCurrentTaskId(taskId);
        setRemarkModalVisible(true);
    };

    const saveRemark = async () => {
        if (!remarkText) return;
        const taskRef = firestore().collection('tasks').doc(currentTaskId);
        const taskDoc = await taskRef.get();
        const updatedRemarks = [...(taskDoc.data().remarks || []), remarkText];
        await taskRef.update({ remarks: updatedRemarks, updatedAt: firestore.FieldValue.serverTimestamp() });
        setRemarkText('');
        setRemarkModalVisible(false);
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.card, maxHeight: height * 0.85 }]}
            >
                {/* Header */}
                <Text style={styles.headerText(theme)}>{selectedUser?.name}'s Tasks</Text>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {selectedUser?.tasks?.length ? selectedUser.tasks.map(task => {
                        const isOverdue = task.deadline?.toDate?.() < new Date() && task.status !== 'completed';

                        return (
                            <Card key={task.taskId} style={[styles.card, { borderColor: isOverdue ? '#FF3B30' : 'transparent' }]}>
                                <Card.Content>
                                    {/* Task info */}
                                    <View>
                                        <View style={styles.titleRow}>
                                            <Ionicons name="list-circle" size={22} color={theme.colors.primary} style={{ marginRight: 6 }} />
                                            <Text style={styles.taskTitle(theme)}>{task.title}</Text>
                                        </View>
                                        <Text style={styles.taskDescription(theme)} numberOfLines={2}>{task.description}</Text>

                                        <View style={styles.deadlineRow}>
                                            <Ionicons name="calendar-outline" size={16} color={isOverdue ? '#FF3B30' : theme.colors.text} style={{ marginRight: 6 }} />
                                            <Text style={[styles.deadlineText(theme), { color: isOverdue ? '#FF3B30' : theme.colors.text }]}>
                                                {task.deadline?.toDate?.()?.toDateString?.() || 'N/A'}
                                            </Text>
                                        </View>

                                        <View style={styles.remarksContainer}>
                                            {task.remarks?.map((remark, index) => (
                                                <View key={index} style={[styles.remarkChip, { backgroundColor: '#F2F2F2' }]}>
                                                    <Ionicons name="pencil-outline" size={12} color="#555" style={{ marginRight: 4 }} />
                                                    <Text style={styles.remarkText}>{remark}</Text>
                                                </View>
                                            ))}
                                        </View>

                                        {/* Horizontal buttons below content */}
                                        <View style={styles.buttonRow}>
                                            {/* Status menu */}
                                            <Menu
                                                visible={menuVisible[task.taskId]}
                                                onDismiss={() => closeMenu(task.taskId)}
                                                anchor={
                                                    <IconButton
                                                        icon="circle"
                                                        iconColor={statusColors[task.status]}
                                                        size={28}
                                                        onPress={() => openMenu(task.taskId)}
                                                    />
                                                }
                                            >
                                                {['pending', 'in-progress', 'completed']
                                                    .filter(s => s !== task.status)
                                                    .map(s => (
                                                        <Menu.Item
                                                            key={s}
                                                            title={s.toUpperCase()}
                                                            leadingIcon={() => <View style={[styles.statusDot, { backgroundColor: statusColors[s] }]} />}
                                                            onPress={() => updateTaskStatus(task.taskId, s)}
                                                        />
                                                    ))}
                                            </Menu>

                                            <IconButton
                                                icon="trash-can-outline"
                                                iconColor="#FF3B30"
                                                size={28}
                                                onPress={() => deleteTask(task.taskId)}
                                            />

                                            <IconButton
                                                icon="plus"
                                                iconColor={theme.colors.primary}
                                                size={28}
                                                onPress={() => openAddRemark(task.taskId)}
                                            />
                                        </View>
                                    </View>
                                </Card.Content>
                            </Card>
                        );
                    }) : (
                        <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20, fontSize: 14 }}>
                            No tasks assigned
                        </Text>
                    )}
                </ScrollView>

                {/* Close Modal Button */}
                <IconButton
                    icon="close-circle-outline"
                    iconColor={theme.colors.primary}
                    size={36}
                    style={{ alignSelf: 'center', marginTop: 16 }}
                    onPress={onDismiss}
                />

                {/* Add Remark Modal */}
                <Portal>
                    <Modal
                        visible={remarkModalVisible}
                        onDismiss={() => setRemarkModalVisible(false)}
                        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.card }]}
                    >
                        <Text style={styles.headerText(theme, 18)}>Add Remark</Text>
                        <TextInput
                            placeholder="Enter your remark"
                            value={remarkText}
                            onChangeText={setRemarkText}
                            style={[styles.remarkInput, { backgroundColor: theme.colors.background }]}
                        />
                        <IconButton
                            icon="content-save-outline"
                            iconColor={theme.colors.primary}
                            size={36}
                            style={{ alignSelf: 'center', marginBottom: 8 }}
                            onPress={saveRemark}
                        />
                        <IconButton
                            icon="close-circle-outline"
                            iconColor={theme.colors.text}
                            size={36}
                            style={{ alignSelf: 'center' }}
                            onPress={() => setRemarkModalVisible(false)}
                        />
                    </Modal>
                </Portal>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalContainer: { padding: 20, borderRadius: 16, marginHorizontal: 16 },
    headerText: (theme, size = 24) => ({ fontSize: size, fontWeight: '700', marginBottom: 16, color: theme.colors.text }),
    card: { borderRadius: 16, elevation: 6, marginBottom: 16, padding: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    taskTitle: (theme) => ({ fontSize: 18, fontWeight: '700', color: theme.colors.text }),
    taskDescription: (theme) => ({ fontSize: 14, color: '#555', marginBottom: 6 }),
    deadlineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    deadlineText: (theme) => ({ fontSize: 14 }),
    remarksContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 8 },
    remarkChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 6, marginBottom: 6 },
    remarkText: { fontSize: 12, color: '#555' },
    remarkInput: { marginBottom: 12, borderRadius: 8, paddingHorizontal: 12 },
    buttonRow: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: 8, gap: 12 },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
});

export default PremiumTasksModal;
