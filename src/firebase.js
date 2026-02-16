import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with modern persistent cache configuration
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});

// NOTE: To activate App Check (recommended for Security Audit Phase 4):
// 1. Install dependency: npm install firebase/app-check
// 2. Uncomment the following and wrap in a check for dev/prod:
/*
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
if (import.meta.env.PROD) {
    initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true
    });
}
*/

/**
 * Helper to add standard metadata to Firestore documents
 */
export const getMetadata = (userId, existingData = null) => {
    const now = serverTimestamp();
    return {
        userId,
        updatedAt: now,
        ...(existingData ? {} : { createdAt: now })
    };
};
