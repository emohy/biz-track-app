import { useState } from 'react';
import { ShoppingCart, Wallet, Package, ShieldCheck, ChevronRight, X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import './Onboarding.css';

const Onboarding = () => {
    const { showOnboarding, setShowOnboarding } = useSettings();
    const [step, setStep] = useState(1);

    if (!showOnboarding) return null;

    const nextStep = () => setStep(prev => prev + 1);
    const skip = () => setShowOnboarding(false);

    const screens = [
        {
            icon: <ShoppingCart size={48} className="onboarding-icon" />,
            title: "BizTrack: Your Business, Organized",
            description: "A professional tool designed specifically for local retail and small business owners.",
            benefit: "Simplified sales tracking and customer management."
        },
        {
            icon: <Package size={48} className="onboarding-icon" />,
            title: "Inventory & Growth",
            description: "Monitor stock levels in real-time and get smart alerts when you're running low.",
            benefit: "Never miss a sale due to out-of-stock items."
        },
        {
            icon: <ShieldCheck size={48} className="onboarding-icon-safe" />,
            title: "Your Data, Your Privacy",
            description: "All business data stays on your device. We don't sell, share, or even see your figures.",
            benefit: "100% offline-first and private by design."
        }
    ];

    const current = screens[step - 1];

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-content card fade-in">
                <button className="onboarding-skip" onClick={skip}>
                    <X size={20} />
                </button>

                <div className="onboarding-visual">
                    {current.icon}
                </div>

                <div className="onboarding-text">
                    <h2>{current.title}</h2>
                    <p>{current.description}</p>
                    <div className="onboarding-benefit">
                        <ChevronRight size={14} />
                        <span>{current.benefit}</span>
                    </div>
                </div>

                <div className="onboarding-footer">
                    <div className="step-indicators">
                        {screens.map((_, i) => (
                            <div key={i} className={`indicator ${step === i + 1 ? 'active' : ''}`} />
                        ))}
                    </div>

                    {step < 3 ? (
                        <button className="onboarding-btn next" onClick={nextStep}>
                            Next Step
                        </button>
                    ) : (
                        <button className="onboarding-btn finish" onClick={skip}>
                            Get Started
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
