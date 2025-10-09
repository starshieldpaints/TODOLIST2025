import React from 'react';
import {
    NativeModules,
    Alert,
    BackHandler,
    AppState,
    PermissionsAndroid,
    Platform,
    Linking,
} from 'react-native';

const { DeveloperMode } = NativeModules;

export async function checkSecurityStatus() {
    if (Platform.OS !== 'android') return false;

    try {
        // 🧭 Ask for location permission (optional, helps mock detection)
        try {
            await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
        } catch {
            // ignore if denied
        }

        const [devMode, usbDebugging, mockLocation] = await Promise.all([
            DeveloperMode.isDeveloperModeEnabled(),
            DeveloperMode.isUSBDebuggingEnabled(),
            DeveloperMode.isMockLocationEnabled(),
        ]);

        if (devMode || usbDebugging || mockLocation) {
            let reason = devMode
                ? 'Developer options are enabled.'
                : usbDebugging
                    ? 'USB debugging is active.'
                    : 'Mock location detected.';

            Alert.alert(
                'Security Alert 🚫',
                `${reason}\n\nPlease disable this setting to continue.`,
                [
                    {
                        text: 'Open Settings',
                        onPress: () => {
                            try {
                                DeveloperMode.openDeveloperSettings();
                            } catch {
                                // fallback to system settings if native call fails
                                Linking.openSettings();
                            }
                        },
                    },
                    {
                        text: 'Exit App',
                        onPress: () => BackHandler.exitApp(),
                        style: 'destructive',
                    },
                ],
                { cancelable: false }
            );

            return true;
        }

        return false;
    } catch (error) {
        console.warn('Error checking developer mode:', error);
        return false;
    }
}

export function useEnforceDevModeBlock() {
    React.useEffect(() => {
        // Check immediately on start
        checkSecurityStatus();

        // Recheck whenever app returns to foreground
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') checkSecurityStatus();
        });

        return () => sub.remove();
    }, []);
}
