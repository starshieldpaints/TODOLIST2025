import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

export default function usePushNotifications() {
    useEffect(() => {

        messaging().requestPermission();

        const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
            console.log('Foreground notification:', remoteMessage);

            await notifee.displayNotification({
                title: remoteMessage.notification?.title || remoteMessage.data?.title,
                body: remoteMessage.notification?.body || remoteMessage.data?.body,
                android: { channelId: 'default' },
            });
        });

        const unsubscribeBackgroundOpen = messaging().onNotificationOpenedApp(remoteMessage => {
            console.log('App opened from background notification:', remoteMessage);

        });

        messaging().getInitialNotification().then(remoteMessage => {
            if (remoteMessage) {
                console.log('App opened from quit notification:', remoteMessage);

            }
        });

        return () => {
            unsubscribeForeground();
            unsubscribeBackgroundOpen();
        };
    }, []);
}