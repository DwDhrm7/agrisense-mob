import { useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { LIGHT_COLORS, DARK_COLORS } from './config';

export let isDarkModeGlobal = Appearance.getColorScheme() === 'dark';
const listeners = new Set<() => void>();

export const setGlobalTheme = (isDark: boolean) => {
    isDarkModeGlobal = isDark;
    listeners.forEach(l => l());
};

export const useTheme = () => {
    const [isDark, setIsDark] = useState(isDarkModeGlobal);
    
    useEffect(() => {
        const handler = () => setIsDark(isDarkModeGlobal);
        listeners.add(handler);
        return () => { listeners.delete(handler); }
    }, []);
    
    const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
    return { ...colors, isDark };
};
