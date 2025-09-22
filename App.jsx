import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "./src/screens/HomeScreen";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from "./src/screens/SplashScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
import PhoneAuthScreen from "./src/screens/auth/PhoneScreen";
import VerificationScreen from "./src/screens/auth/VerificationScreen";
import UserScreen from "./src/screens/user/UserScreen";
import AdminScreen from "./src/screens/admin/AdminScreen";
import SuperAdminScreen from "./src/screens/superAdmin/SuperAdminScreen";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, ThemeContext } from './src/context/ThemeContext';
import { Provider as PaperProvider } from 'react-native-paper';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
      <ThemeProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="login" component={LoginScreen} />
            <Stack.Screen name="register" component={RegisterScreen} />
            <Stack.Screen name="phoneAuth" component={PhoneAuthScreen} />
            <Stack.Screen name="verification" component={VerificationScreen} />
            <Stack.Screen name="user" component={UserScreen} />
            <Stack.Screen name="admin" component={AdminScreen} />
            <Stack.Screen name="superAdmin" component={SuperAdminScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

