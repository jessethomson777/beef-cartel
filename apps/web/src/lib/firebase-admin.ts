import 'server-only';
import { initializeApp, getApps, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

/**
 * Firebase Admin SDK, lazily initialised with Application Default Credentials.
 * - On Firebase App Hosting: uses the backend's service account automatically.
 * - Locally: run `gcloud auth application-default login` once.
 * NOTE: no service-account JSON is required. If ADC ever proves insufficient
 * (e.g. you need a specific SA), set GOOGLE_APPLICATION_CREDENTIALS to a key
 * file path, or pass `credential: cert(require('./sa.json'))` to initializeApp.
 */
let app: App | undefined;

function getAdminApp(): App {
  if (app) return app;
  app =
    getApps()[0] ??
    initializeApp({
      projectId:
        process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  return app;
}

export function adminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}
