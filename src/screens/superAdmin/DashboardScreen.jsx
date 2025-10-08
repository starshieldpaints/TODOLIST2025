// import React, { useContext } from 'react';
// import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { ThemeContext } from '../../context/ThemeContext';
// import DashboardCharts from "./DashBoardCharts"; // Existing component
// import { useScreenWidth } from '../../hooks/useScreenWidth';
// import { useDashboardData } from '../../hooks/useDashboardData';
// import { useDashboardModals } from '../../hooks/useDashboardModals';
// import { useStatusColor } from '../../utils/statusUtils';
// import { styles } from '../../components/dashboard/DashboardStyles';
// import { StatCard } from '../../components/dashboard/StatCard';
// import { TaskListModal } from '../../components/dashboard/TaskListModal';
// import { TaskDetailModal } from '../../components/dashboard/TaskDetailModal';
// import { UserDetailModal } from '../../components/dashboard/UserDetailModal';

// const DashboardScreen = () => {
//     const { theme } = useContext(ThemeContext);
//     const screenWidth = useScreenWidth();
//     const scale = screenWidth / 375; 

//     const {
//         admins, users, tasks, usersMap, taskStats, getUserLabel, isUsersMapReady
//     } = useDashboardData();

//     const {
//         selectedModal, setSelectedModal,
//         selectedTaskDetail, setSelectedTaskDetail,
//         selectedUserDetail, setSelectedUserDetail
//     } = useDashboardModals();

//     const getStatusColor = useStatusColor();

//     if (!isUsersMapReady) {
//         return (
//             <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }} edges={['top']}>
//                 <ActivityIndicator size="large" color={theme.colors.primary} />
//                 <Text style={{ color: theme.colors.text, marginTop: 10 }}>Loading User Reference Data...</Text>
//             </SafeAreaView>
//         );
//     }

//     const statCardsData = [
//         { title: 'Admins', value: admins, iconName: 'shield-outline', bgColor: '#3498db', modalKey: 'admins' },
//         { title: 'Users', value: users, iconName: 'people-outline', bgColor: '#2ecc71', modalKey: 'users' },
//         { title: 'Pending Tasks', value: taskStats.pending, iconName: 'time-outline', bgColor: '#f1c40f', modalKey: 'pending' },
//         { title: 'In Progress', value: taskStats.inprogress, iconName: 'construct-outline', bgColor: '#2980b9', modalKey: 'inprogress' },
//         { title: 'Completed', value: taskStats.completed, iconName: 'checkmark-done-outline', bgColor: '#27ae60', modalKey: 'completed' },
//         { title: 'Rejected', value: taskStats.rejected, iconName: 'close-circle-outline', bgColor: '#e74c3c', modalKey: 'rejected' },
//     ];

//     return (
//         <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
//             <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
//                 <View style={styles.statCardsContainer}>
//                     {statCardsData.map((card, index) => (
//                         <StatCard
//                             key={index}
//                             title={card.title}
//                             value={card.value}
//                             iconName={card.iconName}
//                             bgColor={card.bgColor}
//                             scale={scale}
//                             onPress={() => setSelectedModal(card.modalKey)}
//                         />
//                     ))}
//                 </View>

//                 <DashboardCharts tasks={tasks} admins={admins} users={users} />
//             </ScrollView>

//             <TaskListModal
//                 selectedModal={selectedModal}
//                 taskStats={taskStats}
//                 admins={admins}
//                 users={users}
//                 usersMap={usersMap}
//                 getUserLabel={getUserLabel}
//                 getStatusColor={getStatusColor} 
//                 setSelectedModal={setSelectedModal}
//                 setSelectedTaskDetail={setSelectedTaskDetail}
//                 setSelectedUserDetail={setSelectedUserDetail}
//             />
//             <TaskDetailModal
//                 selectedTaskDetail={selectedTaskDetail}
//                 usersMap={usersMap}
//                 getUserLabel={getUserLabel}
//                 getStatusColor={getStatusColor}
//                 setSelectedTaskDetail={setSelectedTaskDetail}
//                 setSelectedUserDetail={setSelectedUserDetail}
//             />
//             <UserDetailModal
//                 selectedUserDetail={selectedUserDetail}
//                 tasks={tasks}
//                 setSelectedUserDetail={setSelectedUserDetail}
//             />
//         </SafeAreaView>
//     );
// };

