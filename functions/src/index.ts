

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import {initializeApp, applicationDefault} from "firebase-admin/app";
import {getMessaging} from "firebase-admin/messaging";
import {getFirestore, FieldValue} from "firebase-admin/firestore";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Initialize Firebase Admin SDK once per cold start
initializeApp({
  credential: applicationDefault(),
});

type SendFcmRequestBody = {
  token?: string;
  tokens?: string[];
  topic?: string;
  notification?: {
    title?: string;
    body?: string;
    imageUrl?: string;
  };
  data?: Record<string, string>;
  android?: Record<string, unknown>;
  apns?: Record<string, unknown>;
  fcmOptions?: Record<string, unknown>;
};

export const sendFcm = onRequest(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed. Use POST."});
    return;
  }

  const body = (req.body || {}) as SendFcmRequestBody;
  const {token, tokens, topic, notification, data, android, apns, fcmOptions} = body;

  if (!token && !tokens && !topic) {
    res.status(400).json({
      error: "One of 'token', 'tokens', or 'topic' is required.",
    });
    return;
  }

  // Validate data payload types (must be string key-values for FCM)
  let sanitizedData: Record<string, string> | undefined = undefined;
  if (data) {
    sanitizedData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [String(k), String(v)])
    );
  }

  try {
    const messaging = getMessaging();

    if (Array.isArray(tokens) && tokens.length > 0) {
      const multicastMessage = {
        tokens,
        notification,
        data: sanitizedData,
        android: android as unknown,
        apns: apns as unknown,
        fcmOptions: fcmOptions as unknown,
      } as any;

      const resp = await messaging.sendEachForMulticast(multicastMessage);
      res.status(200).json({
        successCount: resp.successCount,
        failureCount: resp.failureCount,
        responses: resp.responses.map((r) => ({success: r.success, error: r.error?.message})),
      });
      return;
    }

    const message: any = {
      notification,
      data: sanitizedData,
      android,
      apns,
      fcmOptions,
    };

    if (token) message.token = token;
    if (topic) message.topic = topic;

    const id = await messaging.send(message);
    res.status(200).json({messageId: id});
  } catch (err: any) {
    logger.error("FCM send failed", {error: err?.message || err});
    res.status(500).json({error: err?.message || "Internal error"});
  }
});

type CreateNotificationBody = {
  userId: string;
  userType: "skilled_worker" | "job_poster" | string;
  title: string;
  body: string;
  type: string;
  jobId?: string;
  assignedJobId?: string;
  data?: Record<string, string | number | boolean | null>;
  fcmToken?: string; // optional if you only want to save
};

export const createNotificationAndSend = onRequest(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed. Use POST."});
    return;
  }

  const body = (req.body || {}) as Partial<CreateNotificationBody>;
  const {userId, userType, title, body: notifBody, type, jobId, assignedJobId, data, fcmToken} = body;

  if (!userId || !userType || !title || !notifBody || !type) {
    res.status(400).json({
      error: "Missing required fields: userId, userType, title, body, type",
    });
    return;
  }

  try {
    const db = getFirestore();

    const payloadData: Record<string, unknown> = {
      userId,
      userType,
      title,
      body: notifBody,
      type,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    };
    if (jobId) payloadData.jobId = jobId;
    if (assignedJobId) payloadData.assignedJobId = assignedJobId;
    if (data) payloadData.data = data;

    const docRef = await db.collection("Notifications").add(payloadData);

    // Prepare FCM payload mirroring saved doc
    if (fcmToken) {
      const messaging = getMessaging();
      const fcmData: Record<string, string> = {
        notificationId: docRef.id,
        userId,
        userType: String(userType),
        type: String(type),
      };
      if (jobId) fcmData.jobId = String(jobId);
      if (assignedJobId) fcmData.assignedJobId = String(assignedJobId);
      if (data) {
        for (const [k, v] of Object.entries(data)) {
          if (v === undefined) continue;
          fcmData[`data_${k}`] = String(v);
        }
      }

      await messaging.send({
        token: fcmToken,
        notification: {title, body: notifBody},
        data: fcmData,
      });
    }

    res.status(200).json({id: docRef.id});
  } catch (err: any) {
    logger.error("createNotificationAndSend failed", {error: err?.message || err});
    res.status(500).json({error: err?.message || "Internal error"});
  }
});
