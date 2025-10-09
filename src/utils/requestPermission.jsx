// import { Alert, Platform } from 'react-native';
// import auth from '@react-native-firebase/auth';
// import firestore from '@react-native-firebase/firestore';
// import messaging, { requestPermission } from '@react-native-firebase/messaging';
// import Geolocation from 'react-native-geolocation-service';
// import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';

// export const requestPermissionsAndSaveLocation = async () => {
//     try {
//         const currentUser = auth().currentUser;
//         if (!currentUser) return;

//         const userId = currentUser.uid;
//         const userDocRef = firestore().collection('users').doc(userId);
//         const userDoc = await userDocRef.get();
//         const preferences = userDoc.exists ? userDoc.data().notificationPreferences || {} : {};

//         const enforcePermission = async (permission, friendlyName) => {
//             if (!permission) return false;

//             while (true) {
//                 let status = await check(permission);

//                 if (status === RESULTS.DENIED) {
//                     // Prompt system permission
//                     status = await request(permission);
//                 }

//                 if (status === RESULTS.BLOCKED) {
//                     // Prompt user to open settings
//                     const open = await new Promise(resolve => {
//                         Alert.alert(
//                             `${friendlyName} Permission Required`,
//                             `This app cannot work properly without ${friendlyName}. Please enable it in settings.`,
//                             [
//                                 { text: 'Open Settings', onPress: () => { openSettings(); resolve(true); } },
//                                 { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
//                             ],
//                             { cancelable: false }
//                         );
//                     });

//                     if (!open) {
//                         // Keep looping — app functionality is restricted
//                         continue;
//                     }
//                 }

//                 if (status === RESULTS.GRANTED) return true;

//                 // If user denied (not blocked), repeat the loop
//                 await new Promise(resolve => setTimeout(resolve, 500)); // small delay before retrying
//             }
//         };

//         const locationPermission = Platform.select({
//             ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
//             android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
//             default: null,
//         });
//         const locationGranted = await enforcePermission(locationPermission, 'Location');

//         if (locationGranted) {
//             Geolocation.getCurrentPosition(
//                 async position => {
//                     const { latitude, longitude } = position.coords;
//                     await userDocRef.set(
//                         {
//                             location: { latitude, longitude },
//                             lastLocationUpdatedAt: firestore.FieldValue.serverTimestamp(),
//                         },
//                         { merge: true }
//                     );
//                 },
//                 () => Alert.alert('Location Error', 'Unable to fetch your current location.'),
//                 { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
//             );
//         }

//         // --- Contacts ---
//         const contactsPermission = Platform.select({
//             ios: PERMISSIONS.IOS.CONTACTS,
//             android: PERMISSIONS.ANDROID.READ_CONTACTS,
//             default: null,
//         });
//         await enforcePermission(contactsPermission, 'Contacts');

//         // --- Notifications ---
//         const notificationsPermission = Platform.select({
//             ios: PERMISSIONS.IOS.NOTIFICATIONS,
//             android: PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
//             default: null,
//         });
//         const notificationsGranted = await enforcePermission(notificationsPermission, 'Notifications');

//         if (notificationsGranted) {
//             const authStatus = await messaging().requestPermission();
//             const enabled =
//                 authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//                 authStatus === messaging.AuthorizationStatus.PROVISIONAL;

//             if (enabled) {
//                 const fcmToken = await messaging().getToken();
//                 const savedTokens = userDoc.data()?.fcmTokens || [];
//                 await userDocRef.set(
//                     {
//                         fcmTokens: savedTokens.includes(fcmToken) ? savedTokens : [...savedTokens, fcmToken],
//                         notificationPreferences: { ...preferences, push: true },
//                     },
//                     { merge: true }
//                 );
//             }
//         }

//     } catch (error) {
//         console.error(error);
//         Alert.alert('Error', 'Failed to enforce permissions or save location.');
//     }
// };



