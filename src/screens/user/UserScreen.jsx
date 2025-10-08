
// import React, { useEffect } from 'react';
// import { Alert, Platform } from 'react-native';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import Icon from 'react-native-vector-icons/Ionicons';
// import messaging from '@react-native-firebase/messaging';
// import auth from '@react-native-firebase/auth';
// import firestore from '@react-native-firebase/firestore';
// import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
// import Geolocation from 'react-native-geolocation-service';
// import { useTheme } from '../../hooks/useTheme';

// import TasksScreen from './TaskScreen';
// import DashboardScreen from './DashboardScreen';
// import ProfileScreen from './ProfileScreen';

// const Tab = createBottomTabNavigator();

// const UserScreen = () => {
//     const theme = useTheme();

//     const requestPermissionAndSaveLocation = async () => {
//         try {
//             const currentUser = auth().currentUser;
//             if (!currentUser) return;
//             const userId = currentUser.uid;
//             const userDocRef = firestore().collection('users').doc(userId);
//             const userDoc = await userDocRef.get();
//             const preferences = userDoc.exists ? userDoc.data().notificationPreferences || {} : {};

//             // --- Location Permission ---
//             const locationPermission = Platform.select({
//                 ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
//                 android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
//             });
//             const locationStatus = await request(locationPermission);

//             if (locationStatus === RESULTS.GRANTED) {
//                 Geolocation.getCurrentPosition(
//                     async position => {
//                         const { latitude, longitude } = position.coords;
//                         console.log('User location:', latitude, longitude);

//                         // Save location to Firestore
//                         await userDocRef.set(
//                             { location: { latitude, longitude }, lastLocationUpdatedAt: firestore.FieldValue.serverTimestamp() },
//                             { merge: true }
//                         );
//                     },
//                     error => {
//                         console.error('Error getting location:', error);
//                         Alert.alert('Location Error', 'Unable to fetch your current location.');
//                     },
//                     { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
//                 );
//             } else {
//                 Alert.alert('Location Permission', 'Location access denied. Some features may not work.');
//             }

//             // --- Contacts Permission ---
//             const contactsPermission = Platform.select({
//                 ios: PERMISSIONS.IOS.CONTACTS,
//                 android: PERMISSIONS.ANDROID.READ_CONTACTS,
//             });
//             await request(contactsPermission);

//             // --- Notifications Permission ---
//             if (!preferences.push) {
//                 const notificationGranted = await new Promise(resolve => {
//                     Alert.alert(
//                         'Enable Push Notifications?',
//                         'Do you want to receive push notifications?',
//                         [
//                             { text: 'No', style: 'cancel', onPress: () => resolve(false) },
//                             { text: 'Yes', onPress: () => resolve(true) },
//                         ],
//                         { cancelable: false }
//                     );
//                 });

//                 if (notificationGranted) {
//                     const authStatus = await messaging().requestPermission();
//                     const enabled =
//                         authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//                         authStatus === messaging.AuthorizationStatus.PROVISIONAL;

//                     if (enabled) {
//                         const fcmToken = await messaging().getToken();
//                         const savedTokens = userDoc.data()?.fcmTokens || [];
//                         if (!savedTokens.includes(fcmToken)) {
//                             await userDocRef.set(
//                                 {
//                                     fcmTokens: [...savedTokens, fcmToken],
//                                     notificationPreferences: { ...preferences, push: true }
//                                 },
//                                 { merge: true }
//                             );
//                         } else {
//                             await userDocRef.set(
//                                 { notificationPreferences: { ...preferences, push: true } },
//                                 { merge: true }
//                             );
//                         }
//                         Alert.alert('Notifications Enabled', 'You will now receive push notifications!');
//                     } else {
//                         Alert.alert('Notifications Disabled', 'You can enable them later in settings.');
//                     }
//                 }
//             }

//         } catch (error) {
//             console.error('Permission/location error:', error);
//             Alert.alert('Error', 'Failed to request permissions or save location.');
//         }
//     };

//     useEffect(() => {
//         requestPermissionAndSaveLocation();

//         const unsubscribe = messaging().onMessage(async remoteMessage => {
//             Alert.alert(remoteMessage.notification?.title, remoteMessage.notification?.body);
//         });

//         return unsubscribe;
//     }, []);

//     return (
//         <Tab.Navigator
//             screenOptions={{
//                 headerShown: false,
//                 tabBarActiveTintColor: theme.colors.primary,
//                 tabBarInactiveTintColor: theme.colors.text,
//                 tabBarStyle: { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border },
//             }}
//         >
//             <Tab.Screen
//                 name="Tasks"
//                 component={TasksScreen}
//                 options={{ tabBarIcon: ({ color, size }) => <Icon name="checkmark-done-outline" color={color} size={size} /> }}
//             />
//             <Tab.Screen
//                 name="Dashboard"
//                 component={DashboardScreen}
//                 options={{ tabBarIcon: ({ color, size }) => <Icon name="grid-outline" color={color} size={size} /> }}
//             />
//             <Tab.Screen
//                 name="Profile"
//                 component={ProfileScreen}
//                 options={{ tabBarIcon: ({ color, size }) => <Icon name="person-outline" color={color} size={size} /> }}
//             />
//         </Tab.Navigator>
//     );
// };

// export default UserScreen;












import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import messaging from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';
import { useTheme } from '../../hooks/useTheme';

import TasksScreen from './TaskScreen';
import DashboardScreen from './DashboardScreen';
import ProfileScreen from './ProfileScreen';

const Tab = createBottomTabNavigator();

const UserScreen = () => {
    const theme = useTheme();

    const requestPermissionsAndSaveLocation = async () => {
        try {
            const currentUser = auth().currentUser;
            if (!currentUser) return;

            const userId = currentUser.uid;
            const userDocRef = firestore().collection('users').doc(userId);
            const userDoc = await userDocRef.get();
            const preferences = userDoc.exists ? userDoc.data().notificationPreferences || {} : {};

            // --- Location Permission ---
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

            // --- Contacts Permission ---
            const contactsPermission = Platform.select({
                ios: PERMISSIONS.IOS.CONTACTS,
                android: PERMISSIONS.ANDROID.READ_CONTACTS,
            });
            const contactsStatus = await request(contactsPermission);
            if (contactsStatus !== RESULTS.GRANTED) {
                Alert.alert('Contacts Permission Denied', 'You denied access to contacts.');
            }

            // --- Notifications Permission ---
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
