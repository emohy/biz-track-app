import React from 'react';
import { 
  Download, 
  BarChart3, 
  Box, 
  Receipt, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Smartphone
} from 'lucide-react';
import './LandingPage.css';

// Import images
import heroImg from '../assets/landing/hero.png';
import salesImg from '../assets/landing/sales.png';
import inventoryImg from '../assets/landing/inventory.png';
import debtsImg from '../assets/landing/debts.png';

const LandingPage = () => {
  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content section">
          <h1>Stop Losing Track of Your Money. <span style={{ color: '#2F6FED' }}>Run Your Business From Your Phone.</span></h1>
          <p>
            Track every sale. Know your profit. Grow your business. 
            The simplest way to manage your shop in Uganda.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <a href="/downloads/PesaFlow.apk" className="cta-primary" download>
              Download APK <ArrowRight className="cta-arrow" size={20} />
            </a>
            <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
              Android APK • Free • Works Offline • No laptop needed
            </p>
          </div>
          
          <div className="hero-image-container">
            <div className="phone-frame">
              <img src={heroImg} alt="PesaFlow App Preview" className="hero-image" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section">
        <h2 style={{ textAlign: 'center', marginBottom: '12px' }}>Everything You Need to Run Your Business Daily</h2>
        <p style={{ textAlign: 'center', color: '#475569', marginBottom: '40px' }}>
          Stop guessing. Start knowing exactly how your business is performing.
        </p>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><BarChart3 size={24} /></div>
            <h3>Never forget a sale again</h3>
            <p>Record every transaction instantly. See your daily cash flow without counting paper receipts.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon"><Box size={24} /></div>
            <h3>Know your stock in real-time</h3>
            <p>Get alerted before you run out. Stop losing customers because items are "out of stock".</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon"><Receipt size={24} /></div>
            <h3>See your true profit</h3>
            <p>Automatically subtract expenses from sales. Know exactly how much money is yours to keep.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon"><Users size={24} /></div>
            <h3>Get paid on time</h3>
            <p>Track who owes you and how much. Send friendly reminders and never lose money to "forgotten" debts.</p>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="section problem-solution" style={{ borderRadius: '24px', margin: '20px' }}>
        <div style={{ padding: '40px 20px' }}>
          <h2>Stop the Stress of Manual Records</h2>
          <div className="comparison">
            <div className="pain-point">
              <h3 style={{ color: '#ff8a8a', marginBottom: '16px' }}>Is this happening to you?</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                  <span style={{ color: '#ff8a8a', fontWeight: 'bold' }}>✕</span> Losing money without knowing where it went?
                </li>
                <li style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                  <span style={{ color: '#ff8a8a', fontWeight: 'bold' }}>✕</span> Customers not paying debts on time?
                </li>
                <li style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                  <span style={{ color: '#ff8a8a', fontWeight: 'bold' }}>✕</span> Stock finishing without any warning?
                </li>
              </ul>
            </div>
            
            <div className="solution">
              <h3 style={{ color: '#10b981', marginBottom: '16px' }}>The PesaFlow Solution</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                  <CheckCircle2 size={20} color="#10b981" /> Clear reports on every shilling earned
                </li>
                <li style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                  <CheckCircle2 size={20} color="#10b981" /> Automated debt tracking and reminders
                </li>
                <li style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                  <CheckCircle2 size={20} color="#10b981" /> Real-time stock alerts on your phone
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="section screenshots-section">
        <h2>See how it works</h2>
        <p style={{ color: '#475569', marginBottom: '40px' }}>Fast, simple, and built for your shop.</p>
        
        <div className="screenshot-container">
          <div className="screenshot-wrapper">
            <div className="phone-frame mini">
              <img src={salesImg} alt="Sales Tracking" />
            </div>
            <p style={{ marginTop: '16px', fontWeight: '600' }}>Never miss a sale</p>
          </div>
          <div className="screenshot-wrapper">
            <div className="phone-frame mini">
              <img src={inventoryImg} alt="Inventory Management" />
            </div>
            <p style={{ marginTop: '16px', fontWeight: '600' }}>Manage stock easily</p>
          </div>
          <div className="screenshot-wrapper">
            <div className="phone-frame mini">
              <img src={debtsImg} alt="Debt Records" />
            </div>
            <p style={{ marginTop: '16px', fontWeight: '600' }}>Track every debt</p>
          </div>
        </div>
      </section>

      {/* Download Instructions */}
      <section className="section">
        <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>How to install</h2>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="guide-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Download the APK</h4>
              <p>Click the "Download APK" button at the top or bottom of this page.</p>
            </div>
          </div>
          
          <div className="guide-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Allow Install</h4>
              <p>Your phone may ask for permission. This is <strong>100% safe</strong>—just click "Allow" or "Install anyway".</p>
            </div>
          </div>
          
          <div className="guide-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Open & Sign Up</h4>
              <p>Launch PesaFlow and create your account to start tracking your business.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="section" style={{ backgroundColor: '#F8FAFC', borderRadius: '24px', textAlign: 'center' }}>
        <ShieldCheck size={48} color="#2F6FED" style={{ marginBottom: '16px' }} />
        <h2>Built for Businesses in Uganda</h2>
        <p style={{ color: '#475569', maxWidth: '500px', margin: '0 auto 24px' }}>
          "PesaFlow helps me track all my sales easily. I no longer lose sleep over missing money."
        </p>
        <p style={{ fontWeight: '700', color: '#0F172A' }}>– Shop Owner, Kampala</p>
        
        <div className="trust-badges" style={{ marginTop: '40px', borderTop: '1px solid #E2E8F0', paddingTop: '30px' }}>
          <div className="badge">
            <h4 style={{ fontSize: '1.25rem' }}>Simple</h4>
            <p>Easy to learn</p>
          </div>
          <div className="badge">
            <h4 style={{ fontSize: '1.25rem' }}>Fast</h4>
            <p>Works offline</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section" style={{ textAlign: 'center', paddingBottom: '120px' }}>
        <h2 style={{ marginBottom: '16px' }}>Ready to transform your business?</h2>
        <p style={{ color: '#475569', marginBottom: '32px' }}>Start tracking your business today — it takes less than 2 minutes.</p>
        <a href="/downloads/PesaFlow.apk" className="cta-primary" download>
          Download PesaFlow Now <ArrowRight className="cta-arrow" size={20} style={{ marginLeft: '8px' }} />
        </a>
        <p style={{ marginTop: '20px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Zap size={16} /> Fast setup • Works Offline • Secure
        </p>
      </section>

      {/* Sticky Bottom CTA */}
      <div className="sticky-cta">
        <a href="/downloads/PesaFlow.apk" className="cta-primary sticky-btn" download>
          Download APK <ArrowRight size={18} style={{ marginLeft: '8px' }} />
        </a>
      </div>

      {/* Simple Footer */}
      <footer style={{ padding: '40px 20px', textAlign: 'center', borderTop: '1px solid #E2E8F0', color: '#94a3b8', fontSize: '0.875rem' }}>
        <p>&copy; {new Date().getFullYear()} PesaFlow Business. All rights reserved.</p>
        <p style={{ marginTop: '8px' }}>Made for Uganda 🇺🇬</p>
      </footer>
    </div>
  );
};

export default LandingPage;
