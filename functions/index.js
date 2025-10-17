/* eslint-disable max-len */
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const functions = require("firebase-functions");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp();
const firestore = admin.firestore();
const messaging = admin.messaging();

const REMINDER_CHECK_INTERVAL_MS = 2 * 60 * 1000;
const REMINDER_SCHEDULE = "every 2 minutes";
const TIMEZONE = "Asia/Kolkata";

const sendBroadcastNotification = async (title, body, type) => {
  console.log(`Starting broadcast for: ${title}`);
  const usersSnapshot = await firestore.collection("users").get();
  const notificationPromises = [];

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const fcmTokens = userData.fcmTokens || [];

    if (fcmTokens.length === 0) continue;

    const messages = fcmTokens.map((token) => ({
      token,
      notification: {title, body},
      data: {type},
      apns: {payload: {aps: {sound: "default"}}},
    }));

    const messagePromise = messaging.sendEach(messages)
        .then((response) => {
          console.log(`Sent ${response.successCount} messages to user ${userDoc.id}`);
          return null;
        })
        .catch((error) => {
          console.error(`Error sending broadcast message to user ${userDoc.id}:`, error);
        });

    notificationPromises.push(messagePromise);
  }

  await Promise.all(notificationPromises);
  console.log("Broadcast complete.");
};


exports.notifyReportIn = onSchedule(
    {
      schedule: "0 10 * * *",
      timeZone: TIMEZONE,
    },
    async (event) => {
      await sendBroadcastNotification(
          "Good Morning! ☀️",
          "It's 10:00 AM. Time to Report In to the company.",
          "REPORT_IN",
      );
      return null;
    },
);


exports.notifyReportOut = onSchedule(
    {
      schedule: "0 18 * * *",
      timeZone: TIMEZONE,
    },
    async (event) => {
      await sendBroadcastNotification(
          "Time to Wrap Up! 🌙",
          "It's 6:00 PM. Please Report for Leaving and log your day's work.",
          "REPORT_OUT",
      );
      return null;
    },
);


exports.sendTaskReminders = onSchedule(
    {
      schedule: REMINDER_SCHEDULE,
      timeZone: TIMEZONE,
    },
    async (event) => {
      const now = admin.firestore.Timestamp.now();

      const fifteenMinutesFromNow = new Date(now.toDate().getTime() + REMINDER_CHECK_INTERVAL_MS);
      const reminderTimestampEnd = admin.firestore.Timestamp.fromDate(fifteenMinutesFromNow);

      console.log(`Checking 'tasks' collection for reminders between ${now.toDate()} and ${reminderTimestampEnd.toDate()}`);

      const tasksSnapshot = await firestore.collection("tasks")
          .where("reminder", ">=", now)
          .where("reminder", "<=", reminderTimestampEnd)
      // Status filtering removed from query to fix Firestore Indexing Error
          .get();

      const notificationPromises = [];
      const userPromises = {};

      for (const taskDoc of tasksSnapshot.docs) {
        const task = taskDoc.data();
        const taskId = taskDoc.id;
        const assignedToId = task.assignedTo;

        // Filter status client-side instead
        if (task.status === "done") {
          continue;
        }

        if (!userPromises[assignedToId]) {
          userPromises[assignedToId] = firestore.collection("users").doc(assignedToId).get();
        }

        const userDoc = await userPromises[assignedToId];
        const userData = userDoc.data();
        const fcmTokens = userData?.fcmTokens || [];

        if (fcmTokens.length === 0) {
          console.log(`No tokens for user ${assignedToId}. Skipping task ${taskId}.`);
          continue;
        }

        const reminderDate = task.reminder.toDate().toLocaleString("en-US", {
          hour: "2-digit", minute: "2-digit", day: "numeric", month: "short",
        });

        const messages = fcmTokens.map((token) => ({
          token,
          notification: {
            title: `🔔 Task Reminder: ${task.title}`,
            body: `Due at ${reminderDate}. Status: ${task.status}.`,
          },
          data: {
            taskId: taskId,
            type: "TASK_REMINDER",
          },
          apns: {payload: {aps: {sound: "default"}}},
        }));

        const messagePromise = messaging.sendEach(messages)
            .then((response) => {
              console.log(`Sent task reminder for task ${taskId} to user ${assignedToId}`);
              return firestore.collection("tasks").doc(taskId).update({
                reminder: admin.firestore.FieldValue.delete(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            })
            .catch((error) => {
              console.error(`Error sending task reminder for task ${taskId}:`, error);
            });

        notificationPromises.push(messagePromise);
      }

      await Promise.all(notificationPromises);
      console.log("Task reminder check (tasks collection) complete.");
      return null;
    },
);


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
      apns: {payload: {aps: {sound: "default"}}},
    }));

    const response = await messaging.sendEach(messages);
    console.log("Notification responses:", response);

    const failedTokens = [];
    response.responses.forEach((res, idx) => {
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
      await userDocRef.update({fcmTokens: tokens});
      console.log("Removed invalid tokens:", failedTokens);
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
});


