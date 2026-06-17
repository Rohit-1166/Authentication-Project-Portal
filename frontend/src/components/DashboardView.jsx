import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, UploadCloud, Terminal, LogOut, User, Clock, CheckSquare } from 'lucide-react';

export default function DashboardView({ user, onLogout, activeTab, setActiveTab, children }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Persistent Deadline System
  useEffect(() => {
    let deadlineStr = localStorage.getItem('project_deadline');
    if (!deadlineStr) {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      deadlineStr = sevenDaysFromNow.toISOString();
      localStorage.setItem('project_deadline', deadlineStr);
    }

    const deadline = new Date(deadlineStr);

    const updateTimer = () => {
      const now = new Date();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const formatNumber = (num) => String(num).padStart(2, '0');

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'project-docs', label: 'Project Info', icon: <FileText size={18} /> },
    { id: 'submissions', label: 'Submissions', icon: <UploadCloud size={18} /> },
    { id: 'sandbox', label: 'API Sandbox', icon: <Terminal size={18} /> },
  ];

  return (
    <div style={styles.dashboardContainer}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader} className="reveal-up">
          <div style={styles.logoCircle}>IP</div>
          <div>
            <h1 style={styles.brandTitle}>Portal</h1>
            <p style={styles.brandSubtitle}>Authentication Project</p>
          </div>
        </div>

        <nav style={styles.navMenu} className="reveal-up delay-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                ...styles.navItem,
                ...(activeTab === item.id ? styles.navItemActive : {}),
              }}
              className="spring-transition"
            >
              <span style={activeTab === item.id ? { color: 'var(--primary)' } : {}}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={styles.sidebarFooter} className="reveal-up delay-2">
          <div style={styles.userCard}>
            <div style={styles.avatar}>
              <User size={16} color="var(--primary)" />
            </div>
            <div style={styles.userInfo}>
              <h4 style={styles.username}>{user?.username || 'Dev Intern'}</h4>
              <p style={styles.userRole}>Software Intern</p>
            </div>
          </div>
          <button onClick={onLogout} style={styles.logoutBtn} className="spring-transition">
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Dashboard Section */}
      <main style={styles.mainContent}>
        {/* Top Header Banner / Stats */}
        <header style={styles.headerBanner} className="reveal-up">
          <div style={styles.welcomeText}>
            <h2 className="text-gradient-gold" style={styles.headerTitle}>Active Assignment</h2>
            <p style={styles.headerSubtitle}>Complete your security backend authentication project</p>
          </div>

          {/* Countdown Clock Widget */}
          <div className="glass-card reveal-up delay-1" style={styles.countdownWidget}>
            <div style={styles.countdownHeader}>
              <Clock size={14} color="var(--primary)" />
              <span>Time Remaining</span>
            </div>
            <div style={styles.timerGrid}>
              <div style={styles.timerSegment}>
                <span style={styles.timerVal}>{formatNumber(timeLeft.days)}</span>
                <span style={styles.timerLabel}>d</span>
              </div>
              <span style={styles.timerDivider}>:</span>
              <div style={styles.timerSegment}>
                <span style={styles.timerVal}>{formatNumber(timeLeft.hours)}</span>
                <span style={styles.timerLabel}>h</span>
              </div>
              <span style={styles.timerDivider}>:</span>
              <div style={styles.timerSegment}>
                <span style={styles.timerVal}>{formatNumber(timeLeft.minutes)}</span>
                <span style={styles.timerLabel}>m</span>
              </div>
              <span style={styles.timerDivider}>:</span>
              <div style={styles.timerSegment}>
                <span style={styles.timerVal}>{formatNumber(timeLeft.seconds)}</span>
                <span style={styles.timerLabel}>s</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Content */}
        <div style={styles.contentBody} className="reveal-up delay-2">
          {children}
        </div>
      </main>
    </div>
  );
}

const styles = {
  dashboardContainer: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    minHeight: '100vh',
    background: 'var(--bg-main)',
  },
  sidebar: {
    background: 'rgba(6, 9, 17, 0.4)',
    backdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(223, 183, 108, 0.05)',
    padding: '36px 20px',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '36px',
  },
  logoCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--primary), #c59740)',
    color: '#060911',
    fontWeight: '800',
    fontSize: '1.05rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 15px rgba(223, 183, 108, 0.2)',
  },
  brandTitle: {
    fontSize: '1.15rem',
    color: '#fff',
    fontWeight: '800',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.02em',
  },
  brandSubtitle: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '1px',
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '11px 14px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
  },
  navItemActive: {
    background: 'rgba(223, 183, 108, 0.05)',
    color: '#fff',
    borderLeft: '3px solid var(--primary)',
    paddingLeft: '11px',
  },
  sidebarFooter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginTop: 'auto',
    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
    paddingTop: '20px',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '4px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(223, 183, 108, 0.04)',
    border: '1px solid rgba(223, 183, 108, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  username: {
    fontSize: '0.85rem',
    color: '#fff',
    fontWeight: '600',
  },
  userRole: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    padding: '8px',
    fontWeight: '500',
    transition: 'color 0.2s ease',
    textAlign: 'left',
  },
  mainContent: {
    padding: '44px',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    maxHeight: '100vh',
  },
  headerBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    gap: '24px',
    flexWrap: 'wrap',
  },
  welcomeText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: '1.85rem',
    color: '#fff',
    marginBottom: '4px',
  },
  headerSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  },
  countdownWidget: {
    padding: '10px 18px',
    background: 'rgba(18, 27, 49, 0.2)',
    border: '1px solid rgba(223, 183, 108, 0.05)',
    minWidth: '220px',
  },
  countdownHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '6px',
    fontWeight: '700',
  },
  timerGrid: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
  },
  timerSegment: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '1px',
  },
  timerVal: {
    fontFamily: 'var(--font-mono)',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--primary)',
    textShadow: '0 0 8px rgba(223, 183, 108, 0.2)',
  },
  timerLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    marginLeft: '1px',
    fontWeight: '700',
  },
  timerDivider: {
    color: 'rgba(223, 183, 108, 0.15)',
    fontWeight: '600',
    fontSize: '1.1rem',
    paddingBottom: '2px',
  },
  contentBody: {
    flex: 1,
  },
};
