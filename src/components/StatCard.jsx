import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { styles } from '../screens/DashboardScreen/DashboardStyles'; // Import styles

const StatCard = ({ title, value, iconName, bgColor, scale, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        style={[styles.statCard, { backgroundColor: bgColor, padding: 16 * scale, borderRadius: 12 * scale }]}
    >
        <Ionicons name={iconName} size={28 * scale} color="#fff" />
        <Text style={[styles.statTitle, { fontSize: 14 * scale }]}>{title}</Text>
        <Text style={[styles.statValue, { fontSize: 18 * scale }]}>{Array.isArray(value) ? value.length : value}</Text>
    </TouchableOpacity>
);

export default StatCard;