import React, { useState, useEffect } from 'react';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import ProjectDocs from './components/ProjectDocs';
import Submissions from './components/Submissions';
import ApiSandbox from './components/ApiSandbox';
import { CheckCircle2, ShieldCheck, FolderGit2, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from './config';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  
  // Overview metrics state
  const [stats, setStats] = useState({
    docsViewed: false,
    sandboxUsed: false,
    hasSubmissions: false,
    submissionCount: 0
  });

  // Global Alert/Toast System
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Restore session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    const storedToken = localStorage.getItem('auth_token');
    const storedRefreshToken = localStorage.getItem('auth_refresh_token');
    
    // Recovery stats tracking
    const viewed = localStorage.getItem('stat_docs_viewed') === 'true';
    const sandbox = localStorage.getItem('stat_sandbox_used') === 'true';
    
    setStats(prev => ({
      ...prev,
      docsViewed: viewed,
      sandboxUsed: sandbox
    }));

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      if (storedRefreshToken) setRefreshToken(storedRefreshToken);
    }
  }, []);

  // Update submission state in background when tab switches or token changes
  useEffect(() => {
    if (!token) return;
    const checkSubmissions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/submissions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const count = data.submissions?.length || 0;
          setStats(prev => ({
            ...prev,
            hasSubmissions: count > 0,
            submissionCount: count
          }));
        }
      } catch (err) {
        console.error('Quietly failed to fetch submissions count', err);
      }
    };
    checkSubmissions();
  }, [token, activeTab]);

  // Track documentation views
  useEffect(() => {
    if (activeTab === 'project-docs' && !stats.docsViewed) {
      localStorage.setItem('stat_docs_viewed', 'true');
      setStats(prev => ({ ...prev, docsViewed: true }));
    }
  }, [activeTab, stats.docsViewed]);

  const handleAuthSuccess = (userData, accessToken, refreshTokenData) => {
    if (userData) {
      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
    }
    
    if (accessToken) {
      setToken(accessToken);
      localStorage.setItem('auth_token', accessToken);
    }

    if (refreshTokenData) {
      setRefreshToken(refreshTokenData);
      localStorage.setItem('auth_refresh_token', refreshTokenData);
      
      if (activeTab === 'sandbox') {
        localStorage.setItem('stat_sandbox_used', 'true');
        setStats(prev => ({ ...prev, sandboxUsed: true }));
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
    } catch (err) {
      console.error('Logout API failure', err);
    } finally {
      setUser(null);
      setToken('');
      setRefreshToken('');
      setActiveTab('dashboard');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_refresh_token');
      addToast('Logged out successfully', 'info');
    }
  };

  const executeRefresh = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      handleAuthSuccess(null, data.accessToken, data.refreshToken);
      addToast('Authorization tokens rotated successfully', 'success');
      return data.accessToken;
    } catch (error) {
      addToast('Session expired. Please log in again.', 'error');
      handleLogout();
      return null;
    }
  };

  return (
    <>
      {/* Toast Alert System */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button 
              onClick={() => removeToast(toast.id)} 
              style={{ background: 'none', border: 'none', color: '#fff', marginLeft: 'auto', cursor: 'pointer', fontSize: '1rem' }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Main View Router */}
      {!user ? (
        <AuthView onAuthSuccess={handleAuthSuccess} addToast={addToast} />
      ) : (
        <DashboardView 
          user={user} 
          onLogout={handleLogout} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
        >
          {/* Dashboard Overview Panel */}
          {activeTab === 'dashboard' && (
            <div style={styles.overviewContainer} className="reveal-up">
              <div style={styles.grid}>
                
                {/* Left Overview Column */}
                <div style={styles.leftColumn} className="reveal-up delay-1">
                  <div className="glass-card" style={styles.card}>
                    <h3 className="text-gradient-gold" style={styles.cardTitle}>Internship Milestone Status</h3>
                    <p style={styles.cardSubtitle}>Track your progress for the current backend assignment</p>
                    
                    <div style={styles.milestonesList}>
                      {/* Milestone 1 */}
                      <div style={styles.milestoneItem}>
                        <div style={{
                          ...styles.checkIndicator,
                          borderColor: stats.docsViewed ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                          background: stats.docsViewed ? 'rgba(223, 183, 108, 0.04)' : 'none'
                        }} className="spring-transition">
                          {stats.docsViewed && <CheckCircle2 size={14} color="var(--primary)" />}
                        </div>
                        <div style={styles.milestoneDetails}>
                          <h4 style={styles.milestoneTitle}>Review Project Specifications</h4>
                          <p style={styles.milestoneDesc}>Read and inspect documentation for JWT Auth Assignment</p>
                          <button onClick={() => setActiveTab('project-docs')} style={styles.textLink} className="spring-transition">
                            View specifications &rarr;
                          </button>
                        </div>
                      </div>

                      {/* Milestone 2 */}
                      <div style={styles.milestoneItem}>
                        <div style={{
                          ...styles.checkIndicator,
                          borderColor: stats.sandboxUsed ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                          background: stats.sandboxUsed ? 'rgba(223, 183, 108, 0.04)' : 'none'
                        }} className="spring-transition">
                          {stats.sandboxUsed && <CheckCircle2 size={14} color="var(--primary)" />}
                        </div>
                        <div style={styles.milestoneDetails}>
                          <h4 style={styles.milestoneTitle}>Test APIs in Sandbox</h4>
                          <p style={styles.milestoneDesc}>Perform live backend endpoints testing and token rotation simulations</p>
                          <button onClick={() => setActiveTab('sandbox')} style={styles.textLink} className="spring-transition">
                            Open visual playground &rarr;
                          </button>
                        </div>
                      </div>

                      {/* Milestone 3 */}
                      <div style={styles.milestoneItem}>
                        <div style={{
                          ...styles.checkIndicator,
                          borderColor: stats.hasSubmissions ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                          background: stats.hasSubmissions ? 'rgba(223, 183, 108, 0.04)' : 'none'
                        }} className="spring-transition">
                          {stats.hasSubmissions && <CheckCircle2 size={14} color="var(--primary)" />}
                        </div>
                        <div style={styles.milestoneDetails}>
                          <h4 style={styles.milestoneTitle}>Submit Project Archive</h4>
                          <p style={styles.milestoneDesc}>Upload your completed Express project directory packed as a ZIP file</p>
                          <button onClick={() => setActiveTab('submissions')} style={styles.textLink} className="spring-transition">
                            Go to uploader &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Statistics Column */}
                <div style={styles.rightColumn} className="reveal-up delay-2">
                  {/* Status Card */}
                  <div className="glass-card" style={{ ...styles.card, ...styles.accentCard }}>
                    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '16px' }}>
                      <defs>
                        <linearGradient id="shieldGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="65%" stopColor="var(--primary)" />
                          <stop offset="100%" stopColor="#c59740" />
                        </linearGradient>
                      </defs>
                      <circle cx="22" cy="22" r="19" stroke="var(--primary)" strokeWidth="1" strokeDasharray="4 6" className="animate-spin-slow" style={{ transformOrigin: '22px 22px', animationDuration: '12s' }} />
                      <circle cx="22" cy="22" r="14" fill="var(--primary-glow)" className="animate-pulse-gold" />
                      <path d="M22 8C27 8 31 10 31 10C31 10 31 19 28 25C25 30 22 34 22 34C22 34 19 30 16 25C13 19 13 10 13 10C13 10 17 8 22 8Z" stroke="url(#shieldGoldGrad)" strokeWidth="2" fill="rgba(6, 9, 17, 0.4)" strokeLinejoin="round" />
                      <path d="M18 20L21 23L26 17" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <h3 className="text-gradient-gold" style={styles.cardTitle}>Security Rating</h3>
                    <p style={styles.statusDescription}>
                      Your portal session is secure. Local authorization tokens are short-lived.
                    </p>
                    <div style={styles.tokenStatusRow}>
                      <span style={styles.tokenLabel}>Access Token:</span>
                      <span style={styles.tokenValue}>ACTIVE (15m expiry)</span>
                    </div>
                    <div style={styles.tokenStatusRow}>
                      <span style={styles.tokenLabel}>Refresh Token:</span>
                      <span style={styles.tokenValue}>ACTIVE (7d rotation)</span>
                    </div>
                    <button onClick={executeRefresh} className="neon-btn secondary spring-transition" style={styles.manualRefreshBtn}>
                      <RefreshCw size={12} style={{ marginRight: '6px' }} /> Force Token Refresh
                    </button>
                  </div>

                  {/* Summary Card */}
                  <div className="glass-card reveal-up delay-3" style={styles.card}>
                    <FolderGit2 size={22} color="var(--primary)" style={{ marginBottom: '12px' }} />
                    <h4 style={styles.summaryTitle}>Upload Count</h4>
                    <p style={styles.summaryMetric} className="text-gradient-gold">{stats.submissionCount}</p>
                    <p style={styles.summaryInfo}>
                      {stats.hasSubmissions 
                        ? "Your latest submission has been validated." 
                        : "Upload a zip archive to register your work."
                      }
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'project-docs' && <ProjectDocs addToast={addToast} />}
          {activeTab === 'submissions' && <Submissions token={token} addToast={addToast} />}
          {activeTab === 'sandbox' && (
            <ApiSandbox 
              token={token} 
              refreshToken={refreshToken} 
              onAuthSuccess={handleAuthSuccess} 
              addToast={addToast} 
            />
          )}
        </DashboardView>
      )}
    </>
  );
}

