import notifee from '@notifee/react-native';

export async function createDefaultChannel() {
    await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: notifee.AndroidImportance.HIGH, // Must be HIGH to show in tray
    });
}
