
import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import messaging from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useTheme } from '../../hooks/useTheme';

import TasksScreen from './TaskScreen';
import DashboardScreen from './DashboardScreen';
import ProfileScreen from './ProfileScreen';

const Tab = createBottomTabNavigator();

const UserScreen = () => {
    const theme = useTheme();

    useEffect(() => {
        const promptUserForPushPreference = async () => {
            try {
                const currentUser = auth().currentUser;
                if (!currentUser) {
                    Alert.alert('Not Logged In', 'You must be logged in to set notification preferences.');
                    return;
                }

                const userId = currentUser.uid;
                const userDocRef = firestore().collection('users').doc(userId);
                const userDoc = await userDocRef.get();
                const preferences = userDoc.exists ? userDoc.data().notificationPreferences || {} : {};

                // If user already opted in, skip the prompt
                if (preferences.push) return;

                // Ask user for push notification permission
                Alert.alert(
                    'Enable Push Notifications?',
                    'Do you want to receive push notifications?',
                    [
                        {
                            text: 'No',
                            style: 'cancel',
                        },
                        {
                            text: 'Yes',
                            onPress: async () => {
                                try {
                                    // Request FCM permission
                                    const authStatus = await messaging().requestPermission();
                                    const enabled =
                                        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                                        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

                                    if (!enabled) {
                                        Alert.alert(
                                            'Notifications Disabled',
                                            'You denied permission. You can enable it in settings later.'
                                        );
                                        return;
                                    }

                                    // Get FCM token
                                    const fcmToken = await messaging().getToken();
                                    const savedTokens = userDoc.data().fcmTokens || [];

                                    // Save token if not already saved
                                    if (!savedTokens.includes(fcmToken)) {
                                        await userDocRef.set(
                                            {
                                                fcmTokens: [...savedTokens, fcmToken],
                                                notificationPreferences: { ...preferences, push: true }
                                            },
                                            { merge: true }
                                        );
                                        Alert.alert('Notifications Enabled', 'You will now receive push notifications!');
                                    } else {
                                        await userDocRef.set(
                                            { notificationPreferences: { ...preferences, push: true } },
                                            { merge: true }
                                        );
                                        Alert.alert('Notifications Active', 'Your push notifications are already active.');
                                    }
                                } catch (error) {
                                    console.error('Error enabling notifications:', error);
                                    Alert.alert('Error', 'Something went wrong. Please try again.');
                                }
                            }
                        }
                    ],
                    { cancelable: false }
                );

            } catch (error) {
                console.error('Error fetching user preferences:', error);
            }
        };

        promptUserForPushPreference();

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
                tabBarStyle: { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border },
            }}
        >
            <Tab.Screen
                name="Tasks"
                component={TasksScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Icon name="checkmark-done-outline" color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Icon name="grid-outline" color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Icon name="person-outline" color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
};

export default UserScreen;
