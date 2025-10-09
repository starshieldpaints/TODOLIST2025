// import { useEffect } from 'react';
// import messaging from '@react-native-firebase/messaging';
// import { Alert } from 'react-native';
// import notifee from '@notifee/react-native';

// export default function usePushNotifications() {
//     useEffect(() => {
//         messaging().requestPermission();

//         const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
//             console.log('Foreground notification:', remoteMessage);

//             // Show local notification in foreground
//             await notifee.displayNotification({
//                 title: remoteMessage.notification?.title,
//                 body: remoteMessage.notification?.body,
//                 android: { channelId: 'default' },
//             });

//             // Optional: you can show a simple alert too
//             // Alert.alert(remoteMessage.notification?.title, remoteMessage.notification?.body);
//         });

//         // Background & quit state notifications
//         messaging().onNotificationOpenedApp(remoteMessage => {
//             console.log('Notification opened from background or quit:', remoteMessage);
//             // Just open the app, no navigation
//         });

//         messaging().getInitialNotification().then(remoteMessage => {
//             if (remoteMessage) {
//                 console.log('App opened from quit state by notification:', remoteMessage);
//                 // Just open the app, no navigation
//             }
//         });

//         return () => {
//             unsubscribeForeground();
//         };
//     }, []);
// }






// src/hooks/usePushNotifications.js
import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

export default function usePushNotifications() {
    useEffect(() => {
        // Ask for permissions
        messaging().requestPermission();

        // Foreground notifications
        const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
            console.log('Foreground notification:', remoteMessage);

            await notifee.displayNotification({
                title: remoteMessage.notification?.title || remoteMessage.data?.title,
                body: remoteMessage.notification?.body || remoteMessage.data?.body,
                android: { channelId: 'default' },
            });
        });

        // Handle when app opened from background
        const unsubscribeBackgroundOpen = messaging().onNotificationOpenedApp(remoteMessage => {
            console.log('App opened from background notification:', remoteMessage);
            // TODO: navigate user if needed
        });

        // Handle when app opened from quit state
        messaging().getInitialNotification().then(remoteMessage => {
            if (remoteMessage) {
                console.log('App opened from quit notification:', remoteMessage);
                // TODO: navigate user if needed
            }
        });

        return () => {
            unsubscribeForeground();
            unsubscribeBackgroundOpen();
        };
    }, []);
}
