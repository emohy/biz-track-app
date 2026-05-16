import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, UserPlus, Chrome } from 'lucide-react';
import './SignIn.css';

import logoFull from '../assets/branding/logo-full.jpeg';

const SignIn = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { loginWithGoogle, login, signup } = useAuth();

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        try {
            await loginWithGoogle();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="signin-container">
            <div className="signin-card">
                <div className="signin-header">
                    <div className="logo-wrapper">
                        <img src={logoFull} alt="PesaFlow" />
                    </div>
                    <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                    <p>{isLogin ? 'Manage your business with ease' : 'Join thousands of Ugandan business owners'}</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleEmailAuth} className="auth-form">
                    <div className="input-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={18} />
                            <input
                                type="email"
                                placeholder="name@business.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="primary-auth-btn">
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="divider">
                    <span>or continue with</span>
                </div>

                <button onClick={handleGoogleSignIn} className="google-btn">
                    <Chrome size={20} />
                    Continue with Google
                </button>

                <div className="auth-toggle">
                    {isLogin ? (
                        <>
                            Don't have an account?{' '}
                            <button onClick={() => setIsLogin(false)}>Sign Up</button>
                        </>
                    ) : (
                        <>
                            Already have an account?{' '}
                            <button onClick={() => setIsLogin(true)}>Sign In</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SignIn;
