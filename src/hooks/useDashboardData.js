// import { useState, useEffect, useCallback, useMemo } from 'react';
// import firestore from '@react-native-firebase/firestore';

// // Helper function for debouncing state updates
// const debounce = (func, delay) => {
//     let timeout;
//     return (...args) => {
//         clearTimeout(timeout);
//         timeout = setTimeout(() => func.apply(this, args), delay);
//     };
// };

// /**
//  * Custom hook to manage all dashboard data fetching and processing,
//  * including fetching details for users referenced in tasks but not yet loaded.
//  */
// export const useDashboardData = () => {
//     const [admins, setAdmins] = useState([]);
//     const [users, setUsers] = useState([]);
//     const [tasks, setTasks] = useState([]);
//     const [usersMap, setUsersMap] = useState({});
//     const [isUsersMapReady, setIsUsersMapReady] = useState(false);

//     // State to track if the hook component is mounted
//     const [isMounted, setIsMounted] = useState(true);

//     // Debounce the state setters to prevent rapid re-renders
//     const setAdminsDebounced = useMemo(() => debounce(setAdmins, 100), []);
//     const setUsersDebounced = useMemo(() => debounce(setUsers, 100), []);
//     const setTasksDebounced = useMemo(() => debounce(setTasks, 100), []);

//     // 1. Lifecycle check (set isMounted to false on unmount)
//     useEffect(() => {
//         setIsMounted(true);
//         return () => setIsMounted(false);
//     }, []);

//     // 2. Fetch Admins and Users (Filtered by role)
//     useEffect(() => {
//         // Fetch Admin users
//         const unsubscribeAdmins = firestore()
//             .collection('users')
//             .where('role', 'in', ['admin'])
//             .onSnapshot(snapshot => {
//                 setAdminsDebounced(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
//             });

//         // Fetch General users
//         const unsubscribeUsers = firestore()
//             .collection('users')
//             .where('role', '==', 'user')
//             .onSnapshot(snapshot => {
//                 setUsersDebounced(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
//             });

//         return () => {
//             unsubscribeAdmins();
//             unsubscribeUsers();
//         };
//     }, [setAdminsDebounced, setUsersDebounced]);

//     // 3. Fetch Tasks
//     useEffect(() => {
//         const unsubscribe = firestore()
//             .collection('tasks')
//             .onSnapshot(snapshot => {
//                 setTasksDebounced(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
//             });
//         return unsubscribe;
//     }, [setTasksDebounced]);

//     // 4. Create initial UID → user map (Memoized for stability)
//     const memoizedUsersMap = useMemo(() => {
//         const map = {};
//         [...admins, ...users].forEach(u => {
//             const idKey = u.uid || u.id;
//             if (idKey) {
//                 map[String(idKey).trim()] = u;
//             }
//         });
//         return map;
//     }, [admins, users]);

//     useEffect(() => {
//         // We set the actual state after the memoization
//         setUsersMap(memoizedUsersMap);
//         setIsUsersMapReady(true);
//     }, [memoizedUsersMap]);


//     // 5. Dedicated Fetch for Missing User IDs found in tasks
//     useEffect(() => {
//         // Use memoizedUsersMap directly for up-to-date check
//         if (!tasks.length || !isUsersMapReady) return;

//         const referencedIds = new Set();
//         tasks.forEach(task => {
//             if (task.assignedTo) referencedIds.add(String(task.assignedTo).trim());
//             if (task.assignedBy) referencedIds.add(String(task.assignedBy).trim());
//         });

//         const missingIds = Array.from(referencedIds).filter(id => !memoizedUsersMap[id]);

//         if (missingIds.length > 0) {
//             const batches = [];
//             for (let i = 0; i < missingIds.length; i += 10) {
//                 batches.push(missingIds.slice(i, i + 10));
//             }

