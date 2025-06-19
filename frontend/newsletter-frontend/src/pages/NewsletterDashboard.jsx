import React, { useState, useEffect, useCallback} from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js'; // Make sure this import is correct

// Assuming you have this Toast component. If not, paste the basic Toast component
// from the previous response here or create a separate file for it (e.g., components/Toast.jsx)
// import Toast from './Toast'; // Adjust path if needed

// --- Basic Toast Component (If you don't have one, put this in a separate file like components/Toast.jsx) ---
import { XCircle, CheckCircle, Info } from 'lucide-react'; // Assuming you have lucide-react for icons
import { useRef } from 'react';

const Toast = ({ message, type, onClose }) => {
  if (!message) return null;

  let bgColor = '';
  let icon = null;
  let textColor = 'white';

  switch (type) {
    case 'success':
      bgColor = 'rgba(5, 150, 105, 0.9)'; // Green
      icon = <CheckCircle size={20} />;
      break;
    case 'error':
      bgColor = 'rgba(153, 27, 27, 0.9)'; // Red
      icon = <XCircle size={20} />;
      break;
    case 'info':
      bgColor = 'rgba(59, 130, 246, 0.9)'; // Blue
      icon = <Info size={20} />;
      break;
    default:
      bgColor = 'rgba(55, 65, 81, 0.9)'; // Gray/Default
      icon = <Info size={20} />;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: bgColor,
      color: textColor,
      padding: '12px 25px',
      borderRadius: '8px',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      transition: 'opacity 0.3s ease-in-out',
      opacity: message ? 1 : 0,
      pointerEvents: message ? 'auto' : 'none'
    }}>
      {icon}
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: textColor,
          cursor: 'pointer',
          fontSize: '1.2em',
          marginLeft: '10px'
        }}
      >
        &times;
      </button>
    </div>
  );
};
// --- END Basic Toast Component ---


