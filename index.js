// /**
//  * @format
//  */

// import { AppRegistry } from 'react-native';
// import App from './App';
// import { name as appName } from './app.json';

// AppRegistry.registerComponent("TaskManagerApp", () => App);



/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';


messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background notification received:', remoteMessage);
    await notifee.displayNotification({
        title: remoteMessage.notification?.title || remoteMessage.data?.title,
        body: remoteMessage.notification?.body || remoteMessage.data?.body,
        android: {
            channelId: 'default', 
            smallIcon: 'ic_launcher',
        },

    });
});
AppRegistry.registerComponent(appName, () => App);
