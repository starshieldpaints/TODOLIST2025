// ThemeContext.js
import React, { createContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { LightTheme, DarkTheme } from '../utils/theme';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
    const [theme, setTheme] = useState(LightTheme);

    useEffect(() => {
        const colorScheme = Appearance.getColorScheme();
        if (themeMode === 'system') {
            setTheme(colorScheme === 'dark' ? DarkTheme : LightTheme);
        } else if (themeMode === 'dark') {
            setTheme(DarkTheme);
        } else {
            setTheme(LightTheme);
        }

        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            if (themeMode === 'system') {
                setTheme(colorScheme === 'dark' ? DarkTheme : LightTheme);
            }
        });
        return () => subscription.remove();
    }, [themeMode]);

    const toggleTheme = () => {
        setThemeMode(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
