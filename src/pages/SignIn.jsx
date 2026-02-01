import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, UserPlus, Chrome } from 'lucide-react';
import './SignIn.css';

const SignIn = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { signInWithGoogle, signInWithEmail, signUp } = useAuth();

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await signInWithEmail(email, password);
            } else {
                await signUp(email, password);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        try {
            await signInWithGoogle();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="signin-container">
            <div className="signin-card">
                <div className="signin-header">
                    <div className="logo-badge">
                        <LogIn size={32} color="white" />
                    </div>
                    <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                    <p>{isLogin ? 'Sign in to sync your business data' : 'Start tracking your business metrics today'}</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleEmailAuth} className="auth-form">
                    <div className="form-group">
                        <label><Mail size={16} /> Email Address</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label><Lock size={16} /> Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="primary-auth-btn">
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <div className="divider">
                    <span>or continue with</span>
                </div>

                <button onClick={handleGoogleSignIn} className="google-btn">
                    <Chrome size={20} />
                    Google
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
