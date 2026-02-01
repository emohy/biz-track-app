import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useSales } from '../context/SalesContext';
import { useExpense } from '../context/ExpenseContext';
import { useProduct } from '../context/ProductContext';
import { useCustomer } from '../context/CustomerContext';
import { useAuth } from '../context/AuthContext';
import {
    Download, Shield, Trash2, RotateCcw, AlertTriangle,
    Sun, Moon, Monitor, Palette, ArrowLeft, LogOut, User
} from 'lucide-react';
import './Settings.css';

const Settings = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const {
        testMode, setTestMode,
        alertsEnabled, setAlertsEnabled,
        appTheme, setAppTheme,
        exportBackup, restoreBackup, resetAllData, clearTestData,
        setShowOnboarding
    } = useSettings();

    const [restorePreview, setRestorePreview] = useState(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const fileInputRef = useRef(null);

    const { sales } = useSales();
    const { expenses } = useExpense();
    const { products } = useProduct();
    const { customers } = useCustomer();

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to sign out?')) {
            await logout();
        }
    };

    const handleReset = () => {
        if (window.confirm('CRITICAL: This will permanently delete ALL your real data. This cannot be undone. Are you absolutely sure?')) {
            if (window.confirm('LAST WARNING: Delete everything?')) {
                resetAllData();
            }
        }
    };

    const handleClearTest = () => {
        if (window.confirm('Delete all test data? Your real data will remain safe.')) {
            clearTestData();
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const preview = await restoreBackup(file);
            setRestorePreview(preview);
        } catch (err) {
            alert(`Error reading backup: ${err}`);
        } finally {
            e.target.value = ''; // Reset input
        }
    };

    const handleConfirmRestore = () => {
        if (restorePreview) {
            setIsRestoring(true);
            restorePreview.apply();
        }
    };

    return (
        <div className="page container settings-page">
            <header className="settings-header">
                <div className="header-top">
                    <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
                        <ArrowLeft size={24} />
                    </button>
                    <h1>Settings</h1>
                </div>
                <p>Manage your data and account preferences.</p>
            </header>

            <section className="settings-section">
                <div className="section-header">
                    <User size={20} />
                    <h2>Account</h2>
                </div>
                <div className="account-info-card">
                    <div className="user-details">
                        <div className="user-avatar">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName} />
                            ) : (
                                <User size={24} />
                            )}
                        </div>
                        <div className="user-meta">
                            <span className="user-name">{user?.displayName || 'Business Owner'}</span>
                            <span className="user-email">{user?.email}</span>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </section>

            <section className="settings-section">
                <div className="section-header">
                    <Palette size={20} />
                    <h2>Appearance</h2>
                </div>
                {/* ... theme buttons ... */}
                <div className="theme-selector-grid">
                    <button
                        className={`theme-btn ${appTheme === 'system' ? 'active' : ''}`}
                        onClick={() => setAppTheme('system')}
                    >
                        <Monitor size={18} />
                        <span>System</span>
                    </button>
                    <button
                        className={`theme-btn ${appTheme === 'light' ? 'active' : ''}`}
                        onClick={() => setAppTheme('light')}
                    >
                        <Sun size={18} />
                        <span>Light</span>
                    </button>
                    <button
                        className={`theme-btn ${appTheme === 'dark' ? 'active' : ''}`}
                        onClick={() => setAppTheme('dark')}
                    >
                        <Moon size={18} />
                        <span>Dark</span>
                    </button>
                </div>
            </section>

            <section className="settings-section">
                <div className="section-header">
                    <Shield size={20} />
                    <h2>Privacy & Cloud Sync</h2>
                </div>

                <div className="privacy-info-box">
                    <p><strong>Your data is secured in the cloud.</strong> BizTrack uses Firebase to securely sync your sales, expenses, and customer data across all your devices. Only you can access your data.</p>
                </div>

                <div className="setting-item">
                    <div className="setting-info">
                        <span className="setting-label">Test Mode</span>
                        <p className="setting-desc">Isolate your testing from real records.</p>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={testMode}
                            onChange={(e) => setTestMode(e.target.checked)}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
                {/* ... other settings ... */}
                <div className="setting-item">
                    <div className="setting-info">
                        <span className="setting-label">Smart Alerts</span>
                        <p className="setting-desc">Proactive business health notifications.</p>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={alertsEnabled}
                            onChange={(e) => setAlertsEnabled(e.target.checked)}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>

                <div className="setting-item">
                    <div className="setting-info">
                        <span className="setting-label">Onboarding Walkthrough</span>
                        <p className="setting-desc">Replay the introductory guide.</p>
                    </div>
                    <button className="small-action-btn" onClick={() => setShowOnboarding(true)}>
                        Replay Intro
                    </button>
                </div>
            </section>

            {/* ... Backup & Restore section ... */}
            <section className="settings-section">
                <div className="section-header">
                    <Download size={20} />
                    <h2>Backup & Restore</h2>
                </div>
                <p className="section-helper-text">Export a backup or restore your data safely.</p>
                <div className="backup-actions">
                    <button className="backup-btn primary" onClick={exportBackup}>
                        <Download size={18} /> Export Backup (JSON)
                    </button>
                    <button className="backup-btn secondary" onClick={() => fileInputRef.current?.click()}>
                        <RotateCcw size={18} /> Restore from Backup (JSON)
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".json"
                        onChange={handleFileSelect}
                    />
                </div>

                {restorePreview && (
                    <div className="restore-preview-overlay">
                        <div className="restore-preview-card">
                            <h3>Restore Preview</h3>
                            <p>This will <strong>replace</strong> your current data with the following contents:</p>
                            <div className="preview-grid">
                                <div className="preview-stat">
                                    <span className="count">{restorePreview.counts.products}</span>
                                    <span className="label">Products</span>
                                </div>
                                <div className="preview-stat">
                                    <span className="count">{restorePreview.counts.sales}</span>
                                    <span className="label">Sales</span>
                                </div>
                                <div className="preview-stat">
                                    <span className="count">{restorePreview.counts.customers}</span>
                                    <span className="label">Customers</span>
                                </div>
                                <div className="preview-stat">
                                    <span className="count">{restorePreview.counts.expenses}</span>
                                    <span className="label">Expenses</span>
                                </div>
                            </div>
                            <p className="warning-text">CAUTION: This action cannot be undone.</p>
                            <div className="preview-actions">
                                <button className="cancel-btn" onClick={() => setRestorePreview(null)}>Cancel</button>
                                <button className="confirm-btn danger" onClick={handleConfirmRestore} disabled={isRestoring}>
                                    {isRestoring ? 'Restoring...' : 'Replace All Data'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <section className="settings-section danger-zone">
                <div className="section-header">
                    <AlertTriangle size={20} className="danger-text" />
                    <h2 className="danger-text">Danger Zone</h2>
                </div>

                <div className="danger-item">
                    <div className="danger-info">
                        <span className="danger-label">Clear Test Data</span>
                        <p className="danger-desc">Delete all data created while in Test Mode.</p>
                    </div>
                    <button className="danger-btn outline" onClick={handleClearTest}>
                        <RotateCcw size={16} /> Reset Trial
                    </button>
                </div>

                <div className="danger-item">
                    <div className="danger-info">
                        <span className="danger-label">Reset All Data</span>
                        <p className="danger-desc">Permanently delete ALL your records. This is final.</p>
                    </div>
                    <button className="danger-btn" onClick={handleReset}>
                        <Trash2 size={16} /> Delete Everything
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Settings;