exports.sendTestNotification = functions.https.onRequest(async (req, res) => {
  try {
    const userDoc = await firestore.collection("users").doc("HFFldszSjscxQGOpnWcIHXVqaGt2").get();
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
      apns: {payload: {aps: {sound: "default"}}},
    }));

    const response = await messaging.sendEach(messages);
    console.log("FCM responses:", response);

    res.send("Test notification sent successfully!");
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).send("Error sending test notification");
  }
});
exports.sendPersonalTaskReminders = onSchedule(
    {
      schedule: REMINDER_SCHEDULE,
      timeZone: TIMEZONE,
    },
    async (event) => {
      const now = admin.firestore.Timestamp.now();
      const fifteenMinutesFromNow = new Date(now.toDate().getTime() + REMINDER_CHECK_INTERVAL_MS);
      const reminderTimestampEnd = admin.firestore.Timestamp.fromDate(fifteenMinutesFromNow);
      console.log(`Checking ALL user documents for personal task reminders between ${now.toDate()} and ${reminderTimestampEnd.toDate()}`);
      const usersSnapshot = await firestore.collection("users").get();
      const notificationPromises = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        const personalTasks = userData.myTasks || [];
        const fcmTokens = userData.fcmTokens || [];

        if (fcmTokens.length === 0) {
          console.log(`No FCM tokens for user ${userId}. Skipping personal tasks.`);
          continue;
        }

        // 2. Iterate through the myTasks array
        for (const task of personalTasks) {
        // Check if the task has a reminder field
          if (!task.reminder || task.status === "done") {
            continue;
          }

          // Convert task reminder to a comparable Timestamp
          const taskReminderTimestamp = task.reminder;

          // 3. Check if the reminder is within the 15-minute window
          if (taskReminderTimestamp.seconds >= now.seconds &&
          taskReminderTimestamp.seconds <= reminderTimestampEnd.seconds) {
            const reminderDate = taskReminderTimestamp.toDate().toLocaleString("en-US", {
              hour: "2-digit", minute: "2-digit", day: "numeric", month: "short",
            });

            const messages = fcmTokens.map((token) => ({
              token,
              notification: {
                title: `🔔 Personal Task Reminder: ${task.title}`,
                body: `Due at ${reminderDate}. Status: ${task.status}.`,
              },
              data: {
                taskId: task.id,
                type: "PERSONAL_TASK_REMINDER",
              },
              apns: {payload: {aps: {sound: "default"}}},
            }));

            // Send notification and delete the reminder field from the task object
            const messagePromise = messaging.sendEach(messages)
                .then((response) => {
                  console.log(`Sent personal task reminder for task ${task.id} to user ${userId}`);

                  // Remove the 'reminder' field from the task object in the array
                  const updatedTasks = personalTasks.filter((t) => t.id !== task.id);
                  const updatedTask = {...task};
                  delete updatedTask.reminder; // Create the updated task without the reminder field
                  updatedTasks.push(updatedTask); // Add the updated task back

                  // Update the entire myTasks array in Firestore
                  return firestore.collection("users").doc(userId).update({
                    myTasks: updatedTasks,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                  });
                })
                .catch((error) => {
                  console.error(`Error sending personal task reminder for task ${task.id} to user ${userId}:`, error);
                });

            notificationPromises.push(messagePromise);
          }
        }
      }

      await Promise.all(notificationPromises);
      console.log("Personal Task reminder check (myTasks array) complete.");
      return null;
    },
);
