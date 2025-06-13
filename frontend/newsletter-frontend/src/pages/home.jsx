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
  // Pagination state for each section
  const [pagination, setPagination] = useState({
    drafts: { currentPage: 1, itemsPerPage: 6 },
    published: { currentPage: 1, itemsPerPage: 6 },
    archived: { currentPage: 1, itemsPerPage: 6 },
    all: { currentPage: 1, itemsPerPage: 6 }
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNewsletters = async () => {
      console.log("Fetching newsletters")
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

        // Transform the API data to match our component structure
        const transformedData = {
          drafts: data.data.DRAFT.map(item => ({
            id: item.id,
            title: item.project_name || 'Untitled Newsletter',
            status: 'draft',
            lastEdited: new Date(item.updated_at || item.created_at).toLocaleDateString(),
            preview: 'Draft newsletter content...'
          })),
          published: data.data.PUBLISHED.map(item => ({
            id: item.id,
            title: item.project_name || 'Published Newsletter',
            status: 'published',
            lastEdited: new Date(item.updated_at || item.created_at).toLocaleDateString(),
            preview: 'Published newsletter content...'
          })),
          archived: data.data.ARCHIVED.map(item => ({
            id: item.id,
            title: item.project_name || 'Archived Newsletter',
            status: 'archived',
            lastEdited: new Date(item.updated_at || item.created_at).toLocaleDateString(),
            preview: 'Archived newsletter content...'
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

  const handleActionClick = (action, newsletterId) => {
    // Handle different actions
    switch (action) {
      case 'Edit':
        navigate(`/editor/${newsletterId}`);
        break;
      case 'Preview':
        // Implement preview logic
        break;
      case 'View':
        // Implement view logic
        break;
      case 'Delete':
        // Implement delete logic
        break;
      case 'Duplicate':
        // Implement duplicate logic
        break;
      case 'Restore':
        // Implement restore logic
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
    
    return sectionNewsletters.slice(startIndex, endIndex);
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
      padding: '24px',
      border: '1px solid #404040',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer'
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
      marginTop: 'auto'
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
              { key: 'all', icon: '📄', label: 'All Newsletters' }
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
          {getCurrentNewsletters().length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#a3a3a3',
              fontSize: '18px'
            }}>
              No newsletters found in this section.
            </div>
          ) : (
            <>
              <div style={styles.grid}>
                {getCurrentNewsletters().map((newsletter) => (
                  <div 
                    key={newsletter.id} 
                    style={styles.card}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.5)';
                      e.currentTarget.style.borderColor = '#525252';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#404040';
                    }}
                  >
                    <div style={styles.cardTopBorder}></div>
                    
                    <div>
                      <h3 style={styles.cardTitle}>{newsletter.title}</h3>
                      <div style={styles.cardMeta}>
                        <span style={styles.cardDate}>{newsletter.lastEdited}</span>
                        <span style={{...styles.statusBadge, ...getStatusBadgeStyle(newsletter.status)}}>
                          {newsletter.status}
                        </span>
                      </div>
                      
                      <p style={styles.cardPreview}>{newsletter.preview}</p>
                      
                      <div style={styles.cardActions}>
                        {getActionButtons(newsletter.status).map((action) => (
                          <button
                            key={action}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActionClick(action, newsletter.id);
                            }}
                            style={getActionButtonStyle(action)}
                            onMouseEnter={(e) => {
                              e.target.style.opacity = '0.8';
                              e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.opacity = '1';
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

              {/* Pagination Controls */}
              {renderPagination()}
            </>
          )}
        </div>
      </main>
    </div>

    {/* Footer */}
    <footer style={styles.footer}>
      <div style={styles.footerContent}>
        <div style={styles.copyright}>
          © 2024 NewsletterPro. All rights reserved.
        </div>
        <div style={styles.footerLinks}>
          <a href="#privacy" style={styles.footerLink}>Privacy Policy</a>
          <a href="#terms" style={styles.footerLink}>Terms of Service</a>
          <a href="#support" style={styles.footerLink}>Support</a>
          <a href="#contact" style={styles.footerLink}>Contact</a>
        </div>
      </div>
    </footer>
  </div>
);
};

export default NewsletterDashboard;