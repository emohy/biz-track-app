import { useState, useEffect } from 'react';
import { X, Package, Tag, Wallet, Database, TriangleAlert, Truck } from 'lucide-react';
import { formatCurrency, parseCurrency } from '../utils';
import { useSettings } from '../context/SettingsContext';
import './ProductForm.css';

const ProductForm = ({ isOpen, onClose, onSubmit, initialData }) => {
    const { notify } = useSettings();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        productName: '',
        costPrice: '',
        sellingPrice: '',
        stockQuantity: '',
        minimumStockLevel: '',
        supplierName: ''
    });

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
            setDisplayValues(prev => ({ ...prev, [name]: value }));
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.productName || !formData.costPrice || !formData.sellingPrice || !formData.stockQuantity || !formData.minimumStockLevel || isLoading) {
            return;
        }

        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 600));

        onSubmit({
            ...formData,
            costPrice: Number(formData.costPrice),
            sellingPrice: Number(formData.sellingPrice),
            stockQuantity: Number(formData.stockQuantity),
            minimumStockLevel: Number(formData.minimumStockLevel)
        });

        notify(`Product "${formData.productName}" saved`);
        setIsLoading(false);
        onClose();
    };

    const isValid = formData.productName && formData.costPrice && formData.sellingPrice && formData.stockQuantity && formData.minimumStockLevel;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content premium-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="title-with-icon">
                        <Package size={24} className="header-icon" />
                        <h2>{initialData ? 'Edit Product' : 'Add Product'}</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="premium-form">
                    <section className="form-section">
                        <div className="section-header">
                            <Database size={16} />
                            <span>Basic Information</span>
                        </div>
                        <div className="form-group">
                            <label>Product Name*</label>
                            <input
                                name="productName"
                                value={formData.productName}
                                onChange={handleChange}
                                placeholder="e.g. Premium Blend Coffee"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="form-group">
                            <label>Supplier (Optional)</label>
                            <div className="input-with-icon">
                                <Truck size={18} className="input-icon" />
                                <input
                                    name="supplierName"
                                    value={formData.supplierName}
                                    onChange={handleChange}
                                    placeholder="Enter supplier name"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="form-section highlight">
                        <div className="section-header">
                            <Tag size={16} />
                            <span>Pricing Strategy</span>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Cost Price</label>
                                <input
                                    type="text"
                                    name="costPrice"
                                    value={displayValues.costPrice}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder="UGX 0"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="form-group">
                                <label>Selling Price</label>
                                <input
                                    type="text"
                                    name="sellingPrice"
                                    value={displayValues.sellingPrice}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder="UGX 0"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        {formData.costPrice && formData.sellingPrice && (
                            <div className="margin-indicator transition-all">
                                <span>Projected Profit: </span>
                                <strong className={formData.sellingPrice >= formData.costPrice ? 'text-success' : 'text-danger'}>
                                    {formatCurrency(formData.sellingPrice - formData.costPrice)}
                                </strong>
                            </div>
                        )}
                    </section>

                    <section className="form-section">
                        <div className="section-header">
                            <Wallet size={16} />
                            <span>Inventory Control</span>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Initial Stock</label>
                                <input
                                    type="number"
                                    name="stockQuantity"
                                    value={formData.stockQuantity}
                                    onChange={handleChange}
                                    placeholder="0"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="form-group">
                                <label>Alert Level</label>
                                <input
                                    type="number"
                                    name="minimumStockLevel"
                                    value={formData.minimumStockLevel}
                                    onChange={handleChange}
                                    placeholder="5"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <small className="form-hint">
                            <TriangleAlert size={12} />
                            Get notified when stock drops below {formData.minimumStockLevel || '5'}
                        </small>
                    </section>

                    {initialData && (
                        <div className="audit-stamps premium-audit">
                            <span>Created: {new Date(initialData.createdAt).toLocaleDateString()}</span>
                            {initialData.updatedAt && (
                                <span>Modified: {new Date(initialData.updatedAt).toLocaleDateString()}</span>
                            )}
                        </div>
                    )}

                    <button type="submit" className="save-btn premium-btn" disabled={!isValid || isLoading}>
                        {isLoading ? (
                            <span className="btn-loader">Saving Changes...</span>
                        ) : (
                            <span>{initialData ? 'Update Product' : 'Register Product'}</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProductForm;
