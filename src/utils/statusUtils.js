// src/utils/statusUtils.js
import { useCallback } from 'react';

/**
 * Custom hook that returns a memoized function to get the color for a task status.
 */
export const useStatusColor = () => {
    // This returns the actual color function
    return useCallback((status) => {
        switch (status) {
            case 'pending': return '#f1c40f';
            case 'inprogress': return '#2980b9';
            case 'completed': return '#27ae60';
            case 'rejected': return '#e74c3c';
            default: return '#999';
        }
    }, []);
};