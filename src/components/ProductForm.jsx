import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { formatCurrency, parseCurrency } from '../utils';
import './ProductForm.css';

const ProductForm = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState({
        productName: '',
        costPrice: '',
        sellingPrice: '',
        stockQuantity: '',
        minimumStockLevel: '',
        supplierName: ''
    });

    // Helper to separate raw numbers from display formatting
    const [displayValues, setDisplayValues] = useState({
        costPrice: '',
        sellingPrice: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            setDisplayValues({
                costPrice: initialData.costPrice ? formatCurrency(initialData.costPrice) : '',
                sellingPrice: initialData.sellingPrice ? formatCurrency(initialData.sellingPrice) : ''
            });
        } else {
            setFormData({
                productName: '',
                costPrice: '',
                sellingPrice: '',
                stockQuantity: '',
                minimumStockLevel: '',
                supplierName: ''
            });
            setDisplayValues({ costPrice: '', sellingPrice: '' });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'costPrice' || name === 'sellingPrice') {
            // Allow typing: keep the raw input in display for smooth typing
            // But store the parsed number in formData
            setDisplayValues(prev => ({ ...prev, [name]: value }));

            // Should verify valid number characters before parsing
            // For simplicity, we assume users type numbers/commas
            const parsed = parseCurrency(value);
            setFormData(prev => ({ ...prev, [name]: parsed }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        if (name === 'costPrice' || name === 'sellingPrice') {
            const formatted = formatCurrency(formData[name]);
            setDisplayValues(prev => ({ ...prev, [name]: formatted }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Basic Validation
        if (!formData.productName || !formData.costPrice || !formData.sellingPrice || !formData.stockQuantity || !formData.minimumStockLevel) {
            return;
        }

        onSubmit({
            ...formData,
            costPrice: Number(formData.costPrice),
            sellingPrice: Number(formData.sellingPrice),
            stockQuantity: Number(formData.stockQuantity),
            minimumStockLevel: Number(formData.minimumStockLevel)
        });
        onClose();
    };

    const isValid = formData.productName && formData.costPrice && formData.sellingPrice && formData.stockQuantity && formData.minimumStockLevel;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{initialData ? 'Edit Product' : 'Add Product'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Product Name*</label>
                        <input name="productName" value={formData.productName} onChange={handleChange} placeholder="e.g. Widget A" />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Cost Price*</label>
                            <input
                                type="text" // Text to allow formatting
                                name="costPrice"
                                value={displayValues.costPrice}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="UGX 0"
                            />
                        </div>
                        <div className="form-group">
                            <label>Selling Price*</label>
                            <input
                                type="text"
                                name="sellingPrice"
                                value={displayValues.sellingPrice}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="UGX 0"
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Stock Qty*</label>
                            <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} placeholder="0" />
                        </div>
                        <div className="form-group">
                            <label>Min Stock*</label>
                            <input type="number" name="minimumStockLevel" value={formData.minimumStockLevel} onChange={handleChange} placeholder="5" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Supplier (Optional)</label>
                        <input name="supplierName" value={formData.supplierName} onChange={handleChange} placeholder="Supplier Name" />
                    </div>
                    <button type="submit" className="save-btn" disabled={!isValid}>
                        Save Product
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProductForm;
