import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';

export default function App() {
  const [firebaseStatus, setFirebaseStatus] = useState('checking'); // 'checking', 'success', 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    try {
      const appName = auth().app.name;
      console.log('Firebase initialized:', appName);
      setFirebaseStatus('success');
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      setErrorMsg(error.message);
      setFirebaseStatus('error');
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Task Manager App</Text>

      {firebaseStatus === 'checking' && (
        <>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.text}>Checking Firebase...</Text>
        </>
      )}

      {firebaseStatus === 'success' && (
        <Text style={[styles.text, styles.success]}>
          ✅ Firebase is working! App: {auth().app.name}
        </Text>
      )}

      {firebaseStatus === 'error' && (
        <Text style={[styles.text, styles.error]}>
          ❌ Firebase failed to initialize. {errorMsg}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  text: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  success: {
    color: 'green',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    fontWeight: 'bold',
  },
});
