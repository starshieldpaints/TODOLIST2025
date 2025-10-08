import { Alert, Platform } from "react-native";
import { request, PERMISSIONS, RESULTS } from "react-native-permissions";
import messaging from "@react-native-firebase/messaging";

export const requestAllPermissions = async () => {
    const results = {
        location: false,
        contacts: false,
        notifications: false,
        fcmToken: null,
    };

    try {
        const locationPermission = Platform.select({
            ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
            android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        });
        const locationStatus = await request(locationPermission);
        results.location = locationStatus === RESULTS.GRANTED;
        if (!results.location)
            Alert.alert(
                "Location Permission Denied",
                "Location access is required to show nearby tasks."
            );
        const contactsPermission = Platform.select({
            ios: PERMISSIONS.IOS.CONTACTS,
            android: PERMISSIONS.ANDROID.READ_CONTACTS,
        });
        const contactsStatus = await request(contactsPermission);
        results.contacts = contactsStatus === RESULTS.GRANTED;
        if (!results.contacts)
            Alert.alert(
                "Contacts Permission Denied",
                "Contacts access is required to assign tasks."
            );

        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        results.notifications = enabled;
        if (enabled) results.fcmToken = await messaging().getToken();
        else
            Alert.alert(
                "Notifications Disabled",
                "You can enable notifications in settings later."
            );
    } catch (error) {
        console.error("Permission request error:", error);
    }

    return results;
};
