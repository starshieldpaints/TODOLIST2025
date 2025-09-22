import React, { useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    ActivityIndicator,
    useColorScheme,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";

export default function SplashScreen() {
    const navigation = useNavigation();
    const scheme = useColorScheme(); // 'light' or 'dark'

    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.replace("Home"); // navigate after splash
        }, 2500);

        return () => clearTimeout(timer);
    }, [navigation]);

    const isDark = scheme === "dark";

    return (
        <LinearGradient
            colors={
                isDark
                    ? ["#000000", "#005BAC"] // Dark mode gradient
                    : ["#FFFFFF", "#88C540"] // Light mode gradient
            }
            style={styles.container}
        >
            {/* Company Logo */}
            <Image
                source={require("../../assests/logo.png")}
                style={styles.logo}
                resizeMode="contain"
            />

            {/* App Name */}
            <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#005BAC" }]}>
                StarShield
            </Text>
            <Text
                style={[
                    styles.subtitle,
                    { color: isDark ? "#BBBBBB" : "#333333" },
                ]}
            >
                Task Manager
            </Text>

            {/* Loading Spinner */}
            <ActivityIndicator
                size="large"
                color={isDark ? "#88C540" : "#005BAC"}
                style={{ marginTop: 30 }}
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 20,
        borderRadius: 30,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 5,
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 10,
    },
});
