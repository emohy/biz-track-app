import { X } from 'lucide-react';
import './BottomSheet.css';

const BottomSheet = ({ isOpen, onClose, actions }) => {
    if (!isOpen) return null;

    return (
        <div className="bottom-sheet-overlay" onClick={onClose}>
            <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="bottom-sheet-header">
                    <h3>Quick Actions</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="bottom-sheet-content">
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            className="action-item"
                            disabled={action.disabled}
                            onClick={action.onClick}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BottomSheet;
