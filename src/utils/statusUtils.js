import { useCallback } from 'react';

export const useStatusColor = () => {

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