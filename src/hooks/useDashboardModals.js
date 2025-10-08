import { useState } from 'react';

/**
 * Custom hook to manage modal state for the dashboard.
 */
export const useDashboardModals = () => {
    const [selectedModal, setSelectedModal] = useState(null);
    const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);
    const [selectedUserDetail, setSelectedUserDetail] = useState(null);

    return {
        selectedModal, setSelectedModal,
        selectedTaskDetail, setSelectedTaskDetail,
        selectedUserDetail, setSelectedUserDetail
    };
};