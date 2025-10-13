import { Platform } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';

export async function createDefaultChannel() {
    if (Platform.OS === 'android') {
        await notifee.createChannel({
            id: 'default',
            name: 'Default Channel',
            importance: AndroidImportance.HIGH,
        });
    }
}