import { Alert, Platform } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import Geolocation from 'react-native-geolocation-service';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';

export const requestPermissionsAndSaveLocation = async () => {
    try {
        const currentUser = auth().currentUser;
        if (!currentUser) return;

        const userId = currentUser.uid;
        const userDocRef = firestore().collection('users').doc(userId);
        const userDoc = await userDocRef.get();
        const preferences = userDoc.exists ? userDoc.data().notificationPreferences || {} : {};

        // ✅ Helper with null safety
        const ensurePermission = async (permission, label) => {
            if (!permission) {
                console.warn(`[Permissions] Skipped ${label}: invalid permission key`);
                return false;
            }

            let status;
            try {
                status = await check(permission);
            } catch {
                console.warn(`[Permissions] Error checking ${label}`);
                return false;
            }

            while (status !== RESULTS.GRANTED) {
                if (status === RESULTS.DENIED) {
                    status = await request(permission);
                } else if (status === RESULTS.BLOCKED) {
                    await new Promise(resolve => {
                        Alert.alert(
                            `${label} Permission Blocked`,
                            `${label} permission is required. Please enable it in settings.`,
                            [
                                { text: 'Open Settings', onPress: () => { openSettings(); resolve(); } },
                                { text: 'Retry', onPress: () => resolve() },
                            ],
                            { cancelable: false }
                        );
                    });
                } else {
                    await new Promise(resolve => {
                        Alert.alert(
                            `${label} Permission Needed`,
                            `Please allow ${label} permission to continue.`,
                            [
                                { text: 'Allow', onPress: async () => { status = await request(permission); resolve(); } },
                            ],
                            { cancelable: false }
                        );
                    });
                }

                try {
                    status = await check(permission);
                } catch {
                    console.warn(`[Permissions] Failed to recheck ${label}`);
                    break;
                }
            }

            return status === RESULTS.GRANTED;
        };

        // --- Location ---
        const locationPermission = Platform.select({
            ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
            android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
            default: null,
        });
        await ensurePermission(locationPermission, 'Location');

        Geolocation.getCurrentPosition(
            async position => {
                const { latitude, longitude } = position.coords;
                await userDocRef.set(
                    { location: { latitude, longitude }, lastLocationUpdatedAt: firestore.FieldValue.serverTimestamp() },
                    { merge: true }
                );
            },
            () => Alert.alert('Location Error', 'Unable to fetch your current location.'),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );

        // --- Contacts ---
        const contactsPermission = Platform.select({
            ios: PERMISSIONS.IOS.CONTACTS,
            android: PERMISSIONS.ANDROID.READ_CONTACTS,
            default: null,
        });
        await ensurePermission(contactsPermission, 'Contacts');

        // --- Notifications (Android special case) ---
        if (Platform.OS === 'android') {
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (!enabled) {
                Alert.alert(
                    'Notifications Required',
                    'Please enable notifications in Settings to receive updates.',
                    [
                        { text: 'Open Settings', onPress: () => openSettings() },
                        { text: 'Retry', onPress: () => requestPermissionsAndSaveLocation() },
                    ],
                    { cancelable: false }
                );
                return;
            }
        } else {
            // iOS still uses permission constants
            const notificationPermission = PERMISSIONS.IOS.NOTIFICATIONS;
            await ensurePermission(notificationPermission, 'Notifications');
        }

        // --- FCM Token ---
        const fcmToken = await messaging().getToken();
        const savedTokens = userDoc.data()?.fcmTokens || [];
        if (!savedTokens.includes(fcmToken)) {
            await userDocRef.set(
                {
                    fcmTokens: [...savedTokens, fcmToken],
                    notificationPreferences: { ...preferences, push: true },
                },
                { merge: true }
            );
        }

    } catch (error) {
        console.error('Permission flow error:', error);
        Alert.alert('Error', 'Failed to request permissions or save location.');
    }
};
