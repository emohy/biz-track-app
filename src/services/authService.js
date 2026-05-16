import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';
import { auth, db } from '../firebase';

/**
 * Ensures a user profile exists in Firestore and updates the last login time.
 */
export const ensureUserProfile = async (user) => {
    if (!user) return null;

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    const userData = {
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    if (!userDoc.exists()) {
        userData.createdAt = serverTimestamp();
        userData.role = 'user'; // Default role
        await setDoc(userRef, userData);
    } else {
        await setDoc(userRef, userData, { merge: true });
    }

    return { id: user.uid, ...userDoc.data(), ...userData };
};

/**
 * Login with Email and Password
 */
export const login = async (email, password) => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await ensureUserProfile(result.user);
        return result.user;
    } catch (error) {
        console.error("Login Error:", error.code, error.message);
        throw error;
    }
};

/**
 * Signup with Email and Password
 */
export const signup = async (email, password) => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await ensureUserProfile(result.user);
        return result.user;
    } catch (error) {
        console.error("Signup Error:", error.code, error.message);
        throw error;
    }
};

/**
 * Login with Google using Capacitor Native Plugin
 */
export const loginWithGoogle = async () => {
    try {
        const result = await GoogleSignIn.signIn();
        const idToken = result.authentication.idToken;
        
        if (!idToken) {
            throw new Error("No ID Token received from Google Sign-In");
        }

        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        await ensureUserProfile(userCredential.user);
        return userCredential.user;
    } catch (error) {
        console.error("Google Login Error:", error);
        throw error;
    }
};

/**
 * Logout
 */
export const logout = async () => {
    try {
        await GoogleSignIn.signOut(); // Best effort native sign out
    } catch (e) {
        // Ignore native sign out errors
    }
    return signOut(auth);
};

/**
 * Listen to Auth State Changes
 */
export const listenToAuth = (callback) => {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            const profile = await ensureUserProfile(user);
            callback(user, profile);
        } else {
            callback(null, null);
        }
    });
};

export default {
    login,
    signup,
    loginWithGoogle,
    logout,
    listenToAuth,
    ensureUserProfile
};
