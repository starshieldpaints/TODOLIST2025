// import { Alert, Platform } from 'react-native';
// import auth from '@react-native-firebase/auth';
// import firestore from '@react-native-firebase/firestore';
// import messaging from '@react-native-firebase/messaging';
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
//         const ensurePermission = async (permission, label) => {
//             if (!permission) {
//                 console.warn(`[Permissions] Skipped ${label}: invalid permission key`);
//                 return false;
//             }

//             let status;
//             try {
//                 status = await check(permission);
//             } catch {
//                 console.warn(`[Permissions] Error checking ${label}`);
//                 return false;
//             }

//             while (status !== RESULTS.GRANTED) {
//                 if (status === RESULTS.DENIED) {
//                     status = await request(permission);
//                 } else if (status === RESULTS.BLOCKED) {
//                     await new Promise(resolve => {
//                         Alert.alert(
//                             `${label} Permission Blocked`,
//                             `${label} permission is required. Please enable it in settings.`,
//                             [
//                                 { text: 'Open Settings', onPress: () => { openSettings(); resolve(); } },
//                                 { text: 'Retry', onPress: () => resolve() },
//                             ],
//                             { cancelable: false }
//                         );
//                     });
//                 } else {
//                     await new Promise(resolve => {
//                         Alert.alert(
//                             `${label} Permission Needed`,
//                             `Please allow ${label} permission to continue.`,
//                             [
//                                 { text: 'Allow', onPress: async () => { status = await request(permission); resolve(); } },
//                             ],
//                             { cancelable: false }
//                         );
//                     });
//                 }

//                 try {
//                     status = await check(permission);
//                 } catch {
//                     console.warn(`[Permissions] Failed to recheck ${label}`);
//                     break;
//                 }
//             }

//             return status === RESULTS.GRANTED;
//         };

//         const locationPermission = Platform.select({
//             ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
//             android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
//             default: null,
//         });
//         await ensurePermission(locationPermission, 'Location');

//         Geolocation.getCurrentPosition(
//             async position => {
//                 const { latitude, longitude } = position.coords;
//                 await userDocRef.set(
//                     { location: { latitude, longitude }, lastLocationUpdatedAt: firestore.FieldValue.serverTimestamp() },
//                     { merge: true }
//                 );
//             },
//             () => Alert.alert('Location Error', 'Unable to fetch your current location.'),
//             { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
//         );

//         const contactsPermission = Platform.select({
//             ios: PERMISSIONS.IOS.CONTACTS,
//             android: PERMISSIONS.ANDROID.READ_CONTACTS,
//             default: null,
//         });
//         await ensurePermission(contactsPermission, 'Contacts');

//         if (Platform.OS === 'android') {
//             const authStatus = await messaging().requestPermission();
//             const enabled =
//                 authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//                 authStatus === messaging.AuthorizationStatus.PROVISIONAL;

//             if (!enabled) {
//                 Alert.alert(
//                     'Notifications Required',
//                     'Please enable notifications in Settings to receive updates.',
//                     [
//                         { text: 'Open Settings', onPress: () => openSettings() },
//                         { text: 'Retry', onPress: () => requestPermissionsAndSaveLocation() },
//                     ],
//                     { cancelable: false }
//                 );
//                 return;
//             }
//         } else {

//             const notificationPermission = PERMISSIONS.IOS.NOTIFICATIONS;
//             await ensurePermission(notificationPermission, 'Notifications');
//         }

//         const fcmToken = await messaging().getToken();
//         const savedTokens = userDoc.data()?.fcmTokens || [];
//         if (!savedTokens.includes(fcmToken)) {
//             await userDocRef.set(
//                 {
//                     fcmTokens: [...savedTokens, fcmToken],
//                     notificationPreferences: { ...preferences, push: true },
//                 },
//                 { merge: true }
//             );
//         }

//     } catch (error) {
//         console.error('Permission flow error:', error);
//         Alert.alert('Error', 'Failed to request permissions or save location.');
//     }
// };







import { Alert, Platform } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import Geolocation from 'react-native-geolocation-service';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';

