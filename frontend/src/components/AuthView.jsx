import React, { useState } from 'react';
import { Shield, Mail, User, Lock, Eye, EyeOff, KeyRound, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function AuthView({ onAuthSuccess, addToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    usernameOrEmail: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleValidate = () => {
    if (isLogin) {
      if (!formData.usernameOrEmail || !formData.password) {
        addToast('Please fill in all fields', 'error');
        return false;
      }
    } else {
      if (!formData.username || !formData.email || !formData.password) {
        addToast('Please fill in all fields', 'error');
        return false;
      }
      if (formData.password.length < 6) {
        addToast('Password must be at least 6 characters long', 'error');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        addToast('Please enter a valid email address', 'error');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!handleValidate()) return;

    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin
      ? { usernameOrEmail: formData.usernameOrEmail, password: formData.password }
      : { username: formData.username, email: formData.email, password: formData.password };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      addToast(data.message || 'Success!', 'success');

      if (isLogin) {
        onAuthSuccess(data.user, data.accessToken, data.refreshToken);
      } else {
        setIsLogin(true);
        setFormData({ username: '', email: '', password: '', usernameOrEmail: '' });
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-auth-wrapper">
      <div className="glass-card reveal-up app-auth-card">
        {/* Left Side: Forms */}
        <div className="reveal-up delay-1 app-form-section">
          <div style={styles.header}>
            <div style={styles.logoContainer}>
              <Shield size={26} color="var(--primary)" />
            </div>
            <h2 className="text-gradient-gold" style={styles.title}>
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p style={styles.subtitle}>
              {isLogin ? 'Log in to manage your internship project' : 'Register your developer account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {isLogin ? (
              <div className="form-group reveal-up delay-2">
                <label htmlFor="usernameOrEmail">Username or Email</label>
                <div style={styles.inputWrapper}>
                  <Mail size={18} style={styles.inputIcon} />
                  <input
                    type="text"
                    id="usernameOrEmail"
                    name="usernameOrEmail"
                    className="form-input"
                    placeholder="Enter username or email"
                    value={formData.usernameOrEmail}
                    onChange={handleInputChange}
                    style={styles.paddedInput}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="form-group reveal-up delay-2">
                  <label htmlFor="username">Username</label>
                  <div style={styles.inputWrapper}>
                    <User size={18} style={styles.inputIcon} />
                    <input
                      type="text"
                      id="username"
                      name="username"
                      className="form-input"
                      placeholder="dev_intern"
                      value={formData.username}
                      onChange={handleInputChange}
                      style={styles.paddedInput}
                    />
                  </div>
                </div>

                <div className="form-group reveal-up delay-2">
                  <label htmlFor="email">Email address</label>
                  <div style={styles.inputWrapper}>
                    <Mail size={18} style={styles.inputIcon} />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-input"
                      placeholder="intern@company.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      style={styles.paddedInput}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="form-group reveal-up delay-3">
              <label htmlFor="password">Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  style={styles.passwordInput}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="neon-btn reveal-up delay-4" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={styles.switchView} className="reveal-up delay-4">
            <p>
              {isLogin ? "New to the portal?" : "Already have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                style={styles.switchBtn}
              >
                {isLogin ? 'Register Here' : 'Log In Here'}
              </button>
            </p>
          </div>
        </div>

        {/* Right Side: Visual Brand & Animated Svgator Illustration */}
        <div className="reveal-up delay-2 app-info-section">
          {/* Animated SVG Credential Vault (Svgator Style) */}
          <div style={styles.svgContainer}>
            <svg width="220" height="220" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="40%" stopColor="#f7dca4" />
                  <stop offset="100%" stopColor="#c59740" />
                </linearGradient>
                <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#5c67f2" />
                </linearGradient>
              </defs>
              
              {/* Back ambient pulse glow */}
              <circle cx="110" cy="110" r="90" fill="url(#glowGrad)" className="animate-pulse-gold" />
              
              {/* Outer rotating dial ring */}
              <circle cx="110" cy="110" r="80" stroke="url(#goldGrad)" strokeWidth="1" strokeDasharray="12 25" fill="none" className="animate-spin-slow" style={{ transformOrigin: '110px 110px' }} />
              
              {/* Inner tech concentric ring */}
              <circle cx="110" cy="110" r="64" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" fill="none" />
              
              {/* Secondary rotating nodes */}
              <g className="animate-spin-slow" style={{ transformOrigin: '110px 110px', animationDirection: 'reverse', animationDuration: '30s' }}>
                <circle cx="110" cy="46" r="3" fill="#5c67f2" />
                <circle cx="174" cy="110" r="3" fill="#dfb76c" />
                <circle cx="110" cy="174" r="3" fill="#5c67f2" />
                <circle cx="46" cy="110" r="3" fill="#dfb76c" />
              </g>

              {/* 3D-Look padlock vault graphic */}
              <g className="animate-float" style={{ transformOrigin: '110px 110px' }}>
                {/* Lock shackle */}
                <path d="M85 105 V85 C85 71.1929 96.1929 60 110 60 C123.807 60 135 71.1929 135 85 V105" stroke="url(#goldGrad)" strokeWidth="5" strokeLinecap="round" fill="none" />
                
                {/* Lock Body */}
                <rect x="75" y="100" width="70" height="52" rx="10" fill="#0d1425" stroke="url(#goldGrad)" strokeWidth="2" />
                
                {/* Embedded lock core */}
                <circle cx="110" cy="122" r="7" fill="url(#indigoGrad)" />
                <path d="M110 128 V142" stroke="url(#indigoGrad)" strokeWidth="3" strokeLinecap="round" />
              </g>
            </svg>
          </div>

          <h3 className="text-gradient-gold" style={styles.infoTitle}>Secure Auth Engine</h3>
          <p style={styles.infoText}>
            This developer portal implements rotated Refresh Tokens and JSON Web Tokens for secure session persistence.
          </p>

          <div style={styles.featureList}>
            <div style={styles.featureItem}>
              <div style={styles.goldBullet} />
              <p style={styles.featureDesc}>
                <strong>Short-lived access keys</strong> to restrict unauthorized access windows.
              </p>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.goldBullet} />
              <p style={styles.featureDesc}>
                <strong>Cryptographic rotation</strong> refreshing token families upon every active load.
              </p>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.goldBullet} />
              <p style={styles.featureDesc}>
                <strong>Session validation records</strong> with database-backed revoke registers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  authWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '24px',
  },
  authCard: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    width: '100%',
    maxWidth: '960px',
    overflow: 'hidden',
    border: '1px solid rgba(223, 183, 108, 0.08)',
  },
  formSection: {
    padding: '50px 48px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    borderRight: '1px solid rgba(223, 183, 108, 0.04)',
  },
  header: {
    marginBottom: '32px',
  },
  logoContainer: {
    display: 'inline-flex',
    padding: '10px',
    background: 'rgba(223, 183, 108, 0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(223, 183, 108, 0.12)',
    marginBottom: '18px',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '8px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    lineHeight: '1.4',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  paddedInput: {
    paddingLeft: '44px',
  },
  passwordInput: {
    paddingLeft: '44px',
    paddingRight: '44px',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
  },
  submitBtn: {
    marginTop: '12px',
    width: '100%',
  },
  switchView: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontWeight: '700',
    cursor: 'pointer',
    padding: '0 4px',
    fontFamily: 'var(--font-sans)',
  },
  infoSection: {
    padding: '50px 48px',
    background: 'rgba(6, 9, 17, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgContainer: {
    marginBottom: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: '1.35rem',
    marginBottom: '10px',
    textAlign: 'center',
  },
  infoText: {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    marginBottom: '28px',
    textAlign: 'center',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
  },
  featureItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  goldBullet: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--primary)',
    boxShadow: '0 0 6px var(--primary-glow)',
    marginTop: '6px',
    flexShrink: 0,
  },
  featureDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.825rem',
    lineHeight: '1.4',
  },
};