//             batches.forEach(batch => {
//                 firestore()
//                     .collection('users')
//                     .where(firestore.FieldPath.documentId(), 'in', batch)
//                     .get()
//                     .then(snapshot => {
//                         // CRITICAL CHECK: Only update state if the component is still mounted
//                         if (!isMounted) return;

//                         const newUsers = {};
//                         snapshot.docs.forEach(doc => {
//                             const fetchedUser = { uid: doc.id, ...doc.data() };
//                             newUsers[doc.id] = fetchedUser;
//                         });
//                         setUsersMap(prevMap => ({ ...prevMap, ...newUsers }));
//                     })
//                     .catch(error => {
//                         console.error("Error fetching missing users:", error);
//                     });
//             });
//         }
//     }, [tasks, isUsersMapReady, memoizedUsersMap, isMounted]); // Added isMounted to dependencies

//     // 6. Helper function to determine the best display label
//     const getUserLabel = useCallback(uid => {
//         const cleanUid = String(uid).trim();
//         const user = usersMap[cleanUid];

//         if (!user) {
//             return `Unknown User (ID: ${cleanUid.substring(0, 8)}...)`;
//         }

//         let identifier = null;
//         if (user.phone) {
//             identifier = `+${String(user.phone).replace(/\D/g, '')}`;
//         } else if (user.email) {
//             identifier = user.email;
//         }

//         if (user.name) {
//             return identifier ? `${user.name} (${identifier})` : user.name;
//         }
//         if (identifier) {
//             return identifier;
//         }

//         return `Missing User Data (ID: ${cleanUid})`;
//     }, [usersMap]);


//     // 7. Derived State: Task statistics (MEMOIZED)
//     const taskStats = useMemo(() => {
//         return {
//             pending: tasks.filter(t => t.status === 'pending'),
//             inprogress: tasks.filter(t => t.status === 'inprogress'),
//             completed: tasks.filter(t => t.status === 'completed'),
//             rejected: tasks.filter(t => t.status === 'rejected'),
//         };
//     }, [tasks]);


//     return { admins, users, tasks, usersMap, taskStats, getUserLabel, isUsersMapReady };
// };























import { useState, useEffect, useCallback, useMemo } from 'react';
import firestore from '@react-native-firebase/firestore';

// Helper function for debouncing state updates (kept as is)
const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
};

/**
 * Custom hook to manage all dashboard data fetching and processing,
 * including fetching details for users referenced in tasks but not yet loaded.
 */