const styles = {
  overviewContainer: {
    maxWidth: '1000px',
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '24px',
    alignItems: 'start',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  card: {
    padding: '24px 30px',
    border: '1px solid rgba(223, 183, 108, 0.05)',
  },
  accentCard: {
    background: 'linear-gradient(135deg, rgba(223, 183, 108, 0.02) 0%, rgba(92, 103, 242, 0.02) 100%)',
    borderColor: 'rgba(223, 183, 108, 0.12)',
  },
  cardTitle: {
    fontSize: '1.15rem',
    fontWeight: '750',
    marginBottom: '6px',
  },
  cardSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.825rem',
    marginBottom: '24px',
  },
  milestonesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  milestoneItem: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  checkIndicator: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '2px',
    flexShrink: 0,
  },
  milestoneDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  milestoneTitle: {
    fontSize: '0.9rem',
    color: '#fff',
    fontWeight: '600',
  },
  milestoneDesc: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
    lineHeight: '1.4',
  },
  textLink: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'left',
    marginTop: '8px',
    padding: 0,
    fontFamily: 'var(--font-sans)',
  },
  statusDescription: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    marginBottom: '20px',
  },
  tokenStatusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.78rem',
    padding: '8px 0',
    borderBottom: '1px solid rgba(223, 183, 108, 0.04)',
  },
  tokenLabel: {
    color: 'var(--text-muted)',
  },
  tokenValue: {
    color: 'var(--primary)',
    fontWeight: '700',
  },
  manualRefreshBtn: {
    marginTop: '20px',
    width: '100%',
    padding: '10px',
    fontSize: '0.8rem',
  },
  summaryTitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: '700',
  },
  summaryMetric: {
    fontSize: '2rem',
    fontWeight: '800',
    margin: '10px 0 6px 0',
    fontFamily: 'var(--font-display)',
  },
  summaryInfo: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
  },
};
