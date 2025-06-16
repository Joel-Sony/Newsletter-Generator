import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

  const navigate = useNavigate();

  useEffect(() => {
    const fetchNewsletters = async () => {
      console.log("Fetching newsletters");
      try {
        setLoading(true);
        const authToken = localStorage.getItem('authToken');

        if (!authToken) {
          throw new Error('Authentication required');
        }

        const response = await fetch('/api/newsletters', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch newsletters');
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
            image_path:item.image_path,
            version: item.version || 'N/A' // Added version
          })),
          published: data.data.PUBLISHED.map(item => ({
            id: item.id,
            title: item.project_name || 'Published Newsletter',
            status: 'published',
            lastEdited: new Date(item.updated_at || item.created_at).toLocaleDateString(),
            image_path:item.image_path,
            version: item.version || 'N/A' // Added version
          })),
          archived: data.data.ARCHIVED.map(item => ({
            id: item.id,
            title: item.project_name || 'Archived Newsletter',
            status: 'archived',
            lastEdited: new Date(item.updated_at || item.created_at).toLocaleDateString(),
            image_path:item.image_path,
            version: item.version || 'N/A' // Added version
          }))
        };

        setNewsletters(transformedData);
      } catch (err) {
        console.error('Error fetching newsletters:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNewsletters();
  }, []);

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

  // Effect to hide toast after a few seconds
  useEffect(() => {
    let timer;
    if (showToast) {
      timer = setTimeout(() => {
        setShowToast(false);
        setToastMessage('');
      }, 3000); // Toast disappears after 3 seconds
    }
    return () => clearTimeout(timer); // Clean up the timer
  }, [showToast]);

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
  const confirmDelete = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Authentication required');
      }

      // Replace with your actual delete API endpoint
      const response = await fetch(`/api/delete/${newsletterToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete newsletter');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete newsletter');
      }

      const deletedNewsletterTitle = getNewsletterTitleById(newsletterToDelete); // Get the title BEFORE updating state

      // Update the newsletters state to remove the deleted item
      setNewsletters(prevNewsletters => {
        const newNewsletters = { ...prevNewsletters };
        // Find and remove the newsletter from all categories
        for (const section in newNewsletters) {
          newNewsletters[section] = newNewsletters[section].filter(
            (newsletter) => newsletter.id !== newsletterToDelete
          );
        }
        return newNewsletters;
      });

      // Show toast notification
      setToastMessage(`File '${deletedNewsletterTitle}' deleted successfully.`);
      setShowToast(true);

    } catch (err) {
      console.error('Error deleting newsletter:', err);
      setError(err.message);
      setToastMessage(`Error deleting newsletter: ${err.message}`); // Show error in toast too
      setShowToast(true);
    } finally {
      setShowDeleteModal(false);
      setNewsletterToDelete(null);
    }
  };

  // Function to cancel the delete action
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setNewsletterToDelete(null);
  };

  const handleActionClick = (action, newsletterId) => {
    // Handle different actions
    switch (action) {
      case 'Edit':
        navigate(`/editor/${newsletterId}`);
        break;
      case 'View':
        console.log(`View action clicked for newsletter ID: ${newsletterId}`);
        navigate(`/preview/${newsletterId}`); // Assuming 'View' also goes to a preview-like page
        break;
      case 'Preview': // <<< ADD THIS CASE
        navigate(`/preview/${newsletterId}`); // Navigate to the dedicated preview route
        break;
      case 'Delete':
        handleDeleteClick(newsletterId); // Call the new handler for delete
        break;
      case 'Duplicate':
        // Implement duplicate logic
        console.log(`Duplicate action clicked for newsletter ID: ${newsletterId}`);
        break;
      case 'Restore':
        // Implement restore logic
        console.log(`Restore action clicked for newsletter ID: ${newsletterId}`);
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
      if (isMobile && sidebarOpen && !event.target.closest('.sidebar') && !event.target.closest('.mobile-menu-btn')) {
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
      case 'draft': return ['Edit', 'Preview', 'Delete'];
      case 'published': return ['View', 'Duplicate'];
      case 'archived': return ['View', 'Restore'];
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
      case 'Duplicate': return { ...baseStyle, backgroundColor: '#10b981', color: '#ffffff' };
      case 'Restore': return { ...baseStyle, backgroundColor: '#f59e0b', color: '#ffffff' };
      default: return { ...baseStyle, backgroundColor: '#6b7280', color: '#ffffff' };
    }
  };

  const renderPagination = () => {
    const totalPages = getTotalPages(activeSection);
    const currentPage = pagination[activeSection].currentPage;

    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;

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
      transition: 'all 0.3s ease',
      fontSize: '15px',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '8px 16px',
      borderRadius: '8px'
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
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
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
      overflowY: 'auto'
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
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    sidebarButtonActive: {
      backgroundColor: '#3b82f6',
      color: 'white',
      transform: 'translateX(4px)',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
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
      boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
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
      color: '#a3a3a3'
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
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '24px',
      marginBottom: '32px'
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
      flexDirection: 'column'
    },
    cardImageContainer: {
      width: '100%',
      height: '160px',
      overflow: 'hidden',
      position: 'relative'
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
      flexDirection: 'column'
    },
    cardTopBorder: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899)'
    },
    cardTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '8px',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    cardMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px'
    },
    cardDate: {
      color: '#a3a3a3',
      fontSize: '14px',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    statusBadge: {
      padding: '6px 12px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    cardPreview: {
      color: '#d4d4d4',
      lineHeight: '1.6',
      marginBottom: '16px',
      display: '-webkit-box',
      WebkitLineClamp: 3,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px'
    },
    cardActions: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
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
      justifyContent: 'center'
    },
    paginationButtonActive: {
      backgroundColor: '#3b82f6',
      color: 'white',
      borderColor: '#3b82f6',
      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
    },
    paginationButtonDisabled: {
      backgroundColor: '#111111',
      color: '#525252',
      cursor: 'not-allowed',
      borderColor: '#262626'
    },
    footer: {
      backgroundColor: '#111111',
      borderTop: '1px solid #262626',
      padding: '24px',
      color: '#a3a3a3',
      marginTop: 'auto',

    },
    footerContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
      maxWidth: '1200px',
      margin: '0 auto',
      flexWrap: 'wrap',
      flexDirection: isMobile ? 'column' : 'row',
      textAlign: isMobile ? 'center' : 'left'
    },
    footerLinks: {
      display: 'flex',
      gap: '32px',
      flexWrap: 'wrap'
    },
    footerLink: {
      fontSize: '14px',
      color: '#a3a3a3',
      textDecoration: 'none',
      transition: 'color 0.3s ease',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    copyright: {
      fontSize: '14px',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    // Modal Styles
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
    // Toast Styles
    toastContainer: {
      position: 'fixed',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#10b981', // Green for success
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
    versionText: { // New style for version number
      color: '#a3a3a3',
      fontSize: '14px',
      fontFamily: 'Inter, system-ui, sans-serif',
      marginTop: '4px' // Add some space below the title
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
        Loading newsletters...
      </div>
    );
  }

 return (
  <div style={styles.container}>
    {/* Header */}
    <header style={styles.header}>
      <div style={styles.logo}>
        NewsletterPro
      </div>
      <nav style={styles.nav}>
        <a href="#dashboard" style={styles.navLink}>Dashboard</a>
        <a href="#analytics" style={styles.navLink}>Analytics</a>
        <a href="#templates" style={styles.navLink}>Templates</a>
        <a href="#subscribers" style={styles.navLink}>Subscribers</a>
      </nav>
      <div style={styles.headerRight}>
        <button
          className="mobile-menu-btn"
          style={styles.mobileMenuBtn}
          onClick={toggleSidebar}
        >
          ☰
        </button>
        <div style={styles.avatar}>
          JD
        </div>
      </div>
    </header>

    <div style={styles.mainContainer}>
      {/* Sidebar */}
      <aside className="sidebar" style={styles.sidebar}>
        <div>
          <div style={styles.sectionTitle}>Newsletter Management</div>
          <ul style={styles.sidebarList}>
            {[
              { key: 'drafts', icon: '📝', label: 'Drafts' },
              { key: 'published', icon: '📤', label: 'Published' },
              { key: 'archived', icon: '📦', label: 'Archived' },
              { key: 'all', icon: '📄', label: 'All Newsletters' },
            ].map((item) => (
              <li key={item.key} style={styles.sidebarItem}>
                <button
                  onClick={() => handleSectionChange(item.key)}
                  style={{
                    ...styles.sidebarButton,
                    ...(activeSection === item.key ? styles.sidebarButtonActive : styles.sidebarButtonInactive)
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== item.key) {
                      e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                      e.target.style.color = '#d4d4d4';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== item.key) {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = '#a3a3a3';
                    }
                  }}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div style={styles.sectionTitle}>Settings</div>
          <ul style={styles.sidebarList}>
            {[
              { icon: '⚙️', label: 'General' },
              { icon: '🔒', label: 'Privacy' },
              { icon: '💰', label: 'Billing' },
              { icon: '❓', label: 'Help & Support' }
            ].map((item, index) => (
              <li key={index} style={styles.sidebarItem}>
                <button
                  style={{ ...styles.sidebarButton, ...styles.sidebarButtonInactive }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                    e.target.style.color = '#d4d4d4';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#a3a3a3';
                  }}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        <div>
          <h1 style={styles.mainTitle}>Newsletter Dashboard</h1>
          <p style={styles.mainSubtitle}>Manage and create your newsletters with ease</p>
        </div>

        <div style={styles.createButtonContainer}>
          <button
            onClick={createNewsletter}
            style={styles.createButton}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 35px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
            }}
          >
            ✨ Create New Newsletter
          </button>
        </div>

        <div style={styles.tabsContainer}>
          {[
            { key: 'drafts', label: 'Drafts' },
            { key: 'published', label: 'Published' },
            { key: 'archived', label: 'Archived' },
            { key: 'all', label: 'All Newsletters' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleSectionChange(tab.key)}
              style={{
                ...styles.tab,
                ...(activeSection === tab.key ? styles.tabActive : styles.tabInactive)
              }}
              onMouseEnter={(e) => {
                if (activeSection !== tab.key) {
                  e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                  e.target.style.color = '#d4d4d4';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== tab.key) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#a3a3a3';
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={styles.contentContainer}>
          <h2 style={styles.contentTitle}>{getSectionTitle()}</h2>
          {error && <div style={{ color: '#ef4444', marginBottom: '20px' }}>Error: {error}</div>}
          {getCurrentNewsletters().length === 0 && !loading && (
            <div style={{ textAlign: 'center', color: '#a3a3a3', padding: '50px' }}>
              No newsletters found in this section.
            </div>
          )}
          <div style={styles.grid}>
            {getCurrentNewsletters().map((newsletter) => (
              <div
                key={newsletter.id}
                style={styles.card}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.4)';
                  if (newsletter.previewImage) {
                    e.currentTarget.querySelector('img').style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.25)';
                  if (newsletter.previewImage) {
                    e.currentTarget.querySelector('img').style.transform = 'scale(1)';
                  }
                }}
              >
                <div style={styles.cardTopBorder}></div>
                <div style={styles.cardImageContainer}>
                  {newsletter.previewImage ? (
                    <img src={newsletter.previewImage} alt={newsletter.title} style={styles.cardImage} />
                  ) : (
                    <div style={{
                      ...styles.cardImage,
                      backgroundColor: '#333',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#a3a3a3',
                      fontSize: '18px',
                      fontWeight: '600'
                    }}>
                      No Image
                    </div>
                  )}
                </div>
                <div style={styles.cardContent}>
                  <h3 style={styles.cardTitle}>{newsletter.title}</h3>
                  <p style={styles.versionText}>Version: {newsletter.version}</p> {/* Display version here */}
                  <div style={styles.cardMeta}>
                    <span style={styles.cardDate}>Last Edited: {newsletter.lastEdited}</span>
                    <span style={{ ...styles.statusBadge, ...getStatusBadgeStyle(newsletter.status) }}>
                      {newsletter.status}
                    </span>
                  </div>
                  <p style={styles.cardPreview}>{newsletter.preview}</p>
                  <div style={{ ...styles.cardActions, marginTop: 'auto' }}>
                    {getActionButtons(newsletter.status).map((action) => (
                      <button
                        key={action}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click when button is clicked
                          handleActionClick(action, newsletter.id);
                        }}
                        style={getActionButtonStyle(action)}
                        onMouseEnter={(e) => {
                          e.target.style.opacity = 0.8;
                          e.target.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.opacity = 1;
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {renderPagination()}
        </div>
      </main>
    </div>

    {/* Footer */}
    <footer style={styles.footer}>
      <div style={styles.footerContent}>
        <div style={styles.copyright}>
          © {new Date().getFullYear()} NewsletterPro. All rights reserved.
        </div>
        <div style={styles.footerLinks}>
          <a href="#privacy" style={styles.footerLink}>Privacy Policy</a>
          <a href="#terms" style={styles.footerLink}>Terms of Service</a>
          <a href="#contact" style={styles.footerLink}>Contact Us</a>
        </div>
      </div>
    </footer>

    {/* Delete Confirmation Modal */}
    {showDeleteModal && (
      <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
          <h3 style={styles.modalTitle}>Confirm Deletion</h3>
          <p style={styles.modalText}>
            Are you sure you want to delete "{getNewsletterTitleById(newsletterToDelete)}"? This action cannot be undone.
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
      ...(showToast ? styles.toastContainerVisible : {})
    }}>
      <span style={styles.toastIcon}>✅</span>
      {toastMessage}
    </div>
  </div>
 );
};

export default NewsletterDashboard;