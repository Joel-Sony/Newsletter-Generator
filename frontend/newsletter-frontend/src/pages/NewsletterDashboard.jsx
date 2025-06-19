import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js'; // Make sure this import is correct
import { XCircle, CheckCircle, Info, Menu, UserRound, LogOut, FileText, LayoutList, Archive, PlusCircle, PenTool, Eye, Copy, Trash2, RotateCcw, GitBranch, Search } from 'lucide-react';

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
  const [userEmail, setUserEmail] = useState(''); 
  const [searchTerm, setSearchTerm] = useState(''); 

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
  const [toastType, setToastType] = useState('success'); 

  const [showAccountDropdown, setShowAccountDropdown] = useState(false); 
  const accountRef = useRef(null); 

  const [showCreateOptionsModal, setShowCreateOptionsModal] = useState(false);

  const navigate = useNavigate();

  const hasFetchedDataOnce = useRef(false);

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
  const fetchNewsletters = useCallback(async (forceRefetch = false) => {
    if (!forceRefetch && sessionStorage.getItem('newslettersData')) {
      try {
        const cachedData = JSON.parse(sessionStorage.getItem('newslettersData'));
        setNewsletters(cachedData);
        setLoading(false);
        console.log("Newsletters loaded from session storage.");
        hasFetchedDataOnce.current = true; // Mark as fetched even from cache
        return;
      } catch (e) {
        console.error("Error parsing cached newsletters from session storage, re-fetching:", e);
      }
    }

    if (hasFetchedDataOnce.current && !forceRefetch) {
      console.log("fetchNewsletters: Data already fetched for this component instance (or from cache). Skipping API call.");
      return;
    }

    console.log("Fetching newsletters from API...");
    setLoading(true);

    try {

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting session:", sessionError);
        displayToast('Authentication error. Please log in again.', 'error');
        navigate('/login');
        throw new Error(`Failed to get session: ${sessionError.message}`);
      }

      if (!session || !session.access_token) {
        console.warn("No active session or access token found. Redirecting to login.");
        displayToast('Authentication required. Please log in.', 'info');
        navigate('/login');
        throw new Error('Authentication required. Session expired or not found.');
      }

      // Set user email
      setUserEmail(session.user?.email || '');
      console.log("Supabase session:", session);
      console.log("User email from session:", session.user?.email);
      console.log("User email state (userEmail):", userEmail);

      const authToken = session.access_token;

      const response = await fetch('/api/newsletters-current', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.error("Backend authentication failed:", response.status, response.statusText);
          await supabase.auth.signOut();
          navigate('/login');
          throw new Error('Session expired or unauthorized. Please log in again.');
        }
        const errorData = await response.json();
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
      sessionStorage.setItem('newslettersData', JSON.stringify(transformedData)); // Store in session storage
      hasFetchedDataOnce.current = true; // Mark as fetched from API
    } catch (err) {
      console.error('Error fetching newsletters:', err);
      setError(err.message);
      displayToast(`Error loading newsletters: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [navigate, displayToast]);

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

  const handleSectionChange = (section) => {
    setActiveSection(section);
    // Reset search term when changing sections
    setSearchTerm('');
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
      const authToken = session.access_token;

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

      // Invalidate session storage cache after data modification
      sessionStorage.removeItem('newslettersData');
      hasFetchedDataOnce.current = false; // Reset the ref to force re-fetch

      // Re-fetch all newsletters to update the UI
      await fetchNewsletters(true); // Force refetch after deletion

      displayToast(`File '${deletedNewsletterTitle}' deleted successfully.`, 'success');

    } catch (err) {
      console.error('Error deleting newsletter:', err);
      displayToast(`Error deleting newsletter: ${err.message}`, 'error');
    } finally {
      setShowDeleteModal(false);
      setNewsletterToDelete(null);
    }
  }, [newsletterToDelete, navigate, getNewsletterTitleById, displayToast, fetchNewsletters]);

  const handleDuplicate = useCallback(async (newsletterId) => {
    try {
      // --- AUTHENTICATION CHANGE: Get session from Supabase ---
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Error getting session for duplicate:", sessionError);
        displayToast('Authentication error. Please log in again.', 'error');
        navigate('/login');
        throw new Error(`Failed to get session for duplicate: ${sessionError.message}`);
      }
      if (!session || !session.access_token) {
        await supabase.auth.signOut();
        navigate('/login');
        throw new Error('Authentication required to duplicate. Please log in again.');
      }
      const authToken = session.access_token;

      const originalNewsletterTitle = getNewsletterTitleById(newsletterId);

      const confirmed = window.confirm(`Are you sure you want to duplicate "${originalNewsletterTitle}"?`);
      if (!confirmed) {
        return;
      }

      console.log(`Attempting to duplicate newsletter with ID: ${newsletterId}`);
      const response = await fetch(`/api/${newsletterId}/duplicate`, {
        method: 'POST',
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

      displayToast(`Newsletter '${data.name}' duplicated successfully!`, 'success');

      // Invalidate session storage cache after data modification
      sessionStorage.removeItem('newslettersData');
      hasFetchedDataOnce.current = false; // Reset the ref to force re-fetch

      // Re-fetch all newsletters to show the new duplicate
      await fetchNewsletters(true); // Force refetch after duplication

    } catch (err) {
      console.error('Error duplicating newsletter:', err);
      displayToast(`Error duplicating newsletter: ${err.message}`, 'error');
    }
  }, [navigate, fetchNewsletters, getNewsletterTitleById, displayToast]);


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
      const authToken = session.access_token;

      const newsletterTitle = getNewsletterTitleById(newsletterId);

      const confirmed = window.confirm(`Are you sure you want to restore "${newsletterTitle}"?`);
      if (!confirmed) {
        return;
      }

      console.log(`Attempting to restore newsletter with ID: ${newsletterId}`);
      const response = await fetch(`/api/restore/${newsletterId}`, {
        method: 'POST',
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

      // Invalidate session storage cache after data modification
      sessionStorage.removeItem('newslettersData');
      hasFetchedDataOnce.current = false; // Reset the ref to force re-fetch

      // IMPORTANT: Re-fetch all newsletters to update the UI (e.g., move from archived to drafts)
      await fetchNewsletters(true); // Force refetch after restore

    } catch (err) {
      console.error('Error restoring newsletter:', err);
      displayToast(`Error restoring newsletter: ${err.message}`, 'error');
    }
  }, [navigate, fetchNewsletters, getNewsletterTitleById, displayToast]);


  // Function to cancel the delete action
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setNewsletterToDelete(null);
  };

  const handleActionClick = (action, newsletterId, projectId) => {
    switch (action) {
      case 'Edit':
        // Invalidate session storage cache to force re-fetch when returning to dashboard after editing
        sessionStorage.removeItem('newslettersData');
        hasFetchedDataOnce.current = false; // Reset the ref to force re-fetch
        navigate(`/editor/${newsletterId}`);
        break;
      case 'View':
      case 'Preview':
        navigate(`/preview/${newsletterId}`);
        break;
      case 'Delete':
        handleDeleteClick(newsletterId);
        break;
      case 'Duplicate':
        handleDuplicate(newsletterId);
        break;
      case 'Restore':
        handleRestore(newsletterId);
        break;
      case 'Versions':
        navigate(`/versions/${projectId}`);
        break;
      default:
        console.log(`${action} action clicked for newsletter ID: ${newsletterId}`);
    }
  };

  // MODIFIED: This function now opens the modal instead of navigating directly
  const createNewsletter = () => {
    setShowCreateOptionsModal(true);
  };

  // NEW: Handlers for each creation option
  const handleCreateBlank = () => {
    sessionStorage.removeItem('newslettersData');
    hasFetchedDataOnce.current = false;
    setShowCreateOptionsModal(false); // Close modal
    navigate('/editor/0'); // Navigate to blank template creation
  };

  const handleCreateFromUpload = () => {
    // Logic for Upload and design with AI 
    sessionStorage.removeItem('newslettersData');
    hasFetchedDataOnce.current = false;
    setShowCreateOptionsModal(false); // Close modal
    navigate('/generator'); 
    displayToast('Redirecting to template upload page...', 'info');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      // Clear all session storage relevant to newsletters
      sessionStorage.removeItem('newslettersData');
      hasFetchedDataOnce.current = false; // Reset the ref
      setUserEmail(''); // Clear user email
      displayToast('Logged out successfully!', 'success');
      navigate('/login'); // Redirect to login page
    } catch (error) {
      console.error('Error logging out:', error.message);
      displayToast(`Logout failed: ${error.message}`, 'error');
    } finally {
      setShowAccountDropdown(false); // Close dropdown after action
    }
  };

  // Close dropdown, sidebar, and new create options modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && sidebarOpen &&
        !event.target.closest('.sidebar') &&
        !event.target.closest('.mobile-menu-btn')) {
        setSidebarOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setShowAccountDropdown(false);
      }
      // NEW: Close Create Options Modal
      if (showCreateOptionsModal && !event.target.closest('.create-options-modal-content') && !event.target.closest('.create-button')) {
        setShowCreateOptionsModal(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [sidebarOpen, isMobile, showCreateOptionsModal]);


  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'draft': return { backgroundColor: '#fbbf24', color: '#1f2937', border: '1px solid #f59e0b' };
      case 'published': return { backgroundColor: '#10b981', color: '#ffffff', border: '1px solid #059669' };
      case 'archived': return { backgroundColor: '#6b7280', color: '#ffffff', border: '1px solid #4b5563' };
      default: return { backgroundColor: '#374151', color: '#d1d5db', border: '1px solid #6b7280' };
    }
  };

  // Modified to separate "Versions" button
  const getActionButtons = (status) => {
    let mainActions = [];
    let versionAction = null;

    switch (status) {
      case 'draft':
        mainActions = [{ name: 'Edit', icon: <PenTool size={16} /> }, { name: 'Preview', icon: <Eye size={16} /> }, { name: 'Delete', icon: <Trash2 size={16} /> }];
        versionAction = { name: 'Versions', icon: <GitBranch size={16} /> };
        break;
      case 'published':
        mainActions = [{ name: 'View', icon: <Eye size={16} /> }, { name: 'Duplicate', icon: <Copy size={16} /> }];
        versionAction = { name: 'Versions', icon: <GitBranch size={16} /> };
        break;
      case 'archived':
        mainActions = [{ name: 'View', icon: <Eye size={16} /> }, { name: 'Restore', icon: <RotateCcw size={16} /> }];
        versionAction = { name: 'Versions', icon: <GitBranch size={16} /> };
        break;
      default:
        mainActions = [{ name: 'View', icon: <Eye size={16} /> }];
        versionAction = { name: 'Versions', icon: <GitBranch size={16} /> };
    }
    return { mainActions, versionAction };
  };

  const getCurrentNewsletters = () => {
    const allNewsletters = {
      drafts: newsletters.drafts,
      published: newsletters.published,
      archived: newsletters.archived,
      all: [...newsletters.drafts, ...newsletters.published, ...newsletters.archived]
    };

    let sectionNewsletters = allNewsletters[activeSection] || [];

    // Filter by search term
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      sectionNewsletters = sectionNewsletters.filter(newsletter =>
        newsletter.title.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    // Apply pagination AFTER filtering
    const currentPagination = pagination[activeSection];
    const startIndex = (currentPagination.currentPage - 1) * currentPagination.itemsPerPage;
    const endIndex = startIndex + currentPagination.itemsPerPage;

    return sectionNewsletters.slice(startIndex, endIndex).map(newsletter => ({
      ...newsletter,
      previewImage: newsletter.image_path
    }));
  };

  const getTotalPages = (section) => {
    const allNewsletters = {
      drafts: newsletters.drafts,
      published: newsletters.published,
      archived: newsletters.archived,
      all: [...newsletters.drafts, ...newsletters.published, ...newsletters.archived]
    };

    let sectionNewsletters = allNewsletters[section] || [];

    // Filter by search term for total pages calculation as well
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      sectionNewsletters = sectionNewsletters.filter(newsletter =>
        newsletter.title.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

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
      padding: '8px 14px', // Slightly more compact, adjusted padding
      borderRadius: '6px',
      fontSize: '13.5px', // Slightly smaller font, adjusted for better look
      fontWeight: '500',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: 'Inter, system-ui, sans-serif',
      flexShrink: 0, // Prevent buttons from shrinking
      whiteSpace: 'nowrap', // Prevent text from wrapping
      display: 'flex', // Enable flexbox for icon and text
      alignItems: 'center',
      gap: '6px', // Space between icon and text
    };

    switch (action) {
      case 'Edit': return { ...baseStyle, backgroundColor: '#3b82f6', color: '#ffffff', '&:hover': { backgroundColor: '#2563eb' } };
      case 'Preview':
      case 'View': return { ...baseStyle, backgroundColor: '#8b5cf6', color: '#ffffff', '&:hover': { backgroundColor: '#7c3aed' } };
      case 'Delete': return { ...baseStyle, backgroundColor: '#ef4444', color: '#ffffff', '&:hover': { backgroundColor: '#dc2626' } };
      case 'Duplicate': return { ...baseStyle, backgroundColor: '#10b981', color: '#ffffff', '&:hover': { backgroundColor: '#047857' } };
      case 'Restore': return { ...baseStyle, backgroundColor: '#f59e0b', color: '#ffffff', '&:hover': { backgroundColor: '#d97706' } };
      case 'Versions': return { ...baseStyle, backgroundColor: '#525252', color: '#ffffff', '&:hover': { backgroundColor: '#3f3f46' } }; // Removed flexBasis: '100%'
      default: return { ...baseStyle, backgroundColor: '#6b7280', color: '#ffffff' };
    }
  };

  const renderPagination = () => {
    const totalPages = getTotalPages(activeSection);
    const currentPage = pagination[activeSection].currentPage;

    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = isMobile ? 3 : 5;

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
        padding: '1rem 1.5rem', // 16px 24px
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
      },
      logo: {
        fontSize: '1.75rem', // 28px
        fontWeight: '800',
        background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontFamily: 'Inter, system-ui, sans-serif',
        letterSpacing: '-0.025em'
      },
      nav: {
        display: 'flex',
        gap: '2rem', // 32px
        alignItems: 'center'
      },
      navLink: {
        color: '#a3a3a3',
        fontWeight: '500',
        textDecoration: 'none',
        transition: 'color 0.3s ease, transform 0.3s ease',
        fontSize: '0.9375rem', // 15px
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '0.5rem 1rem', // 8px 16px
        borderRadius: '8px',
        '&:hover': {
          color: '#ffffff',
          transform: 'translateY(-2px)'
        }
      },
      headerRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem', // 16px
        position: 'relative', // For dropdown positioning
      },
      mobileMenuBtn: {
        fontSize: '1.5rem', // 24px
        color: '#3b82f6',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'none', // Controlled by JS
        padding: '0.5rem'
      },
      accountIconContainer: { // New style for account icon wrapper
        position: 'relative',
      },
      accountIcon: { // New style for account icon button
        width: '2.75rem', // 44px
        height: '2.75rem', // 44px
        borderRadius: '0.75rem', // 12px
        background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: '700',
        cursor: 'pointer',
        fontSize: '1rem', // 16px
        fontFamily: 'Inter, system-ui, sans-serif',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: '0 6px 16px rgba(59, 130, 246, 0.5)'
        }
      },
      accountDropdown: { // New style for account dropdown
        position: 'absolute',
        top: 'calc(100% + 10px)', // Below the icon
        right: '0',
        backgroundColor: '#1e1e1e',
        border: '1px solid #333',
        borderRadius: '8px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
        minWidth: '200px',
        zIndex: 100,
        padding: '10px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      },
      dropdownEmail: { // New style for email in dropdown
        padding: '8px 15px',
        color: '#a3a3a3',
        fontSize: '0.9rem',
        borderBottom: '1px solid #262626',
        marginBottom: '5px',
        fontWeight: '500',
      },
      dropdownButton: { // New style for logout button in dropdown
        width: '100%',
        padding: '10px 15px',
        backgroundColor: 'transparent',
        border: 'none',
        color: '#d1d5db',
        textAlign: 'left',
        cursor: 'pointer',
        fontSize: '0.95rem',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        transition: 'background-color 0.2s ease, color 0.2s ease',
        '&:hover': {
          backgroundColor: '#262626',
          color: '#ffffff',
        },
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
        padding: '1.5rem', // 24px
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s ease',
        position: 'static',
        zIndex: 40,
        overflowY: 'auto',
      },
      sectionTitle: {
        fontSize: '0.75rem', // 12px
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: '#737373',
        marginBottom: '1rem', // 16px
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      sidebarList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        marginBottom: '2rem' // 32px
      },
      sidebarItem: {
        marginBottom: '0.25rem' // 4px
      },
      sidebarButton: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem', // 12px
        padding: '0.75rem 1rem', // 12px 16px
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        fontSize: '0.875rem', // 14px
        fontFamily: 'Inter, system-ui, sans-serif',
        '&:hover': {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: '#d4d4d4'
        }
      },
      sidebarButtonActive: {
        backgroundColor: '#3b82f6',
        color: 'white',
        transform: 'translateX(4px)',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
        '&:hover': {
          backgroundColor: '#3b82f6',
          color: 'white',
          transform: 'translateX(4px)'
        }
      },
      sidebarButtonInactive: {
        backgroundColor: 'transparent',
        color: '#a3a3a3'
      },
      // New style for the create button container in sidebar
      createButtonSidebarContainer: {
        paddingBottom: '1.5rem', // Space below the button
        borderBottom: '1px solid #262626', // Separator
        marginBottom: '1.5rem', // Space below the separator
        display: 'flex',
        justifyContent: 'center',
      },
      createButton: {
        background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
        color: 'white',
        padding: '1.125rem 2.25rem', // 18px 36px
        borderRadius: '12px',
        fontSize: '1rem', // 16px
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: 'Inter, system-ui, sans-serif',
        boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
        marginTop: '1rem', // Space from top of sidebar content
        width: '90%', // Make it take most of the sidebar width
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 12px 30px rgba(59, 130, 246, 0.5)'
        }
      },
      main: {
        flex: 1,
        padding: '2rem', // 32px
        backgroundColor: '#0a0a0a',
        paddingBottom: '4rem', // 64px
        overflowY: 'auto'
      },
      mainTitle: {
        fontSize: '2.625rem', // 42px
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: '0.5rem', // 8px
        fontFamily: 'Inter, system-ui, sans-serif',
        letterSpacing: '-0.025em'
      },
      mainSubtitle: {
        color: '#a3a3a3',
        fontSize: '1.125rem', // 18px
        marginBottom: '2rem', // 32px
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: '400'
      },
      tabsContainer: {
        display: 'flex',
        gap: '0.375rem', // 6px
        marginBottom: '2rem', // 32px
        backgroundColor: '#171717',
        borderRadius: '0.875rem', // 14px
        padding: '0.375rem', // 6px
        border: '1px solid #262626'
      },
      tab: {
        flex: 1,
        padding: '0.875rem 1.25rem', // 14px 20px
        borderRadius: '10px',
        fontWeight: '500',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '0.875rem' // 14px
      },
      tabActive: {
        backgroundColor: '#3b82f6',
        color: 'white',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
        '&:hover': {
          backgroundColor: '#3b82f6', // Keep active color on hover
          color: 'white'
        }
      },
      tabInactive: {
        backgroundColor: 'transparent',
        color: '#a3a3a3',
        '&:hover': {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: '#d4d4d4'
        }
      },
      grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.5rem', // 24px
        paddingBottom: '1.25rem' // 20px
      },
      newsletterCard: {
        backgroundColor: '#171717',
        borderRadius: '1rem', // 16px
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        border: '1px solid #262626',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.35)'
        }
      },
      cardImage: {
        width: '100%',
        height: '11.25rem', // 180px
        objectFit: 'cover',
        borderBottom: '1px solid #262626'
      },
      cardContent: {
        padding: '1.25rem', // 20px
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1
      },
      cardTitle: {
        fontSize: '1.125rem', // 18px
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: '0.5rem', // 8px
        fontFamily: 'Inter, system-ui, sans-serif',
        lineHeight: '1.4em'
      },
      cardMeta: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem', // 16px
        fontSize: '0.8125rem', // 13px
        color: '#a3a3a3',
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      cardActions: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.6rem', // Increased gap slightly for better separation
        marginTop: 'auto', // Push actions to the bottom
        justifyContent: 'flex-start',
      },
      searchBarContainer: {
        position: 'relative',
        width: '100%',
        marginBottom: '1.5rem', // space below search bar
      },
      searchInput: {
        width: '100%',
        padding: '0.875rem 1rem 0.875rem 3rem', // Add left padding for icon
        borderRadius: '8px',
        border: '1px solid #333',
        backgroundColor: '#1e1e1e',
        color: '#d1d5db',
        fontSize: '1rem',
        fontFamily: 'Inter, system-ui, sans-serif',
        outline: 'none',
        transition: 'border-color 0.2s ease',
        '&:focus': {
          borderColor: '#3b82f6',
        },
        '&::placeholder': {
          color: '#a3a3a3',
        }
      },
      searchIcon: {
        position: 'absolute',
        left: '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#a3a3a3',
      },
      paginationContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem', // 8px
        marginTop: '2rem', // 32px
        marginBottom: '1.25rem', // 20px
        flexWrap: 'wrap'
      },
      paginationButton: {
        backgroundColor: '#1f2937',
        color: '#d1d5db',
        border: '1px solid #374151',
        padding: '0.625rem 1rem', // 10px 16px
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontSize: '0.875rem', // 14px
        fontWeight: '500',
        fontFamily: 'Inter, system-ui, sans-serif',
        '&:hover': {
          backgroundColor: '#374151',
          color: '#ffffff'
        }
      },
      paginationButtonActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
        color: 'white',
        fontWeight: '600',
        '&:hover': {
          backgroundColor: '#2563eb',
          borderColor: '#2563eb',
        }
      },
      paginationButtonDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
        backgroundColor: '#1f2937',
        color: '#d1d5db',
      },
      emptyState: {
        textAlign: 'center',
        padding: '3.75rem 1.25rem', // 60px 20px
        backgroundColor: '#171717',
        borderRadius: '1rem', // 16px
        border: '1px solid #262626',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.25rem', // 20px
        minHeight: '18.75rem' // 300px
      },
      emptyStateText: {
        fontSize: '1.25rem', // 20px
        color: '#a3a3a3',
        fontWeight: '500'
      },
      emptyStateSubText: {
        fontSize: '1rem', // 16px
        color: '#737373',
        maxWidth: '500px',
        lineHeight: '1.6'
      },
      loadingOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1001,
        color: 'white',
        fontSize: '1.5rem' // 24px
      },
      errorState: {
        textAlign: 'center',
        padding: '3.75rem 1.25rem', // 60px 20px
        backgroundColor: '#171717',
        borderRadius: '1rem', // 16px
        border: '1px solid #262626',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.25rem', // 20px
        minHeight: '18.75rem', // 300px
        color: '#ef4444'
      },
      deleteModalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      },
      deleteModalContent: {
        backgroundColor: '#1e1e1e',
        padding: '1.875rem', // 30px
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%',
        border: '1px solid #333'
      },
      deleteModalTitle: {
        fontSize: '1.5rem', // 24px
        fontWeight: '700',
        color: '#ef4444',
        marginBottom: '0.9375rem' // 15px
      },
      deleteModalMessage: {
        fontSize: '1rem', // 16px
        color: '#a3a3a3',
        marginBottom: '1.5625rem', // 25px
        lineHeight: '1.6'
      },
      deleteModalButtons: {
        display: 'flex',
        justifyContent: 'center',
        gap: '0.9375rem' // 15px
      },
      deleteModalConfirmBtn: {
        backgroundColor: '#ef4444',
        color: 'white',
        padding: '0.75rem 1.5625rem', // 12px 25px
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1rem', // 16px
        fontWeight: '600',
        transition: 'background-color 0.3s ease',
        '&:hover': {
          backgroundColor: '#dc2626'
        }
      },
      deleteModalCancelBtn: {
        backgroundColor: '#374151',
        color: 'white',
        padding: '0.75rem 1.5625rem', // 12px 25px
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1rem', // 16px
        fontWeight: '600',
        transition: 'background-color 0.3s ease',
        '&:hover': {
          backgroundColor: '#4b5563'
        }
      },
      // NEW Styles for the Create Options Modal
      createOptionsModalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      },
      createOptionsModalContent: {
        backgroundColor: '#1e1e1e',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%',
        border: '1px solid #333',
        position: 'relative',
      },
      createOptionsModalTitle: {
        fontSize: '1.6rem',
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: '1.5rem',
      },
      createOptionsButtonContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      },
      createOptionButton: {
        background: '#374151',
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        fontSize: '1.1rem',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        '&:hover': {
          backgroundColor: '#4b5563',
          transform: 'translateY(-2px)',
        },
      },
      createOptionButtonPrimary: {
          background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
          '&:hover': {
              background: 'linear-gradient(45deg, #2563eb, #7c3aed)',
              transform: 'translateY(-2px)',
          },
      },
      modalCloseButton: {
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          color: '#a3a3a3',
          fontSize: '1.8rem',
          cursor: 'pointer',
          padding: '5px',
          borderRadius: '50%',
          '&:hover': {
              backgroundColor: '#262626',
              color: '#ffffff',
          },
      }
    };

  if (loading && !hasFetchedDataOnce.current) { // Only show full loading if no cached data
    return (
      <div style={styles.loadingOverlay}>
        <p>Loading newsletters...</p>
      </div>
    );
  }

  if (error && !newsletters.drafts.length && !newsletters.published.length && !newsletters.archived.length) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.logo}>Newsletter Generator</div>
          <button style={{ ...styles.mobileMenuBtn, display: isMobile ? 'block' : 'none' }} onClick={toggleSidebar}><Menu size={24} /></button>
          <div style={styles.headerRight}>
            <div style={styles.accountIconContainer} ref={accountRef}>
              <button
                style={styles.accountIcon}
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              >
                <UserRound size={28} />
              </button>
              {showAccountDropdown && (
                <div style={styles.accountDropdown}>
                  {userEmail && <span style={styles.dropdownEmail}>{userEmail}</span>}
                  <button style={styles.dropdownButton} onClick={handleLogout}>
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={styles.mainContainer}>
          <div style={styles.main}>
            <div style={styles.errorState}>
              <p>Error: {error}</p>
              <button onClick={() => fetchNewsletters(true)} style={styles.createButton}>Try Again</button>
            </div>
          </div>
        </div>
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      </div>
    );
  }


  const currentNewsletters = getCurrentNewsletters();

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>Newsletter Generator</div>
        <button className="mobile-menu-btn" style={{ ...styles.mobileMenuBtn, display: isMobile ? 'block' : 'none' }} onClick={toggleSidebar}><Menu size={24} /></button>
        <div style={styles.headerRight}>
          <div style={styles.accountIconContainer} ref={accountRef}>
            <button
              style={styles.accountIcon}
              onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            >
              <UserRound size={28} />
            </button>
            {showAccountDropdown && (
              <div style={styles.accountDropdown}>
                {userEmail && <span style={styles.dropdownEmail}>{userEmail}</span>}
                <button style={styles.dropdownButton} onClick={handleLogout}>
                  <LogOut size={18} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={styles.mainContainer}>
        {/* Sidebar */}
        <aside className="sidebar" style={{
          ...styles.sidebar,
          transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
          position: isMobile ? 'fixed' : 'static',
          top: isMobile ? '80px' : 'auto', // Adjust based on header height
          left: isMobile ? '0' : 'auto',
          height: isMobile ? 'calc(100vh - 80px)' : '100%',
          boxShadow: isMobile && sidebarOpen ? '5px 0 15px rgba(0, 0, 0, 0.5)' : 'none',
        }}>
          <div style={styles.createButtonSidebarContainer}>
            <button onClick={createNewsletter} style={styles.createButton} className="create-button">
              <PlusCircle size={20} /> Create New Newsletter
            </button>
          </div>

          <h3 style={styles.sectionTitle}>Dashboard</h3>
          <ul style={styles.sidebarList}>
            <li style={styles.sidebarItem}>
              <button
                onClick={() => handleSectionChange('drafts')}
                style={{
                  ...styles.sidebarButton,
                  ...(activeSection === 'drafts' ? styles.sidebarButtonActive : styles.sidebarButtonInactive)
                }}
              >
                <FileText size={18} /> Drafts ({newsletters.drafts.length})
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
                <LayoutList size={18} /> Published ({newsletters.published.length})
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
                <Archive size={18} /> Archived ({newsletters.archived.length})
              </button>
            </li>
          </ul>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          <h1 style={styles.mainTitle}>{getSectionTitle()}</h1>
          <p style={styles.mainSubtitle}>Manage your newsletters effortlessly.</p>

          <div style={styles.searchBarContainer}>
            <Search size={20} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search newsletters by title..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                // Reset to first page when search term changes
                setPagination(prev => ({
                  ...prev,
                  [activeSection]: { ...prev[activeSection], currentPage: 1 }
                }));
              }}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.tabsContainer}>
            {Object.keys(newsletters).map(section => (
              <button
                key={section}
                onClick={() => handleSectionChange(section)}
                style={{
                  ...styles.tab,
                  ...(activeSection === section ? styles.tabActive : styles.tabInactive)
                }}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          </div>

          {loading && hasFetchedDataOnce.current === false && (
            <div style={styles.loadingOverlay}>
              <p>Loading newsletters...</p>
            </div>
          )}

          {!loading && currentNewsletters.length === 0 && searchTerm === '' ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyStateText}>No {activeSection} newsletters found.</p>
              <p style={styles.emptyStateSubText}>Create a new newsletter using the button in the sidebar to see it appear here.</p>
              {/* Removed inline create button here as it's now in the sidebar */}
            </div>
          ) : !loading && currentNewsletters.length === 0 && searchTerm !== '' ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyStateText}>No newsletters found for "{searchTerm}".</p>
              <p style={styles.emptyStateSubText}>Try a different search term or clear the search to see all newsletters.</p>
              <button onClick={() => setSearchTerm('')} style={styles.createButton}>
                Clear Search
              </button>
            </div>
          ) : (
            <>
              <div style={styles.grid}>
                {currentNewsletters.map((newsletter) => {
                  const { mainActions, versionAction } = getActionButtons(newsletter.status);
                  return (
                    <div key={newsletter.id} style={styles.newsletterCard}>
                      <img
                        src={newsletter.previewImage || 'https://via.placeholder.com/400x250?text=No+Image'}
                        alt={newsletter.title}
                        style={styles.cardImage}
                      />
                      <div style={styles.cardContent}>
                        <h2 style={styles.cardTitle}>{newsletter.title}</h2>
                        <div style={styles.cardMeta}>
                          <span>Last Edited: {newsletter.lastEdited}</span>
                          <span style={{ ...styles.cardStatus, ...getStatusBadgeStyle(newsletter.status) }}>
                            {newsletter.status}
                          </span>
                        </div>
                        <div style={styles.cardActions}>
                          {/* Main action buttons */}
                          {mainActions.map((action) => (
                            <button
                              key={action.name}
                              onClick={() => handleActionClick(action.name, newsletter.id, newsletter.project_id)}
                              style={getActionButtonStyle(action.name)}
                            >
                              {action.icon} {action.name}
                            </button>
                          ))}
                          {/* Versions button */}
                          {versionAction && (
                            <button
                              key={versionAction.name}
                              onClick={() => handleActionClick(versionAction.name, newsletter.id, newsletter.project_id)}
                              style={getActionButtonStyle(versionAction.name)}
                            >
                              {versionAction.icon} {versionAction.name}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {renderPagination()}
            </>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={styles.deleteModalOverlay}>
          <div style={styles.deleteModalContent}>
            <h2 style={styles.deleteModalTitle}>Confirm Deletion</h2>
            <p style={styles.deleteModalMessage}>
              Are you sure you want to delete "{getNewsletterTitleById(newsletterToDelete)}"? This action cannot be undone.
            </p>
            <div style={styles.deleteModalButtons}>
              <button onClick={confirmDelete} style={styles.deleteModalConfirmBtn}>Delete</button>
              <button onClick={cancelDelete} style={styles.deleteModalCancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Create New Newsletter Options Modal */}
      {showCreateOptionsModal && (
        <div style={styles.createOptionsModalOverlay}>
          <div style={styles.createOptionsModalContent} className="create-options-modal-content">
            <button
                onClick={() => setShowCreateOptionsModal(false)}
                style={styles.modalCloseButton}
            >
                &times;
            </button>
            <h2 style={styles.createOptionsModalTitle}>Create New Newsletter</h2>
            <div style={styles.createOptionsButtonContainer}>
              <button
                onClick={handleCreateFromUpload}
                style={{...styles.createOptionButton, ...styles.createOptionButtonPrimary}}
              >
                <FileText size={20} /> Create content and design with AI
              </button>
              <button
                onClick={handleCreateBlank}
                style={styles.createOptionButton}
              >
                <PlusCircle size={20} /> Create blank template
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default NewsletterDashboard;