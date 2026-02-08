export const formatCurrency = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    const number = Number(value);
    if (isNaN(number)) return '';
    // Format with commas and no decimal places
    return 'UGX ' + number.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
};

export const parseCurrency = (displayValue) => {
    if (!displayValue) return '';
    // Remove "UGX", spaces, and commas
    const cleanValue = displayValue.toString().replace(/UGX|[, ]/g, '');
    const number = Number(cleanValue);
    return isNaN(number) ? '' : number;
};
export const normalizePhone = (raw, defaultCountryCode = "+256") => {
    if (!raw) return "";
    let s = raw.trim().replace(/[()\-\s]/g, "");
    if (s.startsWith("00")) s = "+" + s.slice(2);
    if (s.startsWith("0") && !s.startsWith("+")) s = defaultCountryCode + s.slice(1);
    if (!s.startsWith("+") && /^\d+$/.test(s)) s = defaultCountryCode + s;
    return s;
};
