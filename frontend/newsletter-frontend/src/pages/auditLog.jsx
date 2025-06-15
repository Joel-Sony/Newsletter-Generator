import React, { useState, useEffect } from 'react';

const AuditLog = () => {
  const [auditLogData, setAuditLogData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedFileId, setExpandedFileId] = useState(null); // State to track which file is expanded

  // Mock Data - In a real application, this would be fetched from an API
  const mockAuditLogData = [
    {
      id: 'newsletter-q1-2024',
      name: 'Marketing Campaign Q1 2024',
      type: 'Newsletter',
      latestVersionDate: '2024-06-15',
      latestVersionUser: 'Alice Johnson',
      versions: [
        { versionId: 'v1.0', date: '2024-06-15', user: 'Alice Johnson', description: 'Final version before send-off.', changes: 'Published, minor content tweaks' },
        { versionId: 'v0.9', date: '2024-06-14', user: 'Bob Williams', description: 'Added product highlights section.', changes: 'New section: Product Highlights' },
        { versionId: 'v0.8', date: '2024-06-12', user: 'Alice Johnson', description: 'Initial draft with proposed content.', changes: 'Initial content creation' },
        { versionId: 'v0.7', date: '2024-06-10', user: 'Bob Williams', description: 'Minor text corrections.', changes: 'Copyediting' },
        { versionId: 'v0.6', date: '2024-06-08', user: 'Alice Johnson', description: 'Incorporated feedback from review.', changes: 'Feedback implementation' },
      ]
    },
    {
      id: 'monthly-newsletter-may',
      name: 'Monthly Newsletter May 2024',
      type: 'Newsletter',
      latestVersionDate: '2024-05-30',
      latestVersionUser: 'Charlie Brown',
      versions: [
        { versionId: 'v1.0', date: '2024-05-30', user: 'Charlie Brown', description: 'Published May newsletter.', changes: 'Published, final review' },
        { versionId: 'v0.9', date: '2024-05-28', user: 'David Lee', description: 'Updated subscriber segmentation.', changes: 'Audience segmentation' },
        { versionId: 'v0.8', date: '2024-05-25', user: 'Charlie Brown', description: 'Content review edits.', changes: 'Content edits and image adjustments' },
        { versionId: 'v0.7', date: '2024-05-20', user: 'Charlie Brown', description: 'First draft completed.', changes: 'Initial draft' },
      ]
    },
    {
      id: 'quarterly-report-2024',
      name: 'Q2 2024 Performance Report',
      type: 'Report',
      latestVersionDate: '2024-06-10',
      latestVersionUser: 'Eva Green',
      versions: [
        { versionId: 'v3.1', date: '2024-06-10', user: 'Eva Green', description: 'Added executive summary.', changes: 'Executive summary added' },
        { versionId: 'v3.0', date: '2024-06-09', user: 'Eva Green', description: 'Final data integration.', changes: 'Data integration' },
        { versionId: 'v2.5', date: '2024-06-05', user: 'Frank White', description: 'Reviewed financial data accuracy.', changes: 'Financial data review' },
        { versionId: 'v2.0', date: '2024-06-01', user: 'Eva Green', description: 'Initial draft with basic structure.', changes: 'Initial report structure' },
      ]
    },
     {
      id: 'product-update-email',
      name: 'Product Update Email v2',
      type: 'Email',
      latestVersionDate: '2024-06-13',
      latestVersionUser: 'Grace Kim',
      versions: [
        { versionId: 'v2.0', date: '2024-06-13', user: 'Grace Kim', description: 'Minor wording adjustments.', changes: 'Wording refinements' },
        { versionId: 'v1.5', date: '2024-06-12', user: 'Grace Kim', description: 'Added new feature highlights.', changes: 'New feature highlights' },
        { versionId: 'v1.0', date: '2024-06-11', user: 'Grace Kim', description: 'Initial draft for internal review.', changes: 'First draft' },
      ]
    },
    {
      id: 'event-promo-landing-page',
      name: 'Annual Summit Landing Page',
      type: 'Web Page',
      latestVersionDate: '2024-06-07',
      latestVersionUser: 'Henry Ford',
      versions: [
        { versionId: 'v1.2', date: '2024-06-07', user: 'Henry Ford', description: 'Updated speaker bios.', changes: 'Speaker bio updates' },
        { versionId: 'v1.1', date: '2024-06-05', user: 'Ivy Chen', description: 'Integrated registration form.', changes: 'Registration form integration' },
        { versionId: 'v1.0', date: '2024-06-03', user: 'Henry Ford', description: 'Initial page design and content.', changes: 'Initial design and content' },
      ]
    }
  ];

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setAuditLogData(mockAuditLogData);
      setLoading(false);
    }, 500); // Simulate network delay
  }, []);

  const handleFileClick = (fileId) => {
    setExpandedFileId(prevId => (prevId === fileId ? null : fileId)); // Toggle expansion
  };

  const auditStyles = {
    container: {
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '32px',
      alignItems: 'center',
    },
    header: {
      width: '100%',
      maxWidth: '900px',
      marginBottom: '32px',
      paddingBottom: '16px',
      borderBottom: '1px solid #262626',
      textAlign: 'center',
    },
    title: {
      fontSize: '42px',
      fontWeight: '800',
      background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      letterSpacing: '-0.025em',
      marginBottom: '8px',
    },
    subtitle: {
      color: '#a3a3a3',
      fontSize: '18px',
      fontWeight: '400',
    },
    logContainer: {
      backgroundColor: '#171717',
      borderRadius: '16px',
      padding: '24px',
      width: '100%',
      maxWidth: '900px',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
      border: '1px solid #262626',
    },
    loadingText: {
      fontSize: '24px',
      color: '#a3a3a3',
      textAlign: 'center',
      marginTop: '50px',
    },
    errorText: {
      fontSize: '20px',
      color: '#ef4444',
      textAlign: 'center',
      marginTop: '50px',
    },
    fileCard: {
      backgroundColor: '#1f1f1f',
      borderRadius: '12px',
      padding: '20px 24px',
      marginBottom: '12px',
      border: '1px solid #404040',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      position: 'relative',
      overflow: 'hidden', // Ensures the gradient border doesn't overflow
    },
    fileCardHover: {
      transform: 'translateY(-3px)',
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
      borderColor: '#525252',
    },
    fileCardTopBorder: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
      opacity: 0,
      transition: 'opacity 0.3s ease',
    },
    fileCardTopBorderVisible: {
      opacity: 1,
    },
    fileMainInfo: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap', // Allow wrapping on small screens
      gap: '10px',
    },
    fileName: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#ffffff',
      flexGrow: 1,
    },
    fileMeta: {
      fontSize: '14px',
      color: '#a3a3a3',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      flexWrap: 'wrap',
    },
    fileTypeBadge: {
      padding: '4px 10px',
      borderRadius: '6px',
      backgroundColor: '#374151',
      color: '#d1d5db',
      fontSize: '12px',
      fontWeight: '500',
    },
    versionSubmenu: {
      marginTop: '15px',
      borderTop: '1px solid #262626',
      paddingTop: '15px',
    },
    versionItem: {
      backgroundColor: '#262626',
      borderRadius: '8px',
      padding: '12px 18px',
      marginBottom: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      transition: 'background-color 0.2s ease',
    },
    versionItemHover: {
      backgroundColor: '#333333',
    },
    versionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '8px',
    },
    versionId: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffffff',
    },
    versionDetails: {
      fontSize: '13px',
      color: '#a3a3a3',
    },
    versionDescription: {
      fontSize: '14px',
      color: '#d4d4d4',
      marginTop: '5px',
    },
    versionChanges: {
      fontSize: '13px',
      color: '#737373',
      fontStyle: 'italic',
    }
  };

  if (loading) {
    return (
      <div style={auditStyles.container}>
        <p style={auditStyles.loadingText}>Loading audit log...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={auditStyles.container}>
        <p style={auditStyles.errorText}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={auditStyles.container}>
      <header style={auditStyles.header}>
        <h1 style={auditStyles.title}>Audit Log</h1>
        <p style={auditStyles.subtitle}>Track changes and view version history for your files.</p>
      </header>

      <div style={auditStyles.logContainer}>
        {auditLogData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#a3a3a3', fontSize: '18px' }}>
            No audit log entries found.
          </div>
        ) : (
          auditLogData.map((file) => (
            <div
              key={file.id}
              style={{
                ...auditStyles.fileCard,
                ...(expandedFileId === file.id ? auditStyles.fileCardHover : {}), // Keep hovered style if expanded
              }}
              onClick={() => handleFileClick(file.id)}
              onMouseEnter={(e) => {
                if (expandedFileId !== file.id) { // Only apply hover if not expanded
                    e.currentTarget.style.transform = auditStyles.fileCardHover.transform;
                    e.currentTarget.style.boxShadow = auditStyles.fileCardHover.boxShadow;
                    e.currentTarget.style.borderColor = auditStyles.fileCardHover.borderColor;
                    e.currentTarget.querySelector('.file-card-top-border').style.opacity = 1;
                }
              }}
              onMouseLeave={(e) => {
                if (expandedFileId !== file.id) { // Only remove hover if not expanded
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#404040';
                    e.currentTarget.querySelector('.file-card-top-border').style.opacity = 0;
                }
              }}
            >
              <div
                className="file-card-top-border"
                style={{
                  ...auditStyles.fileCardTopBorder,
                  ...(expandedFileId === file.id ? auditStyles.fileCardTopBorderVisible : {}),
                }}
              ></div>
              <div style={auditStyles.fileMainInfo}>
                <span style={auditStyles.fileName}>{file.name}</span>
                <div style={auditStyles.fileMeta}>
                  <span style={auditStyles.fileTypeBadge}>{file.type}</span>
                  <span>Last Edited: {file.latestVersionDate} by {file.latestVersionUser}</span>
                  <span>
                    {expandedFileId === file.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {expandedFileId === file.id && (
                <div style={auditStyles.versionSubmenu}>
                  {file.versions.map((version, index) => (
                    <div
                      key={version.versionId}
                      style={auditStyles.versionItem}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = auditStyles.versionItemHover.backgroundColor}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#262626'}
                    >
                      <div style={auditStyles.versionHeader}>
                        <span style={auditStyles.versionId}>Version {version.versionId}</span>
                        <span style={auditStyles.versionDetails}>
                          {version.date} by {version.user}
                        </span>
                      </div>
                      <p style={auditStyles.versionDescription}>{version.description}</p>
                      {version.changes && (
                        <span style={auditStyles.versionChanges}>Changes: {version.changes}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AuditLog;
