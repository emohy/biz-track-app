import { useState, useEffect } from 'react';
import { RotateCcw, X } from 'lucide-react';
import './UndoToast.css';

const UndoToast = ({ message, onUndo, onDismiss, duration = 5000 }) => {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);

            if (remaining === 0) {
                clearInterval(interval);
                onDismiss();
            }
        }, 50);

        return () => clearInterval(interval);
    }, [duration, onDismiss]);

    return (
        <div className="undo-toast">
            <div className="toast-content">
                <span className="toast-message">{message}</span>
                <button className="undo-action-btn" onClick={onUndo}>
                    <RotateCcw size={16} /> Undo
                </button>
                <button className="toast-close-btn" onClick={onDismiss}>
                    <X size={16} />
                </button>
            </div>
            <div className="toast-progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
};

export default UndoToast;
