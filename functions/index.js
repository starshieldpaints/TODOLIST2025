/* eslint-disable arrow-parens */
/* eslint-disable eol-last */
/* eslint-disable comma-dangle */
/* eslint-disable max-len */
/* eslint-disable object-curly-spacing */
// /* eslint-disable max-len */
// const {onDocumentCreated} = require("firebase-functions/v2/firestore");
// const {getMessaging} = require("firebase-admin/messaging");
// const admin = require("firebase-admin");

// admin.initializeApp();

// // Firestore trigger: when a new task is created
// exports.notifyUserOnTask = onDocumentCreated("tasks/{taskId}", async (event) => {
//   const snapshot = event.data;
//   if (!snapshot) {
//     console.log("No data in snapshot");
//     return;
//   }

//   const taskData = snapshot.data();
//   const assignedTo = taskData.assignedTo;

//   if (!assignedTo) {
//     console.log("Task has no assigned user");
//     return;
//   }

//   try {
//     // Get the user's FCM tokens from Firestore
//     const userDocRef = admin.firestore().collection("users").doc(assignedTo);
//     const userDoc = await userDocRef.get();
//     if (!userDoc.exists) {
//       console.log(`User ${assignedTo} does not exist`);
//       return;
//     }

//     const userData = userDoc.data();
//     let tokens = userData.fcmTokens || [];

//     if (tokens.length === 0) {
//       console.log("No FCM tokens for this user, skipping notification");
//       return;
//     }

//     const payload = {
//       notification: {
//         title: "New Task Assigned",
//         body: `You have been assigned a new task: ${taskData.title}`,
//       },
//       data: {
//         taskId: taskData.taskId || "",
//       },
//       apns: {
//         payload: {
//           aps: {
//             sound: "default",
//           },
//         },
//       },
//     };

//     // Send notification
//     const response = await getMessaging().sendToDevice(tokens, payload);
//     console.log("Notification response:", response);

//     // Cleanup invalid tokens
//     const failedTokens = [];
//     response.responses.forEach((res, idx) => {
//       if (!res.success) {
//         const errorCode = res.error.code;
//         if (
//           errorCode === "messaging/registration-token-not-registered" ||
//           errorCode === "messaging/invalid-argument"
//         ) {
//           failedTokens.push(tokens[idx]);
//         }
//       }
//     });

//     if (failedTokens.length > 0) {
//       console.log("Cleaning up invalid tokens:", failedTokens);
//       tokens = tokens.filter((token) => !failedTokens.includes(token));
//       await userDocRef.update({fcmTokens: tokens});
//     }
//   } catch (error) {
//     console.error("Error sending notification:", error);
//   }
// });

/* eslint-disable max-len */
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const firestore = admin.firestore();

/**
 * Firestore trigger: send notification when a new task is created
 */
exports.notifyUserOnTask = onDocumentCreated("tasks/{taskId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data in snapshot");
    return;
  }

  const taskData = snapshot.data();
  const assignedTo = taskData.assignedTo;

  if (!assignedTo) {
    console.log("Task has no assigned user");
    return;
  }

  try {
    const userDocRef = firestore.collection("users").doc(assignedTo);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      console.log(`User ${assignedTo} does not exist`);
      return;
    }

    const userData = userDoc.data();
    let tokens = userData.fcmTokens || [];

    if (tokens.length === 0) {
      console.log("No FCM tokens for this user, skipping notification");
      return;
    }

    const messages = tokens.map((token) => ({
      token,
      notification: {
        title: "New Task Assigned",
        body: `You have been assigned a new task: ${taskData.title}`,
      },
      apns: {
        payload: { aps: { sound: "default" } },
      },
    }));

    // Use sendEach to send notifications to all tokens individually
    const response = await admin.messaging().sendEach(messages);
    console.log("Notification responses:", response);

    // Cleanup invalid tokens
    const failedTokens = [];
    response.forEach((res, idx) => {
      if (!res.success) {
        const errorCode = res.error?.code;
        if (
          errorCode === "messaging/registration-token-not-registered" ||
          errorCode === "messaging/invalid-argument"
        ) {
          failedTokens.push(tokens[idx]);
        }
      }
    });

    if (failedTokens.length > 0) {
      tokens = tokens.filter((t) => !failedTokens.includes(t));
      await userDocRef.update({ fcmTokens: tokens });
      console.log("Removed invalid tokens:", failedTokens);
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
});

/**
 * Manual test notification
 * Trigger this via HTTPS to send a test notification to your device
 */
exports.sendTestNotification = functions.https.onRequest(async (req, res) => {
  try {
    const userDoc = await firestore.collection("users").doc("zNNvbTcn4BalN3gAKe02QVcR88L2").get();
    if (!userDoc.exists) {
      return res.status(404).send("User not found");
    }

    const userData = userDoc.data();
    const tokens = userData.fcmTokens || [];

    if (tokens.length === 0) {
      return res.status(400).send("No FCM tokens for this user");
    }

    const messages = tokens.map((token) => ({
      token,
      notification: {
        title: "Test Notification",
        body: "Hello! This is a test push notification.",
      },
    }));

    const response = await admin.messaging().sendEach(messages);
    console.log("FCM responses:", response);

    res.send("Test notification sent successfully!");
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).send("Error sending test notification");
  }
});