const NewsletterDashboard = () => {
  const [activeSection, setActiveSection] = useState('drafts');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [newsletters, setNewsletters] = useState({
    drafts: [],
    published: [],
    archived: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pagination, setPagination] = useState({
    drafts: { currentPage: 1, itemsPerPage: 6 },
    published: { currentPage: 1, itemsPerPage: 6 },
    archived: { currentPage: 1, itemsPerPage: 6 },
    all: { currentPage: 1, itemsPerPage: 6 }
  });

  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newsletterToDelete, setNewsletterToDelete] = useState(null);

  // State for toast notification
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success', 'error', 'info' for styling

  const navigate = useNavigate();

  const hasFetchedData = useRef(false);

  // Reusable toast display function (added for consistency)
  const displayToast = useCallback((message, type) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setToastMessage('');
      setToastType('success'); // Reset to default
    }, 3500); // Toast disappears after 3.5 seconds
  }, []);

  // Memoized fetchNewsletters using useCallback
  const fetchNewsletters = useCallback(async () => {
    
    try {
      if (hasFetchedData.current) {
      console.log("fetchNewsletters: Data already fetched for this component instance. Skipping.");
      return;
      }

      console.log("Fetching newsletters...");
      setLoading(true);

      // --- AUTHENTICATION CHANGE: Get session from Supabase ---
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting session:", sessionError);
        displayToast('Authentication error. Please log in again.', 'error'); // Use displayToast
        navigate('/login'); // Redirect on session error
        throw new Error(`Failed to get session: ${sessionError.message}`);
      }

      if (!session || !session.access_token) {
        // If no session or no access token after attempting to get it,
        // it means the user is genuinely not logged in or the session is truly invalid.
        console.warn("No active session or access token found. Redirecting to login.");
        displayToast('Authentication required. Please log in.', 'info'); // Use displayToast
        navigate('/login');
        throw new Error('Authentication required. Session expired or not found.');
      }

      const authToken = session.access_token; // Use the fresh token

      const response = await fetch('/api/newsletters-current', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        // More robust error handling for backend responses
        if (response.status === 401 || response.status === 403) {
            console.error("Backend authentication failed:", response.status, response.statusText);
            // Clear session and redirect if backend explicitly denies auth
            await supabase.auth.signOut();
            navigate('/login');
            throw new Error('Session expired or unauthorized. Please log in again.');
        }
        const errorData = await response.json(); // Try to parse error message from backend
        throw new Error(errorData.error || `Failed to fetch newsletters: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch newsletters');
      }
      const transformedData = {
        drafts: data.data.DRAFT.map(item => ({
          id: item.id,
          title: item.project_name || 'Untitled Newsletter',
          status: 'draft',
          lastEdited: new Date(item.updated_at || item.created_at).toLocaleDateString(),
          image_path: item.image_path,
          version: item.version || 'N/A',
          project_id: item.project_id
        })),
        published: data.data.PUBLISHED.map(item => ({
          id: item.id,
          title: item.project_name || 'Published Newsletter',
          status: 'published',
          lastEdited: new Date(item.updated_at || item.created_at).toLocaleDateString(),
          image_path: item.image_path,
          version: item.version || 'N/A',
          project_id: item.project_id
        })),
        archived: data.data.ARCHIVED.map(item => ({
          id: item.id,
          title: item.project_name || 'Archived Newsletter',
          status: 'archived',
          lastEdited: new Date(item.updated_at || item.created_at).toLocaleDateString(),
          image_path: item.image_path,
          version: item.version || 'N/A',
          project_id: item.project_id
        }))
      };

      setNewsletters(transformedData);
    } catch (err) {
      console.error('Error fetching newsletters:', err);
      setError(err.message);
      displayToast(`Error loading newsletters: ${err.message}`, 'error'); // Use displayToast
    } finally {
      setLoading(false);
    }
  }, [navigate, displayToast]); // navigate and displayToast are dependencies

  // Trigger fetchNewsletters on component mount
  useEffect(() => {
    fetchNewsletters();
  }, [fetchNewsletters]); // Dependency on memoized fetchNewsletters

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true); // Always show sidebar on desktop
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to hide toast after a few seconds (simplified, now handled by displayToast)
  // This useEffect is no longer strictly necessary if displayToast manages auto-hide
  useEffect(() => {
    // This useEffect can be removed if displayToast handles auto-hide
    // If you want a separate mechanism for clearing toasts, keep it.
    // For now, displayToast handles it for simplicity.
  }, [showToast]); // Keep for now to be safe, but can be reconsidered


  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handlePageChange = (section, page) => {
    setPagination(prev => ({
      ...prev,
      [section]: { ...prev[section], currentPage: page }
    }));
  };

  // Function to handle opening the delete confirmation modal
  const handleDeleteClick = (newsletterId) => {
    setNewsletterToDelete(newsletterId);
    setShowDeleteModal(true);
  };

  // Helper to get newsletter title by ID
  const getNewsletterTitleById = (id) => {
    const allNewsletters = [
      ...newsletters.drafts,
      ...newsletters.published,
      ...newsletters.archived
    ];
    const found = allNewsletters.find(nl => nl.id === id);
    return found ? found.title : 'Unknown Newsletter';
  };

  // Function to confirm and perform the delete action
  const confirmDelete = useCallback(async () => {
    try {
      // --- AUTHENTICATION CHANGE: Get session from Supabase ---
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Error getting session for delete:", sessionError);
        displayToast('Authentication error. Please log in again.', 'error');
        navigate('/login');
        throw new Error(`Failed to get session for delete: ${sessionError.message}`);
      }
      if (!session || !session.access_token) {
        await supabase.auth.signOut();
        navigate('/login');
        throw new Error('Authentication required to delete. Please log in again.');
      }
      const authToken = session.access_token; // Use the fresh token

      const response = await fetch(`/api/delete/${newsletterToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401 || response.status === 403) {
            await supabase.auth.signOut();
            navigate('/login');
            throw new Error('Session expired or unauthorized. Please log in again.');
        }
        throw new Error(errorData.error || 'Failed to delete newsletter');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete newsletter');
      }

      const deletedNewsletterTitle = getNewsletterTitleById(newsletterToDelete);

      setNewsletters(prevNewsletters => {
        const newNewsletters = { ...prevNewsletters };
        for (const section in newNewsletters) {
          newNewsletters[section] = newNewsletters[section].filter(
            (newsletter) => newsletter.id !== newsletterToDelete
          );
        }
        return newNewsletters;
      });

      displayToast(`File '${deletedNewsletterTitle}' deleted successfully.`, 'success'); // Use displayToast

    } catch (err) {
      console.error('Error deleting newsletter:', err);
      displayToast(`Error deleting newsletter: ${err.message}`, 'error'); // Use displayToast
    } finally {
      setShowDeleteModal(false);
      setNewsletterToDelete(null);
    }
  }, [newsletterToDelete, navigate, getNewsletterTitleById, displayToast]); // newsletterToDelete, navigate, getNewsletterTitleById, displayToast are dependencies

  const handleDuplicate = useCallback(async (newsletterId) => {
    try {
      // --- AUTHENTICATION CHANGE: Get session from Supabase ---
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Error getting session for duplicate:", sessionError);
        displayToast('Authentication error. Please log in again.', 'error'); // Use displayToast
        navigate('/login');
        throw new Error(`Failed to get session for duplicate: ${sessionError.message}`);
      }
      if (!session || !session.access_token) {
        await supabase.auth.signOut();
        navigate('/login');
        throw new Error('Authentication required to duplicate. Please log in again.');
      }
      const authToken = session.access_token; // Use the fresh token

      const originalNewsletterTitle = getNewsletterTitleById(newsletterId);

      // Confirm with the user before duplicating
      const confirmed = window.confirm(`Are you sure you want to duplicate "${originalNewsletterTitle}"?`);
      if (!confirmed) {
        return; // User cancelled
      }

      console.log(`Attempting to duplicate newsletter with ID: ${newsletterId}`);
      const response = await fetch(`/api/${newsletterId}/duplicate`, { // Corrected endpoint to match Flask backend
        method: 'POST', // Use POST method for duplication
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401 || response.status === 403) {
            await supabase.auth.signOut();
            navigate('/login');
            throw new Error('Session expired or unauthorized. Please log in again.');
        }
        throw new Error(errorData.message || 'Failed to duplicate newsletter.');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to duplicate newsletter.');
      }

      displayToast(`Newsletter '${data.name}' duplicated successfully!`, 'success'); // Use displayToast

      // Re-fetch all newsletters to show the new duplicate
      await fetchNewsletters();

    } catch (err) {
      console.error('Error duplicating newsletter:', err);
      displayToast(`Error duplicating newsletter: ${err.message}`, 'error'); // Use displayToast
    }
  }, [navigate, fetchNewsletters, getNewsletterTitleById, displayToast]); // navigate, fetchNewsletters, getNewsletterTitleById, displayToast are dependencies


  // NEW: Function to handle restoring a newsletter
  const handleRestore = useCallback(async (newsletterId) => {
    try {
      // --- AUTHENTICATION: Get session from Supabase ---
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Error getting session for restore:", sessionError);
        displayToast('Authentication error. Please log in again.', 'error');
        navigate('/login');
        throw new Error(`Failed to get session for restore: ${sessionError.message}`);
      }
      if (!session || !session.access_token) {
        await supabase.auth.signOut();
        navigate('/login');
        throw new Error('Authentication required to restore. Please log in again.');
      }
      const authToken = session.access_token; // Use the fresh token

      const newsletterTitle = getNewsletterTitleById(newsletterId);

    
      const confirmed = window.confirm(`Are you sure you want to restore "${newsletterTitle}"?`);
      if (!confirmed) {
        return; // User cancelled
      }

      console.log(`Attempting to restore newsletter with ID: ${newsletterId}`);
      const response = await fetch(`/api/restore/${newsletterId}`, {
        method: 'POST', // Use POST method for restore
        headers: {
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${authToken}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401 || response.status === 403) {
            await supabase.auth.signOut();
            navigate('/login');
            throw new Error('Session expired or unauthorized. Please log in again.');
        }
        throw new Error(errorData.error || 'Failed to restore newsletter.');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to restore newsletter.');
      }

      displayToast(`Newsletter '${newsletterTitle}' restored successfully.`, 'success');

      // IMPORTANT: Re-fetch all newsletters to update the UI (e.g., move from archived to drafts)
      await fetchNewsletters();

    } catch (err) {
      console.error('Error restoring newsletter:', err);
      displayToast(`Error restoring newsletter: ${err.message}`, 'error');
    }
  }, [newsletterToDelete, navigate, fetchNewsletters, getNewsletterTitleById, displayToast]); // newsletterToDelete, navigate, fetchNewsletters, getNewsletterTitleById, displayToast are dependencies


  // Function to cancel the delete action
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setNewsletterToDelete(null);
  };

  const handleActionClick = (action, newsletterId, projectId) => {
    switch (action) {
      case 'Edit':
        navigate(`/editor/${newsletterId}`);
        break;
      case 'View':
        console.log(`View action clicked for newsletter ID: ${newsletterId}`);
        navigate(`/preview/${newsletterId}`);
        break;
      case 'Preview':
        navigate(`/preview/${newsletterId}`);
        break;
      case 'Delete':
        handleDeleteClick(newsletterId); // Call the new handler for delete
        break;
      case 'Duplicate':
        handleDuplicate(newsletterId); // Call the new handler for duplicate
        break;
      case 'Restore':
        handleRestore(newsletterId); // Call the new handler for restore
        break;
      case 'Versions':
        navigate(`/versions/${projectId}`);
        break;
      default:
        console.log(`${action} action clicked for newsletter ID: ${newsletterId}`);
    }
  };

  const createNewsletter = () => {
    navigate('/generator');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Adjusted condition to correctly identify clicks outside the sidebar and not on the toggle button
      if (isMobile && sidebarOpen &&
          !event.target.closest('.sidebar') &&
          !event.target.closest('.mobile-menu-btn')) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [sidebarOpen, isMobile]);


  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'draft': return { backgroundColor: '#fbbf24', color: '#1f2937', border: '1px solid #f59e0b' };
      case 'published': return { backgroundColor: '#10b981', color: '#ffffff', border: '1px solid #059669' };
      case 'archived': return { backgroundColor: '#6b7280', color: '#ffffff', border: '1px solid #4b5563' };
      default: return { backgroundColor: '#374151', color: '#d1d5db', border: '1px solid #6b7280' };
    }
  };

  const getActionButtons = (status) => {
    switch (status) {
      case 'draft': return ['Edit', 'Preview', 'Delete', 'Versions'];
      case 'published': return ['View', 'Duplicate', 'Versions'];
      case 'archived': return ['View', 'Restore', 'Versions'];
      default: return ['View'];
    }
  };

  const getCurrentNewsletters = () => {
    const allNewsletters = {
      drafts: newsletters.drafts,
      published: newsletters.published,
      archived: newsletters.archived,
      all: [...newsletters.drafts, ...newsletters.published, ...newsletters.archived]
    };

    const sectionNewsletters = allNewsletters[activeSection] || [];
    const currentPagination = pagination[activeSection];
    const startIndex = (currentPagination.currentPage - 1) * currentPagination.itemsPerPage;
    const endIndex = startIndex + currentPagination.itemsPerPage;

    return sectionNewsletters.slice(startIndex, endIndex).map(newsletter => ({
      ...newsletter,
      previewImage: newsletter.image_path // Ensure this is correctly mapped
    }));
  };

  const getTotalPages = (section) => {
    const allNewsletters = {
      drafts: newsletters.drafts,
      published: newsletters.published,
      archived: newsletters.archived,
      all: [...newsletters.drafts, ...newsletters.published, ...newsletters.archived]
    };

    const sectionNewsletters = allNewsletters[section] || [];
    return Math.ceil(sectionNewsletters.length / pagination[section].itemsPerPage);
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'drafts': return 'Draft Newsletters';
      case 'published': return 'Published Newsletters';
      case 'archived': return 'Archived Newsletters';
      case 'all': return 'All Newsletters';
      default: return 'Draft Newsletters';
    }
  };

  const getActionButtonStyle = (action) => {
    const baseStyle = {
      padding: '6px 10px', // Smaller padding for compactness
      borderRadius: '6px', // Slightly smaller radius
      fontSize: '12px',    // Smaller font size for buttons
      fontWeight: '500',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: 'Inter, system-ui, sans-serif',
      flexShrink: 0, // Prevent shrinking
      whiteSpace: 'nowrap', // Prevent text wrapping
    };

    switch (action) {
      case 'Edit': return { ...baseStyle, backgroundColor: '#3b82f6', color: '#ffffff', '&:hover': { backgroundColor: '#2563eb' } };
      case 'Preview':
      case 'View': return { ...baseStyle, backgroundColor: '#8b5cf6', color: '#ffffff', '&:hover': { backgroundColor: '#7c3aed' } };
      case 'Delete': return { ...baseStyle, backgroundColor: '#ef4444', color: '#ffffff', '&:hover': { backgroundColor: '#dc2626' } };
      case 'Duplicate': return { ...baseStyle, backgroundColor: '#10b981', color: '#ffffff', '&:hover': { backgroundColor: '#047857' } };
      case 'Restore': return { ...baseStyle, backgroundColor: '#f59e0b', color: '#ffffff', '&:hover': { backgroundColor: '#d97706' } };
      case 'Versions': return { ...baseStyle, backgroundColor: '#525252', color: '#ffffff', '&:hover': { backgroundColor: '#3f3f46' } }; // New style for 'Versions'
      default: return { ...baseStyle, backgroundColor: '#6b7280', color: '#ffffff' };
    }
  };

  const renderPagination = () => {
    const totalPages = getTotalPages(activeSection);
    const currentPage = pagination[activeSection].currentPage;

    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = isMobile ? 3 : 5; // Fewer pages on mobile

      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        const half = Math.floor(maxVisiblePages / 2);
        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, start + maxVisiblePages - 1);

        if (end - start < maxVisiblePages - 1) {
          start = Math.max(1, end - maxVisiblePages + 1);
        }

        if (start > 1) {
          pages.push(1);
          if (start > 2) pages.push('...');
        }

        for (let i = start; i <= end; i++) {
          pages.push(i);
        }

        if (end < totalPages) {
          if (end < totalPages - 1) pages.push('...');
          pages.push(totalPages);
        }
      }

      return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
      <div style={styles.paginationContainer}>
        <button
          onClick={() => handlePageChange(activeSection, Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          style={{
            ...styles.paginationButton,
            ...(currentPage === 1 ? styles.paginationButtonDisabled : {})
          }}
        >
          ←
        </button>

        {pageNumbers.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' ? handlePageChange(activeSection, page) : null}
            disabled={page === '...'}
            style={{
              ...styles.paginationButton,
              ...(page === currentPage ? styles.paginationButtonActive : {}),
              ...(page === '...' ? styles.paginationButtonDisabled : {})
            }}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(activeSection, Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          style={{
            ...styles.paginationButton,
            ...(currentPage === totalPages ? styles.paginationButtonDisabled : {})
          }}
        >
          →
        </button>
      </div>
    );
  };

  const styles = {
    container: {
      height: '100%',
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      backgroundColor: '#111111',
      borderBottom: '1px solid #262626',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
    },
    logo: {
      fontSize: '28px',
      fontWeight: '800',
      background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontFamily: 'Inter, system-ui, sans-serif',
      letterSpacing: '-0.025em'
    },
    nav: {
      display: isMobile ? 'none' : 'flex',
      gap: '32px',
      alignItems: 'center'
    },
    navLink: {
      color: '#a3a3a3',
      fontWeight: '500',
      textDecoration: 'none',
      transition: 'color 0.3s ease, transform 0.3s ease', // Added transform for hover
      fontSize: '15px',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '8px 16px',
      borderRadius: '8px',
      // Add hover effect
      ':hover': {
        color: '#ffffff',
        transform: 'translateY(-2px)'
      }
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    mobileMenuBtn: {
      fontSize: '24px',
      color: '#3b82f6',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      display: isMobile ? 'block' : 'none',
      padding: '8px'
    },
    avatar: {
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '700',
      cursor: 'pointer',
      fontSize: '16px',
      fontFamily: 'Inter, system-ui, sans-serif',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      ':hover': {
        transform: 'scale(1.05)',
        boxShadow: '0 6px 16px rgba(59, 130, 246, 0.5)'
      }
    },
    mainContainer: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden'
    },
    sidebar: {
      width: '280px',
      backgroundColor: '#111111',
      borderRight: '1px solid #262626',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.3s ease',
      transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
      position: isMobile ? 'fixed' : 'static',
      top: isMobile ? '80px' : 'auto',
      left: isMobile ? 0 : 'auto',
      height: isMobile ? 'calc(100vh - 80px)' : '100%',
      zIndex: 40,
      overflowY: 'auto',
      boxShadow: isMobile && sidebarOpen ? '5px 0 15px rgba(0, 0, 0, 0.5)' : 'none',
    },
    sectionTitle: {
      fontSize: '12px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: '#737373',
      marginBottom: '16px',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    sidebarList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      marginBottom: '32px'
    },
    sidebarItem: {
      marginBottom: '4px'
    },
    sidebarButton: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      fontSize: '14px',
      fontFamily: 'Inter, system-ui, sans-serif',
      ':hover': { // Basic hover for all sidebar buttons
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        color: '#d4d4d4'
      }
    },
    sidebarButtonActive: {
      backgroundColor: '#3b82f6',
      color: 'white',
      transform: 'translateX(4px)',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
      ':hover': { // Keep active style on hover for active button
        backgroundColor: '#3b82f6',
        color: 'white',
        transform: 'translateX(4px)' // Maintain the transform
      }
    },
    sidebarButtonInactive: {
      backgroundColor: 'transparent',
      color: '#a3a3a3'
    },
    main: {
      flex: 1,
      padding: '32px',
      backgroundColor: '#0a0a0a',
      paddingBottom: '64px',
      overflowY: 'auto'
    },
    mainTitle: {
      fontSize: '42px',
      fontWeight: '800',
      color: '#ffffff',
      marginBottom: '8px',
      fontFamily: 'Inter, system-ui, sans-serif',
      letterSpacing: '-0.025em'
    },
    mainSubtitle: {
      color: '#a3a3a3',
      fontSize: '18px',
      marginBottom: '32px',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: '400'
    },
    createButton: {
      background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
      color: 'white',
      padding: '18px 36px',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginBottom: '32px',
      fontFamily: 'Inter, system-ui, sans-serif',
      boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
      ':hover': {
        transform: 'translateY(-3px)',
        boxShadow: '0 12px 30px rgba(59, 130, 246, 0.5)'
      }
    },
    createButtonContainer: {
      backgroundColor: '#171717',
      borderRadius: '16px',
      padding: '32px',
      marginBottom: '32px',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
      border: '1px solid #262626'
    },
    tabsContainer: {
      display: 'flex',
      gap: '6px',
      marginBottom: '32px',
      backgroundColor: '#171717',
      borderRadius: '14px',
      padding: '6px',
      border: '1px solid #262626'
    },
    tab: {
      flex: 1,
      padding: '14px 20px',
      borderRadius: '10px',
      fontWeight: '500',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px'
    },
    tabActive: {
      backgroundColor: '#3b82f6',
      color: 'white',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
    },
    tabInactive: {
      backgroundColor: 'transparent',
      color: '#a3a3a3',
      ':hover': {
        backgroundColor: '#262626', // Lighter hover for inactive tabs
        color: '#ffffff'
      }
    },
    contentContainer: {
      backgroundColor: '#171717',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
      border: '1px solid #262626',
      marginBottom: '32px'
    },
    contentTitle: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '24px',
      fontFamily: 'Inter, system-ui, sans-serif',
      letterSpacing: '-0.025em'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', // Slightly smaller min width for more cards per row
      gap: '24px',
      marginBottom: '32px',
      // Responsive adjustments for grid
      '@media (maxWidth: 1024px)': {
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      },
      '@media (maxWidth: 768px)': {
        gridTemplateColumns: '1fr', // Single column on small screens
      },
    },
    card: {
      backgroundColor: '#1f1f1f',
      borderRadius: '16px',
      padding: '0',
      border: '1px solid #404040',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
      ':hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 15px 30px rgba(0, 0, 0, 0.5)',
        borderColor: '#3b82f6' // Highlight border on hover
      }
    },
    cardImageContainer: {
      width: '100%',
      height: '180px', // Slightly taller image area
      overflow: 'hidden',
      position: 'relative',
      borderTopLeftRadius: '16px',
      borderTopRightRadius: '16px',
    },
    cardImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'transform 0.3s ease'
    },
    cardContent: {
      padding: '20px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative', // For top border positioning
    },
    cardTopBorder: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)', // Horizontal gradient
      zIndex: 1, // Ensure it's above content
    },
    cardTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '4px', // Reduced margin
      fontFamily: 'Inter, system-ui, sans-serif',
      lineHeight: '1.3' // Improve readability
    },
    cardMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '10px' // Reduced margin
    },
    cardDate: {
      color: '#a3a3a3',
      fontSize: '13px', // Slightly smaller
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    statusBadge: {
      padding: '4px 10px', // Smaller padding
      borderRadius: '6px', // Smaller radius
      fontSize: '11px', // Smaller font size
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'inline-block' // Ensure it behaves like a block for sizing
    },
    cardPreview: {
      color: '#d4d4d4',
      lineHeight: '1.5', // Adjusted line height
      marginBottom: '16px',
      display: '-webkit-box',
      WebkitLineClamp: 3,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '13px' // Slightly smaller font
    },
    cardActions: {
      display: 'flex',
      gap: '6px', // Smaller gap between buttons
      flexWrap: 'wrap', // Allow wrapping if space is tight
      marginTop: 'auto', // Push actions to the bottom of the card
      justifyContent: 'flex-start', // Align buttons to the start
      // Adjust behavior for smaller screens/more buttons
      '@media (maxWidth: 400px)': { // Example breakpoint for very small screens
        flexDirection: 'column', // Stack buttons vertically
        gap: '8px',
        alignItems: 'stretch', // Make buttons full width
      },
    },
    paginationContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      marginTop: '24px'
    },
    paginationButton: {
      padding: '8px 12px',
      borderRadius: '8px',
      border: '1px solid #404040',
      backgroundColor: '#1f1f1f',
      color: '#a3a3a3',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
      fontWeight: '500',
      minWidth: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ':hover': {
        backgroundColor: '#262626',
        color: '#ffffff',
        borderColor: '#525252'
      }
    },
    paginationButtonActive: {
      backgroundColor: '#3b82f6',
      color: 'white',
      borderColor: '#3b82f6',
      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
      ':hover': {
        backgroundColor: '#3b82f6', // Maintain active style on hover
        color: 'white',
        borderColor: '#3b82f6',
      }
    },
    paginationButtonDisabled: {
      backgroundColor: '#111111',
      color: '#525252',
      cursor: 'not-allowed',
      borderColor: '#262626',
      ':hover': { // No hover effect for disabled buttons
        backgroundColor: '#111111',
        color: '#525252',
        borderColor: '#262626',
      }
    },
    footer: {
      backgroundColor: '#111111',
      borderTop: '1px solid #262626',
      padding: '24px',
      color: '#a3a3a3',
      marginTop: 'auto',
      width: '100%',
    },
    footerContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
      maxWidth: '1200px',
      margin: '0 auto',
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>SwiftScribe</div>
        <nav style={styles.nav}>
          <a href="#" style={styles.navLink}>Dashboard</a>
          <a href="#" style={styles.navLink}>Templates</a>
          <a href="#" style={styles.navLink}>Settings</a>
        </nav>
        <div style={styles.headerRight}>
          <button style={styles.mobileMenuBtn} onClick={toggleSidebar}>☰</button>
          <div style={styles.avatar}>JS</div>
        </div>
      </header>

      <div style={styles.mainContainer}>
        <aside className="sidebar" style={styles.sidebar}>
          <div style={styles.sectionTitle}>Newsletters</div>
          <ul style={styles.sidebarList}>
            <li style={styles.sidebarItem}>
              <button
                onClick={() => handleSectionChange('drafts')}
                style={{
                  ...styles.sidebarButton,
                  ...(activeSection === 'drafts' ? styles.sidebarButtonActive : styles.sidebarButtonInactive)
                }}
              >
                <i className="lucide lucide-file-text"></i>
                Drafts
              </button>
            </li>
            <li style={styles.sidebarItem}>
              <button
                onClick={() => handleSectionChange('published')}
                style={{
                  ...styles.sidebarButton,
                  ...(activeSection === 'published' ? styles.sidebarButtonActive : styles.sidebarButtonInactive)
                }}
              >
                <i className="lucide lucide-globe"></i>
                Published
              </button>
            </li>
            <li style={styles.sidebarItem}>
              <button
                onClick={() => handleSectionChange('archived')}
                style={{
                  ...styles.sidebarButton,
                  ...(activeSection === 'archived' ? styles.sidebarButtonActive : styles.sidebarButtonInactive)
                }}
              >
                <i className="lucide lucide-archive"></i>
                Archived
              </button>
            </li>
            <li style={styles.sidebarItem}>
              <button
                onClick={() => handleSectionChange('all')}
                style={{
                  ...styles.sidebarButton,
                  ...(activeSection === 'all' ? styles.sidebarButtonActive : styles.sidebarButtonInactive)
                }}
              >
                <i className="lucide lucide-layout-grid"></i>
                All
              </button>
            </li>
          </ul>

          <div style={styles.sectionTitle}>Tools</div>
          <ul style={styles.sidebarList}>
            <li style={styles.sidebarItem}>
              <button
                style={{
                  ...styles.sidebarButton,
                  ...styles.sidebarButtonInactive
                }}
              >
                <i className="lucide lucide-palette"></i>
                Templates
              </button>
            </li>
            <li style={styles.sidebarItem}>
              <button
                style={{
                  ...styles.sidebarButton,
                  ...styles.sidebarButtonInactive
                }}
              >
                <i className="lucide lucide-chart-bar"></i>
                Analytics
              </button>
            </li>
          </ul>
        </aside>

        <main style={styles.main}>
          <h1 style={styles.mainTitle}>Dashboard</h1>
          <p style={styles.mainSubtitle}>Manage your newsletters and content</p>

          <div style={styles.createButtonContainer}>
            <button style={styles.createButton} onClick={createNewsletter}>
              + Create New Newsletter
            </button>
          </div>

          <div style={styles.tabsContainer}>
            <button
              onClick={() => handleSectionChange('drafts')}
              style={{
                ...styles.tab,
                ...(activeSection === 'drafts' ? styles.tabActive : styles.tabInactive)
              }}
            >
              Drafts
            </button>
            <button
              onClick={() => handleSectionChange('published')}
              style={{
                ...styles.tab,
                ...(activeSection === 'published' ? styles.tabActive : styles.tabInactive)
              }}
            >
              Published
            </button>
            <button
              onClick={() => handleSectionChange('archived')}
              style={{
                ...styles.tab,
                ...(activeSection === 'archived' ? styles.tabActive : styles.tabInactive)
              }}
            >
              Archived
            </button>
            <button
              onClick={() => handleSectionChange('all')}
              style={{
                ...styles.tab,
                ...(activeSection === 'all' ? styles.tabActive : styles.tabInactive)
              }}
            >
              All
            </button>
          </div>

          <div style={styles.contentContainer}>
            <h2 style={styles.contentTitle}>{getSectionTitle()}</h2>
            {loading ? (
              <p style={{ color: '#a3a3a3', textAlign: 'center' }}>Loading newsletters...</p>
            ) : error ? (
              <p style={{ color: '#ef4444', textAlign: 'center' }}>Error: {error}</p>
            ) : getCurrentNewsletters().length === 0 ? (
              <p style={{ color: '#a3a3a3', textAlign: 'center' }}>No newsletters in this section.</p>
            ) : (
              <div style={styles.grid}>
                {getCurrentNewsletters().map(newsletter => (
                  <div key={newsletter.id} style={styles.card}>
                    <div style={styles.cardImageContainer}>
                      <div style={styles.cardTopBorder}></div>
                      <img
                        src={newsletter.image_path || 'https://via.placeholder.com/400x180?text=No+Image'}
                        alt={newsletter.title}
                        style={styles.cardImage}
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x180?text=Image+Error'; }}
                      />
                    </div>
                    <div style={styles.cardContent}>
                      <h3 style={styles.cardTitle}>{newsletter.title}</h3>
                      <div style={styles.cardMeta}>
                        <span style={styles.cardDate}>Last Edited: {newsletter.lastEdited}</span>
                        <span style={{ ...styles.statusBadge, ...getStatusBadgeStyle(newsletter.status) }}>
                          {newsletter.status}
                        </span>
                      </div>
                      <p style={styles.cardPreview}>
                        Version: {newsletter.version}
                      </p>
                      <div style={styles.cardActions}>
                        {getActionButtons(newsletter.status).map(action => (
                          <button
                            key={action}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click if button is clicked
                              handleActionClick(action, newsletter.id, newsletter.project_id);
                            }}
                            style={getActionButtonStyle(action)}
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {renderPagination()}
          </div>
        </main>
      </div>

      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <span>&copy; {new Date().getFullYear()} SwiftScribe. All rights reserved.</span>
          <span>Privacy Policy | Terms of Service</span>
        </div>
      </footer>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1f1f1f', padding: '30px', borderRadius: '15px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)', maxWidth: '450px', width: '90%',
            border: '1px solid #404040', color: 'white', textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '24px', marginBottom: '15px' }}>Confirm Delete</h3>
            <p style={{ fontSize: '16px', marginBottom: '30px', color: '#a3a3a3' }}>
              Are you sure you want to permanently delete "{getNewsletterTitleById(newsletterToDelete)}"? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '12px 25px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#ef4444', color: 'white', cursor: 'pointer',
                  fontSize: '16px', fontWeight: '600', transition: 'background-color 0.2s'
                }}
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                style={{
                  padding: '12px 25px', borderRadius: '8px', border: '1px solid #6b7280',
                  backgroundColor: 'transparent', color: '#a3a3a3', cursor: 'pointer',
                  fontSize: '16px', fontWeight: '600', transition: 'background-color 0.2s'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)} // Allow closing manually
        />
      )}
    </div>
  );
};

export default NewsletterDashboard;