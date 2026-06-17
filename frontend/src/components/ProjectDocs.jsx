import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, Award, BookOpen, ExternalLink, Loader } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function ProjectDocs({ addToast }) {
  const [projectInfo, setProjectInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/project/info`);
        if (!response.ok) {
          throw new Error('Failed to fetch project specifications');
        }
        const data = await response.json();
        setProjectInfo(data);
      } catch (error) {
        addToast(error.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [addToast]);

  const handleDownloadDoc = () => {
    if (!projectInfo) return;
    
    const content = `
=========================================================
${projectInfo.title.toUpperCase()}
=========================================================

INTRODUCTION:
${projectInfo.introduction}

OBJECTIVES:
${projectInfo.objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}

EXPECTED DELIVERABLES:
${projectInfo.deliverables.map((d, i) => `- ${d}`).join('\n')}

EVALUATION CRITERIA:
${projectInfo.evaluationCriteria.map((c, i) => `- ${c}`).join('\n')}

REFERENCES:
${projectInfo.references.map(r => `- ${r.name}: ${r.url}`).join('\n')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Authentication_APIs_Assignment.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('Project instructions downloaded successfully', 'success');
  };

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <Loader className="animate-spin-slow" size={36} color="var(--primary)" />
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading project specifications...</p>
      </div>
    );
  }

  if (!projectInfo) {
    return (
      <div style={styles.errorContainer} className="glass-card">
        <p>Could not load project information. Please make sure the backend server is running.</p>
      </div>
    );
  }

  return (
    <div style={styles.container} className="reveal-up">
      {/* Doc Card */}
      <div className="glass-card" style={styles.docCard}>
        {/* Doc Header */}
        <div style={styles.docHeader}>
          <div style={styles.headerTitleRow}>
            {/* Animated Document Scanner SVG (Svgator Style) */}
            <div style={styles.iconBox}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="goldGradSvg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="var(--primary)" />
                  </linearGradient>
                </defs>
                {/* Paper sheet */}
                <path d="M12 8 C12 6.89543 12.8954 6 14 6 H22 L28 12 V32 C28 33.1046 27.1046 34 26 34 H14 C12.8954 34 12 33.1046 12 32 V8 Z" stroke="url(#goldGradSvg)" strokeWidth="1.5" fill="none" />
                {/* Folded corner */}
                <path d="M22 6 V12 H28" stroke="url(#goldGradSvg)" strokeWidth="1.5" fill="none" />
                {/* Mock lines */}
                <line x1="16" y1="16" x2="24" y2="16" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                <line x1="16" y1="20" x2="24" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                <line x1="16" y1="24" x2="20" y2="24" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                {/* Scanning green/indigo line */}
                <g className="animate-scan-line">
                  <line x1="10" y1="10" x2="30" y2="10" stroke="var(--secondary)" strokeWidth="2" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 4px var(--secondary-glow))' }} />
                </g>
              </svg>
            </div>
            <div>
              <h3 className="text-gradient-gold" style={styles.title}>{projectInfo.title}</h3>
              <p style={styles.meta}>Required • Node.js, Express, MongoDB, JWT</p>
            </div>
          </div>
          <button onClick={handleDownloadDoc} className="neon-btn" style={styles.downloadBtn}>
            <Download size={16} />
            <span>Download Instructions</span>
          </button>
        </div>

        {/* Doc Body */}
        <div style={styles.docBody}>
          {/* Section: Intro */}
          <section style={styles.section} className="reveal-up delay-1">
            <h4 style={styles.sectionTitle}>1. Introduction</h4>
            <p style={styles.text}>{projectInfo.introduction}</p>
          </section>

          {/* Section: Objectives */}
          <section style={styles.section} className="reveal-up delay-2">
            <h4 style={styles.sectionTitle}>2. Project Objectives</h4>
            <div style={styles.objectivesList}>
              {projectInfo.objectives.map((objective, index) => (
                <div key={index} style={styles.objectiveItem}>
                  <CheckCircle size={16} color="var(--primary)" style={{ marginTop: '3px', flexShrink: 0 }} />
                  <span style={styles.text}>{objective}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Deliverables */}
          <section style={styles.section} className="reveal-up delay-3">
            <h4 style={styles.sectionTitle}>3. Expected Deliverables</h4>
            <div style={styles.deliverablesList}>
              {projectInfo.deliverables.map((deliverable, index) => (
                <div key={index} style={styles.deliverableItem}>
                  <div style={styles.bulletPoint} />
                  <span style={styles.text}>{deliverable}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Evaluation */}
          <section style={styles.section} className="reveal-up delay-4">
            <h4 style={styles.sectionTitle}>4. Evaluation Criteria</h4>
            <div style={styles.evaluationList}>
              {projectInfo.evaluationCriteria.map((criteria, index) => (
                <div key={index} style={styles.evaluationItem}>
                  <Award size={16} color="var(--secondary)" style={{ marginTop: '3px', flexShrink: 0 }} />
                  <span style={styles.text}>{criteria}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Section: References */}
          <section style={styles.sectionNoBorder} className="reveal-up delay-4">
            <h4 style={styles.sectionTitle}>5. References & Resources</h4>
            <div style={styles.referencesList}>
              {projectInfo.references.map((ref, index) => (
                <a
                  key={index}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.refLink}
                  className="glass-card spring-transition"
                >
                  <BookOpen size={16} color="var(--primary)" />
                  <div style={styles.refInfo}>
                    <span style={styles.refName}>{ref.name}</span>
                    <span style={styles.refUrl}>{ref.url}</span>
                  </div>
                  <ExternalLink size={14} color="var(--text-muted)" />
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 0',
  },
  errorContainer: {
    padding: '24px',
    color: 'var(--danger)',
    textAlign: 'center',
  },
  docCard: {
    border: '1px solid rgba(223, 183, 108, 0.06)',
  },
  docHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 32px',
    borderBottom: '1px solid rgba(223, 183, 108, 0.05)',
    gap: '20px',
    flexWrap: 'wrap',
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'rgba(223, 183, 108, 0.03)',
    border: '1px solid rgba(223, 183, 108, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: '700',
  },
  meta: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  downloadBtn: {
    padding: '10px 18px',
    fontSize: '0.8rem',
  },
  docBody: {
    padding: '32px',
  },
  section: {
    marginBottom: '28px',
    paddingBottom: '24px',
    borderBottom: '1px solid rgba(223, 183, 108, 0.03)',
  },
  sectionNoBorder: {
    marginBottom: '0',
  },
  sectionTitle: {
    fontSize: '0.95rem',
    color: '#fff',
    marginBottom: '14px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  text: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    lineHeight: '1.6',
  },
  objectivesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  objectiveItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  deliverablesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  deliverableItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  bulletPoint: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--primary)',
    boxShadow: '0 0 6px var(--primary-glow)',
    flexShrink: 0,
  },
  evaluationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  evaluationItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  referencesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  refLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    textDecoration: 'none',
    border: '1px solid rgba(223, 183, 108, 0.04)',
    background: 'rgba(255, 255, 255, 0.01)',
  },
  refInfo: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  refName: {
    fontSize: '0.85rem',
    color: '#fff',
    fontWeight: '600',
  },
  refUrl: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
};
