// AdminTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TasksScreen from './TasksScreen';
import DashboardScreen from './DashboardScreen';
import AssignScreen from './AssignScreen';
import ProfileScreen from '../user/ProfileScreen';
import { useTheme } from '../../hooks/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

// Helper function to generate tab icons
const getTabIcon = (iconName) => ({ color, size }) => (
  <Icon name={iconName} color={color} size={size} />
);

const AdminTabs = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        tabBarStyle: { backgroundColor: theme.colors.card},
      }}
    >
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarIcon: getTabIcon('checkmark-done-outline'),
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: getTabIcon('grid-outline'),
        }}
      />
      <Tab.Screen
        name="Assign"
        component={AssignScreen}
        options={{
          tabBarIcon: getTabIcon('clipboard-outline'),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: getTabIcon('person-outline'),
        }}
      />
    </Tab.Navigator>
  );
};

export default AdminTabs;
