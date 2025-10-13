import React, { useContext, useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Platform, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Snackbar } from 'react-native-paper';
import { ThemeContext } from '../../context/ThemeContext';
import DashboardCharts from "./DashBoardCharts";
import { useScreenWidth } from '../../hooks/useScreenWidth';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useDashboardModals } from '../../hooks/useDashboardModals';
import { useStatusColor } from '../../utils/statusUtils';
import { styles as baseStyles } from '../../components/dashboard/DashboardStyles';
import { StatCard } from '../../components/dashboard/StatCard';
import { TaskListModal } from '../../components/dashboard/TaskListModal';
import { TaskDetailModal } from '../../components/dashboard/TaskDetailModal';
import { UserDetailModal } from '../../components/dashboard/UserDetailModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';

const safeDate = (timestamp) => {
    if (!timestamp) return new Date();

    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }

    if (timestamp instanceof Date) {
        return timestamp;
    }

    return new Date(timestamp);
};

const hoursBetween = (start, end) => (end - start) / 1000 / 3600;

const alignRight = (text, x, width, size, font) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    return x + width - textWidth - 5;
};

const getOverdueTasks = (tasks) => {
    const now = new Date();
    return tasks.filter(task => {
        if (task.status === 'completed' || task.status === 'rejected') {
            return false;
        }

        const deadline = safeDate(task.deadline);

        if (isNaN(deadline.getTime())) {
            return false;
        }

        return deadline < now;
    });
};

