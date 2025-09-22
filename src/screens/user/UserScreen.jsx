// AppTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TasksScreen from './TaskScreen';
import DashboardScreen from './DashboardScreen';
import ProfileScreen from './ProfileScreen';
import { useTheme } from '../../hooks/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';


const Tab = createBottomTabNavigator();

const UserScreen = () => {
    const theme = useTheme();

    return (
  
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,      
                tabBarInactiveTintColor: theme.colors.text,      
                tabBarStyle: { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border },
            }}
        >
            <Tab.Screen
                name="Tasks"
                component={TasksScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Icon name="checkmark-done-outline" color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Icon name="grid-outline" color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Icon name="person-outline" color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
   
    );
};

export default UserScreen;




