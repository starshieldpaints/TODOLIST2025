// import React, { useContext } from 'react';
// import { View, Dimensions, Text, ScrollView } from 'react-native';
// import { PieChart, BarChart } from 'react-native-chart-kit';
// import { ThemeContext } from '../../context/ThemeContext';

// const screenWidth = Dimensions.get('window').width;

// const DashboardCharts = ({ tasks, admins, users }) => {
//     const { theme } = useContext(ThemeContext);
//     const today = new Date();

//     // --- Task Status Pie Chart ---
//     const taskStats = {
//         pending: tasks.filter(t => t.status === 'pending').length,
//         inprogress: tasks.filter(t => t.status === 'inprogress').length,
//         completed: tasks.filter(t => t.status === 'completed').length,
//         rejected: tasks.filter(t => t.status === 'rejected').length,
//     };
//     const taskPieData = [
//         { name: 'Pending', count: taskStats.pending, color: '#f1c40f', legendFontColor: theme.colors.text, legendFontSize: 12 },
//         { name: 'In Progress', count: taskStats.inprogress, color: '#2980b9', legendFontColor: theme.colors.text, legendFontSize: 12 },
//         { name: 'Completed', count: taskStats.completed, color: '#27ae60', legendFontColor: theme.colors.text, legendFontSize: 12 },
//         { name: 'Rejected', count: taskStats.rejected, color: '#e74c3c', legendFontColor: theme.colors.text, legendFontSize: 12 },
//     ];

//     // --- Users vs Admins Bar Chart ---
//     const userAdminBarData = {
//         labels: ['Admins', 'Users'],
//         datasets: [{ data: [admins.length, users.length] }],
//     };
//     // --- Top Performer Contribution Pie Chart ---
//     const totalTasks = tasks.length;
//     const topAdminTasks = topAdmin ? tasksPerAdmin.find(a => a.name === topAdmin.name)?.count || 0 : 0;
//     const topUserTasks = topUser ? tasksPerUser.find(u => u.name === topUser.name)?.count || 0 : 0;
//     const otherTasks = totalTasks - topAdminTasks - topUserTasks;

//     const topPerformerPieData = [
//         { name: topAdmin ? topAdmin.name : 'Top Admin', count: topAdminTasks, color: '#8e44ad', legendFontColor: theme.colors.text, legendFontSize: 12 },
//         { name: topUser ? topUser.name : 'Top User', count: topUserTasks, color: '#e67e22', legendFontColor: theme.colors.text, legendFontSize: 12 },
//         { name: 'Others', count: otherTasks, color: '#7f8c8d', legendFontColor: theme.colors.text, legendFontSize: 12 },
//     ];


//     // --- Tasks per Admin & Efficiency ---
//     const tasksPerAdmin = admins.map(admin => {
//         const assignedTasks = tasks.filter(t => t.assignedBy === admin.adminId);
//         const completedOnTime = assignedTasks.filter(t => t.status === 'completed' && new Date(t.updatedAt) <= new Date(t.deadline)).length;
//         const avgTime = assignedTasks.length
//             ? Math.round(
//                 assignedTasks.reduce((acc, t) => acc + (new Date(t.updatedAt) - new Date(t.createdAt)) / (1000 * 60), 0) /
//                 assignedTasks.length
//             )
//             : 0; // minutes
//         const efficiency = assignedTasks.length ? Math.round((completedOnTime / assignedTasks.length) * 100) : 0;
//         return { name: admin.name || 'Admin', count: assignedTasks.length, efficiency, avgTime };
//     });

//     // --- Tasks per User & Efficiency ---
//     const tasksPerUser = users.map(user => {
//         const assignedTasks = tasks.filter(t => t.assignedTo === user.uid);
//         const completedOnTime = assignedTasks.filter(t => t.status === 'completed' && new Date(t.updatedAt) <= new Date(t.deadline)).length;
//         const avgTime = assignedTasks.length
//             ? Math.round(
//                 assignedTasks.reduce((acc, t) => acc + (new Date(t.updatedAt) - new Date(t.createdAt)) / (1000 * 60), 0) /
//                 assignedTasks.length
//             )
//             : 0;
//         const efficiency = assignedTasks.length ? Math.round((completedOnTime / assignedTasks.length) * 100) : 0;
//         return { name: user.name || 'User', count: assignedTasks.length, efficiency, avgTime };
//     });

