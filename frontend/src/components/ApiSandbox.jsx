import React, { useState, useEffect } from 'react';
import { Send, Key, RefreshCw, Layers } from 'lucide-react';

export default function ApiSandbox({ token, refreshToken, onAuthSuccess, addToast }) {
  const [selectedEndpoint, setSelectedEndpoint] = useState('/login');
  const [requestBody, setRequestBody] = useState('');
  const [headers, setHeaders] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Console Outputs
  const [responseStatus, setResponseStatus] = useState(null);
  const [responseHeaders, setResponseHeaders] = useState(null);
  const [responseBody, setResponseBody] = useState(null);

  // Decoded JWT Data
  const [decodedToken, setDecodedToken] = useState(null);

  const endpoints = {
    '/register': {
      method: 'POST',
      defaultBody: JSON.stringify({
        username: 'test_user',
        email: 'test@example.com',
        password: 'password123'
      }, null, 2),
      description: 'Creates a new user account with a secure bcrypt-hashed password.'
    },
    '/login': {
      method: 'POST',
      defaultBody: JSON.stringify({
        usernameOrEmail: 'test_user',
        password: 'password123'
      }, null, 2),
      description: 'Authenticates user, issues access token (body) and refresh token (body + HttpOnly cookie).'
    },
    '/refresh': {
      method: 'POST',
      defaultBody: '',
      description: 'Rotates current refresh token and issues a new access token + refresh token pair.'
    },
    '/logout': {
      method: 'POST',
      defaultBody: '',
      description: 'Revokes the active refresh token in the database and clears authentication cookies.'
    },
    '/me': {
      method: 'GET',
      defaultBody: '',
      description: 'Protected profile route. Requires a valid JWT access token passed via Authorization headers.'
    }
  };

  useEffect(() => {
    const config = endpoints[selectedEndpoint];
    if (selectedEndpoint === '/refresh') {
      setRequestBody(JSON.stringify({ refreshToken: refreshToken || 'no_active_refresh_token_in_memory' }, null, 2));
    } else if (selectedEndpoint === '/logout') {
      setRequestBody(JSON.stringify({ refreshToken: refreshToken || '' }, null, 2));
    } else {
      setRequestBody(config.defaultBody);
    }

    const head = { 'Content-Type': 'application/json' };
    if (selectedEndpoint === '/me') {
      head['Authorization'] = token ? `Bearer ${token.substring(0, 15)}...` : 'Bearer <login_first_to_obtain_token>';
    }
    setHeaders(head);
  }, [selectedEndpoint, token, refreshToken]);

  const decodeJwt = (jwtString) => {
    try {
      const parts = jwtString.split('.');
      if (parts.length !== 3) return null;
      
      const payloadBase64 = parts[1];
      const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const decodedStr = atob(normalized);
      const payload = JSON.parse(decodedStr);
      
      const headerBase64 = parts[0];
      const headerDecoded = JSON.parse(atob(headerBase64.replace(/-/g, '+').replace(/_/g, '/')));
      
      return {
        header: headerDecoded,
        payload: payload,
        signature: parts[2].substring(0, 16) + '...'
      };
    } catch (e) {
      console.error('JWT Decoding error', e);
      return null;
    }
  };

  const handleSendRequest = async () => {
    setLoading(true);
    setResponseStatus(null);
    setResponseHeaders(null);
    setResponseBody(null);
    setDecodedToken(null);

    const endpointUrl = `http://localhost:5000/api/auth${selectedEndpoint}`;
    const method = endpoints[selectedEndpoint].method;
    const reqHeaders = { 'Content-Type': 'application/json' };
    
    if (selectedEndpoint === '/me' && token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers: reqHeaders
    };

    if (method !== 'GET' && requestBody) {
      try {
        options.body = JSON.stringify(JSON.parse(requestBody));
      } catch (err) {
        addToast('Invalid JSON in request body', 'error');
        setLoading(false);
        return;
      }
    }

    try {
      const startTime = performance.now();
      const response = await fetch(endpointUrl, options);
      const endTime = performance.now();

      setResponseStatus({
        code: response.status,
        text: response.statusText,
        time: `${Math.round(endTime - startTime)}ms`
      });

      const resHead = {};
      response.headers.forEach((val, key) => {
        resHead[key] = val;
      });
      setResponseHeaders(resHead);

      const json = await response.json();
      setResponseBody(json);

      if (response.ok) {
        if (selectedEndpoint === '/login' && json.accessToken) {
          onAuthSuccess(json.user, json.accessToken, json.refreshToken);
        } else if (selectedEndpoint === '/refresh' && json.accessToken) {
          onAuthSuccess(null, json.accessToken, json.refreshToken);
        } else if (selectedEndpoint === '/logout') {
          onAuthSuccess(null, '', '');
        }
        
        if (json.accessToken) {
          const decoded = decodeJwt(json.accessToken);
          setDecodedToken(decoded);
        }
      }
    } catch (error) {
      addToast(error.message, 'error');
      setResponseBody({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="reveal-up">
      <div style={styles.splitGrid}>
        
        {/* Request Setup Panel */}
        <div className="glass-card" style={styles.panel}>
          <div style={styles.panelHeader}>
            {/* Animated Terminal SVG (Svgator Style) */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Code bracket console symbol */}
              <path d="M4 17L9 12L4 7" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {/* Blinking cursor block */}
              <line x1="11" y1="16" x2="18" y2="16" stroke="#5c67f2" strokeWidth="3" strokeLinecap="round" className="animate-pulse-gold" />
            </svg>
            <span style={styles.panelTitle}>API Request Panel</span>
          </div>

          <div style={styles.panelBody}>
            {/* Endpoint Selector */}
            <div className="form-group">
              <label>Select API Endpoint</label>
              <div style={styles.endpointSelectRow}>
                <span style={{
                  ...styles.methodBadge,
                  color: endpoints[selectedEndpoint].method === 'POST' ? 'var(--primary)' : 'var(--secondary)',
                  borderColor: endpoints[selectedEndpoint].method === 'POST' ? 'rgba(223, 183, 108, 0.2)' : 'rgba(92, 103, 242, 0.2)'
                }}>
                  {endpoints[selectedEndpoint].method}
                </span>
                <select
                  value={selectedEndpoint}
                  onChange={(e) => setSelectedEndpoint(e.target.value)}
                  style={styles.selectInput}
                >
                  <option value="/register">/api/auth/register</option>
                  <option value="/login">/api/auth/login</option>
                  <option value="/refresh">/api/auth/refresh (Rotate)</option>
                  <option value="/me">/api/auth/me (Protected)</option>
                  <option value="/logout">/api/auth/logout</option>
                </select>
              </div>
              <p style={styles.endpointDesc}>{endpoints[selectedEndpoint].description}</p>
            </div>

            {/* Headers Preview */}
            <div className="form-group">
              <label>HTTP Headers</label>
              <pre style={styles.codeBlock}>
                {JSON.stringify(headers, null, 2)}
              </pre>
            </div>

            {/* Request Body Editor */}
            {endpoints[selectedEndpoint].method === 'POST' && (
              <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label>JSON Request Body</label>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  style={styles.editorTextArea}
                />
              </div>
            )}

            <button
              onClick={handleSendRequest}
              className="neon-btn spring-transition"
              style={styles.sendBtn}
              disabled={loading}
            >
              {loading ? <RefreshCw className="animate-spin-slow" size={14} /> : <Send size={14} />}
              <span>Execute API Call</span>
            </button>
          </div>
        </div>

        {/* Response / Decoder Panel */}
        <div style={styles.rightColumn}>
          {/* Response Console */}
          <div className="glass-card" style={{ ...styles.panel, minHeight: '320px' }}>
            <div style={styles.panelHeader}>
              <Layers size={16} color="var(--secondary)" />
              <span style={styles.panelTitle}>Response Output Console</span>
              {responseStatus && (
                <div style={styles.statusGroup}>
                  <span style={{
                    ...styles.statusVal,
                    color: responseStatus.code < 400 ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {responseStatus.code} {responseStatus.text}
                  </span>
                  <span style={styles.timeVal}>{responseStatus.time}</span>
                </div>
              )}
            </div>

            <div style={{ ...styles.panelBody, background: '#04060b', padding: '16px' }}>
              {responseBody ? (
                <div style={styles.responseContainer} className="reveal-up">
                  <span style={styles.reportLabel}>Response Headers</span>
                  <pre style={styles.consoleHeaders}>
                    {JSON.stringify(responseHeaders, null, 2)}
                  </pre>
                  
                  <span style={{ ...styles.reportLabel, marginTop: '12px', display: 'block' }}>Response Body JSON</span>
                  <pre style={styles.consoleBody}>
                    {JSON.stringify(responseBody, null, 2)}
                  </pre>
                </div>
              ) : (
                <div style={styles.emptyConsole}>
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '12px' }}>
                    <rect x="6" y="8" width="28" height="24" rx="4" stroke="var(--text-muted)" strokeWidth="2" />
                    <line x1="12" y1="14" x2="16" y2="14" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="18" x2="20" y2="18" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <p>Execute an API request to view details here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Decoded JWT Inspector */}
          {decodedToken && (
            <div className="glass-card reveal-up" style={styles.panel}>
              <div style={styles.panelHeader}>
                <Key size={16} color="var(--primary)" />
                <span style={styles.panelTitle}>Decoded JWT Access Token</span>
              </div>
              <div style={styles.panelBody}>
                <div style={styles.jwtSection}>
                  <span style={styles.jwtPartLabel}>Header (Algorithm & Type)</span>
                  <pre style={{ ...styles.jwtBlock, color: 'var(--primary)', borderLeftColor: 'var(--primary)' }}>
                    {JSON.stringify(decodedToken.header, null, 2)}
                  </pre>

                  <span style={styles.jwtPartLabel}>Payload (Claims / User Data)</span>
                  <pre style={{ ...styles.jwtBlock, color: 'var(--secondary)', borderLeftColor: 'var(--secondary)' }}>
                    {JSON.stringify(decodedToken.payload, null, 2)}
                  </pre>

                  <span style={styles.jwtPartLabel}>Signature Verification Hash</span>
                  <pre style={{ ...styles.jwtBlock, color: 'var(--text-muted)', borderLeftColor: 'var(--text-muted)' }}>
                    {decodedToken.signature}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
  },
  splitGrid: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 1.2fr',
    gap: '24px',
    alignItems: 'start',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid rgba(223, 183, 108, 0.06)',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 20px',
    borderBottom: '1px solid rgba(223, 183, 108, 0.05)',
    background: 'rgba(255, 255, 255, 0.01)',
  },
  panelTitle: {
    fontSize: '0.75rem',
    color: '#fff',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  statusGroup: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statusVal: {
    fontSize: '0.8rem',
    fontWeight: '700',
  },
  timeVal: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  panelBody: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  endpointSelectRow: {
    display: 'flex',
    alignItems: 'stretch',
    gap: '10px',
    marginTop: '6px',
  },
  methodBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 14px',
    border: '1px solid',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: '800',
    background: 'rgba(6, 9, 17, 0.6)',
  },
  selectInput: {
    flex: 1,
    background: 'rgba(6, 9, 17, 0.6)',
    border: '1px solid rgba(223, 183, 108, 0.1)',
    color: '#fff',
    padding: '12px',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
  },
  endpointDesc: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    marginTop: '6px',
    lineHeight: '1.4',
  },
  codeBlock: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    background: 'rgba(6, 9, 17, 0.7)',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.02)',
    color: 'var(--text-secondary)',
    overflowX: 'auto',
  },
  editorTextArea: {
    width: '100%',
    height: '140px',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    background: 'rgba(6, 9, 17, 0.7)',
    border: '1px solid rgba(223, 183, 108, 0.1)',
    color: 'var(--text-primary)',
    padding: '12px',
    borderRadius: '8px',
    outline: 'none',
    resize: 'none',
    lineHeight: '1.5',
    transition: 'border-color 0.2s ease',
  },
  sendBtn: {
    width: '100%',
    padding: '12px',
    fontSize: '0.85rem',
  },
  emptyConsole: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '240px',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
  },
  responseContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  reportLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '6px',
    fontWeight: '700',
  },
  consoleHeaders: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    background: 'rgba(255, 255, 255, 0.01)',
    padding: '10px',
    borderRadius: '6px',
    overflowX: 'auto',
    border: '1px solid rgba(255, 255, 255, 0.01)',
  },
  consoleBody: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    color: 'var(--primary)',
    background: 'rgba(255, 255, 255, 0.01)',
    padding: '12px',
    borderRadius: '6px',
    overflowX: 'auto',
    border: '1px solid rgba(255, 255, 255, 0.01)',
  },
  jwtSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  jwtPartLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    fontWeight: '700',
  },
  jwtBlock: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    background: 'rgba(6, 9, 17, 0.6)',
    padding: '12px',
    borderRadius: '6px',
    borderLeft: '3px solid',
    overflowX: 'auto',
  },
};
