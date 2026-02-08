import { Phone } from "lucide-react";
import { normalizePhone } from "../utils";
import "./CallIconButton.css";

const CallIconButton = ({
    phone,
    defaultCountryCode = "+256",
    notify,
}) => {
    const normalized = phone ? normalizePhone(phone, defaultCountryCode) : "";

    const onCall = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!normalized) {
            return notify?.("No phone number saved for this customer", "error");
        }
        window.location.href = `tel:${normalized}`;
    };

    if (!phone) return null;

    return (
        <button
            type="button"
            aria-label="Call customer"
            onClick={onCall}
            className="call-icon-btn"
        >
            <Phone size={18} />
        </button>
    );
};

export default CallIconButton;
