
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Modal, TouchableOpacity, Pressable, Alert, Image, ActivityIndicator, Platform, FlatList } from 'react-native';
import { Card, Snackbar } from 'react-native-paper';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

// --- PDF GENERATION IMPORTS (Requires pdf-lib, react-native-fs, and buffer) ---
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';
// ------------------------------

// Constants for responsiveness
const screenWidth = Dimensions.get('window').width;
const PADDING_HORIZONTAL = 32; // 16px padding on each side
const PIE_CHART_WIDTH = screenWidth - PADDING_HORIZONTAL;
// Ensures a minimum width of 400 for bar/line charts for readability, enabling horizontal scroll if screen is smaller.
const CHART_WIDTH = Math.max(screenWidth - PADDING_HORIZONTAL, 400);

// Utility functions
const safeDate = (timestamp) => {
    return (timestamp?.toDate?.() || new Date(timestamp || Date.now()));
};

const hoursBetween = (start, end) => (end - start) / 1000 / 3600;
const daysBetween = (start, end) => (end - start) / 1000 / 3600 / 24;


// -----------------------------------------------------------------
// 🛠️ PDF GENERATION FUNCTIONS (Unchanged - assumes these functions are complete)
// -----------------------------------------------------------------

const generateOverallPdfContent = async (data) => {
    const { tasks, tasksPerUser } = data;
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    let page = pdfDoc.addPage();
    let { width, height } = page.getSize();
    let y = height - 50;
    const margin = 50;
    const lineGap = 16;
    const now = new Date();

    const totalTasks = tasks.length;
    const completedTasksList = tasks.filter(t => t.status === 'completed');
    const totalCompleted = completedTasksList.length;
    const totalRejected = tasks.filter(t => t.status === 'rejected').length;
    const overdueTasks = tasks.filter(t => safeDate(t.deadline) < now && t.status !== 'completed').length;

    const completionRate = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;
    const rejectionRate = totalTasks > 0 ? (totalRejected / totalTasks) * 100 : 0;

    const totalCompletionHours = totalCompleted > 0
        ? completedTasksList.reduce((sum, t) => sum + hoursBetween(safeDate(t.createdAt), safeDate(t.updatedAt)), 0)
        : 0;
    const avgCompletionTime = totalCompleted > 0 ? totalCompletionHours / totalCompleted : 0;
    const completedOnTime = completedTasksList.filter(t => safeDate(t.updatedAt) <= safeDate(t.deadline)).length;
    const onTimeRate = totalCompleted > 0 ? (completedOnTime / totalCompleted) * 100 : 0;

    const agingTasks = tasks.filter(t => t.status === 'todo' || t.status === 'inprogress');
    const slowAgingTasks = agingTasks.filter(t => daysBetween(safeDate(t.createdAt), now) >= 3).length;

    const rankedUsers = tasksPerUser
        .filter(u => u.count > 0)
        .map(u => ({
            name: u.name,
            completionRate: (u.completed / u.count) * 100,
        }))
        .sort((a, b) => b.completionRate - a.completionRate);

    const topPerformer = rankedUsers[0];
    const bottomPerformer = rankedUsers.length > 0 ? rankedUsers[rankedUsers.length - 1] : null;

    // 1. Header and Title
    page.drawText('Task Management System - Overall Performance Report', {
        x: margin, y: y, size: 22, font: fontBold, color: rgb(0.18, 0.31, 0.43)
    });
    y -= 30;
    page.drawText(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, {
        x: margin, y: y, size: 10, font: font, color: rgb(0.5, 0.5, 0.5)
    });
    y -= 40;


    // 2. Core Operational KPIs - 4 Boxes
    page.drawText('Core Operational KPIs', { x: margin, y: y, size: 16, font: fontBold });
    y -= 25;

    const coreKpiData = [
        { label: 'Total Tasks', value: totalTasks, color: rgb(0.2, 0.6, 0.86) },
        { label: 'Completion Rate', value: `${completionRate.toFixed(1)}%`, color: rgb(0.18, 0.8, 0.44) },
        { label: 'Overdue Tasks', value: overdueTasks, color: rgb(0.91, 0.3, 0.24) },
        { label: 'Rejection Rate', value: `${rejectionRate.toFixed(1)}%`, color: rgb(0.5, 0.5, 0.5) },
    ];

    let xOffset = margin;
    const kpiBoxWidth = (width - margin * 2 - 30) / 4;
    const kpiBoxHeight = 55;
    const gap = 10;

    coreKpiData.forEach((kpi, index) => {
        xOffset = margin + (kpiBoxWidth + gap) * index;

        page.drawRectangle({ x: xOffset, y: y - 10, width: kpiBoxWidth, height: 5, color: kpi.color });
        page.drawRectangle({
            x: xOffset, y: y - kpiBoxHeight - 5, width: kpiBoxWidth, height: kpiBoxHeight,
            borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1,
            color: rgb(0.98, 0.98, 0.98)
        });

        page.drawText(String(kpi.value), {
            x: xOffset + 10, y: y - 35, size: 16, font: fontBold, color: rgb(0.1, 0.1, 0.1)
        });
        page.drawText(kpi.label, {
            x: xOffset + 10, y: y - 50, size: 8, font: font, color: rgb(0.4, 0.4, 0.4)
        });
    });
    y -= (kpiBoxHeight + 35);

    // 3. Deeper Analysis (Completion, Aging, Productivity)
    if (y < margin + 180) {
        page = pdfDoc.addPage();
        y = height - 50;
    }

    page.drawText('Deeper Performance Analysis', { x: margin, y: y, size: 16, font: fontBold });
    y -= 25;

    const col1X = margin;
    const col2X = width / 2 + 20;

    let colY = y;
    page.drawText('Completion Timing:', { x: col1X, y: colY, size: 12, font: fontBold, color: rgb(0.18, 0.31, 0.43) });
    colY -= lineGap;

    page.drawText(`Avg. Time to Complete:`, { x: col1X, y: colY, size: 10, font: font });
    page.drawText(`${avgCompletionTime.toFixed(1)} hours`, { x: col1X + 130, y: colY, size: 10, font: fontBold });
    colY -= lineGap;

    page.drawText(`On-Time Rate (Completed):`, { x: col1X, y: colY, size: 10, font: font });
    page.drawText(`${onTimeRate.toFixed(1)}%`, { x: col1X + 130, y: colY, size: 10, font: fontBold, color: onTimeRate > 75 ? rgb(0.18, 0.8, 0.44) : rgb(0.91, 0.3, 0.24) });
    colY -= 2 * lineGap;

    colY = y;
    page.drawText('Aging & Productivity:', { x: col2X, y: colY, size: 12, font: fontBold, color: rgb(0.18, 0.31, 0.43) });
    colY -= lineGap;

    page.drawText(`Slow Aging Tasks (3+ days):`, { x: col2X, y: colY, size: 10, font: font });
    page.drawText(String(slowAgingTasks), { x: col2X + 130, y: colY, size: 10, font: fontBold, color: slowAgingTasks > 0 ? rgb(0.91, 0.3, 0.24) : rgb(0.18, 0.8, 0.44) });
    colY -= lineGap;

    if (topPerformer) {
        page.drawText(`Top Performer (Comp. Rate):`, { x: col2X, y: colY, size: 10, font: font });
        page.drawText(`${topPerformer.name} (${topPerformer.completionRate.toFixed(1)}%)`, { x: col2X + 130, y: colY, size: 10, font: fontBold, color: rgb(0.18, 0.8, 0.44) });
        colY -= lineGap;
    }
    if (bottomPerformer && bottomPerformer !== topPerformer) {
        page.drawText(`Needs Review:`, { x: col2X, y: colY, size: 10, font: font });
        page.drawText(`${bottomPerformer.name} (${bottomPerformer.completionRate.toFixed(1)}%)`, { x: col2X + 130, y: colY, size: 10, font: fontBold, color: rgb(0.91, 0.3, 0.24) });
    }

    y -= 100;

    // 4. User Performance Table Header
    y -= 40;
    if (y < margin + 100) {
        page = pdfDoc.addPage();
        y = height - 50;
    }
    page.drawText('Detailed User Performance Breakdown', { x: margin, y: y, size: 16, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    y -= 20;

    const headers = ['User', 'Total', 'Comp.', 'In-Prog.', 'Overdue', 'On-Time', 'Avg Hrs'];
    const colWidths = [100, 50, 50, 60, 60, 60, 60];
    let x = margin;

    page.drawRectangle({ x: margin, y: y - 12, width: width - margin * 2, height: 16, color: rgb(0.9, 0.9, 0.9) });

    headers.forEach((header, i) => {
        page.drawText(header, { x: x + 5, y: y - 5, size: 9, font: fontBold, color: rgb(0, 0, 0) });
        x += colWidths[i];
    });
    y -= 25;

    // 5. Performance Table Rows
    tasksPerUser.forEach(user => {
        if (y < margin + 20) {
            page = pdfDoc.addPage();
            y = height - 50;
            page.drawRectangle({ x: margin, y: y - 12, width: width - margin * 2, height: 16, color: rgb(0.9, 0.9, 0.9) });
            x = margin;
            headers.forEach((header, i) => {
                page.drawText(header, { x: x + 5, y: y - 5, size: 9, font: fontBold, color: rgb(0, 0, 0) });
                x += colWidths[i];
            });
            y -= 25;
        }

        x = margin;

        const avgHours = user.avgCompletion.toFixed(1);

        page.drawText(user.name.slice(0, 12), { x: x + 5, y: y, size: 9, font }); x += colWidths[0];
        page.drawText(String(user.count), { x: x + 5, y: y, size: 9, font }); x += colWidths[1];
        page.drawText(String(user.completed), { x: x + 5, y: y, size: 9, font }); x += colWidths[2];
        page.drawText(String(user.inProgress), { x: x + 5, y: y, size: 9, font }); x += colWidths[3];

        page.drawText(String(user.overdue), { x: x + 5, y: y, size: 9, font: fontBold, color: user.overdue > 0 ? rgb(0.91, 0.3, 0.24) : rgb(0.1, 0.1, 0.1) }); x += colWidths[4];

        page.drawText(String(user.completedOnTime), { x: x + 5, y: y, size: 9, font }); x += colWidths[5];
        page.drawText(avgHours, { x: x + 5, y: y, size: 9, font });

        y -= lineGap;

        page.drawLine({ start: { x: margin, y: y + 2 }, end: { x: width - margin, y: y + 2 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
    });

    return pdfDoc.save();
};

const generateUserPdfContent = async (user) => {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    let page = pdfDoc.addPage();
    let { height } = page.getSize();
    let y = height - 50;
    const margin = 50;
    const lineGap = 18;
    const totalAssigned = user.count;
    const userCompletionRate = totalAssigned > 0 ? (user.completed / totalAssigned) * 100 : 0;
    const userOnTimeRate = user.completed > 0 ? (user.completedOnTime / user.completed) * 100 : 0;
    const userRejectionRate = totalAssigned > 0 ? (user.rejected / totalAssigned) * 100 : 0;


    page.drawText(`Individual Performance Report: ${user.name}`, { x: margin, y: y, size: 24, font: fontBold, color: rgb(0.18, 0.31, 0.43) });
    y -= 40;

    page.drawText('Key Performance Indicators:', { x: margin, y: y, size: 16, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    y -= lineGap;

    const dataPairs = [
        ['Total Tasks Assigned:', user.count, rgb(0.18, 0.31, 0.43)],
        ['Completion Rate:', `${userCompletionRate.toFixed(1)}%`, userCompletionRate > 50 ? rgb(0.18, 0.8, 0.44) : rgb(0.95, 0.61, 0.07)],
        ['Rejection Rate:', `${userRejectionRate.toFixed(1)}%`, userRejectionRate > 10 ? rgb(0.91, 0.3, 0.24) : rgb(0.18, 0.8, 0.44)],
        ['Overdue Tasks:', user.overdue, user.overdue > 0 ? rgb(0.91, 0.3, 0.24) : rgb(0.18, 0.8, 0.44)],
        ['On-Time Completion Rate:', `${userOnTimeRate.toFixed(1)}%`, userOnTimeRate > 70 ? rgb(0.18, 0.8, 0.44) : rgb(0.95, 0.61, 0.07)],
        ['Avg. Completion Time (Hrs):', user.avgCompletion.toFixed(2), rgb(0.95, 0.61, 0.07)],
    ];

    dataPairs.forEach(([label, value, color]) => {
        page.drawText(label, { x: margin, y: y, size: 12, font: fontBold });
        page.drawText(String(value), { x: margin + 250, y: y, size: 12, font: fontBold, color: color });
        y -= lineGap;
    });

    y -= 40;

    page.drawLine({ start: { x: margin, y: y }, end: { x: margin + 200, y: y }, thickness: 1 });
    page.drawText('Report Administrator Signature', { x: margin, y: y - 15, size: 8, font });

    return pdfDoc.save();
};
const UserPerformanceCard = ({ user, theme, scale, onPress }) => {
    const { name, profilePicUrl } = user;
    return (
        <TouchableOpacity
            style={[styles.userCardNew, { backgroundColor: theme.colors.card }]}
            onPress={() => onPress(user)}
        >
            <View style={styles.userCardContent}>
                <View style={styles.nameContainer}>
                    {profilePicUrl ? (
                        <Image
                            source={{ uri: profilePicUrl }}
                            style={styles.profileImage}
                        />
                    ) : (
                        <Ionicons name="person-circle-outline" size={28 * scale} color={theme.colors.primary} />
                    )}
                    <Text style={[styles.userNameText, { color: theme.colors.text, fontSize: 18 * scale }]}>{name}</Text>
                </View>
                <Ionicons
                    name="chevron-forward-outline"
                    size={22 * scale}
                    color={theme.colors.border}
                    style={styles.actionChevron}
                />
            </View>
        </TouchableOpacity>
    );
};

const DashboardScreen = () => {
    const { theme } = useContext(ThemeContext);
    const scale = screenWidth / 375;
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadInfo, setDownloadInfo] = useState({ isVisible: false, fileName: '' });

    const currentAdminId = auth().currentUser?.uid;
    const now = new Date();

    // Fetch users and tasks from Firestore 
    useEffect(() => {
        if (!currentAdminId) return;

        const usersRef = firestore().collection('users').where('adminId', '==', currentAdminId);
        const tasksRef = firestore().collection('tasks').where('assignedBy', '==', currentAdminId);

        const unsubscribeUsers = usersRef.onSnapshot(snapshot =>
            setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })))
        );

        const unsubscribeTasks = tasksRef.onSnapshot(snapshot =>
            setTasks(snapshot.docs.map(doc => ({ taskId: doc.id, ...doc.data() })))
        );

        return () => {
            unsubscribeUsers();
            unsubscribeTasks();
        };
    }, [currentAdminId]);

    // --- ANALYTICS CALCULATIONS ---
    const todoTasksCount = tasks.filter(t => t.status === 'todo' || t.status === 'pending').length;
    const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasksCount = tasks.filter(t => t.status === 'inprogress').length;
    const rejectedTasksCount = tasks.filter(t => t.status === 'rejected').length;

    const overdueTasksList = tasks.filter(t => {
        const deadline = safeDate(t.deadline);
        return deadline < now && t.status !== 'completed';
    });

    // Merge task data with user data for dashboard metrics
    const tasksPerUser = users.map(u => {
        const userTasks = tasks.filter(t => t.assignedTo === u.uid);
        const userCompleted = userTasks.filter(t => t.status === 'completed').length;

        const userOverdue = userTasks.filter(t => {
            const deadline = safeDate(t.deadline);
            return deadline < now && t.status !== 'completed';
        }).length;

        const avgCompletion = userCompleted > 0
            ? userTasks.filter(t => t.status === 'completed').reduce((sum, t) => {
                const created = safeDate(t.createdAt);
                const updated = safeDate(t.updatedAt);
                return sum + hoursBetween(created, updated);
            }, 0) / userCompleted
            : 0;

        const completedOnTime = userTasks.filter(t => {
            const deadline = safeDate(t.deadline);
            const updated = safeDate(t.updatedAt);
            return t.status === 'completed' && updated <= deadline;
        }).length;

        return {
            uid: u.uid,
            name: u.name || 'Unnamed',
            email: u.email || 'N/A',
            phone: u.phone || 'N/A',
            profilePicUrl: u.profilePicUrl,
            count: userTasks.length,
            completed: userCompleted,
            inProgress: userTasks.filter(t => t.status === 'inprogress').length,
            todo: userTasks.filter(t => t.status === 'todo' || t.status === 'pending').length,
            rejected: userTasks.filter(t => t.status === 'rejected').length,
            overdue: userOverdue,
            completedOnTime,
            avgCompletion
        };
    });

    // ---------------------------------------------
    // 📊 CHART DATA PREPARATION FUNCTIONS (8 Charts Total)
    // ---------------------------------------------

    // 1. Task Status Breakdown (Pie Chart)
    const pieChartData = [
        { name: 'Completed', population: completedTasksCount, color: '#2ecc71', legendFontColor: theme.colors.text, legendFontSize: 12 },
        { name: 'In Progress', population: inProgressTasksCount, color: '#f39c12', legendFontColor: theme.colors.text, legendFontSize: 12 },
        { name: 'To Do', population: todoTasksCount, color: '#3498db', legendFontColor: theme.colors.text, legendFontSize: 12 },
        { name: 'Rejected', population: rejectedTasksCount, color: '#e74c3c', legendFontColor: theme.colors.text, legendFontSize: 12 },
        { name: 'Overdue', population: overdueTasksList.length, color: '#9b59b6', legendFontColor: theme.colors.text, legendFontSize: 12 },
    ].filter(data => data.population > 0);

    // 2. Tasks Per User (Bar Chart - Workload)
    const sortedUsersByCount = tasksPerUser
        .filter(u => u.count > 0)
        .sort((a, b) => b.count - a.count);

    const barChartData = {
        labels: sortedUsersByCount.map(u => u.name.split(' ')[0]),
        datasets: [
            { data: sortedUsersByCount.map(u => u.count) }
        ]
    };

    // 3. User Completion Rate (Line Chart - Effectiveness)
    const sortedUsersByCompletionRate = tasksPerUser
        .filter(u => u.count > 0)
        .sort((a, b) => (b.completed / b.count) - (a.completed / a.count));

    const lineChartData = {
        labels: sortedUsersByCompletionRate.map(u => u.name.split(' ')[0]),
        datasets: [
            {
                data: sortedUsersByCompletionRate.map(u => parseFloat(((u.completed / u.count) * 100).toFixed(1))),
                color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
                strokeWidth: 2
            }
        ],
        legend: ['Completion Rate (%)']
    };

    // 4. Overdue Tasks by Current Status (Pie Chart - Risk Focus)
    const overdueTodo = overdueTasksList.filter(t => t.status === 'todo' || t.status === 'pending').length;
    const overdueInProgress = overdueTasksList.filter(t => t.status === 'inprogress').length;

    const overdueByStatusData = [
        { name: 'To Do (Unstarted)', population: overdueTodo, color: '#e74c3c', legendFontColor: theme.colors.text, legendFontSize: 12 },
        { name: 'In Progress (Stalled)', population: overdueInProgress, color: '#f39c12', legendFontColor: theme.colors.text, legendFontSize: 12 },
    ].filter(data => data.population > 0);

    // 5. Average Time to Completion by User (Bar Chart - Efficiency)
    const sortedUsersByAvgTime = tasksPerUser
        .filter(u => u.avgCompletion > 0)
        .sort((a, b) => a.avgCompletion - b.avgCompletion);

    const avgCompletionTimeChartData = {
        labels: sortedUsersByAvgTime.map(u => u.name.split(' ')[0]),
        datasets: [
            { data: sortedUsersByAvgTime.map(u => parseFloat(u.avgCompletion.toFixed(1))) }
        ]
    };

    // 6. Task Aging (Bar Chart - Bottleneck Analysis)
    const agingTasks = tasks.filter(t => t.status === 'todo' || t.status === 'inprogress');
    const today = new Date();

    const agingBins = {
        '0-1 Day': agingTasks.filter(t => daysBetween(safeDate(t.createdAt), today) <= 1).length,
        '2-3 Days': agingTasks.filter(t => daysBetween(safeDate(t.createdAt), today) > 1 && daysBetween(safeDate(t.createdAt), today) <= 3).length,
        '4-7 Days': agingTasks.filter(t => daysBetween(safeDate(t.createdAt), today) > 3 && daysBetween(safeDate(t.createdAt), today) <= 7).length,
        '8+ Days': agingTasks.filter(t => daysBetween(safeDate(t.createdAt), today) > 7).length,
    };

    const agingChartData = {
        labels: Object.keys(agingBins),
        datasets: [{ data: Object.values(agingBins) }]
    };

    // 7. Tasks Created Over Time (Line Chart - Workload Trend)
    const taskCreationByMonth = tasks.reduce((acc, t) => {
        const date = safeDate(t.createdAt);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[monthYear] = (acc[monthYear] || 0) + 1;
        return acc;
    }, {});

    const sortedMonths = Object.keys(taskCreationByMonth).sort();
    const workloadTrendData = {
        labels: sortedMonths.slice(-6).map(m => m.slice(5)), // Last 6 months
        datasets: [{ data: sortedMonths.slice(-6).map(m => taskCreationByMonth[m]) }]
    };

    // 8. Task Priority Breakdown (Pie Chart - Resource Allocation)
    const priorityCounts = tasks.reduce((acc, t) => {
        const priority = t.priority || 'Medium'; // Default to Medium if not set
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
    }, {});

    const priorityChartData = [
        { name: 'High', population: priorityCounts['High'] || 0, color: '#e74c3c', legendFontColor: theme.colors.text, legendFontSize: 12 },
        { name: 'Medium', population: priorityCounts['Medium'] || 0, color: '#f39c12', legendFontColor: theme.colors.text, legendFontSize: 12 },
        { name: 'Low', population: priorityCounts['Low'] || 0, color: '#2ecc71', legendFontColor: theme.colors.text, legendFontSize: 12 },
    ].filter(data => data.population > 0);

    // ---------------------------------------------

    // ---------------------------------------------
    // PDF Generation and DOWNLOAD Logic (Unchanged)
    // ---------------------------------------------

    const renderUserCard = ({ item }) => (
        // 'item' here is one user object from the tasksPerUser array
        <UserPerformanceCard
            user={item}
            theme={theme}
            scale={scale}
            onPress={handleUserPress}
        />
    );

    const createAndSharePdf = async (contentGenerator, data, fileNameBase) => {
        if (isDownloading) return;
        setIsDownloading(true);
        setDownloadInfo({ isVisible: false, fileName: '' });

        const finalFileName = `${fileNameBase}_${new Date().toISOString().slice(0, 10)}.pdf`;

        try {
            const pdfBytes = await contentGenerator(data);

            if (pdfBytes.length === 0) {
                Alert.alert('Error', 'Could not generate PDF content. Check console for details.');
                return;
            }

            const base64Data = Buffer.from(pdfBytes).toString('base64');

            const downloadPath = Platform.select({
                ios: `${RNFS.DocumentDirectoryPath}/${finalFileName}`,
                android: `${RNFS.DownloadDirectoryPath}/${finalFileName}`,
            });

            await RNFS.writeFile(downloadPath, base64Data, 'base64');
            setDownloadInfo({ isVisible: true, fileName: finalFileName });

        } catch (error) {
            console.error('PDF Generation/Download Error:', error);
            Alert.alert('Error', 'Could not generate or save the report. Please check permissions or console for PDF-lib errors.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadReport = () => {
        const data = { tasks, tasksPerUser };
        createAndSharePdf(generateOverallPdfContent, data, 'Overall_Task_Report');
    };

    const handleDownloadUserReport = () => {
        if (!selectedUser) return;
        createAndSharePdf(generateUserPdfContent, selectedUser, `Report_${selectedUser.name.replace(/\s/g, '_')}`);
    };

    const handleUserPress = (user) => {
        // Find the full user data with calculated metrics
        const fullUser = tasksPerUser.find(u => u.uid === user.uid);
        setSelectedUser(fullUser);
        setModalVisible(true);
    };

    const onDismissSnackbar = () => {
        setDownloadInfo({ isVisible: false, fileName: '' });
    };

    const chartConfig = {
        backgroundColor: theme.colors.card,
        backgroundGradientFrom: theme.colors.card,
        backgroundGradientTo: theme.colors.card,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
        labelColor: (opacity = 1) => theme.colors.text,
        style: { borderRadius: 16 },
        propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: theme.colors.border,
        },
        propsForLabels: {
            fontSize: 10,
        },
    };

    // --- RENDER ---
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>

                {/* --- DOWNLOAD REPORT BUTTON (Overall Analytics) --- */}
                <TouchableOpacity
                    style={[styles.downloadButton, { backgroundColor: theme.colors.primary, marginBottom: 20 }]}
                    onPress={handleDownloadReport}
                    disabled={isDownloading}
                >
                    {isDownloading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="download-outline" size={20 * scale} color="#fff" />
                            <Text style={styles.downloadButtonText}>Download Full Report</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* KPI Cards (Numeric Metrics) */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 }}>
                    {[tasks.length, completedTasksCount, inProgressTasksCount, todoTasksCount, rejectedTasksCount, overdueTasksList.length].map((value, idx) => (
                        <Card key={idx} style={[styles.kpiCard, { width: screenWidth < 400 ? '48%' : '30%', backgroundColor: theme.colors.card }]}>
                            <Card.Content style={{ alignItems: 'center' }}>
                                <Text style={[styles.kpiValue, { fontSize: 18 * scale, color: theme.colors.text }]}>{value}</Text>
                                <Text style={[styles.kpiLabel, { fontSize: 12 * scale, color: theme.colors.text }]}>
                                    {['Total', 'Completed', 'In Progress', 'To Do', 'Rejected', 'Overdue'][idx]}
                                </Text>
                            </Card.Content>
                        </Card>
                    ))}
                </View>

                {/* ======================================= */}
                {/* 📊 TASK ANALYTICS SECTION (Status & Risk) */}
                {/* ======================================= */}
                <Text style={[styles.sectionTitle, { fontSize: 18 * scale, color: theme.colors.text, marginTop: 10, marginBottom: 5 }]}>Task Analytics (Health & Risk)</Text>

                {/* 1. Overall Task Status Breakdown (Pie Chart) */}
                <Card style={[styles.chartCard, { backgroundColor: theme.colors.card }]}>
                    <Card.Title
                        title="Overall Task Status Breakdown"
                        titleStyle={{ color: theme.colors.text, fontSize: 16 * scale }}
                    />
                    <Card.Content style={{ alignItems: 'center' }}>
                        {pieChartData.length > 0 ? (
                            <PieChart
                                data={pieChartData}
                                width={PIE_CHART_WIDTH}
                                height={200}
                                chartConfig={chartConfig}
                                accessor="population"
                                backgroundColor="transparent"
                                paddingLeft="15"
                                absolute
                            />
                        ) : (
                            <Text style={{ color: theme.colors.text, paddingVertical: 50 }}>No task data to display.</Text>
                        )}
                    </Card.Content>
                </Card>

                {/* 2. Overdue Tasks by Current Status (Pie Chart) */}
                <Card style={[styles.chartCard, { backgroundColor: theme.colors.card }]}>
                    <Card.Title
                        title="Overdue Tasks by Current Status (Risk Focus)"
                        titleStyle={{ color: theme.colors.text, fontSize: 16 * scale }}
                    />
                    <Card.Content style={{ alignItems: 'center' }}>
                        {overdueByStatusData.length > 0 ? (
                            <PieChart
                                data={overdueByStatusData}
                                width={PIE_CHART_WIDTH}
                                height={200}
                                chartConfig={chartConfig}
                                accessor="population"
                                backgroundColor="transparent"
                                paddingLeft="15"
                                absolute
                            />
                        ) : (
                            <Text style={{ color: theme.colors.text, paddingVertical: 50 }}>No overdue tasks to analyze.</Text>
                        )}
                    </Card.Content>
                </Card>

                {/* 3. Task Aging (Bar Chart - Bottleneck Analysis) */}
                <Card style={[styles.chartCard, { backgroundColor: theme.colors.card }]}>
                    <Card.Title
                        title="Incomplete Task Aging (Days)"
                        titleStyle={{ color: theme.colors.text, fontSize: 16 * scale }}
                    />
                    <Card.Content>
                        {agingTasks.length > 0 ? (
                            <ScrollView horizontal={true} contentContainerStyle={{ paddingRight: 16 }}>
                                <BarChart
                                    data={agingChartData}
                                    width={CHART_WIDTH}
                                    height={220}
                                    chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(241, 196, 15, ${opacity})` }}
                                    style={{ marginVertical: 8, borderRadius: 16 }}
                                    verticalLabelRotation={-30}
                                    showValuesOnTopOfBars={true}
                                />
                            </ScrollView>
                        ) : (
                            <Text style={{ color: theme.colors.text, paddingVertical: 50 }}>No incomplete tasks to check aging.</Text>
                        )}
                    </Card.Content>
                </Card>

                {/* 4. Task Priority Breakdown (Pie Chart - Resource Allocation) */}
                <Card style={[styles.chartCard, { backgroundColor: theme.colors.card }]}>
                    <Card.Title
                        title="Task Priority Distribution"
                        titleStyle={{ color: theme.colors.text, fontSize: 16 * scale }}
                    />
                    <Card.Content style={{ alignItems: 'center' }}>
                        {priorityChartData.length > 0 ? (
                            <PieChart
                                data={priorityChartData}
                                width={PIE_CHART_WIDTH}
                                height={200}
                                chartConfig={chartConfig}
                                accessor="population"
                                backgroundColor="transparent"
                                paddingLeft="15"
                                absolute
                            />
                        ) : (
                            <Text style={{ color: theme.colors.text, paddingVertical: 50 }}>No priority data to display.</Text>
                        )}
                    </Card.Content>
                </Card>


                {/* ======================================= */}
                {/* 📈 WORKLOAD & EFFICIENCY SECTION          */}
                {/* ======================================= */}
                <Text style={[styles.sectionTitle, { fontSize: 18 * scale, color: theme.colors.text, marginTop: 24, marginBottom: 5 }]}>Workload & Efficiency Metrics</Text>

                {/* 5. Tasks Created Over Time (Line Chart - Workload Trend) */}
                <Card style={[styles.chartCard, { backgroundColor: theme.colors.card }]}>
                    <Card.Title
                        title="Task Creation Trend (Last 6 Months)"
                        titleStyle={{ color: theme.colors.text, fontSize: 16 * scale }}
                    />
                    <Card.Content>
                        {workloadTrendData.labels.length > 1 ? (
                            <ScrollView horizontal={true} contentContainerStyle={{ paddingRight: 16 }}>
                                <LineChart
                                    data={workloadTrendData}
                                    width={CHART_WIDTH}
                                    height={220}
                                    chartConfig={{ ...chartConfig, decimalPlaces: 0, color: (opacity = 1) => `rgba(155, 89, 182, ${opacity})` }}
                                    bezier
                                    style={{ marginVertical: 8, borderRadius: 16 }}
                                    verticalLabelRotation={-30}
                                />
                            </ScrollView>
                        ) : (
                            <Text style={{ color: theme.colors.text, paddingVertical: 50 }}>Not enough historical data for trend analysis.</Text>
                        )}
                    </Card.Content>
                </Card>

                {/* 6. Tasks Per User (Bar Chart - Workload) */}
                <Card style={[styles.chartCard, { backgroundColor: theme.colors.card }]}>
                    <Card.Title
                        title="Users by Total Tasks Assigned (Workload)"
                        titleStyle={{ color: theme.colors.text, fontSize: 16 * scale }}
                    />
                    <Card.Content>
                        {barChartData.datasets[0].data.length > 0 ? (
                            <ScrollView horizontal={true} contentContainerStyle={{ paddingRight: 16 }}>
                                <BarChart
                                    data={barChartData}
                                    width={CHART_WIDTH}
                                    height={220}
                                    chartConfig={chartConfig}
                                    style={{ marginVertical: 8, borderRadius: 16 }}
                                    verticalLabelRotation={-30}
                                    showValuesOnTopOfBars={true}
                                />
                            </ScrollView>
                        ) : (
                            <Text style={{ color: theme.colors.text, paddingVertical: 50 }}>No user data to display.</Text>
                        )}
                    </Card.Content>
                </Card>

                {/* 7. User Completion Rate (Line Chart - Effectiveness) */}
                <Card style={[styles.chartCard, { backgroundColor: theme.colors.card }]}>
                    <Card.Title
                        title="User Task Completion Rate (%) (Effectiveness)"
                        titleStyle={{ color: theme.colors.text, fontSize: 16 * scale }}
                    />
                    <Card.Content>
                        {lineChartData.datasets[0].data.length > 0 ? (
                            <ScrollView horizontal={true} contentContainerStyle={{ paddingRight: 16 }}>
                                <LineChart
                                    data={lineChartData}
                                    width={CHART_WIDTH}
                                    height={220}
                                    chartConfig={{ ...chartConfig, decimalPlaces: 1, color: (opacity = 1) => `rgba(142, 68, 173, ${opacity})` }}
                                    bezier
                                    style={{ marginVertical: 8, borderRadius: 16 }}
                                    verticalLabelRotation={-30}
                                />
                            </ScrollView>
                        ) : (
                            <Text style={{ color: theme.colors.text, paddingVertical: 50 }}>Not enough data for completion rate analysis.</Text>
                        )}
                    </Card.Content>
                </Card>

                {/* 8. Average Time to Completion by User (Bar Chart - Efficiency) */}
                <Card style={[styles.chartCard, { backgroundColor: theme.colors.card, marginBottom: 20 }]}>
                    <Card.Title
                        title="Average Time to Completion (Hrs) (Efficiency)"
                        titleStyle={{ color: theme.colors.text, fontSize: 16 * scale }}
                    />
                    <Card.Content>
                        {avgCompletionTimeChartData.datasets[0].data.length > 0 ? (
                            <ScrollView horizontal={true} contentContainerStyle={{ paddingRight: 16 }}>
                                <BarChart
                                    data={avgCompletionTimeChartData}
                                    width={CHART_WIDTH}
                                    height={220}
                                    chartConfig={{ ...chartConfig, decimalPlaces: 1, color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})` }}
                                    style={{ marginVertical: 8, borderRadius: 16 }}
                                    verticalLabelRotation={-30}
                                    showValuesOnTopOfBars={true}
                                />
                            </ScrollView>
                        ) : (
                            <Text style={{ color: theme.colors.text, paddingVertical: 50 }}>Not enough data for completion time analysis.</Text>
                        )}
                    </Card.Content>
                </Card>


                {/* 👤 USER SPECIFIC CARD LIST */}
                <Text style={[styles.sectionTitle, { fontSize: 18 * scale, color: theme.colors.text, marginTop: 24 }]}>Detailed User List</Text>
                <ScrollView 
                    style={{ flex: 1 }} 
                    contentContainerStyle={{ paddingBottom: 100 }}>
                {tasksPerUser.map(user => (
                    
                        <UserPerformanceCard
                            key={user.uid}
                            user={user}
                            theme={theme}
                            scale={scale}
                            onPress={handleUserPress}
                        />
                  
                ))}
                </ScrollView>
              
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalBackground}>
                        <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                            <View style={styles.modalHeader}>
                                {selectedUser?.profilePicUrl ? (
                                    <Image
                                        source={{ uri: selectedUser.profilePicUrl }}
                                        style={styles.modalProfileImage}
                                    />
                                ) : (
                                    <Ionicons name="person-circle-outline" size={40 * scale} color={theme.colors.primary} />
                                )}
                                <View>
                                    <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: 20 * scale }]}>
                                        {selectedUser?.name || 'User Details'}
                                    </Text>

                                </View>
                            </View>
                            <View style={styles.modalDetailRow}>
                                <Ionicons name="mail-outline" size={16 * scale} color={theme.colors.primary} />
                                <Text style={[styles.modalDetailText, { color: theme.colors.text }]}>
                                    <Text style={{ fontWeight: 'bold' }}>Email:</Text> {selectedUser?.email || 'N/A'}
                                </Text>
                            </View>
                            <View style={styles.modalDetailRow}>
                                <Ionicons name="call-outline" size={16 * scale} color={theme.colors.primary} />
                                <Text style={[styles.modalDetailText, { color: theme.colors.text }]}>
                                    <Text style={{ fontWeight: 'bold' }}>Phone:</Text> {selectedUser?.phone || 'N/A'}
                                </Text>
                            </View>
                            <View style={[styles.modalMetricsContainer, { borderColor: theme.colors.border }]}>
                                <Text style={[styles.modalMetricsTitle, { color: theme.colors.text, fontSize: 16 * scale }]}>Task Performance Summary</Text>
                                <View style={styles.modalMetricRow}>
                                    <Text style={[styles.modalMetricLabel, { color: theme.colors.text }]}>Total Tasks Assigned:</Text>
                                    <Text style={[styles.modalMetricValue, { color: theme.colors.primary }]}>{selectedUser?.count || 0}</Text>
                                </View>
                                <View style={styles.modalMetricRow}>
                                    <Text style={[styles.modalMetricLabel, { color: theme.colors.text }]}>Pending Tasks (To Do/In Progress):</Text>
                                    <Text style={[styles.modalMetricValue, { color: '#3498db' }]}>{selectedUser?.todo + selectedUser?.inProgress || 0}</Text>
                                </View>
                                <View style={styles.modalMetricRow}>
                                    <Text style={[styles.modalMetricLabel, { color: theme.colors.text }]}>Overdue Tasks:</Text>
                                    <Text style={[styles.modalMetricValue, { color: '#e74c3c' }]}>{selectedUser?.overdue || 0}</Text>
                                </View>
                                <View style={styles.modalMetricRow}>
                                    <Text style={[styles.modalMetricLabel, { color: theme.colors.text }]}>Rejected Tasks:</Text>
                                    <Text style={[styles.modalMetricValue, { color: '#f39c12' }]}>{selectedUser?.rejected || 0}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={[styles.downloadButton, { backgroundColor: theme.colors.accent, marginVertical: 12 }]}
                                onPress={handleDownloadUserReport}
                                disabled={isDownloading}
                            >
                                {isDownloading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="document-text-outline" size={20 * scale} color="#fff" />
                                        <Text style={styles.downloadButtonText}>Download User Report</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <Pressable
                                style={[styles.closeButton, { backgroundColor: theme.colors.primary }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={[styles.closeButtonText, { fontSize: 16 * scale }]}>Close</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>
            </ScrollView>

            <Snackbar
                visible={downloadInfo.isVisible}
                onDismiss={onDismissSnackbar}
                duration={4000}
                action={{
                    label: 'Close',
                    onPress: () => {
                        onDismissSnackbar();
                    },
                    labelStyle: { color: theme.colors.text }
                }}
                style={[styles.snackbar, { backgroundColor: theme.colors.card }]}
            >
                <Text style={{ color: theme.colors.text }}>
                    ✅ Report <Text style={{ fontWeight: 'bold' }}>{downloadInfo.fileName}</Text> saved to Downloads folder.
                </Text>
            </Snackbar>

        </SafeAreaView>
    );
};

// --- STYLES ---
const styles = StyleSheet.create({
    sectionTitle: { fontWeight: 'bold', marginVertical: 12 },
    kpiCard: { marginBottom: 12, paddingVertical: 16, alignItems: 'center' },
    kpiValue: { fontWeight: 'bold', marginBottom: 4 },
    kpiLabel: {},
    chartCard: {
        borderRadius: 12,
        marginBottom: 16,
        padding: 8,
        elevation: 3,
    },
    userCardNew: {
        paddingVertical: 12,
        marginVertical: 6,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        borderLeftWidth: 5,
        borderLeftColor: '#3498db',
    },
    userCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 4,
        justifyContent: 'space-between',
        
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileImage: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    userNameText: {
        fontWeight: '600',
        marginLeft: 4,
    },
    actionChevron: {
        alignSelf: 'center',
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        minHeight: 48,
    },
    downloadButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 10,
        fontSize: 16,
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 16,
    },
    modalContent: {
        width: '100%',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    modalProfileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
    modalDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    modalDetailText: {
        fontSize: 14,
    },
    modalMetricsContainer: {
        marginTop: 15,
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
    },
    modalMetricsTitle: {
        fontWeight: 'bold',
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalMetricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    modalMetricLabel: {
        fontSize: 14,
    },
    modalMetricValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    closeButton: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    closeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
    },
    snackbar: {
        borderRadius: 8,
        marginHorizontal: 10,
        marginBottom: 10,
    }
});

export default DashboardScreen;