//     // --- Top Performer Admin/User ---
//     const topAdmin = tasksPerAdmin.reduce((prev, curr) => (curr.efficiency > (prev?.efficiency || 0) ? curr : prev), null);
//     const topUser = tasksPerUser.reduce((prev, curr) => (curr.efficiency > (prev?.efficiency || 0) ? curr : prev), null);
//     const topPerformersData = [
//         { name: topAdmin ? topAdmin.name : 'N/A', efficiency: topAdmin ? topAdmin.efficiency : 0, color: '#8e44ad' },
//         { name: topUser ? topUser.name : 'N/A', efficiency: topUser ? topUser.efficiency : 0, color: '#e67e22' },
//     ];
//     const topPerformersBarData = {
//         labels: topPerformersData.map(d => d.name),
//         datasets: [{ data: topPerformersData.map(d => d.efficiency) }],
//     };

//     // --- Deadlines Overview ---
//     const upcoming = tasks.filter(t => new Date(t.deadline) >= today).length;
//     const overdue = tasks.filter(t => new Date(t.deadline) < today && t.status !== 'completed').length;
//     const deadlineBarData = {
//         labels: ['Upcoming', 'Overdue'],
//         datasets: [{ data: [upcoming, overdue] }],
//     };

//     const chartConfig = {
//         backgroundGradientFrom: theme.colors.background,
//         backgroundGradientTo: theme.colors.background,
//         color: (opacity = 1) => theme.colors.text,
//         decimalPlaces: 0,
//     };

//     return (
//         <ScrollView contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 16 }}>
//             {/* Task Status */}
//             <Text style={{ color: theme.colors.text, fontWeight: '700', marginBottom: 8 }}>Task Status</Text>
//             <PieChart
//                 data={taskPieData}
//                 width={screenWidth - 32}
//                 height={200}
//                 chartConfig={chartConfig}
//                 accessor="count"
//                 backgroundColor="transparent"
//                 paddingLeft="15"
//                 absolute
//             />

//             {/* Users vs Admins */}
//             <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>Users vs Admins</Text>
//             <BarChart
//                 data={userAdminBarData}
//                 width={screenWidth - 32}
//                 height={180}
//                 fromZero
//                 chartConfig={chartConfig}
//                 showValuesOnTopOfBars
//             />

//             {/* Admin & User Efficiency */}
//             <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>Admin Efficiency (%)</Text>
//             <BarChart
//                 data={{
//                     labels: tasksPerAdmin.map(a => a.name),
//                     datasets: [{ data: tasksPerAdmin.map(a => a.efficiency) }],
//                 }}
//                 width={screenWidth - 32}
//                 height={180}
//                 fromZero
//                 chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(39, 174, 96, ${opacity})` }}
//                 showValuesOnTopOfBars
//             />

//             <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>User Efficiency (%)</Text>
//             <BarChart
//                 data={{
//                     labels: tasksPerUser.map(u => u.name),
//                     datasets: [{ data: tasksPerUser.map(u => u.efficiency) }],
//                 }}
//                 width={screenWidth - 32}
//                 height={180}
//                 fromZero
//                 chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})` }}
//                 showValuesOnTopOfBars
//             />
//             <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>Top Performer Contribution</Text>
//             <PieChart
//                 data={topPerformerPieData}
//                 width={screenWidth - 32}
//                 height={200}
//                 chartConfig={chartConfig}
//                 accessor="count"
//                 backgroundColor="transparent"
//                 paddingLeft="15"
//                 absolute
//             />


//             {/* Top Performers */}
//             <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>Top Performers (Efficiency %)</Text>
//             <BarChart
//                 data={topPerformersBarData}
//                 width={screenWidth - 32}
//                 height={140}
//                 fromZero
//                 chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})` }}
//                 showValuesOnTopOfBars
//             />

