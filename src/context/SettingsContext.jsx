import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [testMode, setTestMode] = useState(() => {
        const saved = localStorage.getItem('testMode');
        return saved ? JSON.parse(saved) : false;
    });

    const [alertsEnabled, setAlertsEnabled] = useState(() => {
        const saved = localStorage.getItem('alertsEnabled');
        return saved !== null ? JSON.parse(saved) : true; // Default true as per Phase 8
    });

    const [appTheme, setAppTheme] = useState(() => {
        const saved = localStorage.getItem('appTheme');
        return saved || 'system';
    });

    const [showOnboarding, setShowOnboarding] = useState(() => {
        const saved = localStorage.getItem('showOnboarding');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [businessProfile, setBusinessProfile] = useState(() => {
        const saved = localStorage.getItem('businessProfile');
        return saved ? JSON.parse(saved) : { name: '', owner: '' };
    });

    const [holidaySettings, setHolidaySettings] = useState(() => {
        const saved = localStorage.getItem('holidaySettings');
        const defaultHolidays = [
            { date: '01-26', name: 'NRM Liberation Day', message: '' },
            { date: '02-16', name: 'Archbishop Janani Luwum Day', message: '' },
            { date: '03-08', name: "International Women's Day", message: '' },
            { date: '05-01', name: 'Labour Day', message: '' },
            { date: '06-03', name: 'Martyrs Day', message: '' },
            { date: '06-09', name: 'Heroes Day', message: '' },
            { date: '10-09', name: 'Independence Day', message: '' }
        ];
        return saved ? JSON.parse(saved) : { enabled: true, holidays: defaultHolidays };
    });

    const [notification, setNotification] = useState(null);

    const notify = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        localStorage.setItem('showOnboarding', JSON.stringify(showOnboarding));
    }, [showOnboarding]);

    useEffect(() => {
        localStorage.setItem('testMode', JSON.stringify(testMode));
    }, [testMode]);

    useEffect(() => {
        localStorage.setItem('alertsEnabled', JSON.stringify(alertsEnabled));
    }, [alertsEnabled]);

    useEffect(() => {
        localStorage.setItem('appTheme', appTheme);

        // Apply theme classes for manual override
        const root = document.documentElement;
        root.classList.remove('theme-light', 'theme-dark');
        if (appTheme === 'light') root.classList.add('theme-light');
        if (appTheme === 'dark') root.classList.add('theme-dark');
    }, [appTheme]);

    useEffect(() => {
        localStorage.setItem('businessProfile', JSON.stringify(businessProfile));
    }, [businessProfile]);

    useEffect(() => {
        localStorage.setItem('holidaySettings', JSON.stringify(holidaySettings));
    }, [holidaySettings]);

    const updateBusinessProfile = (profile) => {
        setBusinessProfile(prev => ({ ...prev, ...profile }));
    };

    const updateHolidaySettings = (settings) => {
        setHolidaySettings(prev => ({ ...prev, ...settings }));
    };

    // Post-Restore Notification
    useEffect(() => {
        const restored = localStorage.getItem('restore_success');
        if (restored) {
            notify('Backup restored successfully');
            localStorage.removeItem('restore_success');
        }
    }, [notify]);

    const exportBackup = () => {
        const data = {
            metadata: {
                exportVersion: 1,
                exportedAt: new Date().toISOString(),
                app: 'BizTrack'
            },
            data: {
                products: JSON.parse(localStorage.getItem('products') || '[]'),
                sales: JSON.parse(localStorage.getItem('sales') || '[]'),
                customers: JSON.parse(localStorage.getItem('customers') || '[]'),
                expenses: JSON.parse(localStorage.getItem('expenses') || '[]'),
                test_products: JSON.parse(localStorage.getItem('test_products') || '[]'),
                test_sales: JSON.parse(localStorage.getItem('test_sales') || '[]'),
                test_expenses: JSON.parse(localStorage.getItem('test_expenses') || '[]')
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `BizTrack_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const restoreBackup = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);

                    // Basic Validation
                    if (!backup.metadata || !backup.data) {
                        throw new Error('Invalid backup file format.');
                    }

                    const { data } = backup;
                    const requiredKeys = ['products', 'sales', 'customers', 'expenses'];
                    for (const key of requiredKeys) {
                        if (data[key] === undefined || !Array.isArray(data[key])) {
                            throw new Error(`Missing or invalid data for ${key}.`);
                        }
                        if (data[key].length > 0 && !data[key][0].id) {
                            throw new Error(`Data in '${key}' appears to be invalid (missing ID fields).`);
                        }
                    }

                    // Success! Return counts for preview
                    resolve({
                        counts: {
                            products: data.products.length,
                            sales: data.sales.length,
                            customers: data.customers.length,
                            expenses: data.expenses.length
                        },
                        apply: () => {
                            // Clear all storage except settings (Replace storage entirely)
                            const keys = Object.keys(localStorage);
                            keys.forEach(key => {
                                if (key !== 'testMode' && key !== 'alertsEnabled' && key !== 'appTheme' && key !== 'showOnboarding') {
                                    localStorage.removeItem(key);
                                }
                            });

                            // Overwrite LocalStorage with backup data
                            Object.keys(data).forEach(key => {
                                localStorage.setItem(key, JSON.stringify(data[key]));
                            });

                            // Set success flag and reload
                            localStorage.setItem('restore_success', 'true');
                            window.location.reload();
                        }
                    });
                } catch (err) {
                    reject(err.message);
                }
            };
            reader.onerror = () => reject('Failed to read file.');
            reader.readAsText(file);
        });
    };

    const resetAllData = () => {
        // Clear all storage except settings
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key !== 'testMode' && key !== 'alertsEnabled') {
                localStorage.removeItem(key);
            }
        });
        window.location.reload();
    };

    const clearTestData = () => {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('test_')) {
                localStorage.removeItem(key);
            }
        });
        window.location.reload();
    };

    return (
        <SettingsContext.Provider value={{
            testMode, setTestMode,
            alertsEnabled, setAlertsEnabled,
            appTheme, setAppTheme,
            showOnboarding, setShowOnboarding,
            businessProfile, updateBusinessProfile,
            holidaySettings, updateHolidaySettings,
            notification, notify,
            exportBackup, restoreBackup, resetAllData, clearTestData
        }}>
            {children}
        </SettingsContext.Provider>
    );
};