const generateSuperAdminPdfContent = async (reportData, themeColors) => {
    const {
        totalTasks, completedTasks, rejectedTasks, pendingTasks, overdueTasks,
        globalCompletionRate, globalOverdueRate, globalAvgCompletionTime,
        topUsers, adminMetrics, userMetrics
    } = reportData;

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage();
    let { width, height } = page.getSize();
    let y = height - 50;
    const margin = 50;
    const tableWidth = width - margin * 2;
    const rowHeight = 18;
    const primaryColor = rgb(0.18, 0.31, 0.43);

    page.drawText('Super Admin Global Task Management Report', { x: margin, y: y, size: 28, font: fontBold, color: primaryColor });
    y -= 35;
    page.drawText(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, { x: margin, y: y, size: 10, font: font, color: rgb(0.5, 0.5, 0.5) });
    y -= 45;

    page.drawText('Global Task Overview', { x: margin, y: y, size: 18, font: fontBold, color: primaryColor });
    y -= 30;

    const kpiData = [
        { label: 'Total Tasks', value: totalTasks, color: rgb(0.2, 0.6, 0.86) },
        { label: 'Completed Tasks', value: completedTasks, color: rgb(0.18, 0.8, 0.44) },
        { label: 'Pending/In Progress', value: pendingTasks, color: rgb(0.95, 0.61, 0.07) },
        { label: 'Overdue Tasks', value: overdueTasks, color: rgb(0.91, 0.3, 0.24) },
        { label: 'Rejected Tasks', value: rejectedTasks, color: rgb(0.5, 0.5, 0.5) },
    ];

    let xOffset = margin;
    const kpiBoxWidth = (tableWidth - 2 * 20) / 3;
    const kpiBoxHeight = 55;
    const gap = 20;

    kpiData.forEach((kpi, index) => {
        if (index % 3 === 0 && index !== 0) {
            y -= (kpiBoxHeight + 15);
            xOffset = margin;
        }

        const boxY = y - kpiBoxHeight;

        page.drawRectangle({
            x: xOffset, y: boxY, width: kpiBoxWidth, height: kpiBoxHeight,
            borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.5,
            color: rgb(0.98, 0.98, 0.98),
        });

        page.drawRectangle({ x: xOffset, y: boxY + kpiBoxHeight - 5, width: kpiBoxWidth, height: 5, color: kpi.color });

        page.drawText(String(kpi.value), { x: xOffset + 10, y: boxY + 25, size: 16, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
        page.drawText(kpi.label, { x: xOffset + 10, y: boxY + 10, size: 8, font: font, color: rgb(0.4, 0.4, 0.4) });

        xOffset += (kpiBoxWidth + gap);
    });

    y = y - kpiBoxHeight - 20;

    if (y < margin + 100) { page = pdfDoc.addPage(); y = height - 50; }

    page.drawText('System Efficiency & Compliance', { x: margin, y: y, size: 18, font: fontBold, color: primaryColor });
    y -= 30;

    const efficiencyData = [
        { label: 'Global Completion Rate', value: `${globalCompletionRate.toFixed(1)}%`, color: rgb(0.18, 0.8, 0.44) },
        { label: 'Global Overdue Rate', value: `${globalOverdueRate.toFixed(1)}%`, color: rgb(0.91, 0.3, 0.24) },
        { label: 'Avg. Time-to-Completion', value: `${globalAvgCompletionTime.toFixed(1)} hrs`, color: rgb(0.95, 0.61, 0.07) },
    ];

    efficiencyData.forEach((kpi, index) => {
        const boxWidth = (tableWidth - 2 * 10) / 3;
        const xStart = margin + (boxWidth + 10) * index;
        const boxY = y - 45;

        page.drawRectangle({ x: xStart, y: boxY, width: boxWidth, height: 45, borderColor: kpi.color, borderWidth: 1, color: rgb(0.99, 0.99, 0.99) });

        page.drawText(kpi.label, { x: xStart + 8, y: boxY + 28, size: 9, fontBold, color: primaryColor });
        page.drawText(String(kpi.value), { x: xStart + 8, y: boxY + 10, size: 14, font: fontBold, color: kpi.color });
    });
    y -= 70;

    if (topUsers.length > 0) {
        if (y < margin + 150) { page = pdfDoc.addPage(); y = height - 50; }
        page.drawText('Top 10 User Performance (Efficiency)', { x: margin, y: y, size: 16, font: fontBold, color: primaryColor });
        y -= 25;

        const userHeaders = ['User Name', 'Total', 'Completed', 'Comp. %', 'On-Time %', 'Avg. Time (Hrs)'];
        const userColWidths = [150, 60, 60, 60, 65, 70];
        let userX = margin;

        page.drawRectangle({ x: margin, y: y - rowHeight, width: tableWidth, height: rowHeight, color: rgb(0.9, 0.9, 0.9) });

        userHeaders.forEach((header, i) => {
            page.drawText(header, { x: userX + 5, y: y - rowHeight + 5, size: 9, font: fontBold, color: rgb(0, 0, 0) });
            userX += userColWidths[i];
        });
        y -= (rowHeight + 5);

        topUsers.forEach(user => {
            if (y < margin + 20) { page = pdfDoc.addPage(); y = height - 50; }
            userX = margin;

            const compRate = user.totalTasks > 0 ? ((user.completed / user.totalTasks) * 100).toFixed(1) : '0.0';
            const onTimeRate = user.completed > 0 ? ((user.completedOnTime / user.completed) * 100).toFixed(1) : '0.0';
            const avgHours = user.avgCompletion.toFixed(1);

            page.drawText(user.name.slice(0, 20), { x: userX + 5, y: y, size: 9, font }); userX += userColWidths[0];

            page.drawText(String(user.totalTasks), { x: alignRight(String(user.totalTasks), userX, userColWidths[1], 9, font), y: y, size: 9, font }); userX += userColWidths[1];
            page.drawText(String(user.completed), { x: alignRight(String(user.completed), userX, userColWidths[2], 9, font), y: y, size: 9, font }); userX += userColWidths[2];

            page.drawText(`${compRate}%`, { x: alignRight(`${compRate}%`, userX, userColWidths[3], 9, fontBold), y: y, size: 9, fontBold, color: compRate >= 70 ? rgb(0.18, 0.8, 0.44) : primaryColor }); userX += userColWidths[3];
            page.drawText(`${onTimeRate}%`, { x: alignRight(`${onTimeRate}%`, userX, userColWidths[4], 9, fontBold), y: y, size: 9, fontBold, color: onTimeRate >= 80 ? rgb(0.18, 0.8, 0.44) : rgb(0.95, 0.61, 0.07) }); userX += userColWidths[4];
            page.drawText(avgHours, { x: alignRight(avgHours, userX, userColWidths[5], 9, font), y: y, size: 9, font });

            y -= rowHeight;
            page.drawLine({ start: { x: margin, y: y + 2 }, end: { x: width - margin, y: y + 2 }, thickness: 0.5, color: rgb(0.95, 0.95, 0.95) });
        });
    }
    y -= 25;

    if (adminMetrics.length > 0) {
        if (y < margin + 150) { page = pdfDoc.addPage(); y = height - 50; }
        page.drawText('Admin Management Overview', { x: margin, y: y, size: 16, font: fontBold, color: primaryColor });
        y -= 25;

        const adminHeaders = ['Admin', 'Users', 'Total Tasks', 'Comp. %', 'Overdue %', 'Pending', 'Overdue'];
        const adminColWidths = [120, 50, 60, 50, 60, 50, 60];
        let adminX = margin;

        page.drawRectangle({ x: margin, y: y - rowHeight, width: tableWidth, height: rowHeight, color: rgb(0.9, 0.9, 0.9) });

        adminHeaders.forEach((header, i) => {
            page.drawText(header, { x: adminX + 5, y: y - rowHeight + 5, size: 9, font: fontBold, color: rgb(0, 0, 0) });
            adminX += adminColWidths[i];
        });
        y -= (rowHeight + 5);

        adminMetrics.forEach(admin => {
            if (y < margin + 20) { page = pdfDoc.addPage(); y = height - 50; }
            adminX = margin;

            page.drawText(admin.name.slice(0, 15), { x: adminX + 5, y: y, size: 9, font }); adminX += adminColWidths[0];

            page.drawText(String(admin.userCount), { x: alignRight(String(admin.userCount), adminX, adminColWidths[1], 9, font), y: y, size: 9, font }); adminX += adminColWidths[1];
            page.drawText(String(admin.totalTasks), { x: alignRight(String(admin.totalTasks), adminX, adminColWidths[2], 9, font), y: y, size: 9, font }); adminX += adminColWidths[2];

            page.drawText(`${admin.completionRate.toFixed(1)}%`, { x: alignRight(`${admin.completionRate.toFixed(1)}%`, adminX, adminColWidths[3], 9, fontBold), y: y, size: 9, fontBold, color: admin.completionRate >= 70 ? rgb(0.18, 0.8, 0.44) : rgb(0.95, 0.61, 0.07) }); adminX += adminColWidths[3];
            page.drawText(`${admin.overdueRate.toFixed(1)}%`, { x: alignRight(`${admin.overdueRate.toFixed(1)}%`, adminX, adminColWidths[4], 9, fontBold), y: y, size: 9, fontBold, color: admin.overdueRate <= 10 ? rgb(0.18, 0.8, 0.44) : rgb(0.91, 0.3, 0.24) }); adminX += adminColWidths[4];

            page.drawText(String(admin.pending), { x: alignRight(String(admin.pending), adminX, adminColWidths[5], 9, font), y: y, size: 9, font }); adminX += adminColWidths[5];
            page.drawText(String(admin.overdue), { x: alignRight(String(admin.overdue), adminX, adminColWidths[6], 9, fontBold), y: y, size: 9, fontBold, color: admin.overdue > 0 ? rgb(0.91, 0.3, 0.24) : primaryColor });

            y -= rowHeight;
            page.drawLine({ start: { x: margin, y: y + 2 }, end: { x: width - margin, y: y + 2 }, thickness: 0.5, color: rgb(0.95, 0.95, 0.95) });
        });
    }
    y -= 25;

    if (userMetrics.length > 0) {
        if (y < margin + 150) { page = pdfDoc.addPage(); y = height - 50; }
        page.drawText('Full User List and Task Summary', { x: margin, y: y, size: 16, font: fontBold, color: primaryColor });
        y -= 25;

        const userDetailHeaders = ['User Name', 'Total', 'To Do', 'In Prog.', 'Overdue', 'Completed', 'Rejected'];
        const userDetailColWidths = [120, 60, 60, 60, 60, 60, 60];
        let userDetailX = margin;

        page.drawRectangle({ x: margin, y: y - rowHeight, width: tableWidth, height: rowHeight, color: rgb(0.9, 0.9, 0.9) });

        userDetailHeaders.forEach((header, i) => {
            page.drawText(header, { x: userDetailX + 5, y: y - rowHeight + 5, size: 9, font: fontBold, color: rgb(0, 0, 0) });
            userDetailX += userDetailColWidths[i];
        });
        y -= (rowHeight + 5);

        userMetrics.forEach(user => {
            if (y < margin + 20) { page = pdfDoc.addPage(); y = height - 50; }
            userDetailX = margin;

            page.drawText(user.name.slice(0, 15), { x: userDetailX + 5, y: y, size: 9, font }); userDetailX += userDetailColWidths[0];

            page.drawText(String(user.totalTasks), { x: alignRight(String(user.totalTasks), userDetailX, userDetailColWidths[1], 9, font), y: y, size: 9, font }); userDetailX += userDetailColWidths[1];
            page.drawText(String(user.todo), { x: alignRight(String(user.todo), userDetailX, userDetailColWidths[2], 9, font), y: y, size: 9, font }); userDetailX += userDetailColWidths[2];
            page.drawText(String(user.inProgress), { x: alignRight(String(user.inProgress), userDetailX, userDetailColWidths[3], 9, font), y: y, size: 9, font }); userDetailX += userDetailColWidths[3];
            page.drawText(String(user.overdue), { x: alignRight(String(user.overdue), userDetailX, userDetailColWidths[4], 9, fontBold), y: y, size: 9, fontBold, color: user.overdue > 0 ? rgb(0.91, 0.3, 0.24) : primaryColor }); userDetailX += userDetailColWidths[4];
            page.drawText(String(user.completed), { x: alignRight(String(user.completed), userDetailX, userDetailColWidths[5], 9, font), y: y, size: 9, font }); userDetailX += userDetailColWidths[5];
            page.drawText(String(user.rejected), { x: alignRight(String(user.rejected), userDetailX, userDetailColWidths[6], 9, font), y: y, size: 9, font });

            y -= rowHeight;
            page.drawLine({ start: { x: margin, y: y + 2 }, end: { x: width - margin, y: y + 2 }, thickness: 0.5, color: rgb(0.95, 0.95, 0.95) });
        });
    }

    return pdfDoc.save();
};

const createAndSharePdf = async (contentGenerator, data, fileNameBase, themeColors, setIsDownloading, setDownloadInfo) => {
    setIsDownloading(true);
    setDownloadInfo({ isVisible: false, fileName: '' });

    const finalFileName = `${fileNameBase}_${new Date().toISOString().slice(0, 10)}.pdf`;

    try {
        const pdfBytes = await contentGenerator(data, themeColors);

        if (pdfBytes.length === 0) {
            Alert.alert('Error', 'Could not generate PDF content.');
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
        Alert.alert('Error', 'Could not generate or save the report. Please check permissions or console for errors.');
    } finally {
        setIsDownloading(false);
    }
};


const DashboardScreen = () => {
    const { theme } = useContext(ThemeContext);
    const screenWidth = useScreenWidth();
    const scale = screenWidth / 375;

    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadInfo, setDownloadInfo] = useState({ isVisible: false, fileName: '' });

    const {
        admins, users, tasks, taskStats, usersMap, getUserLabel, isUsersMapReady
    } = useDashboardData();

    const {
        selectedModal, setSelectedModal,
        selectedTaskDetail, setSelectedTaskDetail,
        selectedUserDetail, setSelectedUserDetail
    } = useDashboardModals();

    const getStatusColor = useStatusColor();

    const reportData = useMemo(() => {
        const allTasksCount = tasks.length;
        const totalCompleted = taskStats.completed.length;
        const totalOverdue = getOverdueTasks(tasks).length;
        const completedTasksList = tasks.filter(t => t.status === 'completed');

        const totalCompletionHours = completedTasksList.reduce((sum, t) => sum + hoursBetween(safeDate(t.createdAt), safeDate(t.updatedAt)), 0);
        const globalAvgCompletionTime = totalCompleted > 0 ? totalCompletionHours / totalCompleted : 0;

        const userMetrics = users.map(u => {
            const userTasks = tasks.filter(t => t.assignedTo === u.uid);
            const totalTasks = userTasks.length;
            const todoTasks = userTasks.filter(t => t.status === 'todo' || t.status === 'pending').length;
            const inProgressTasks = userTasks.filter(t => t.status === 'inprogress').length;
            const completedTasks = userTasks.filter(t => t.status === 'completed').length;
            const rejectedTasks = userTasks.filter(t => t.status === 'rejected').length;
            const pendingTasks = todoTasks + inProgressTasks;

            const overdueTasks = getOverdueTasks(userTasks).length;

            const completedList = userTasks.filter(t => t.status === 'completed');
            const totalCompHours = completedList.reduce((sum, t) => sum + hoursBetween(safeDate(t.createdAt), safeDate(t.updatedAt)), 0);
            const avgCompletion = completedTasks > 0 ? totalCompHours / completedTasks : 0;

            const completedOnTime = completedList.filter(t => safeDate(t.updatedAt) <= safeDate(t.deadline)).length;

            return {
                uid: u.uid,
                name: u.name || 'Unnamed User',
                email: u.email || 'N/A',
                totalTasks,
                completed: completedTasks,
                rejected: rejectedTasks,
                pending: pendingTasks,
                overdue: overdueTasks,
                todo: todoTasks,
                inProgress: inProgressTasks,
                avgCompletion,
                completedOnTime,
            };
        });

        const adminMetrics = admins.map(a => {
            const adminUsers = users.filter(u => u.adminId === a.uid);
            const adminUserUids = adminUsers.map(u => u.uid);
            const adminUsersTasks = tasks.filter(t => adminUserUids.includes(t.assignedTo));

            const totalTasks = adminUsersTasks.length;
            const completed = adminUsersTasks.filter(t => t.status === 'completed').length;
            const rejected = adminUsersTasks.filter(t => t.status === 'rejected').length;
            const pending = adminUsersTasks.filter(t => t.status === 'todo' || t.status === 'inprogress' || t.status === 'pending').length;
            const overdue = getOverdueTasks(adminUsersTasks).length;

            const completionRate = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;
            const overdueRate = totalTasks > 0 ? (overdue / totalTasks) * 100 : 0;


            return {
                uid: a.uid,
                name: a.name || 'Unnamed Admin',
                email: a.email || 'N/A',
                userCount: adminUsers.length,
                totalTasks,
                completed,
                rejected,
                pending,
                overdue,
                completionRate,
                overdueRate,
            };
        });

        const globalPending = taskStats.pending.length + taskStats.inprogress.length;
        const globalCompletionRate = allTasksCount > 0 ? (totalCompleted / allTasksCount) * 100 : 0;
        const globalOverdueRate = allTasksCount > 0 ? (totalOverdue / allTasksCount) * 100 : 0;

        const topUsers = userMetrics
            .filter(u => u.totalTasks > 0)
            .sort((a, b) => {
                const aRate = a.completed / a.totalTasks;
                const bRate = b.completed / b.totalTasks;
                return bRate - aRate;
            })
            .slice(0, 10);


        return {
            totalTasks: allTasksCount,
            pendingTasks: globalPending,
            overdueTasks: totalOverdue,
            completedTasks: totalCompleted,
            rejectedTasks: taskStats.rejected.length,

            globalCompletionRate,
            globalOverdueRate,
            globalAvgCompletionTime,

            topUsers,
            adminMetrics,
            userMetrics
        };
    }, [users, admins, tasks, taskStats]);


    const handleDownloadReport = () => {
        createAndSharePdf(
            generateSuperAdminPdfContent,
            reportData,
            'SuperAdmin_Global_Report',
            theme.colors,
            setIsDownloading,
            setDownloadInfo
        );
    };

    const onDismissSnackbar = () => {
        setDownloadInfo({ isVisible: false, fileName: '' });
    };

    if (!isUsersMapReady) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }} edges={['top']}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ color: theme.colors.text, marginTop: 10 }}>Loading User Reference Data...</Text>
            </SafeAreaView>
        );
    }

    const overdueTasks = getOverdueTasks(tasks);

    const statCardsData = [
        { title: 'Admins', value: admins.length, iconName: 'shield-outline', bgColor: '#3498db', modalKey: 'admins', data: admins },
        { title: 'Users', value: users.length, iconName: 'people-outline', bgColor: '#2ecc71', modalKey: 'users', data: users },
        { title: 'Pending Tasks', value: reportData.pendingTasks, iconName: 'time-outline', bgColor: '#f1c40f', modalKey: 'pending', data: tasks.filter(t => t.status === 'todo' || t.status === 'inprogress' || t.status === 'pending') },
        { title: 'Overdue Tasks', value: overdueTasks.length, iconName: 'alert-circle-outline', bgColor: '#e74c3c', modalKey: 'overdue', data: overdueTasks },
        { title: 'Completed', value: reportData.completedTasks, iconName: 'checkmark-done-outline', bgColor: '#27ae60', modalKey: 'completed', data: taskStats.completed },
        { title: 'Rejected', value: reportData.rejectedTasks, iconName: 'close-circle-outline', bgColor: '#95a5a6', modalKey: 'rejected', data: taskStats.rejected },
    ];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                <TouchableOpacity
                    style={[componentStyles.downloadButton, { backgroundColor: theme.colors.primary, marginBottom: 20 }]}
                    onPress={handleDownloadReport}
                    disabled={isDownloading}
                >
                    {isDownloading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="download-outline" size={20 * scale} color="#fff" />
                            <Text style={componentStyles.downloadButtonText}>Download Global Report</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={baseStyles.statCardsContainer}>
                    {statCardsData.map((card) => (
                        <StatCard
                            key={card.modalKey}
                            title={card.title}
                            value={card.value}
                            iconName={card.iconName}
                            bgColor={card.bgColor}
                            scale={scale}
                            onPress={() => setSelectedModal(card.modalKey)}
                        />
                    ))}
                </View>
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

            <Snackbar
                visible={downloadInfo.isVisible}

                onDismiss={onDismissSnackbar}
                duration={4000}
                action={{ label: 'Close', onPress: onDismissSnackbar, labelStyle: { color: theme.colors.text } }}
                style={[{ backgroundColor: theme.colors.card, top: 0, marginBottom: 40, borderRadius: 8 }]}
            >
                <Text style={{ color: theme.colors.text }}>
                    <Ionicons name="checkmark-done-outline" /> Report <Text style={{ fontWeight: 'bold' }}>{downloadInfo.fileName}</Text> saved to Downloads.
                </Text>
            </Snackbar>
        </SafeAreaView>
    );
};
const componentStyles = StyleSheet.create({
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
});

export default DashboardScreen;