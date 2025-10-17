import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import messaging from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';
import DashboardScreen from './DashboardScreen';
import ManageAdminScreen from './ManageAdminScreen';
import ManageUserScreen from './ManageUserScreen';
import ProfileScreen from '../user/ProfileScreen';
import { ThemeContext } from '../../context/ThemeContext';
import MyTask from "../user/MyTasks";

const Tab = createBottomTabNavigator();

const SuperAdminTabs = () => {
  const { theme } = React.useContext(ThemeContext);

  const requestPermissionsAndSaveLocation = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;

      const userId = currentUser.uid;
      const userDocRef = firestore().collection('users').doc(userId);
      const userDoc = await userDocRef.get();
      const preferences = userDoc.exists ? userDoc.data().notificationPreferences || {} : {};

      const locationPermission = Platform.select({
        ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      });
      const locationStatus = await request(locationPermission);
      if (locationStatus === RESULTS.GRANTED) {
        Geolocation.getCurrentPosition(
          async position => {
            const { latitude, longitude } = position.coords;
            await userDocRef.set(
              { location: { latitude, longitude }, lastLocationUpdatedAt: firestore.FieldValue.serverTimestamp() },
              { merge: true }
            );
           
          },
          error => Alert.alert('Location Error', 'Unable to fetch your current location.'),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } else {
        Alert.alert('Location Permission Denied', 'You denied location permission. Some features may not work.');
      }

      const contactsPermission = Platform.select({
        ios: PERMISSIONS.IOS.CONTACTS,
        android: PERMISSIONS.ANDROID.READ_CONTACTS,
      });
      const contactsStatus = await request(contactsPermission);
      if (contactsStatus !== RESULTS.GRANTED) {
        Alert.alert('Contacts Permission Denied', 'You denied access to contacts.');
      }

      if (!preferences.push) {
        const notificationGranted = await new Promise(resolve => {
          Alert.alert(
            'Enable Push Notifications?',
            'Do you want to receive push notifications?',
            [
              { text: 'No', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Yes', onPress: () => resolve(true) },
            ],
            { cancelable: false }
          );
        });

        if (notificationGranted) {
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
                notificationPreferences: { ...preferences, push: true }
              },
              { merge: true }
            );
            Alert.alert('Notifications Enabled', 'You will now receive push notifications!');
          } else {
            Alert.alert('Notifications Disabled', 'You can enable them later in settings.');
          }
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request permissions or save location.');
    }
  };

  useEffect(() => {
    requestPermissionsAndSaveLocation();

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert(remoteMessage.notification?.title, remoteMessage.notification?.body);
    });

    return unsubscribe;
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
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
        tabBarSafeAreaInsets: { top: 0 },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = 'grid-outline';
          else if (route.name === 'ManageAdmin') iconName = 'people-outline';
          else if (route.name === 'ManageUser') iconName = 'person-add-outline';
          else if (route.name === 'Profile') iconName = 'person-circle-outline';
          else if (route.name === 'My Tasks') iconName = 'add-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen
        name="My Tasks"
        component={MyTask}
        options={{title:'My Tasks'}}
      />
      <Tab.Screen name="ManageAdmin" component={ManageAdminScreen} options={{ title: 'Admins' }} />
      <Tab.Screen name="ManageUser" component={ManageUserScreen} options={{ title: 'Users' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default SuperAdminTabs;
