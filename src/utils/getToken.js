import messaging from "@react-native-firebase/messaging";
import fireStore from "@react-native-firebase/firestore";


const getFcmToken = async (uid) =>{
    const authStatus = await messaging().requestPermission();
    if(authStatus){
        const fcmToken = await messaging().getToken();
        if(fcmToken){
            await fireStore().collection('user').doc(uid).update({fcmToken})
        }
    }
}