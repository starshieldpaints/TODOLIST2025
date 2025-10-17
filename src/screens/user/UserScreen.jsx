import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import messaging from '@react-native-firebase/messaging';
import { useTheme } from '../../hooks/useTheme';

import TasksScreen from './TaskScreen';
import DashboardScreen from './DashboardScreen';
import ProfileScreen from './ProfileScreen';
import { requestPermissionsAndSaveLocation } from "../../utils/requestPermission";
import MyTask from "./MyTasks";


const Tab = createBottomTabNavigator();

const UserScreen = () => {
    const theme = useTheme();

    useEffect(() => {
        requestPermissionsAndSaveLocation();

        const unsubscribe = messaging().onMessage(async remoteMessage => {
            Alert.alert(remoteMessage.notification?.title, remoteMessage.notification?.body);
        });

        return unsubscribe;
    }, []);

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.text,
                tabBarStyle: {
                    backgroundColor: theme.colors.card,
                    borderTopColor: theme.colors.border,
                    borderTopWidth: 0,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 0,
                    height: 70,
                },
            }}
        >
            <Tab.Screen
                name="Tasks"
                component={TasksScreen}
                options={{ tabBarIcon: ({ color, size }) => <Icon name="checkmark-done-outline" color={color} size={size} /> }}
            />
            <Tab.Screen
                name="My Tasks"
                component={MyTask}
                options={{ tabBarIcon: ({ color, size }) => <Icon name="list-outline" color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{ tabBarIcon: ({ color, size }) => <Icon name="grid-outline" color={color} size={size} /> }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarIcon: ({ color, size }) => <Icon name="person-outline" color={color} size={size} /> }}
            />
        </Tab.Navigator>
    );
};

export default UserScreen;