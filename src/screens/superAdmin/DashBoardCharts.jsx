import React, { useContext } from 'react';
import { ScrollView, Text, useWindowDimensions } from 'react-native';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { ThemeContext } from '../../context/ThemeContext';
import { Fonts } from '../../utils/fonts';

const DashboardCharts = ({ tasks, admins, users }) => {
    const { theme } = useContext(ThemeContext);
    const { width: screenWidth } = useWindowDimensions();
    const today = new Date();
    const chartHeight = Math.min(250, screenWidth * 0.6);

    // Helper to get first name
    const getFirstName = (fullName) => {
        if (!fullName) return '';
        return fullName.split(' ')[0];
    };

    // Task Status Pie Data
    const taskStats = {
        pending: tasks.filter(t => t.status === 'pending').length,
        inprogress: tasks.filter(t => t.status === 'inprogress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        rejected: tasks.filter(t => t.status === 'rejected').length,
    };

    const taskPieData = [
        { name: 'Pending', count: taskStats.pending, color: '#f1c40f', legendFontColor: theme.colors.text, legendFontSize: Math.max(10, screenWidth / 35) },
        { name: 'In Progress', count: taskStats.inprogress, color: '#2980b9', legendFontColor: theme.colors.text, legendFontSize: Math.max(10, screenWidth / 35) },
        { name: 'Completed', count: taskStats.completed, color: '#27ae60', legendFontColor: theme.colors.text, legendFontSize: Math.max(10, screenWidth / 35) },
        { name: 'Rejected', count: taskStats.rejected, color: '#e74c3c', legendFontColor: theme.colors.text, legendFontSize: Math.max(10, screenWidth / 35) },
    ];

    // Tasks per Admin / Efficiency
    const tasksPerAdmin = admins.map(admin => {
        const assignedTasks = tasks.filter(t => t.assignedBy === admin.adminId);
        const completedOnTime = assignedTasks.filter(
            t => t.status === 'completed' && new Date(t.updatedAt) <= new Date(t.deadline)
        ).length;
        const efficiency = assignedTasks.length ? Math.round((completedOnTime / assignedTasks.length) * 100) : 0;
        return { name: admin.name || 'Admin', count: assignedTasks.length, efficiency };
    });
    

    // Tasks per User / Efficiency
    const tasksPerUser = users.map(user => {
        const assignedTasks = tasks.filter(t => t.assignedTo === user.uid);
        const completedOnTime = assignedTasks.filter(
            t => t.status === 'completed' && new Date(t.updatedAt) <= new Date(t.deadline)
        ).length;
        const efficiency = assignedTasks.length ? Math.round((completedOnTime / assignedTasks.length) * 100) : 0;
        return { name: user.name || 'User', count: assignedTasks.length, efficiency };
    });

    // Chart datasets with first names
    const adminTaskBarData = {
        labels: tasksPerAdmin.map(a => getFirstName(a.name)),
        datasets: [{ data: tasksPerAdmin.map(a => a.count) }],
    };
    const adminEfficiencyBarData = {
        labels: tasksPerAdmin.map(a => getFirstName(a.name)),
        datasets: [{ data: tasksPerAdmin.map(a => a.efficiency) }],
    };
    const userTaskBarData = {
        labels: tasksPerUser.map(u => getFirstName(u.name)),
        datasets: [{ data: tasksPerUser.map(u => u.count) }],
    };
    const userEfficiencyBarData = {
        labels: tasksPerUser.map(u => getFirstName(u.name)),
        datasets: [{ data: tasksPerUser.map(u => u.efficiency) }],
    };

    // Deadlines
    const upcoming = tasks.filter(t => new Date(t.deadline) >= today).length;
    const overdue = tasks.filter(t => new Date(t.deadline) < today && t.status !== 'completed').length;
    const deadlineBarData = {
        labels: ['Upcoming', 'Overdue'],
        datasets: [{ data: [upcoming, overdue] }],
    };

    // Top Performer Pie
    const totalTasks = tasks.length;
    const topAdmin = tasksPerAdmin.reduce((prev, curr) => (curr.efficiency > prev.efficiency ? curr : prev), { efficiency: 0 });
    const topUser = tasksPerUser.reduce((prev, curr) => (curr.efficiency > prev.efficiency ? curr : prev), { efficiency: 0 });
    const topAdminTasks = topAdmin.count || 0;
    const topUserTasks = topUser.count || 0;
    const otherTasks = totalTasks - topAdminTasks - topUserTasks;
    const topPerformerPieData = [
        { name: topAdmin.name || 'Top Admin', count: topAdminTasks, color: '#8e44ad', legendFontColor: theme.colors.text, legendFontSize: Math.max(10, screenWidth / 35) },
        { name: topUser.name || 'Top User', count: topUserTasks, color: '#e67e22', legendFontColor: theme.colors.text, legendFontSize: Math.max(10, screenWidth / 35) },
        { name: 'Others', count: otherTasks, color: '#7f8c8d', legendFontColor: theme.colors.text, legendFontSize: Math.max(10, screenWidth / 35) },
    ];

    // Task Trends
    const dates = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (6 - i));
        return d.toISOString().slice(5, 10);
    });
    const tasksPerDay = dates.map(dateStr => tasks.filter(t => t.createdAt.toDate().toISOString().slice(5, 10) === dateStr).length);
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

    // Dynamic chart widths
    const barWidth = 60; // width per bar
    const adminChartWidth = Math.max(screenWidth, tasksPerAdmin.length * barWidth);
    const userChartWidth = Math.max(screenWidth, tasksPerUser.length * barWidth);
    const simpleChartWidth = Math.max(screenWidth, 100);

    return (
        <ScrollView contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 16 }}>
            {/* Task Status */}
            <Text style={{ color: theme.colors.text, fontWeight: '700', marginBottom: 8 }}>Task Status</Text>
            <PieChart
                data={taskPieData}
                width={screenWidth - 32}
                height={chartHeight}
                chartConfig={chartConfig}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
            />

            {/* Users vs Admins */}
            <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8, fontFamily: Fonts.Kalam.Regular }}>Users vs Admins</Text>
            <ScrollView horizontal>
                <BarChart
                    data={{ labels: ['Admins', 'Users'], datasets: [{ data: [admins.length, users.length] }] }}
                    width={simpleChartWidth * 2}
                    height={chartHeight}
                    fromZero
                    chartConfig={chartConfig}
                    showValuesOnTopOfBars
                    verticalLabelRotation={0}
                />
            </ScrollView>

            {/* Tasks per Admin */}
            <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>Tasks per Admin</Text>
            <ScrollView horizontal>
                <BarChart
                    data={adminTaskBarData}
                    width={adminChartWidth}
                    height={500}
                    fromZero
                    chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(41, 128, 185, ${opacity})` }}
                    showValuesOnTopOfBars
                    verticalLabelRotation={60}
                />
            </ScrollView>

            {/* Admin Efficiency */}
            <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>Admin Efficiency (%)</Text>
            <ScrollView horizontal>
                <BarChart
                    data={adminEfficiencyBarData}
                    width={adminChartWidth}
                    height={500}
                    fromZero
                    chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(39, 174, 96, ${opacity})` }}
                    showValuesOnTopOfBars
                    verticalLabelRotation={60}
                />
            </ScrollView>

            {/* Tasks per User */}
            <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>Tasks per User</Text>
            <ScrollView horizontal>
                <BarChart
                    data={userTaskBarData}
                    width={userChartWidth}
                    height={500}
                    fromZero
                    chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(241, 196, 15, ${opacity})` }}
                    showValuesOnTopOfBars
                    verticalLabelRotation={60}
                />
            </ScrollView>

            {/* User Efficiency */}
            <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>User Efficiency (%)</Text>
            <ScrollView horizontal>
                <BarChart
                    data={userEfficiencyBarData}
                    width={userChartWidth}
                    height={500}
                    fromZero
                    chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})` }}
                    showValuesOnTopOfBars
                    verticalLabelRotation={60}
                />
            </ScrollView>

            {/* Deadlines Overview */}
            <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>Deadlines Overview</Text>
            <ScrollView horizontal>
                <BarChart
                    data={deadlineBarData}
                    width={simpleChartWidth * 2}
                    height={chartHeight}
                    fromZero
                    chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(155, 89, 182, ${opacity})` }}
                    showValuesOnTopOfBars
                    verticalLabelRotation={0}
                />
            </ScrollView>

            {/* Top Performer Contribution */}
            <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>Top Performer Contribution</Text>
            <PieChart
                data={topPerformerPieData}
                width={screenWidth - 32}
                height={chartHeight}
                chartConfig={chartConfig}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
            />

            {/* Task Trends */}
            <Text style={{ color: theme.colors.text, fontWeight: '700', marginVertical: 8 }}>Task Trends (Last 7 Days)</Text>
            <LineChart
                data={taskTrendData}
                width={screenWidth - 32}
                height={chartHeight}
                chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})` }}
                fromZero
                bezier
                style={{ marginBottom: 20 }}
            />
        </ScrollView>
    );
};

export default DashboardCharts;
