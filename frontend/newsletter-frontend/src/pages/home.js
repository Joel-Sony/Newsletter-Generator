import React, { useState, useEffect } from 'react';

const NewsletterDashboard = () => {
  const [activeSection, setActiveSection] = useState('drafts');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Get all newsletters for the "all" section
  const allNewsletters = [...newsletters.drafts, ...newsletters.published, ...newsletters.archived];

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setSidebarOpen(false); // Close sidebar on mobile after selection
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

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && !event.target.closest('.sidebar') && !event.target.closest('.mobile-menu-btn')) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [sidebarOpen]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'published': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionButtons = (status) => {
    switch (status) {
      case 'draft':
        return ['Edit', 'Preview', 'Delete'];
      case 'published':
        return ['View', 'Duplicate'];
      case 'archived':
        return ['View', 'Restore'];
      default:
        return ['View'];
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-800 flex flex-col">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-white/20 p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
          NewsletterPro
        </div>
        <nav className="hidden md:flex gap-8 items-center">
          <a href="#dashboard" className="text-gray-600 font-medium hover:text-indigo-500 transition-colors">Dashboard</a>
          <a href="#analytics" className="text-gray-600 font-medium hover:text-indigo-500 transition-colors">Analytics</a>
          <a href="#templates" className="text-gray-600 font-medium hover:text-indigo-500 transition-colors">Templates</a>
          <a href="#subscribers" className="text-gray-600 font-medium hover:text-indigo-500 transition-colors">Subscribers</a>
        </nav>
        <div className="flex items-center gap-4">
          <button 
            className="md:hidden text-2xl text-indigo-500 mobile-menu-btn"
            onClick={toggleSidebar}
          >
            ☰
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold cursor-pointer">
            JD
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className={`w-70 bg-white/95 backdrop-blur-sm border-r border-white/20 p-6 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:relative top-16 md:top-0 left-0 h-full md:h-auto z-40 sidebar`}>
          <div className="mb-8">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Newsletter Management</div>
            <ul className="space-y-2">
              {[
                { key: 'drafts', icon: '📝', label: 'Drafts' },
                { key: 'published', icon: '📤', label: 'Published' },
                { key: 'archived', icon: '📦', label: 'Archived' },
                { key: 'all', icon: '📄', label: 'All Newsletters' }
              ].map((item) => (
                <li key={item.key}>
                  <button
                    onClick={() => handleSectionChange(item.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                      activeSection === item.key
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white transform translate-x-1'
                        : 'text-gray-600 hover:bg-gray-50 hover:transform hover:translate-x-1'
                    }`}
                  >
                    <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-8">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Content</div>
            <ul className="space-y-2">
              {[
                { icon: '🎨', label: 'Templates' },
                { icon: '📷', label: 'Media Library' },
                { icon: '🏷️', label: 'Categories' }
              ].map((item, index) => (
                <li key={index}>
                  <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:transform hover:translate-x-1 transition-all duration-300 font-medium">
                    <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-8">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Audience</div>
            <ul className="space-y-2">
              {[
                { icon: '👥', label: 'Subscribers' },
                { icon: '📊', label: 'Analytics' },
                { icon: '📈', label: 'Reports' }
              ].map((item, index) => (
                <li key={index}>
                  <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:transform hover:translate-x-1 transition-all duration-300 font-medium">
                    <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-8">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Settings</div>
            <ul className="space-y-2">
              {[
                { icon: '⚙️', label: 'General' },
                { icon: '🔒', label: 'Privacy' },
                { icon: '💰', label: 'Billing' },
                { icon: '❓', label: 'Help & Support' }
              ].map((item, index) => (
                <li key={index}>
                  <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:transform hover:translate-x-1 transition-all duration-300 font-medium">
                    <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-2">Newsletter Dashboard</h1>
            <p className="text-white/80 text-lg">Manage and create your newsletters with ease</p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-lg border border-white/20">
            <button 
              onClick={createNewsletter}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            >
              ✨ Create New Newsletter
            </button>
          </div>

          <div className="flex gap-2 mb-8 bg-white/20 backdrop-blur-sm rounded-2xl p-2">
            {[
              { key: 'drafts', label: 'Drafts' },
              { key: 'published', label: 'Published' },
              { key: 'archived', label: 'Archived' },
              { key: 'all', label: 'All Newsletters' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleSectionChange(tab.key)}
                className={`flex-1 py-4 px-6 rounded-xl font-medium transition-all duration-300 ${
                  activeSection === tab.key
                    ? 'bg-white/95 text-gray-800 shadow-lg'
                    : 'text-white/70 hover:bg-white/10 hover:text-white/90'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">{getSectionTitle()}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getCurrentNewsletters().map((newsletter) => (
                <div key={newsletter.id} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-indigo-100 hover:transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                  
                  <div className="mb-3">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{newsletter.title}</h3>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-600 text-sm">{newsletter.lastEdited}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${getStatusBadgeClass(newsletter.status)}`}>
                        {newsletter.status}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3">
                    {newsletter.preview}
                  </p>
                  
                  <div className="flex gap-2">
                    {getActionButtons(newsletter.status).map((action) => (
                      <button
                        key={action}
                        onClick={() => handleActionClick(action, newsletter.title)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          action === 'Edit' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                          action === 'Preview' || action === 'View' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' :
                          action === 'Delete' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                          'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white/95 backdrop-blur-sm border-t border-white/20 p-6 text-gray-600">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 max-w-6xl mx-auto">
          <div className="flex gap-8">
            <a href="#about" className="text-sm hover:text-indigo-500 transition-colors">About</a>
            <a href="#privacy" className="text-sm hover:text-indigo-500 transition-colors">Privacy Policy</a>
            <a href="#terms" className="text-sm hover:text-indigo-500 transition-colors">Terms of Service</a>
            <a href="#contact" className="text-sm hover:text-indigo-500 transition-colors">Contact</a>
          </div>
          <div className="text-sm">&copy; 2025 NewsletterPro. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default NewsletterDashboard;