export const useDashboardData = () => {
    const [admins, setAdmins] = useState([]);
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [usersMap, setUsersMap] = useState({});
    const [isUsersMapReady, setIsUsersMapReady] = useState(false);

    const [isMounted, setIsMounted] = useState(true);

    const setAdminsDebounced = useMemo(() => debounce(setAdmins, 100), []);
    const setUsersDebounced = useMemo(() => debounce(setUsers, 100), []);
    const setTasksDebounced = useMemo(() => debounce(setTasks, 100), []);

    // 1. Lifecycle check
    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    // 2. Fetch Admins and Users (Fixed user ID mapping)
    useEffect(() => {
        // Function to map document data, ensuring 'uid' is a trimmed string
        const mapDocToUser = (doc) => ({
            // 💡 FIX 1: Explicitly map doc.id to 'uid' and ensure it's a trimmed string
            uid: String(doc.id).trim(),
            ...doc.data()
        });

        const unsubscribeAdmins = firestore()
            .collection('users')
            .where('role', 'in', ['admin'])
            .onSnapshot(snapshot => {
                setAdminsDebounced(snapshot.docs.map(mapDocToUser));
            });

        const unsubscribeUsers = firestore()
            .collection('users')
            .where('role', '==', 'user')
            .onSnapshot(snapshot => {
                setUsersDebounced(snapshot.docs.map(mapDocToUser));
            });

        return () => {
            unsubscribeAdmins();
            unsubscribeUsers();
        };
    }, [setAdminsDebounced, setUsersDebounced]);

    // 3. Fetch Tasks (Kept as is, assuming assignedTo/By are strings)
    useEffect(() => {
        const unsubscribe = firestore()
            .collection('tasks')
            .onSnapshot(snapshot => {
                setTasksDebounced(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
        return unsubscribe;
    }, [setTasksDebounced]);

    // 4. Create initial UID → user map (Fixed map key generation)
    const memoizedUsersMap = useMemo(() => {
        const map = {};
        [...admins, ...users].forEach(u => {
            const idKey = u.uid || u.id; // u.uid should now be reliable from FIX 1
            if (idKey) {
                // 💡 FIX 2: Use the clean, trimmed ID as the map key
                map[String(idKey).trim()] = u;
            }
        });
        return map;
    }, [admins, users]);

    useEffect(() => {
        setUsersMap(memoizedUsersMap);
        setIsUsersMapReady(true);
    }, [memoizedUsersMap]);


    // 5. Dedicated Fetch for Missing User IDs found in tasks (Fixed missing user update)
    useEffect(() => {
        if (!tasks.length || !isUsersMapReady) return;

        const referencedIds = new Set();
        tasks.forEach(task => {
            // Ensure task IDs are cleaned before checking/fetching
            if (task.assignedTo) referencedIds.add(String(task.assignedTo).trim());
            if (task.assignedBy) referencedIds.add(String(task.assignedBy).trim());
        });

        const missingIds = Array.from(referencedIds).filter(id => !memoizedUsersMap[id]);

        if (missingIds.length > 0) {
            // ... (batch logic for fetching missing IDs is correct) ...
            const batches = [];
            for (let i = 0; i < missingIds.length; i += 10) {
                batches.push(missingIds.slice(i, i + 10));
            }

            batches.forEach(batch => {
                firestore()
                    .collection('users')
                    .where(firestore.FieldPath.documentId(), 'in', batch)
                    .get()
                    .then(snapshot => {
                        if (!isMounted) return;

                        const newUsers = {};
                        snapshot.docs.forEach(doc => {
                            // 💡 FIX 3: Ensure the fetched user object also has a clean 'uid'
                            const cleanUid = String(doc.id).trim();
                            const fetchedUser = { uid: cleanUid, ...doc.data() };

                            // Key in newUsers is the clean UID/doc.id
                            newUsers[cleanUid] = fetchedUser;
                        });
                        setUsersMap(prevMap => ({ ...prevMap, ...newUsers }));
                    })
                    .catch(error => {
                        console.error("Error fetching missing users:", error);
                    });
            });
        }
    }, [tasks, isUsersMapReady, memoizedUsersMap, isMounted]);

    // 6. Helper function to determine the best display label (Kept as is, relies on fixes 1, 2, 3)
    const getUserLabel = useCallback(uid => {
        // cleanUid will match the key in usersMap (which is the document ID string)
        const cleanUid = String(uid).trim();
        const user = usersMap[cleanUid];

        if (!user) {
            // This case should now rarely happen for valid IDs
            return `Unknown User (ID: ${cleanUid.substring(0, 8)}...)`;
        }

        let identifier = null;
        if (user.phone) {
            identifier = `+${String(user.phone).replace(/\D/g, '')}`;
        } else if (user.email) {
            identifier = user.email;
        }

        if (user.name) {
            return identifier ? `${user.name} (${identifier})` : user.name;
        }
        if (identifier) {
            return identifier;
        }

        return `Missing User Data (ID: ${cleanUid})`;
    }, [usersMap]);


    // ... (taskStats and return statement are unchanged) ...
    const taskStats = useMemo(() => {
        return {
            pending: tasks.filter(t => t.status === 'pending'),
            inprogress: tasks.filter(t => t.status === 'inprogress'),
            completed: tasks.filter(t => t.status === 'completed'),
            rejected: tasks.filter(t => t.status === 'rejected'),
        };
    }, [tasks]);


    return { admins, users, tasks, usersMap, taskStats, getUserLabel, isUsersMapReady };
};