/**
 * Utility function to wait for a specified duration.
 * @param {number} ms - Milliseconds to wait.
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const requestPermissionsAndSaveLocation = async () => {
    try {
        const currentUser = auth().currentUser;
        if (!currentUser) return;

        const userId = currentUser.uid;
        const userDocRef = firestore().collection('users').doc(userId);
        const userDoc = await userDocRef.get();
        const preferences = userDoc.exists ? userDoc.data().notificationPreferences || {} : {};

        /**
         * Ensures a permission is granted. Requests it, and if denied/blocked, explicitly
         * directs the user to open settings to enable it.
         * @param {string} permission - The permission key from react-native-permissions.
         * @param {string} label - A user-friendly name for the permission (e.g., 'Location').
         * @returns {Promise<boolean>} True if permission is granted, false otherwise.
         */
        const ensurePermission = async (permission, label) => {
            if (!permission) {
                console.warn(`[Permissions] Skipped ${label}: invalid permission key`);
                return false;
            }

            let status = await check(permission);

            // 1. Initial Request: If denied (or first time), request the permission.
            if (status === RESULTS.DENIED) {
                status = await request(permission);
            }

            // 2. Settings Prompt Loop: If still not granted after the first request, prompt for settings.
            if (status !== RESULTS.GRANTED) {
                console.log(`[Permissions] ${label} status: ${status}. Directing user to settings.`);

                await new Promise(resolve => {
                    Alert.alert(
                        `${label} Permission Required`,
                        `${label} is essential for this app. Please tap 'Open Settings' to enable it manually.`,
                        [
                            { text: 'Open Settings', onPress: () => { openSettings(); resolve(); } },
                            { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
                        ],
                        { cancelable: false }
                    );
                });

                await delay(500);
                status = await check(permission);
            }

            return status === RESULTS.GRANTED;
        };

        // ----------------------------------------------------
        // --- 1. Location Permission and Save (Mandatory) ---
        // ----------------------------------------------------
        const locationPermission = Platform.select({
            ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
            android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
            default: null,
        });

        const locationGranted = await ensurePermission(locationPermission, 'Location');

        if (locationGranted) {
            Geolocation.getCurrentPosition(
                async position => {
                    const { latitude, longitude } = position.coords;
                    await userDocRef.set(
                        { location: { latitude, longitude }, lastLocationUpdatedAt: firestore.FieldValue.serverTimestamp() },
                        { merge: true }
                    );
                },
                (error) => {
                    console.error('Geolocation Error:', error);
                    Alert.alert('Location Service Error', 'The device failed to fetch your exact location. Check your device location settings.');
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        } else {
            console.log('[Location] Permission was not granted.');
        }

        // ----------------------------------------------------
        // --- 2. Notifications Permission and FCM Token Save (Mandatory) ---
        // ----------------------------------------------------
        let notificationGranted = false;

        if (Platform.OS === 'android') {
            // Android 13 (API 33) and above requires the POST_NOTIFICATIONS runtime permission.
            if (Platform.Version >= 33) {
                const notificationPermission = PERMISSIONS.ANDROID.POST_NOTIFICATIONS;
                notificationGranted = await ensurePermission(notificationPermission, 'Notifications');
            } else {
                // Android < 13: Permission is assumed or granted on install.
                const authStatus = await messaging().requestPermission();
                notificationGranted =
                    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

                if (!notificationGranted) {
                    // Fallback alert for older Android versions if the messaging API somehow reports denial
                    await new Promise(resolve => {
                        Alert.alert(
                            'Notifications Required',
                            'Push notifications are essential for updates. Please enable them in your device settings.',
                            [
                                { text: 'Open Settings', onPress: () => { openSettings(); resolve(); } },
                                { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
                            ],
                            { cancelable: false }
                        );
                    });
                    // On older Android, if denied here, we cannot reliably re-check status.
                }
            }
        } else {
            // iOS: Uses the unified ensurePermission flow.
            const notificationPermission = PERMISSIONS.IOS.NOTIFICATIONS;
            notificationGranted = await ensurePermission(notificationPermission, 'Notifications');
        }

        if (notificationGranted) {
            try {
                const fcmToken = await messaging().getToken();

                await userDocRef.set(
                    {
                        fcmTokens: firestore.FieldValue.arrayUnion(fcmToken),
                        notificationPreferences: { ...preferences, push: true },
                    },
                    { merge: true }
                );
            } catch (e) {
                console.error("FCM Token retrieval failed:", e);
            }
        }

    } catch (error) {
        console.error('Overall Permission Flow Error:', error);
        Alert.alert('Critical Error', 'An unexpected error occurred during the setup process.');
    }
};