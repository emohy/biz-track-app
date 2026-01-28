import { Plus } from 'lucide-react';
import './GlobalFAB.css';

const GlobalFAB = ({ onClick }) => {
    return (
        <button className="global-fab" onClick={onClick} aria-label="Open Actions">
            <Plus size={24} />
        </button>
    );
};

export default GlobalFAB;