// export default DashboardScreen;


















import React, { useContext } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../../context/ThemeContext';
import DashboardCharts from "./DashBoardCharts";
import { useScreenWidth } from '../../hooks/useScreenWidth';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useDashboardModals } from '../../hooks/useDashboardModals';
import { useStatusColor } from '../../utils/statusUtils';
import { styles } from '../../components/dashboard/DashboardStyles';
import { StatCard } from '../../components/dashboard/StatCard';
import { TaskListModal } from '../../components/dashboard/TaskListModal';
import { TaskDetailModal } from '../../components/dashboard/TaskDetailModal';
import { UserDetailModal } from '../../components/dashboard/UserDetailModal';

const DashboardScreen = () => {
    const { theme } = useContext(ThemeContext);
    const screenWidth = useScreenWidth();
    const scale = screenWidth / 375;

    const {
        admins, users, tasks, usersMap, taskStats, getUserLabel, isUsersMapReady
    } = useDashboardData();

    const {
        selectedModal, setSelectedModal,
        selectedTaskDetail, setSelectedTaskDetail,
        selectedUserDetail, setSelectedUserDetail
    } = useDashboardModals();

    const getStatusColor = useStatusColor();

    if (!isUsersMapReady) {
        // NOTE: This conditional unmount is the likely source of the 'inst' error.
        // If the error persists, you must investigate if DashboardCharts or Modals
        // have asynchronous operations that fire when they are unmounted by this check.
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }} edges={['top']}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ color: theme.colors.text, marginTop: 10 }}>Loading User Reference Data...</Text>
            </SafeAreaView>
        );
    }

    const statCardsData = [
        // Ensure .length is used for the display value
        { title: 'Admins', value: admins.length, iconName: 'shield-outline', bgColor: '#3498db', modalKey: 'admins', data: admins },
        { title: 'Users', value: users.length, iconName: 'people-outline', bgColor: '#2ecc71', modalKey: 'users', data: users },
        { title: 'Pending Tasks', value: taskStats.pending.length, iconName: 'time-outline', bgColor: '#f1c40f', modalKey: 'pending', data: taskStats.pending },
        { title: 'In Progress', value: taskStats.inprogress.length, iconName: 'construct-outline', bgColor: '#2980b9', modalKey: 'inprogress', data: taskStats.inprogress },
        { title: 'Completed', value: taskStats.completed.length, iconName: 'checkmark-done-outline', bgColor: '#27ae60', modalKey: 'completed', data: taskStats.completed },
        { title: 'Rejected', value: taskStats.rejected.length, iconName: 'close-circle-outline', bgColor: '#e74c3c', modalKey: 'rejected', data: taskStats.rejected },
    ];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                <View style={styles.statCardsContainer}>
                    {statCardsData.map((card) => (
                        <StatCard
                            key={card.modalKey} // Using a stable string key
                            title={card.title}
                            value={card.value}
                            iconName={card.iconName}
                            bgColor={card.bgColor}
                            scale={scale}
                            onPress={() => setSelectedModal(card.modalKey)}
                        />
                    ))}
                </View>

                {/* NOTE: If the error persists, temporarily comment out DashboardCharts
                   to check if it's the source of the low-level 'inst' error. */}
                <DashboardCharts tasks={tasks} admins={admins} users={users} />
            </ScrollView>

            <TaskListModal
                selectedModal={selectedModal}
                taskStats={taskStats}
                admins={admins}
                users={users}
                usersMap={usersMap}
                getUserLabel={getUserLabel}
                getStatusColor={getStatusColor}
                setSelectedModal={setSelectedModal}
                setSelectedTaskDetail={setSelectedTaskDetail}
                setSelectedUserDetail={setSelectedUserDetail}
            />
            <TaskDetailModal
                selectedTaskDetail={selectedTaskDetail}
                usersMap={usersMap}
                getUserLabel={getUserLabel}
                getStatusColor={getStatusColor}
                setSelectedTaskDetail={setSelectedTaskDetail}
                setSelectedUserDetail={setSelectedUserDetail}
            />
            <UserDetailModal
                selectedUserDetail={selectedUserDetail}
                tasks={tasks}
                setSelectedUserDetail={setSelectedUserDetail}
            />
        </SafeAreaView>
    );
};

export default DashboardScreen;