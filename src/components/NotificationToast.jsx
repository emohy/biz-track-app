import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import './NotificationToast.css';

const NotificationToast = () => {
    const { notification } = useSettings();

    if (!notification) return null;

    const { message, type } = notification;

    return (
        <div className={`notification-toast ${type}`}>
            <div className="notification-icon">
                {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            </div>
            <span className="notification-message">{message}</span>
        </div>
    );
};

export default NotificationToast;
