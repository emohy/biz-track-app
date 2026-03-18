import { Capacitor } from '@capacitor/core';
import { Contacts } from '@capacitor-community/contacts';

export const isContactPickerSupported = () => {
    if (Capacitor.isNativePlatform()) {
        return true; 
    }
    return ('contacts' in window.navigator && 'select' in window.navigator.contacts && window.isSecureContext);
};

export const pickSingleContact = async () => {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
        try {
            // Check permissions first
            let perm = await Contacts.checkPermissions();
            if (perm.contacts !== 'granted') {
                perm = await Contacts.requestPermissions();
            }
            if (perm.contacts !== 'granted') {
                throw new Error("Permission to access contacts was denied.");
            }

            // Pick a contact
            const result = await Contacts.pickContact({ projection: { name: true, phones: true } });
            
            // Result structure: { contact: { contactId, name: { display, given, family... }, phones: [{ type, number }...] } }
            if (!result || !result.contact) return null; // user cancelled/aborted
            
            const contact = result.contact;
            const name = contact.name?.display || 'Unknown';
            
            let numbers = [];
            if (contact.phones && contact.phones.length > 0) {
                numbers = contact.phones.map(p => p.number);
            }
            
            return { name, numbers };
        } catch (error) {
            console.error("Capacitor Native Contact Picker Error:", error);
            if (error.message && error.message.toLowerCase().includes('user limit')) return null;
            throw new Error("Could not open native contacts.");
        }
    } else {
        // Web Fallback (Chrome Experimental API)
        if (!('contacts' in window.navigator && 'select' in window.navigator.contacts)) {
            throw new Error("Contact picker is not supported on this browser.");
        }

        try {
            const props = ['name', 'tel'];
            const opts = { multiple: false };
            const contacts = await window.navigator.contacts.select(props, opts);
            
            if (!contacts || contacts.length === 0) return null; // user aborted
            
            const contact = contacts[0];
            const name = contact.name?.[0] || 'Unknown';
            const numbers = contact.tel || [];
            
            return { name, numbers };
        } catch (error) {
            console.error("Web Contact Picker Error:", error);
            if (error.name === 'AbortError' || error.name === 'SecurityError') {
                return null; // user cancelled or blocked by policy silently
            }
            throw new Error("Could not construct web contact picker.");
        }
    }
};
