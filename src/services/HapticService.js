import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const haptics = {
    impact: async (style = ImpactStyle.Medium) => {
        try {
            await Haptics.impact({ style });
        } catch (e) {
            // Fallback for web/missing plugin
        }
    },
    vibrate: async () => {
        try {
            await Haptics.vibrate();
        } catch (e) {
            // Fallback
        }
    },
    selectionStart: async () => {
        try {
            await Haptics.selectionStart();
        } catch (e) {
            // Fallback
        }
    },
    selectionChanged: async () => {
        try {
            await Haptics.selectionChanged();
        } catch (e) {
            // Fallback
        }
    },
    selectionEnd: async () => {
        try {
            await Haptics.selectionEnd();
        } catch (e) {
            // Fallback
        }
    },
    success: async () => {
        try {
            await Haptics.notification({ type: 'SUCCESS' });
        } catch (e) {
            // Fallback
        }
    },
    error: async () => {
        try {
            await Haptics.notification({ type: 'ERROR' });
        } catch (e) {
            // Fallback
        }
    }
};
