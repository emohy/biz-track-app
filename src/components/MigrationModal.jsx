import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { Database, ArrowRight, X } from 'lucide-react';
import './MigrationModal.css';

const MigrationModal = ({ user, onComplete }) => {
    const [isMigrating, setIsMigrating] = useState(false);
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Check if there is data to migrate
        const hasData =
            localStorage.getItem('products') ||
            localStorage.getItem('sales') ||
            localStorage.getItem('customers') ||
            localStorage.getItem('expenses');

        const alreadyMigrated = localStorage.getItem(`migrated_${user.uid}`);

        if (hasData && !alreadyMigrated) {
            setShow(true);
        }
    }, [user.uid]);

    const handleMigrate = async () => {
        setIsMigrating(true);
        try {
            const collections = ['products', 'sales', 'customers', 'expenses', 'test_products', 'test_sales', 'test_expenses'];

            for (const col of collections) {
                const data = JSON.parse(localStorage.getItem(col) || '[]');
                for (const item of data) {
                    const { id, ...rest } = item;
                    // Reuse existing IDs as document IDs to avoid duplicates if re-run
                    await setDoc(doc(db, 'users', user.uid, col, id), {
                        ...rest,
                        // Ensure timestamps are preserved or set to server time
                        createdAt: rest.createdAt ? new Date(rest.createdAt) : serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                }
            }

            localStorage.setItem(`migrated_${user.uid}`, 'true');
            // Optional: Mark in Firestore as well
            await setDoc(doc(db, 'users', user.uid), { migrated: true }, { merge: true });

            setShow(false);
            if (onComplete) onComplete();
        } catch (err) {
            console.error('Migration failed:', err);
            alert('Migration failed. Please try again.');
        } finally {
            setIsMigrating(false);
        }
    };

    const handleSkip = () => {
        localStorage.setItem(`migrated_${user.uid}`, 'true');
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="migration-overlay">
            <div className="migration-card">
                <div className="migration-header">
                    <div className="icon-circle">
                        <Database size={24} color="#2F6FED" />
                    </div>
                    <h2>Import Device Data?</h2>
                    <p>We found existing business data on this device. Would you like to sync it to your account?</p>
                </div>

                <div className="migration-benefits">
                    <div className="benefit">
                        <ArrowRight size={16} />
                        <span>Access data on any device</span>
                    </div>
                    <div className="benefit">
                        <ArrowRight size={16} />
                        <span>Automatic cloud backups</span>
                    </div>
                </div>

                <div className="migration-actions">
                    <button
                        className="import-btn"
                        onClick={handleMigrate}
                        disabled={isMigrating}
                    >
                        {isMigrating ? 'Importing...' : 'Import Now'}
                    </button>
                    <button
                        className="skip-btn"
                        onClick={handleSkip}
                        disabled={isMigrating}
                    >
                        Skip
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MigrationModal;
