import React, { useEffect } from 'react';
import { View, Alert, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TasksScreen from './TasksScreen';
import DashboardScreen from './DashboardScreen';
import AssignScreen from './AssignScreen';
import ProfileScreen from '../user/ProfileScreen';
import { useTheme } from '../../hooks/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';

import messaging from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import Geolocation from 'react-native-geolocation-service';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const Tab = createBottomTabNavigator();

const getTabIcon = (iconName) => ({ color, size }) => (
  <Icon name={iconName} color={color} size={size} />
);

const AdminTabs = () => {
  const theme = useTheme();

  useEffect(() => {
    const requestPermissionsAndSaveLocation = async () => {
      try {
        const currentUser = auth().currentUser;
        if (!currentUser) return;
        const userDocRef = firestore().collection('users').doc(currentUser.uid);
        const userDoc = await userDocRef.get();
        const preferences = userDoc.exists ? userDoc.data().notificationPreferences || {} : {};

        if (!preferences.push) {
          const authStatus = await messaging().requestPermission();
          const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
          if (enabled) {
            const fcmToken = await messaging().getToken();
            const savedTokens = userDoc.data()?.fcmTokens || [];
            await userDocRef.set(
              {
                fcmTokens: savedTokens.includes(fcmToken) ? savedTokens : [...savedTokens, fcmToken],
                notificationPreferences: { ...preferences, push: true },
              },
              { merge: true }
            );
            Alert.alert('Notifications Enabled', 'You will now receive push notifications!');
          } else {
            Alert.alert('Notifications Disabled', 'You denied permission for push notifications.');
          }
        }
        const locationPermission =
          Platform.OS === 'android'
            ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
            : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

        const locationStatus = await request(locationPermission);
        if (locationStatus === RESULTS.GRANTED) {
          Geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              await userDocRef.set(
                { location: { latitude, longitude } },
                { merge: true }
              );
            },
            (error) => Alert.alert('Location Error', error.message),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        } else {
          Alert.alert('Location Permission Denied', 'You denied permission to access location.');
        }

        const contactsPermission =
          Platform.OS === 'android'
            ? PERMISSIONS.ANDROID.READ_CONTACTS
            : PERMISSIONS.IOS.CONTACTS;

        const contactsStatus = await request(contactsPermission);
        if (contactsStatus !== RESULTS.GRANTED) {
          Alert.alert('Contacts Permission Denied', 'You denied permission to access contacts.');
        }

      } catch (error) {
        Alert.alert('Permission Error', error.message);
      }
    };

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
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
        },
        tabBarBackground: () => <View style={{ flex: 1, backgroundColor: theme.colors.card }} />,
        safeAreaInsets: { bottom: 0 },
      }}
    >
      <Tab.Screen name="Tasks" component={TasksScreen} options={{ tabBarIcon: getTabIcon('checkmark-done-outline') }} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: getTabIcon('grid-outline') }} />
      <Tab.Screen name="Assign" component={AssignScreen} options={{ tabBarIcon: getTabIcon('clipboard-outline') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: getTabIcon('person-outline') }} />
    </Tab.Navigator>
  );
};

export default AdminTabs;
