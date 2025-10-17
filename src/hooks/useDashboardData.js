import { useState, useEffect, useCallback, useMemo } from 'react';
import firestore from '@react-native-firebase/firestore';

const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
};

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

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    useEffect(() => {

        const mapDocToUser = (doc) => ({

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

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('tasks')
            .onSnapshot(snapshot => {
                setTasksDebounced(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
        return unsubscribe;
    }, [setTasksDebounced]);

    const memoizedUsersMap = useMemo(() => {
        const map = {};
        [...admins, ...users].forEach(u => {
            const idKey = u.uid || u.id;
            if (idKey) {

                map[String(idKey).trim()] = u;
            }
        });
        return map;
    }, [admins, users]);

    useEffect(() => {
        setUsersMap(memoizedUsersMap);
        setIsUsersMapReady(true);
    }, [memoizedUsersMap]);

    useEffect(() => {
        if (!tasks.length || !isUsersMapReady) return;

        const referencedIds = new Set();
        tasks.forEach(task => {

            if (task.assignedTo) referencedIds.add(String(task.assignedTo).trim());
            if (task.assignedBy) referencedIds.add(String(task.assignedBy).trim());
        });

        const missingIds = Array.from(referencedIds).filter(id => !memoizedUsersMap[id]);

        if (missingIds.length > 0) {

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

                            const cleanUid = String(doc.id).trim();
                            const fetchedUser = { uid: cleanUid, ...doc.data() };

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

    const getUserLabel = useCallback(uid => {

        const cleanUid = String(uid).trim();
        const user = usersMap[cleanUid];

        if (!user) {

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