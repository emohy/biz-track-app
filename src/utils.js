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
