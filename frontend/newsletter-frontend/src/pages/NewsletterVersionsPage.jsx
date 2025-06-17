import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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
      const authToken = localStorage.getItem('authToken');

      if (!authToken) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await fetch(`/api/newsletters/${projectId}/versions`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch newsletter versions.');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch newsletter versions.');
      }

      // Supabase returns 'id', 'project_name', 'version', 'updated_at', etc.
      // We expect data.versions to be an array of objects
      setVersions(data.versions.map(item => ({
        id: item.id, // Supabase row ID (unique for each version)
        projectId: item.project_id, // Common project ID for all versions
        name: item.project_name || 'Untitled Newsletter',
        version: item.version,
        status: item.status,
        lastEdited: new Date(item.updated_at || item.created_at).toLocaleString(), // Use toLocaleString for full date/time
        image_path: item.image_path // For preview thumbnail if available
      })));

    } catch (err) {
      console.error('Error fetching newsletter versions:', err);
      setError(err.message);
      setToastMessage(`Error: ${err.message}`);
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  }, [projectId]); // Re-run if projectId changes

  // Fetch data on component mount and projectId change
  useEffect(() => {
    fetchNewsletterVersions();
  }, [fetchNewsletterVersions]);

  // Effect to hide toast after a few seconds
  useEffect(() => {
    let timer;
    if (showToast) {
      timer = setTimeout(() => {
        setShowToast(false);
        setToastMessage('');
        setToastType('success'); // Reset to default
      }, 3000); // Toast disappears after 3 seconds
    }
    return () => clearTimeout(timer); // Clean up the timer
  }, [showToast]);

  // --- Action Handlers ---

  const handleActionClick = (action, versionId) => {
    switch (action) {
      case 'Edit':
        navigate(`/editor/${versionId}`); // Navigate to editor using specific version's ID
        break;
      case 'Preview':
      case 'View': // 'View' can be an alias for Preview here
        navigate(`/preview/${versionId}`); // Navigate to preview using specific version's ID
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
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Authentication required');
      }

      // Here, newsletterToDelete is the Supabase 'id' of the specific version row
      const response = await fetch(`/api/delete/${newsletterToDelete}`, { // Assuming DELETE /api/newsletters/:id
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete newsletter version.');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete newsletter version.');
      }

      // After successful deletion, re-fetch the list of versions
      await fetchNewsletterVersions();

      setToastMessage(`Newsletter version deleted successfully.`);
      setToastType('success');
      setShowToast(true);

    } catch (err) {
      console.error('Error deleting newsletter version:', err);
      setToastMessage(`Error deleting version: ${err.message}`);
      setToastType('error');
      setShowToast(true);
    } finally {
      setShowDeleteModal(false);
      setNewsletterToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setNewsletterToDelete(null);
  };

  // --- Styling and Rendering ---

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
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: 'Inter, system-ui, sans-serif'
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
      padding: '32px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    },
    header: {
      fontSize: '42px',
      fontWeight: '800',
      color: '#ffffff',
      marginBottom: '8px',
      fontFamily: 'Inter, system-ui, sans-serif',
      letterSpacing: '-0.025em',
      textAlign: 'center'
    },
    subtitle: {
      color: '#a3a3a3',
      fontSize: '18px',
      marginBottom: '32px',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: '400',
      textAlign: 'center'
    },
    tableContainer: {
      backgroundColor: '#171717',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
      border: '1px solid #262626',
      width: '100%',
      maxWidth: '1200px',
      overflowX: 'auto', // Enable horizontal scrolling for small screens
      marginBottom: '32px'
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0 10px', // Space between rows
      color: '#d4d4d4'
    },
    tableHead: {},
    tableRow: {
      backgroundColor: '#1f1f1f',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.3s ease',
      cursor: 'default'
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
      whiteSpace: 'nowrap'
    },
    tableDataCell: {
      padding: '16px 20px',
      textAlign: 'left',
      fontSize: '15px',
      fontWeight: '400',
      color: '#ffffff',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    actionButtonsContainer: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      justifyContent: 'flex-start' // Align buttons to start
    },
    thumbnail: {
      width: '80px',
      height: 'auto',
      borderRadius: '6px',
      objectFit: 'cover',
      border: '1px solid #404040'
    },
    // Modal Styles (copied from previous component for consistency)
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
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
      gap: '20px'
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
    },
    modalButtonConfirm: {
      backgroundColor: '#ef4444',
      color: 'white',
    },
    modalButtonCancel: {
      backgroundColor: '#404040',
      color: '#ffffff',
    },
    // Toast Styles (copied from previous component)
    toastContainer: {
      position: 'fixed',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#10b981', // Default for success
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
    },
    toastContainerVisible: {
      opacity: 1,
      transform: 'translateX(-50%) translateY(-10px)',
    },
    toastIcon: {
      fontSize: '20px',
    },
    toastError: {
        backgroundColor: '#ef4444', // Red for error
    },
    backButton: {
        backgroundColor: '#404040',
        color: '#ffffff',
        padding: '12px 24px',
        borderRadius: '10px',
        fontSize: '16px',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        marginTop: '20px',
        alignSelf: 'flex-start', // Align to left within flex container
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    }
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
        Loading newsletter versions...
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
        <button onClick={() => navigate(-1)} style={styles.backButton}>
            ← Back to Dashboard
        </button>
      </div>
    );
  }

  const projectTitle = versions.length > 0 ? versions[0].name : 'Newsletter';

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backButton}>
        ← Back to Dashboard
      </button>
      <h1 style={styles.header}>{projectTitle} Versions</h1>
      <p style={styles.subtitle}>All historical saves for this newsletter.</p>

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
                <tr key={version.id} style={styles.tableRow}>
                  <td style={styles.tableDataCell}>Version {version.version}</td>
                  <td style={styles.tableDataCell}>
                    <span style={{ ...styles.statusBadge, ...getStatusBadgeStyle(version.status) }}>
                      {version.status}
                    </span>
                  </td>
                  <td style={styles.tableDataCell}>{version.lastEdited}</td>
                  <td style={styles.tableDataCell}>
                    {version.image_path ? (
                      <img src={version.image_path} alt={`Version ${version.version} Preview`} style={styles.thumbnail} onError={(e) => { e.target.onerror = null; e.target.src = '[https://placehold.co/80xauto/374151/ffffff?text=No+Img](https://placehold.co/80xauto/374151/ffffff?text=No+Img)'; }} />
                    ) : (
                      <img src="[https://placehold.co/80xauto/374151/ffffff?text=No+Img](https://placehold.co/80xauto/374151/ffffff?text=No+Img)" alt="No Preview" style={styles.thumbnail} />
                    )}
                  </td>
                  <td style={styles.tableDataCell}>
                    <div style={styles.actionButtonsContainer}>
                      <button
                        onClick={() => handleActionClick('Edit', version.id)}
                        style={getActionButtonStyle('Edit')}
                        onMouseEnter={(e) => e.target.style.opacity = 0.9}
                        onMouseLeave={(e) => e.target.style.opacity = 1}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleActionClick('Preview', version.id)}
                        style={getActionButtonStyle('Preview')}
                        onMouseEnter={(e) => e.target.style.opacity = 0.9}
                        onMouseLeave={(e) => e.target.style.opacity = 1}
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => handleActionClick('Delete', version.id)}
                        style={getActionButtonStyle('Delete')}
                        onMouseEnter={(e) => e.target.style.opacity = 0.9}
                        onMouseLeave={(e) => e.target.style.opacity = 1}
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
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                style={{ ...styles.modalButton, ...styles.modalButtonCancel }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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
    </div>
  );
};

export default NewsletterVersionsPage;

