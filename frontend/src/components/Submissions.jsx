import React, { useState, useEffect, useRef } from 'react';
import { File, Trash2, Download, CheckCircle, RefreshCw, FileArchive, ChevronDown, ChevronUp, Loader, AlertCircle } from 'lucide-react';

export default function Submissions({ token, addToast }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const fileInputRef = useRef(null);

  // Validation Simulation Modal State
  const [validationModal, setValidationModal] = useState({
    isOpen: false,
    currentStep: 1,
    status: 'running', // running, success
    fileName: '',
    fileSize: 0,
    report: null
  });

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/submissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch submissions');
      }
      setSubmissions(data.submissions || []);
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSubmissions();
    }
  }, [token]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file) => {
    if (!file) return false;
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'zip') {
      addToast('Only ZIP files are supported', 'error');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast('ZIP file exceeds maximum 10MB limit', 'error');
      return false;
    }
    return true;
  };

  // Run the step-by-step verification loader simulation
  const getStepStatus = (stepNum, report) => {
    if (!report) return 'success';
    const missing = report.validationReport?.missingRequirements || [];
    const warnings = report.validationReport?.warnings || [];

    if (stepNum === 1 || stepNum === 2) return 'success';
    if (stepNum === 3) {
      return missing.includes('package.json') ? 'error' : 'success';
    }
    if (stepNum === 4) {
      return missing.some(r => r.includes('server.js') || r.includes('index.js') || r.includes('app.js')) ? 'error' : 'success';
    }
    if (stepNum === 5) {
      return warnings.length > 0 ? 'warning' : 'success';
    }
    return 'success';
  };

  // Run the step-by-step verification loader simulation
  const startValidationSimulation = (submissionDoc) => {
    let step = 1;
    const interval = setInterval(() => {
      step += 1;
      if (step <= 5) {
        setValidationModal(prev => ({ ...prev, currentStep: step }));
      } else {
        clearInterval(interval);
        const finalStatus = submissionDoc.status === 'Validated' ? 'success' : 'failed';
        setValidationModal(prev => ({ ...prev, status: finalStatus }));
        if (finalStatus === 'success') {
          addToast('Automated project validation passed!', 'success');
        } else {
          addToast('Automated project validation failed.', 'error');
        }
      }
    }, 1000);
  };

  const uploadFile = async (file) => {
    if (!validateFile(file)) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('projectFile', file);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://localhost:5000/api/submissions/upload', true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        setUploading(false);
        const responseData = JSON.parse(xhr.responseText);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          // Trigger the validation simulation modal instead of immediately saving
          setValidationModal({
            isOpen: true,
            currentStep: 1,
            status: 'running',
            fileName: file.name,
            fileSize: file.size,
            report: responseData.submission
          });
          startValidationSimulation(responseData.submission);
        } else {
          addToast(responseData.message || 'Upload failed', 'error');
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        addToast('Network error during file upload', 'error');
      };

      xhr.send(formData);
    } catch (error) {
      setUploading(false);
      addToast(error.message, 'error');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this submission?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/submissions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete submission');
      }

      addToast(data.message, 'success');
      setSubmissions(prev => prev.filter(sub => sub._id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (error) {
      addToast(error.message, 'error');
    }
  };

  const handleDownload = async (id, filename, e) => {
    e.stopPropagation();
    try {
      const response = await fetch(`http://localhost:5000/api/submissions/download/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      addToast(error.message, 'error');
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAcceptValidation = () => {
    setValidationModal(prev => ({ ...prev, isOpen: false }));
    // Refresh the submissions list once accepted!
    fetchSubmissions();
  };

  // Steps names
  const steps = [
    "Checking ZIP archive integrity...",
    "Scanning repository file tree...",
    "Verifying package configuration (package.json)...",
    "Parsing server index files (server.js)...",
    "Running static dependency security check..."
  ];

  return (
    <div style={styles.container} className="reveal-up">
      
      {/* Upload Zone */}
      <div 
        className="glass-card" 
        style={{
          ...styles.dropZone,
          borderColor: dragActive ? 'var(--primary)' : 'rgba(223, 183, 108, 0.12)',
          boxShadow: dragActive ? '0 0 20px rgba(223, 183, 108, 0.1)' : 'var(--shadow-lg)',
          background: dragActive ? 'rgba(223, 183, 108, 0.03)' : 'rgba(20, 30, 55, 0.1)'
        }}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          accept=".zip" 
          style={{ display: 'none' }}
          disabled={uploading}
        />
        
        {/* Animated ZIP Folder SVG */}
        <div style={{ marginBottom: '20px' }}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="goldGradFolder" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="#c59740" />
              </linearGradient>
            </defs>
            <g className="animate-float" style={{ animationDuration: '3s' }}>
              <path d="M22 10 H34 L40 16 V22 H22 V10 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            </g>
            <path d="M6 16 C6 13.7909 7.79086 12 10 12 H22 L28 18 H54 C56.2091 18 58 19.7909 58 22 V48 C58 50.2091 56.2091 52 54 52 H10 C7.79086 52 6 50.2091 6 48 V16 Z" stroke="url(#goldGradFolder)" strokeWidth="2" fill="rgba(6, 9, 17, 0.4)" />
            <line x1="32" y1="26" x2="32" y2="44" stroke="url(#goldGradFolder)" strokeWidth="4" strokeDasharray="3 3" />
            <circle cx="48" cy="38" r="6" stroke="#5c67f2" strokeWidth="1.5" fill="none" />
            <path d="M45 38 V34 C45 32.3431 46.3431 31 48 31 C49.6569 31 51 32.3431 51 34 V38" stroke="#5c67f2" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        
        {uploading ? (
          <div style={styles.progressContainer}>
            <p style={styles.uploadText}>Uploading Submission... {uploadProgress}%</p>
            <div style={styles.progressBarBg}>
              <div style={{ ...styles.progressBarFill, width: `${uploadProgress}%` }} />
            </div>
            <p style={styles.smallInfo}>Transmitting repository archive securely to server...</p>
          </div>
        ) : (
          <>
            <p style={styles.uploadText}>
              Drag and drop your completed project <strong style={{ color: 'var(--primary)' }}>ZIP file</strong> here
            </p>
            <p style={styles.smallInfo}>or</p>
            <button 
              onClick={() => fileInputRef.current.click()} 
              className="neon-btn secondary spring-transition"
              style={styles.browseBtn}
            >
              Browse Files
            </button>
            <p style={styles.limitText}>Maximum archive size: 10MB • File format: .zip</p>
          </>
        )}
      </div>

      {/* Validation Simulation Modal Prompt Window */}
      {validationModal.isOpen && (
        <div style={styles.modalBackdrop}>
          <div className="glass-card reveal-up" style={styles.modalCard}>
            
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <h3 className="text-gradient-gold" style={styles.modalTitle}>
                {validationModal.status === 'running' ? 'Automated Submission Verification' : 'Verification Complete'}
              </h3>
              <p style={styles.modalSubtitle}>
                File: {validationModal.fileName} ({formatBytes(validationModal.fileSize)})
              </p>
            </div>

            {/* Modal Body: Running Steps */}
            {validationModal.status === 'running' ? (
              <div style={styles.modalBody}>
                {/* SVG Live scanner core */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="25" cy="25" r="22" stroke="rgba(223, 183, 108, 0.08)" strokeWidth="2" />
                    <circle cx="25" cy="25" r="22" stroke="var(--primary)" strokeWidth="2" strokeDasharray="15 45" className="animate-spin-slow" style={{ transformOrigin: '25px 25px', animationDuration: '4s' }} />
                    <circle cx="25" cy="25" r="14" fill="rgba(92, 103, 242, 0.1)" className="animate-pulse-gold" />
                    <path d="M21 25L24 28L30 22" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Steps Checklist */}
                <div style={styles.stepsList}>
                  {steps.map((label, idx) => {
                    const stepNum = idx + 1;
                    const isDone = validationModal.currentStep > stepNum;
                    const isCurrent = validationModal.currentStep === stepNum;
                    
                    return (
                      <div key={idx} style={{
                        ...styles.stepRow,
                        opacity: isDone || isCurrent ? 1 : 0.35
                      }}>
                        <div style={styles.stepIconBox}>
                          {isDone ? (
                            (() => {
                              const stepStatus = getStepStatus(stepNum, validationModal.report);
                              if (stepStatus === 'error') {
                                return <AlertCircle size={18} color="var(--danger)" />;
                              } else if (stepStatus === 'warning') {
                                return <AlertCircle size={18} color="var(--warning)" />;
                              }
                              return <CheckCircle size={18} color="var(--success)" />;
                            })()
                          ) : isCurrent ? (
                            <Loader className="animate-spin-slow" size={16} color="var(--primary)" />
                          ) : (
                            <div style={styles.stepCircleDotted} />
                          )}
                        </div>
                        <span style={{
                          ...styles.stepLabel,
                          color: isCurrent ? '#fff' : isDone ? 'var(--text-secondary)' : 'var(--text-muted)',
                          fontWeight: isCurrent ? '700' : '500'
                        }}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div style={{ ...styles.progressBarBg, marginTop: '24px' }}>
                  <div style={{
                    ...styles.progressBarFill,
                    width: `${((validationModal.currentStep - 1) / 5) * 100}%`,
                    transition: 'width 0.8s cubic-bezier(0.25, 1, 0.5, 1)'
                  }} />
                </div>
              </div>
            ) : validationModal.status === 'success' ? (
              // Modal Body: Success Results Report
              <div style={styles.modalBody} className="reveal-up">
                
                {/* SVG Animated checkmark wrapper */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="30" cy="30" r="28" stroke="var(--success)" strokeWidth="2" fill="rgba(16, 185, 129, 0.04)" />
                    <circle cx="30" cy="30" r="28" stroke="var(--primary)" strokeWidth="1" strokeDasharray="8 12" className="animate-spin-slow" style={{ transformOrigin: '30px 30px', animationDuration: '10s' }} />
                    <path d="M20 30L27 37L41 21" stroke="var(--success)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="animate-checkmark" />
                  </svg>
                </div>

                <h4 style={styles.reportSuccessTitle}>ALL AUDIT CONTROLS PASSED</h4>
                
                <div className="glass-card" style={styles.reportSummaryBox}>
                  <div style={styles.reportDetail}>
                    <span style={styles.reportLabel}>SHA-256 Checksum</span>
                    <span style={styles.reportValMono}>{validationModal.report?.validationReport?.checksum}</span>
                  </div>

                  {validationModal.report?.validationReport?.warnings && validationModal.report.validationReport.warnings.length > 0 && (
                    <div style={{ ...styles.reportDetail, marginTop: '10px' }}>
                      <span style={{ ...styles.reportLabel, color: 'var(--warning)' }}>Validation Warnings</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                        {validationModal.report.validationReport.warnings.map((warn, idx) => (
                          <div key={idx} style={{ fontSize: '0.75rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertCircle size={10} color="var(--warning)" style={{ flexShrink: 0 }} />
                            <span>{warn}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div style={{ ...styles.reportDetail, marginTop: '10px' }}>
                    <span style={styles.reportLabel}>Validated Artifacts ({validationModal.report?.validationReport?.detectedFiles?.length || 0})</span>
                    <div style={styles.filesChips}>
                      {validationModal.report?.validationReport?.detectedFiles?.map((file, idx) => (
                        <span key={idx} style={styles.fileChip}>{file}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleAcceptValidation} 
                  className="neon-btn spring-transition" 
                  style={{ width: '100%', marginTop: '24px' }}
                >
                  Accept & Register Submission
                </button>
              </div>
            ) : (
              // Modal Body: Failed Results Report
              <div style={styles.modalBody} className="reveal-up">
                
                {/* SVG Animated cross wrapper */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="30" cy="30" r="28" stroke="var(--danger)" strokeWidth="2" fill="rgba(239, 68, 68, 0.04)" />
                    <circle cx="30" cy="30" r="28" stroke="var(--danger)" strokeWidth="1" strokeDasharray="8 12" className="animate-spin-slow" style={{ transformOrigin: '30px 30px', animationDuration: '10s' }} />
                    <path d="M22 22L38 38M38 22L22 38" stroke="var(--danger)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <h4 style={{ ...styles.reportSuccessTitle, color: 'var(--danger)' }}>AUDIT CRITERIA FAILED</h4>
                
                <div className="glass-card" style={{ ...styles.reportSummaryBox, borderColor: 'rgba(239, 68, 68, 0.15)' }}>
                  <div style={styles.reportDetail}>
                    <span style={{ ...styles.reportLabel, color: 'var(--danger)' }}>Missing Required Files</span>
                    <div style={styles.filesChips}>
                      {validationModal.report?.validationReport?.missingRequirements?.map((reqFile, idx) => (
                        <span key={idx} style={{ ...styles.fileChip, border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)' }}>{reqFile}</span>
                      ))}
                    </div>
                  </div>

                  {validationModal.report?.validationReport?.warnings && validationModal.report.validationReport.warnings.length > 0 && (
                    <div style={{ ...styles.reportDetail, marginTop: '10px' }}>
                      <span style={{ ...styles.reportLabel, color: 'var(--warning)' }}>Validation Warnings</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                        {validationModal.report.validationReport.warnings.map((warn, idx) => (
                          <div key={idx} style={{ fontSize: '0.75rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertCircle size={10} color="var(--warning)" style={{ flexShrink: 0 }} />
                            <span>{warn}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div style={{ ...styles.reportDetail, marginTop: '10px' }}>
                    <span style={styles.reportLabel}>Submitted Files ({validationModal.report?.validationReport?.detectedFiles?.length || 0})</span>
                    <div style={styles.filesChips}>
                      {validationModal.report?.validationReport?.detectedFiles && validationModal.report.validationReport.detectedFiles.length > 0 ? (
                        validationModal.report.validationReport.detectedFiles.map((file, idx) => (
                          <span key={idx} style={styles.fileChip}>{file}</span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No files detected in ZIP archive root.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button 
                    onClick={() => setValidationModal(prev => ({ ...prev, isOpen: false }))} 
                    className="neon-btn secondary spring-transition" 
                    style={{ flex: 1 }}
                  >
                    Cancel Upload
                  </button>
                  <button 
                    onClick={handleAcceptValidation} 
                    className="neon-btn danger spring-transition" 
                    style={{ flex: 1 }}
                  >
                    Save Anyway
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submission History */}
      <div style={styles.historySection} className="reveal-up delay-1">
        <div style={styles.historyHeader}>
          <h3 className="text-gradient-gold" style={styles.sectionTitle}>Submission History</h3>
          <button onClick={fetchSubmissions} className="neon-btn secondary spring-transition" style={styles.refreshBtn} disabled={loading}>
            <RefreshCw size={12} className={loading ? "animate-spin-slow" : ""} />
            <span>Sync</span>
          </button>
        </div>

        {loading ? (
          <p style={styles.noSubmissions}>Retrieving history...</p>
        ) : submissions.length === 0 ? (
          <div className="glass-card" style={styles.emptyCard}>
            <FileArchive size={28} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
            <p>No project files uploaded yet. Submit your ZIP work above.</p>
          </div>
        ) : (
          <div style={styles.submissionsList}>
            {submissions.map((submission) => (
              <div 
                key={submission._id} 
                className="glass-card spring-transition" 
                style={styles.submissionItem}
                onClick={() => toggleExpand(submission._id)}
              >
                <div style={styles.itemHeader}>
                  <div style={styles.itemFileIcon}>
                    <File size={18} color="var(--primary)" />
                  </div>
                  
                  <div style={styles.itemInfo}>
                    <h4 style={styles.itemFilename}>{submission.filename}</h4>
                    <p style={styles.itemMeta}>
                      Size: {formatBytes(submission.filesize)} • Uploaded: {formatDate(submission.uploadDate)}
                    </p>
                  </div>

                  <div style={styles.actionGroup}>
                    <span className={`badge ${
                      submission.status === 'Validated' 
                        ? 'success' 
                        : submission.status === 'Failed' 
                          ? 'danger' 
                          : 'warning'
                    }`}>
                      {submission.status}
                    </span>
                    
                    <button 
                      onClick={(e) => handleDownload(submission._id, submission.filename, e)} 
                      style={styles.iconBtn}
                      title="Download backup"
                    >
                      <Download size={14} />
                    </button>
                    
                    <button 
                      onClick={(e) => handleDelete(submission._id, e)} 
                      style={styles.iconBtn}
                      title="Remove submission"
                    >
                      <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                    </button>

                    {expandedId === submission._id ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Expanded details */}
                {expandedId === submission._id && (
                  <div style={styles.expandedContent} onClick={(e) => e.stopPropagation()}>
                    <h5 style={styles.reportTitle}>Automated Inspection Report</h5>
                    
                    <div style={styles.reportGrid}>
                      <div style={styles.reportDetail}>
                        <span style={styles.reportLabel}>Sha-256 Checksum</span>
                        <span style={styles.reportValMono}>{submission.validationReport?.checksum || 'N/A'}</span>
                      </div>
                      <div style={styles.reportDetail}>
                        <span style={styles.reportLabel}>Directory Structure</span>
                        <span style={styles.reportVal}>
                          {submission.status === 'Validated' ? (
                            <>
                              <CheckCircle size={12} color="var(--success)" style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                              PASS
                            </>
                          ) : (
                            <>
                              <AlertCircle size={12} color="var(--danger)" style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                              FAIL
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {submission.validationReport?.missingRequirements && submission.validationReport.missingRequirements.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <span style={{ ...styles.reportLabel, color: 'var(--danger)' }}>Missing Required Files</span>
                        <div style={styles.filesChips}>
                          {submission.validationReport.missingRequirements.map((reqFile, idx) => (
                            <span key={idx} style={{ ...styles.fileChip, border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)' }}>{reqFile}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {submission.validationReport?.warnings && submission.validationReport.warnings.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <span style={{ ...styles.reportLabel, color: 'var(--warning)' }}>Validation Warnings</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                          {submission.validationReport.warnings.map((warning, idx) => (
                            <div key={idx} style={{ fontSize: '0.75rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <AlertCircle size={10} color="var(--warning)" style={{ flexShrink: 0 }} />
                              <span>{warning}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: '12px' }}>
                      <span style={styles.reportLabel}>Identified Project Files ({submission.validationReport?.detectedFiles?.length || 0})</span>
                      <div style={styles.filesChips}>
                        {submission.validationReport?.detectedFiles && submission.validationReport.detectedFiles.length > 0 ? (
                          submission.validationReport.detectedFiles.map((file, idx) => (
                            <span key={idx} style={styles.fileChip}>{file}</span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No files detected in ZIP archive root.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  dropZone: {
    border: '2px dashed',
    padding: '40px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: '16px',
  },
  uploadText: {
    fontSize: '1rem',
    color: '#fff',
    marginBottom: '8px',
  },
  smallInfo: {
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    marginBottom: '12px',
  },
  browseBtn: {
    padding: '8px 20px',
    fontSize: '0.8rem',
    marginBottom: '16px',
  },
  limitText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  progressContainer: {
    width: '100%',
    maxWidth: '360px',
  },
  progressBarBg: {
    width: '100%',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '2px',
    margin: '12px 0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--primary), #c59740)',
    boxShadow: '0 0 8px var(--primary-glow)',
    transition: 'width 0.2s ease',
  },
  historySection: {
    marginTop: '40px',
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
  },
  refreshBtn: {
    padding: '6px 12px',
    fontSize: '0.8rem',
    gap: '6px',
  },
  noSubmissions: {
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: '20px',
    fontSize: '0.85rem',
  },
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
    color: 'var(--text-secondary)',
    borderStyle: 'dashed',
    fontSize: '0.85rem',
  },
  submissionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  submissionItem: {
    padding: '14px 18px',
    border: '1px solid rgba(223, 183, 108, 0.05)',
    background: 'rgba(18, 27, 49, 0.15)',
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  itemFileIcon: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    background: 'rgba(223, 183, 108, 0.03)',
    border: '1px solid rgba(223, 183, 108, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemFilename: {
    fontSize: '0.9rem',
    color: '#fff',
    fontWeight: '600',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemMeta: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '1px',
  },
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  iconBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  expandedContent: {
    marginTop: '14px',
    paddingTop: '14px',
    borderTop: '1px solid rgba(223, 183, 108, 0.05)',
    animation: 'revealUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  },
  reportTitle: {
    fontSize: '0.8rem',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
    fontWeight: '700',
  },
  reportGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '12px',
  },
  reportDetail: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  reportLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  reportValMono: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  reportVal: {
    fontSize: '0.75rem',
    color: '#fff',
  },
  filesChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '8px',
  },
  fileChip: {
    fontSize: '0.7rem',
    fontFamily: 'var(--font-mono)',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    padding: '3px 6px',
    borderRadius: '4px',
    color: 'var(--text-secondary)',
  },
  // Modal Prompt Styles
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(4, 6, 11, 0.85)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalCard: {
    width: '100%',
    maxWidth: '540px',
    background: '#0c1221',
    border: '1px solid rgba(223, 183, 108, 0.15)',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    marginBottom: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    paddingBottom: '16px',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
  },
  stepsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  stepRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    transition: 'all 0.3s ease',
  },
  stepIconBox: {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleDotted: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)',
  },
  stepLabel: {
    fontSize: '0.85rem',
    fontFamily: 'var(--font-sans)',
  },
  reportSuccessTitle: {
    fontSize: '0.8rem',
    color: 'var(--success)',
    textAlign: 'center',
    letterSpacing: '0.1em',
    fontWeight: '800',
    marginBottom: '16px',
  },
  reportSummaryBox: {
    background: 'rgba(6, 9, 17, 0.4)',
    border: '1px solid rgba(223, 183, 108, 0.08)',
    padding: '20px',
    borderRadius: '12px',
  }
};