//             {/* Deadlines Overview */}
//             <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>Deadlines Overview</Text>
//             <BarChart
//                 data={deadlineBarData}
//                 width={screenWidth - 32}
//                 height={180}
//                 fromZero
//                 chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(155, 89, 182, ${opacity})` }}
//                 showValuesOnTopOfBars
//             />
//         </ScrollView>
//     );
// };

// export default DashboardCharts;




// DashboardCharts.js
import React, { useContext } from 'react';
import { View, Dimensions, Text, ScrollView } from 'react-native';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { ThemeContext } from '../../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

const DashboardCharts = ({ tasks, admins, users }) => {
    const { theme } = useContext(ThemeContext);
    const today = new Date();

    // --- Task Status Pie Chart ---
    const taskStats = {
        pending: tasks.filter(t => t.status === 'pending').length,
        inprogress: tasks.filter(t => t.status === 'inprogress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        rejected: tasks.filter(t => t.status === 'rejected').length,
    };
    const taskPieData = [
        { name: 'Pending', count: taskStats.pending, color: '#f1c40f', legendFontColor: theme.colors.text, legendFontSize: 12 },
        { name: 'In Progress', count: taskStats.inprogress, color: '#2980b9', legendFontColor: theme.colors.text, legendFontSize: 12 },
        { name: 'Completed', count: taskStats.completed, color: '#27ae60', legendFontColor: theme.colors.text, legendFontSize: 12 },
        { name: 'Rejected', count: taskStats.rejected, color: '#e74c3c', legendFontColor: theme.colors.text, legendFontSize: 12 },
    ];

    // --- Users vs Admins Bar Chart ---
    const userAdminBarData = {
        labels: ['Admins', 'Users'],
        datasets: [{ data: [admins.length, users.length] }],
    };

    // --- Tasks per Admin & Efficiency ---
    const tasksPerAdmin = admins.map(admin => {
        const assignedTasks = tasks.filter(t => t.assignedBy === admin.adminId);
        const completedOnTime = assignedTasks.filter(
            t => t.status === 'completed' && new Date(t.updatedAt) <= new Date(t.deadline)
        ).length;
        const avgTime = assignedTasks.length
            ? Math.round(
                assignedTasks.reduce((acc, t) => acc + (new Date(t.updatedAt) - new Date(t.createdAt)) / (1000 * 60), 0) /
                assignedTasks.length
            )
            : 0;
        const efficiency = assignedTasks.length ? Math.round((completedOnTime / assignedTasks.length) * 100) : 0;
        return { name: admin.name || 'Admin', count: assignedTasks.length, efficiency, avgTime };
    });

    const adminTaskBarData = {
        labels: tasksPerAdmin.map(a => a.name),
        datasets: [{ data: tasksPerAdmin.map(a => a.count) }],
    };
    const adminEfficiencyBarData = {
        labels: tasksPerAdmin.map(a => a.name),
        datasets: [{ data: tasksPerAdmin.map(a => a.efficiency) }],
    };

    // --- Tasks per User & Efficiency ---
    const tasksPerUser = users.map(user => {
        const assignedTasks = tasks.filter(t => t.assignedTo === user.uid);
        const completedOnTime = assignedTasks.filter(
            t => t.status === 'completed' && new Date(t.updatedAt) <= new Date(t.deadline)
        ).length;
        const avgTime = assignedTasks.length
            ? Math.round(
                assignedTasks.reduce((acc, t) => acc + (new Date(t.updatedAt) - new Date(t.createdAt)) / (1000 * 60), 0) /
                assignedTasks.length
            )
            : 0;
        const efficiency = assignedTasks.length ? Math.round((completedOnTime / assignedTasks.length) * 100) : 0;
        return { name: user.name || 'User', count: assignedTasks.length, efficiency, avgTime };
    });

    const userTaskBarData = {
        labels: tasksPerUser.map(u => u.name),
        datasets: [{ data: tasksPerUser.map(u => u.count) }],
    };
    const userEfficiencyBarData = {
        labels: tasksPerUser.map(u => u.name),
        datasets: [{ data: tasksPerUser.map(u => u.efficiency) }],
    };

    // --- Deadlines Overview ---
    const upcoming = tasks.filter(t => new Date(t.deadline) >= today).length;
    const overdue = tasks.filter(t => new Date(t.deadline) < today && t.status !== 'completed').length;
    const deadlineBarData = {
        labels: ['Upcoming', 'Overdue'],
        datasets: [{ data: [upcoming, overdue] }],
    };

    // --- Top Performer ---
    const topAdmin = tasksPerAdmin.reduce((prev, curr) => (curr.efficiency > prev.efficiency ? curr : prev), { efficiency: 0 });
    const topUser = tasksPerUser.reduce((prev, curr) => (curr.efficiency > prev.efficiency ? curr : prev), { efficiency: 0 });

    const totalTasks = tasks.length;
    const topAdminTasks = topAdmin.count || 0;
    const topUserTasks = topUser.count || 0;
    const otherTasks = totalTasks - topAdminTasks - topUserTasks;
    const topPerformerPieData = [
        { name: topAdmin.name || 'Top Admin', count: topAdminTasks, color: '#8e44ad', legendFontColor: theme.colors.text, legendFontSize: 12 },
        { name: topUser.name || 'Top User', count: topUserTasks, color: '#e67e22', legendFontColor: theme.colors.text, legendFontSize: 12 },
        { name: 'Others', count: otherTasks, color: '#7f8c8d', legendFontColor: theme.colors.text, legendFontSize: 12 },
    ];

    // --- Task Trends Over Time (last 7 days) ---
    const dates = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (6 - i));
        return d.toISOString().slice(5, 10); // "MM-DD"
    });

    const tasksPerDay = dates.map(dateStr => {
        const dayTasks = tasks.filter(t => t.createdAt.toDate().toISOString().slice(5, 10) === dateStr);
        return dayTasks.length;
    });

    const taskTrendData = {
        labels: dates,
        datasets: [{ data: tasksPerDay, color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})` }],
    };

    const chartConfig = {
        backgroundGradientFrom: theme.colors.background,
        backgroundGradientTo: theme.colors.background,
        color: (opacity = 1) => theme.colors.text,
        decimalPlaces: 0,
    };

    return (
        <ScrollView contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 16 }}>
            <Text style={{ color: theme.colors.text, fontWeight: '700', marginBottom: 8 }}>Task Status</Text>
            <PieChart data={taskPieData} width={screenWidth - 32} height={200} chartConfig={chartConfig} accessor="count" backgroundColor="transparent" paddingLeft="15" absolute />

            <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>Users vs Admins</Text>
            <BarChart data={userAdminBarData} width={screenWidth - 32} height={180} fromZero chartConfig={chartConfig} showValuesOnTopOfBars />

            <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>Tasks per Admin</Text>
            <BarChart data={adminTaskBarData} width={screenWidth - 32} height={180} fromZero chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(41, 128, 185, ${opacity})` }} showValuesOnTopOfBars />

            <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>Admin Efficiency (%)</Text>
            <BarChart data={adminEfficiencyBarData} width={screenWidth - 32} height={180} fromZero chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(39, 174, 96, ${opacity})` }} showValuesOnTopOfBars />

            <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>Tasks per User</Text>
            <BarChart data={userTaskBarData} width={screenWidth - 32} height={180} fromZero chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(241, 196, 15, ${opacity})` }} showValuesOnTopOfBars />

            <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>User Efficiency (%)</Text>
            <BarChart data={userEfficiencyBarData} width={screenWidth - 32} height={180} fromZero chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})` }} showValuesOnTopOfBars />

            <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>Deadlines Overview</Text>
            <BarChart data={deadlineBarData} width={screenWidth - 32} height={180} fromZero chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(155, 89, 182, ${opacity})` }} showValuesOnTopOfBars />

            <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>Top Performer Contribution</Text>
            <PieChart data={topPerformerPieData} width={screenWidth - 32} height={200} chartConfig={chartConfig} accessor="count" backgroundColor="transparent" paddingLeft="15" absolute />

            <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>Task Trends (Last 7 Days)</Text>
            <LineChart
                data={taskTrendData}
                width={screenWidth - 32}
                height={200}
                chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})` }}
                fromZero
                bezier
                style={{ marginBottom: 20 }}
            />
        </ScrollView>
    );
};

export default DashboardCharts;
