
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DashboardScreen from './DashboardScreen';
import ManageAdminScreen from './ManageAdminScreen';
import ManageUserScreen from './ManageUserScreen';
import ProfileScreen from '../user/ProfileScreen';
import { ThemeContext } from '../../context/ThemeContext';

const Tab = createBottomTabNavigator();

const SuperAdminTabs = () => {
  const { theme } = React.useContext(ThemeContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          height: 70,
          paddingTop: 0,
          paddingBottom: 5,
        },
        tabBarSafeAreaInsets: { top: 0 },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = 'grid-outline';
          else if (route.name === 'ManageAdmin') iconName = 'people-outline';
          else if (route.name === 'ManageUser') iconName = 'person-add-outline';
          else if (route.name === 'Profile') iconName = 'person-circle-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="ManageAdmin" component={ManageAdminScreen} options={{ title: 'Admins' }} />
      <Tab.Screen name="ManageUser" component={ManageUserScreen} options={{ title: 'Users' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};


export default SuperAdminTabs;
