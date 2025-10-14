// src/screens/HomeScreen.jsx
import React, { useEffect } from "react";
import { StyleSheet, View, Image, useColorScheme, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Button } from "react-native-paper";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { checkSecurityStatus } from "../utils/developerMode"; 


export default function HomeScreen({ navigation }) {
    const scheme = useColorScheme();
    const isDark = scheme === "dark";

    const gradientColors = ["gray", "black", "red"];

    const features = [
        { icon: "check-circle", text: "Organize your tasks efficiently" },
        { icon: "notifications", text: "Set reminders & deadlines" },
        { icon: "security", text: "Secure & reliable" },
    ];

    // useEffect(() => {

       
    //     const checkAuth = async () => {
    //         const user = auth().currentUser;

    //         if (!user) {
    //             navigation.replace("login");
    //             return;
    //         }

    //         try {
    //             const doc = await firestore().collection("users").doc(user.uid).get();
    //             const role = doc.data()?.role;
                
    //             if (role === "admin") navigation.replace("admin");
    //             else if (role === "superadmin") navigation.replace("superAdmin");
    //             else if (role === 'user') navigation.replace("user")
    //             else navigation.replace("Home");
    //         } catch (error) {
    //             console.log("Error fetching user role:", error);
    //             navigation.replace("Home");
    //         }
    //     };

    //     checkAuth();

       
    // }, [navigation]);


    useEffect(() => {
        const runSecurityAndAuthChecks = async () => {
            // 🔒 First: check for Developer Mode or USB Debugging
            const insecure = await checkSecurityStatus();
            if (insecure) {
                // If found, show alert & stop further execution
                return;
            }

            // 🔐 Then: continue to authentication & role logic
            const user = auth().currentUser;

            if (!user) {
                navigation.replace("login");
                return;
            }

            try {
                const doc = await firestore().collection("users").doc(user.uid).get();
                const role = doc.data()?.role;

                if (role === "admin") navigation.replace("admin");
                else if (role === "superadmin") navigation.replace("superAdmin");
                else if (role === "user") navigation.replace("user");
                else navigation.replace("Home");
            } catch (error) {
                console.log("Error fetching user role:", error);
                navigation.replace("Home");
            }
        };

        runSecurityAndAuthChecks();
    }, [navigation]);


    return (

            <LinearGradient colors={gradientColors} style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {/* Logo & Title */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={require("../../assets/logo.png")}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={[styles.title, { color: isDark ? "#fff" : "#005BAC" }]}>
                            StarShield
                        </Text>
                        <Text style={[styles.subtitle, { color: isDark ? "#BBBBBB" : "#88C540" }]}>
                            Task Manager App
                        </Text>
                    </View>

                    {/* Welcome Text */}
                    <View style={styles.welcomeContainer}>
                        <Text style={[styles.headline, { color: isDark ? "#fff" : "#222" }]}>
                            Welcome to Task Manager App
                        </Text>
                        <Text style={[styles.description, { color: isDark ? "#CCCCCC" : "#555" }]}>
                            “Work smarter, stay organized, and get things done—together.”
                        </Text>
                        <Text style={[styles.description, { color: isDark ? "#CCCCCC" : "#555" }]}>
                            All Your Tasks, One Place
                        </Text>
                    </View>

                    {/* Features */}
                    <View style={styles.featuresContainer}>
                        {features.map((item, idx) => (
                            <View key={idx} style={styles.featureRow}>
                                <MaterialIcons
                                    name={item.icon}
                                    size={24}
                                    color={isDark ? "#88C540" : "#005BAC"}
                                    style={{ marginRight: 10 }}
                                />
                                <Text style={{ color: isDark ? "#fff" : "#222", fontSize: 16 }}>
                                    {item.text}
                                </Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </LinearGradient>
   
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContainer: { padding: 20, paddingBottom: 50 },
    logoContainer: { alignItems: "center", marginBottom: 20 },
    logo: { width: 120, height: 120, borderRadius: 30, marginBottom: 15 },
    title: { fontSize: 28, fontWeight: "bold" },
    subtitle: { fontSize: 18 },
    welcomeContainer: { marginVertical: 20 },
    headline: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
    description: { fontSize: 16, marginBottom: 5 },
    featuresContainer: { marginVertical: 20 },
    featureRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    buttonsContainer: { marginTop: 10 },
});
