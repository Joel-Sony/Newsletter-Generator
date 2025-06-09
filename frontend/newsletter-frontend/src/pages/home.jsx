import React, { useState, useEffect } from 'react';

const NewsletterDashboard = () => {
  const [activeSection, setActiveSection] = useState('drafts');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Sample data for newsletters
  const newsletters = {
    drafts: [
      {
        id: 1,
        title: "Weekly Tech Updates #45",
        lastEdited: "2 hours ago",
        status: "draft",
        preview: "This week we're covering the latest developments in AI, new framework releases, and upcoming tech conferences. Don't miss our exclusive interview with..."
      },
      {
        id: 2,
        title: "Product Launch Announcement",
        lastEdited: "1 day ago",
        status: "draft",
        preview: "We're excited to announce our biggest product launch of the year. After months of development and testing, we're ready to share something amazing..."
      },
      {
        id: 3,
        title: "Q4 Company Updates",
        lastEdited: "3 days ago",
        status: "draft",
        preview: "As we wrap up another successful quarter, we want to share some exciting updates about our team growth, new partnerships, and upcoming initiatives..."
      },
      {
        id: 4,
        title: "Holiday Special Newsletter",
        lastEdited: "5 days ago",
        status: "draft",
        preview: "The holiday season is here! We've prepared special offers, gift guides, and festive content to help you celebrate with your loved ones..."
      }
    ],
    published: [
      {
        id: 5,
        title: "Weekly Tech Updates #44",
        lastEdited: "Published: 1 week ago",
        status: "published",
        preview: "Last week's edition covering breakthrough AI research, new JavaScript features, and the latest startup funding rounds. Over 15,000 readers engaged..."
      },
      {
        id: 6,
        title: "Monthly Design Trends",
        lastEdited: "Published: 2 weeks ago",
        status: "published",
        preview: "Exploring the latest in web design, UI/UX trends, and creative inspiration from top designers around the world. Featured case studies include..."
      },
      {
        id: 7,
        title: "Customer Success Stories",
        lastEdited: "Published: 3 weeks ago",
        status: "published",
        preview: "Celebrating our amazing customers and their success stories. This month we feature three companies that transformed their business using our platform..."
      },
      {
        id: 8,
        title: "Summer Campaign Results",
        lastEdited: "Published: 1 month ago",
        status: "published",
        preview: "Our summer marketing campaign exceeded all expectations! Here's a detailed breakdown of the results, key learnings, and what's coming next..."
      },
      {
        id: 9,
        title: "Team Spotlight: Engineering",
        lastEdited: "Published: 1 month ago",
        status: "published",
        preview: "Meet our incredible engineering team! Learn about their latest projects, technical challenges, and innovative solutions that power our platform..."
      }
    ],
    archived: [
      {
        id: 10,
        title: "Legacy Product Update",
        lastEdited: "Archived: 3 months ago",
        status: "archived",
        preview: "Final update on our legacy product line before the transition to our new platform. Important information for existing users about migration..."
      },
      {
        id: 11,
        title: "Old Branding Newsletter",
        lastEdited: "Archived: 6 months ago",
        status: "archived",
        preview: "Newsletter from our previous branding era. Contains outdated design elements and messaging that no longer align with our current strategy..."
      }
    ]
  };

  const allNewsletters = [...newsletters.drafts, ...newsletters.published, ...newsletters.archived];

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

  const handleActionClick = (action, title) => {
    alert(`${action} action clicked for: "${title}"`);
  };

  const createNewsletter = () => {
    alert('Create New Newsletter feature would open a newsletter editor here!');
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
    switch (activeSection) {
      case 'drafts': return newsletters.drafts;
      case 'published': return newsletters.published;
      case 'archived': return newsletters.archived;
      case 'all': return allNewsletters;
      default: return newsletters.drafts;
    }
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

  const styles = {
    container: {
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
      minHeight: 0
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
      height: isMobile ? 'calc(100vh - 80px)' : 'auto',
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
      overflowY: 'auto',
      backgroundColor: '#0a0a0a'
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
      border: '1px solid #262626'
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
      gap: '24px'
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
    footer: {
      backgroundColor: '#111111',
      borderTop: '1px solid #262626',
      padding: '24px',
      color: '#a3a3a3'
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
                            onClick={() => handleActionClick(action, newsletter.title)}
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