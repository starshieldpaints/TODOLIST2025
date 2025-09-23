/* eslint-disable max-len */
// Import the v2 Firebase Functions API
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {getMessaging} = require("firebase-admin/messaging");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp();

// Firestore trigger: when a new task is created
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
    // Get the user's FCM tokens from Firestore
    const userDoc = await admin.firestore().collection("users").doc(assignedTo).get();
    if (!userDoc.exists) {
      console.log(`User ${assignedTo} does not exist`);
      return;
    }

    const userData = userDoc.data();
    const tokens = userData.fcmTokens || [];

    if (tokens.length === 0) {
      console.log("No FCM tokens for this user, skipping notification");
      return;
    }

    // Build the notification payload
    const payload = {
      notification: {
        title: "New Task Assigned",
        body: `You have been assigned a new task: ${taskData.title}`,
      },
      data: {
        taskId: taskData.taskId,
      },
    };

    // Send the notification
    const response = await getMessaging().sendToDevice(tokens, payload);
    console.log("Notification sent:", response);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
});
