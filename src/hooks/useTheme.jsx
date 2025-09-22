import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

export const useTheme = () => {
    const { theme } = useContext(ThemeContext);
    return theme;
};
