import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js'; // Import your Supabase client

const NewsletterVersionsPage = () => {
  const { projectId } = useParams(); // Get projectId from the URL
  const navigate = useNavigate();

  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newsletterToDelete, setNewsletterToDelete] = useState(null); // Stores the 'id' of the version to delete

  // State for toast notification
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' or 'error'

  // Refined showToast function for consistent behavior
  const displayToast = useCallback((message, type) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  }, []);

  // Function to get the current auth token
  const getAuthToken = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Supabase getSession error:", error);
        displayToast('Authentication error. Please log in again.', 'error');
        navigate('/login', { replace: true });
        return null;
      }
      if (session) {
        return session.access_token;
      }
      // No session means not logged in
      displayToast('Authentication required. Please log in.', 'info');
      navigate('/login', { replace: true });
      return null;
    } catch (err) {
      console.error('Unexpected error in getAuthToken:', err);
      displayToast('An unexpected authentication error occurred. Please try again.', 'error');
      navigate('/login', { replace: true });
      return null;
    }
  }, [navigate, displayToast]); // Dependencies for useCallback

  // Function to fetch newsletter versions
  const fetchNewsletterVersions = useCallback(async () => {
    if (!projectId) {
      setError("No project ID provided in URL.");
      setLoading(false);
      return;
    }

    console.log(`Fetching all versions for project ID: ${projectId}`);
    try {
      setLoading(true);
      setError(null);

      // --- AUTH FIX: Get token using Supabase SDK ---
      const authToken = await getAuthToken();
      if (!authToken) {
        // getAuthToken already handles navigation/toast
        return;
      }

      const response = await fetch(`/api/newsletters/${projectId}/versions`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.status === 401 || response.status === 403) {
        // If the token was invalid or expired despite getAuthToken, redirect
        displayToast('Session expired or unauthorized. Please log in again.', 'error');
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Parse or default to empty object
        throw new Error(errorData.error || `Failed to fetch newsletter versions: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success === false) { 
         throw new Error(data.error || 'Failed to fetch newsletter versions.');
      }

      setVersions(data.versions.map(item => ({
        id: item.id, // Supabase row ID (unique for each version)
        projectId: item.project_id, // Common project ID for all versions
        name: item.project_name || 'Untitled Newsletter',
        version: item.version,
        status: item.status,
        lastEdited: new Date(item.updated_at || item.created_at).toLocaleString(),
        image_path: item.image_path
      })));

    } catch (err) {
      console.error('Error fetching newsletter versions:', err);
      setError(err.message);
      displayToast(`Error: ${err.message}`, 'error'); // Use displayToast
    } finally {
      setLoading(false);
    }
  }, [projectId, getAuthToken, navigate, displayToast]); 

  // Fetch data on component mount and projectId change
  useEffect(() => {
    fetchNewsletterVersions();
  }, [fetchNewsletterVersions]); // fetchNewsletterVersions is already useCallback'd and has its own deps

  // Effect to hide toast after a few seconds
  useEffect(() => {
    let timer;
    if (showToast) {
      timer = setTimeout(() => {
        setShowToast(false);
        setToastMessage('');
        setToastType('success'); // Reset to default
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [showToast]);

  // --- Action Handlers ---

  const handleActionClick = (action, versionId) => {
    switch (action) {
      case 'Edit':
        navigate(`/editor/${versionId}`);
        break;
      case 'Preview':
      case 'View':
        navigate(`/preview/${versionId}`);
        break;
      case 'Delete':
        setNewsletterToDelete(versionId);
        setShowDeleteModal(true);
        break;
      default:
        console.log(`${action} action clicked for version ID: ${versionId}`);
    }
  };

  const confirmDelete = async () => {
    try {
      const authToken = await getAuthToken();
      if (!authToken) {

        return;
      }

      const response = await fetch(`/api/delete/${newsletterToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.status === 401 || response.status === 403) {
        displayToast('Session expired or unauthorized. Please log in again.', 'error');
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete newsletter version: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success === false) { // Check for explicit failure flag from backend
        throw new Error(data.error || 'Failed to delete newsletter version.');
      }

      // After successful deletion, re-fetch the list of versions
      await fetchNewsletterVersions();

      displayToast(`Newsletter version deleted successfully.`, 'success');

    } catch (err) {
      console.error('Error deleting newsletter version:', err);
      displayToast(`Error deleting version: ${err.message}`, 'error');
    } finally {
      setShowDeleteModal(false);
      setNewsletterToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setNewsletterToDelete(null);
  }

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'DRAFT': return { backgroundColor: '#fbbf24', color: '#1f2937', border: '1px solid #f59e0b' };
      case 'PUBLISHED': return { backgroundColor: '#10b981', color: '#ffffff', border: '1px solid #059669' };
      case 'ARCHIVED': return { backgroundColor: '#6b7280', color: '#ffffff', border: '1px solid #4b5563' };
      default: return { backgroundColor: '#374151', color: '#d1d5db', border: '1px solid #6b7280' };
    }
  };

  const getActionButtonStyle = (action) => {
    const baseStyle = {
      padding: '8px 14px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: 'Inter, system-ui, sans-serif',
      flexShrink: 0,
      whiteSpace: 'nowrap',
    };


    switch (action) {
      case 'Edit': return { ...baseStyle, backgroundColor: '#3b82f6', color: '#ffffff' };
      case 'Preview':
      case 'View': return { ...baseStyle, backgroundColor: '#8b5cf6', color: '#ffffff' };
      case 'Delete': return { ...baseStyle, backgroundColor: '#ef4444', color: '#ffffff' };
      default: return { ...baseStyle, backgroundColor: '#6b7280', color: '#ffffff' };
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#ffffff',
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '32px 20px',
      boxSizing: 'border-box',
    },
    contentWrapper: {
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    },
    headerSection: {
      backgroundColor: '#171717',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
      border: '1px solid #262626',
      textAlign: 'center',
      marginBottom: '24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
    },
    header: {
      fontSize: '42px',
      fontWeight: '800',
      background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '0',
      lineHeight: '1.2',
      '@media (max-width: 768px)': {
        fontSize: '32px',
      },
    },
    subtitle: {
      color: '#a3a3a3',
      fontSize: '18px',
      marginBottom: '0',
      fontWeight: '400',
    },
    tableContainer: {
      backgroundColor: '#171717',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
      border: '1px solid #262626',
      width: '100%',
      overflowX: 'auto',
      marginBottom: '32px',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0 10px',
      color: '#d4d4d4',
      textAlign: 'left',
    },
    tableHead: {},
    tableRow: {
      backgroundColor: '#1f1f1f',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.3s ease',
      cursor: 'default',
    },
    tableHeaderCell: {
      padding: '16px 20px',
      textAlign: 'left',
      fontSize: '14px',
      fontWeight: '600',
      color: '#a3a3a3',
      borderBottom: '1px solid #404040',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap',
    },
    tableDataCell: {
      padding: '16px 20px',
      textAlign: 'left',
      fontSize: '15px',
      fontWeight: '400',
      color: '#ffffff',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      verticalAlign: 'middle',
    },
    actionButtonsContainer: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap',
      justifyContent: 'flex-start'
    },
    thumbnail: {
      width: '80px',
      height: '60px',
      borderRadius: '6px',
      objectFit: 'cover',
      border: '1px solid #404040'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.3s ease-out forwards',
    },
    modalContent: {
      backgroundColor: '#1f1f1f',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
      textAlign: 'center',
      maxWidth: '400px',
      width: '90%',
      border: '1px solid #404040',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      animation: 'scaleIn 0.3s ease-out forwards',
    },
    modalTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '8px',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    modalText: {
      color: '#d4d4d4',
      fontSize: '16px',
      lineHeight: '1.6',
      fontFamily: 'Inter, system-ui, sans-serif',
      marginBottom: '20px'
    },
    modalActions: {
      display: 'flex',
      justifyContent: 'center',
      gap: '16px',
      flexWrap: 'wrap',
    },
    modalButton: {
      padding: '12px 24px',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: 'Inter, system-ui, sans-serif',
      flex: '1 1 auto',
      minWidth: '120px',
    },
    modalButtonConfirm: {
      backgroundColor: '#ef4444',
      color: 'white',
    },
    modalButtonCancel: {
      backgroundColor: '#404040',
      color: '#ffffff',
    },
    toastContainer: {
      position: 'fixed',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#10b981',
      color: 'white',
      padding: '15px 25px',
      borderRadius: '10px',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
      zIndex: 1100,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
      fontWeight: '500',
      opacity: 0,
      transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      maxWidth: 'calc(100% - 40px)',
      textAlign: 'center',
    },
    toastContainerVisible: {
      opacity: 1,
      transform: 'translateX(-50%) translateY(-10px)',
      animation: 'slideInFromBottom 0.5s ease-out forwards',
    },
    toastIcon: {
      fontSize: '20px',
    },
    toastError: {
        backgroundColor: '#ef4444',
    },
    backButton: {
        backgroundColor: '#262626',
        color: '#ffffff',
        padding: '12px 24px',
        borderRadius: '10px',
        fontSize: '16px',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        alignSelf: 'flex-start',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    },

  };

  const applyHoverStyle = (e, action) => {
    const style = getActionButtonStyle(action);
    const hoverBg = {
      'Edit': '#2563eb',
      'Preview': '#7c3aed',
      'View': '#7c3aed',
      'Delete': '#dc2626',
      'Back': '#3f3f46' // For back button
    }[action] || style.backgroundColor; // Fallback to base if no hover defined

    e.target.style.backgroundColor = hoverBg;
    e.target.style.transform = 'translateY(-2px)';
    e.target.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
    if (action === 'Back') { // Specific shadow for back button
      e.target.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.4)';
    }
  };

  const removeHoverStyle = (e, action) => {
    const style = getActionButtonStyle(action);
    e.target.style.backgroundColor = style.backgroundColor;
    e.target.style.transform = 'translateY(0)';
    e.target.style.boxShadow = 'none';
    if (action === 'Back') { // Reset specific shadow for back button
      e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    }
  };

  const applyModalButtonHover = (e, type) => {
    const style = type === 'confirm' ? styles.modalButtonConfirm : styles.modalButtonCancel;
    const hoverBg = type === 'confirm' ? '#dc2626' : '#525252';
    const hoverShadow = type === 'confirm' ? '0 4px 10px rgba(239, 68, 68, 0.4)' : '0 4px 10px rgba(64, 64, 64, 0.4)';

    e.target.style.backgroundColor = hoverBg;
    e.target.style.transform = 'translateY(-2px)';
    e.target.style.boxShadow = hoverShadow;
  };

  const removeModalButtonHover = (e, type) => {
    const style = type === 'confirm' ? styles.modalButtonConfirm : styles.modalButtonCancel;
    e.target.style.backgroundColor = style.backgroundColor;
    e.target.style.transform = 'translateY(0)';
    e.target.style.boxShadow = 'none';
  };


  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: 'white',
        backgroundColor: '#0a0a0a'
      }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>Loading newsletter versions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: 'white',
        backgroundColor: '#0a0a0a',
        padding: '20px'
      }}>
        <h2 style={{color: '#ef4444'}}>Error loading versions:</h2>
        <p>{error}</p>
        <button
          onClick={() => navigate(-1)}
          style={styles.backButton}
          onMouseEnter={(e) => applyHoverStyle(e, 'Back')}
          onMouseLeave={(e) => removeHoverStyle(e, 'Back')}
        >
            ← Back to Dashboard
        </button>
      </div>
    );
  }

  const projectTitle = versions.length > 0 ? versions[0].name : 'Newsletter';

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        <div style={styles.headerSection}>
          <button
            onClick={() => navigate(-1)}
            style={styles.backButton}
            onMouseEnter={(e) => applyHoverStyle(e, 'Back')}
            onMouseLeave={(e) => removeHoverStyle(e, 'Back')}
          >
            ← Back to Dashboard
          </button>
          <h1 style={styles.header}>{projectTitle} Versions</h1>
          <p style={styles.subtitle}>All historical saves for this newsletter.</p>
        </div>

        <div style={styles.tableContainer}>
          {versions.length > 0 ? (
            <table style={styles.table}>
              <thead style={styles.tableHead}>
                <tr>
                  <th style={styles.tableHeaderCell}>Version</th>
                  <th style={styles.tableHeaderCell}>Status</th>
                  <th style={styles.tableHeaderCell}>Last Edited</th>
                  <th style={styles.tableHeaderCell}>Preview</th>
                  <th style={styles.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((version) => (
                  <tr
                    key={version.id}
                    style={styles.tableRow}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.4)';
                      e.currentTarget.style.backgroundColor = '#262626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                      e.currentTarget.style.backgroundColor = '#1f1f1f';
                    }}
                  >
                    <td style={styles.tableDataCell}>Version {version.version}</td>
                    <td style={styles.tableDataCell}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        ...getStatusBadgeStyle(version.status)
                      }}>
                        {version.status}
                      </span>
                    </td>
                    <td style={styles.tableDataCell}>{version.lastEdited}</td>
                    <td style={styles.tableDataCell}>
                      {version.image_path ? (
                        <img
                          src={version.image_path}
                          alt={`Version ${version.version} Preview`}
                          style={styles.thumbnail}
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x60/374151/ffffff?text=No+Img'; }}
                        />
                      ) : (
                        <img src="https://placehold.co/80x60/374151/ffffff?text=No+Img" alt="No Preview" style={styles.thumbnail} />
                      )}
                    </td>
                    <td style={styles.tableDataCell}>
                      <div style={styles.actionButtonsContainer}>
                        <button
                          onClick={() => handleActionClick('Edit', version.id)}
                          style={getActionButtonStyle('Edit')}
                          onMouseEnter={(e) => applyHoverStyle(e, 'Edit')}
                          onMouseLeave={(e) => removeHoverStyle(e, 'Edit')}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleActionClick('Preview', version.id)}
                          style={getActionButtonStyle('Preview')}
                          onMouseEnter={(e) => applyHoverStyle(e, 'Preview')}
                          onMouseLeave={(e) => removeHoverStyle(e, 'Preview')}
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => handleActionClick('Delete', version.id)}
                          style={getActionButtonStyle('Delete')}
                          onMouseEnter={(e) => applyHoverStyle(e, 'Delete')}
                          onMouseLeave={(e) => removeHoverStyle(e, 'Delete')}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#a3a3a3', textAlign: 'center', padding: '20px' }}>
              No versions found for this newsletter.
            </p>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>Confirm Deletion</h2>
            <p style={styles.modalText}>
              Are you sure you want to delete this specific version?
              <br />This action cannot be undone.
            </p>
            <div style={styles.modalActions}>
              <button
                onClick={confirmDelete}
                style={{ ...styles.modalButton, ...styles.modalButtonConfirm }}
                onMouseEnter={(e) => applyModalButtonHover(e, 'confirm')}
                onMouseLeave={(e) => removeModalButtonHover(e, 'confirm')}
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                style={{ ...styles.modalButton, ...styles.modalButtonCancel }}
                onMouseEnter={(e) => applyModalButtonHover(e, 'cancel')}
                onMouseLeave={(e) => removeModalButtonHover(e, 'cancel')}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      <div style={{
        ...styles.toastContainer,
        ...(showToast ? styles.toastContainerVisible : {}),
        ...(toastType === 'error' ? styles.toastError : {}),
      }}>
        <span style={styles.toastIcon}>
          {toastType === 'success' ? '✅' : '❌'}
        </span>
        {toastMessage}
      </div>

      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slideInFromBottom {
          from { transform: translateX(-50%) translateY(50px); opacity: 0; }
          to { transform: translateX(-50%) translateY(-10px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default NewsletterVersionsPage;