import React, { useState, useEffect } from 'react';

const Login = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPasswordReqs, setShowPasswordReqs] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated on component mount
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      localStorage.removeItem('authToken');
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    
    // Auto-hide success and info messages
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        setMessage(null);
      }, 5000);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const switchMode = (mode) => {
    setIsLoginMode(mode === 'login');
    setMessage(null);
    setFormData({
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { email, password, confirmPassword } = formData;

    if (!email || !password) {
      showMessage('Please fill in all fields', 'error');
      return;
    }

    // Validate passwords match in signup mode
    if (!isLoginMode && password !== confirmPassword) {
      showMessage('Passwords do not match', 'error');
      return;
    }

    // Validate password strength
    if (!isLoginMode && password.length < 6) {
      showMessage('Password must be at least 6 characters long', 'error');
      return;
    }

    setIsLoading(true);

    try {
      if (isLoginMode) {
        await handleLogin(email, password);
      } else {
        await handleSignup(email, password);
      }
    } catch (error) {
      console.error('Auth error:', error);
      showMessage('Something went wrong. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.message || 'Invalid email or password', 'error');
        return;
      }

      // Store the token
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }

      showMessage('Login successful! Welcome back!', 'success');
      
      setTimeout(() => {
        setUser(data.user);
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      showMessage('Network error. Please try again.', 'error');
    }
  };

const handleSignup = async (email, password) => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message || 'Registration failed', 'error');
      return;
    }

    if (data.requiresVerification) {
      showMessage('Account created! Please check your email for verification.', 'info');
      setTimeout(() => {
        switchMode('login');
        setFormData(prev => ({ ...prev, email: email }));
      }, 3000);
    } else {
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      showMessage('Account created successfully! Welcome!', 'success');
      setTimeout(() => {
        setUser(data.user);
      }, 1000);
    }

  } catch (error) {
    console.error('Signup error:', error);
    showMessage('Network error. Please try again.', 'error');
  }
};


const handleLogout = async () => {
  const token = localStorage.getItem('authToken');

  try {
    // Call logout API only if token exists
    if (token) {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // If token is invalid/expired, treat it as already logged out
      if (!response.ok && response.status !== 401) {
        console.warn('Logout failed:', await response.text());
      }
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear client state and token
    localStorage.removeItem('authToken');
    setUser(null);
    setFormData({
      email: '',
      password: '',
      confirmPassword: ''
    });
    setMessage(null);
    switchMode('login');
  }
};


  const styles = {
    container: {
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    card: {
      backgroundColor: '#171717',
      borderRadius: '16px',
      padding: '40px',
      width: '100%',
      maxWidth: '480px',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
      border: '1px solid #262626',
      position: 'relative'
    },
    logo: {
      fontSize: '32px',
      fontWeight: '800',
      background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontFamily: 'Inter, system-ui, sans-serif',
      letterSpacing: '-0.025em',
      textAlign: 'center',
      marginBottom: '8px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '8px',
      fontFamily: 'Inter, system-ui, sans-serif',
      letterSpacing: '-0.025em',
      textAlign: 'center'
    },
    subtitle: {
      color: '#a3a3a3',
      fontSize: '16px',
      marginBottom: '32px',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: '400',
      textAlign: 'center'
    },
    tabsContainer: {
      display: 'flex',
      gap: '6px',
      marginBottom: '32px',
      backgroundColor: '#111111',
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
    formGroup: {
      marginBottom: '24px',
      position: 'relative'
    },
    input: {
      width: '100%',
      padding: '16px 20px',
      borderRadius: '12px',
      background: '#1f1f1f',
      color: '#ffffff',
      fontSize: '16px',
      outline: 'none',
      border: '1px solid #404040',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    passwordReqs: {
      fontSize: '12px',
      color: '#737373',
      marginTop: '8px',
      paddingLeft: '4px',
      opacity: showPasswordReqs ? 1 : 0,
      transition: 'opacity 0.3s ease',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    createButton: {
      background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
      color: 'white',
      padding: '16px 32px',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginBottom: '24px',
      fontFamily: 'Inter, system-ui, sans-serif',
      boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
      width: '100%'
    },
    createButtonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none'
    },
    message: {
      textAlign: 'center',
      padding: '16px 20px',
      borderRadius: '12px',
      marginBottom: '24px',
      fontWeight: '500',
      fontSize: '14px',
      transition: 'all 0.3s ease',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    messageSuccess: {
      background: 'rgba(34, 197, 94, 0.1)',
      color: '#22c55e',
      border: '1px solid rgba(34, 197, 94, 0.2)'
    },
    messageError: {
      background: 'rgba(239, 68, 68, 0.1)',
      color: '#ef4444',
      border: '1px solid rgba(239, 68, 68, 0.2)'
    },
    messageInfo: {
      background: 'rgba(59, 130, 246, 0.1)',
      color: '#3b82f6',
      border: '1px solid rgba(59, 130, 246, 0.2)'
    },
    dashboard: {
      textAlign: 'center'
    },
    dashboardTitle: {
      fontSize: '42px',
      fontWeight: '800',
      color: '#ffffff',
      marginBottom: '8px',
      fontFamily: 'Inter, system-ui, sans-serif',
      letterSpacing: '-0.025em'
    },
    userInfo: {
      backgroundColor: '#1f1f1f',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid #404040',
      marginBottom: '24px'
    },
    welcome: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '16px',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    userInfoText: {
      color: '#d4d4d4',
      margin: '8px 0',
      fontSize: '14px',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '16px',
      marginBottom: '32px'
    },
    cardTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '8px',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    cardText: {
      color: '#a3a3a3',
      fontSize: '12px',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    logoutButton: {
      background: 'linear-gradient(45deg, #ef4444, #dc2626)',
      color: 'white',
      padding: '14px 28px',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontFamily: 'Inter, system-ui, sans-serif',
      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
    },
    spinner: {
      display: 'inline-block',
      width: '16px',
      height: '16px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '50%',
      borderTop: '2px solid #ffffff',
      animation: 'spin 1s linear infinite',
      marginRight: '8px'
    }
  };

  if (user) {
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleString();
    };

    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, maxWidth: '600px' }}>
          <div style={styles.dashboard}>
            <div style={styles.logo}>AuthApp</div>
            <h1 style={styles.dashboardTitle}>Dashboard</h1>
            
            <div style={styles.userInfo}>
              <p style={styles.welcome}>Welcome back!</p>
              <p style={styles.userInfoText}>📧 {user.email}</p>
              <p style={styles.userInfoText}>🆔 {user.id || 'N/A'}</p>
              <p style={styles.userInfoText}>🕒 Member since: {formatDate(user.created_at)}</p>
              <p style={styles.userInfoText}>🔄 Last login: {formatDate(user.last_login)}</p>
            </div>
            
            <div style={styles.grid}>
              <div style={styles.card}>
                <h4 style={styles.cardTitle}>Secure Auth</h4>
                <p style={styles.cardText}>Protected by Flask</p>
              </div>
              <div style={styles.card}>
                <h4 style={styles.cardTitle}>Real-time</h4>
                <p style={styles.cardText}>Instant updates</p>
              </div>
              <div style={styles.card}>
                <h4 style={styles.cardTitle}>Scalable</h4>
                <p style={styles.cardText}>Ready for growth</p>
              </div>
              <div style={styles.card}>
                <h4 style={styles.cardTitle}>Modern UI</h4>
                <p style={styles.cardText}>Beautiful design</p>
              </div>
            </div>
            
            <button style={styles.logoutButton} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>AI Newsletter</div>
        <h1 style={styles.title}>
          {isLoginMode ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p style={styles.subtitle}>
          {isLoginMode ? 'Sign in to your account' : 'Join us today and get started'}
        </p>
        
        <div style={styles.tabsContainer}>
          <button
            style={{
              ...styles.tab,
              ...(isLoginMode ? styles.tabActive : styles.tabInactive)
            }}
            onClick={() => switchMode('login')}
          >
            Sign In
          </button>
          <button
            style={{
              ...styles.tab,
              ...(!isLoginMode ? styles.tabActive : styles.tabInactive)
            }}
            onClick={() => switchMode('signup')}
          >
            Sign Up
          </button>
        </div>
        
        {message && (
          <div style={{
            ...styles.message,
            ...(message.type === 'success' ? styles.messageSuccess : {}),
            ...(message.type === 'error' ? styles.messageError : {}),
            ...(message.type === 'info' ? styles.messageInfo : {})
          }}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
          </div>
          
          <div style={styles.formGroup}>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              onFocus={() => !isLoginMode && setShowPasswordReqs(true)}
              onBlur={() => setShowPasswordReqs(false)}
              style={styles.input}
              required
              minLength="6"
            />
            {!isLoginMode && (
              <div style={styles.passwordReqs}>
                Password must be at least 6 characters long
              </div>
            )}
          </div>
          
          {!isLoginMode && (
            <div style={styles.formGroup}>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                style={styles.input}
                required
                minLength="6"
              />
            </div>
          )}
          
          <button
            type="submit"
            style={{
              ...styles.createButton,
              ...(isLoading ? styles.createButtonDisabled : {})
            }}
            disabled={isLoading}
          >
            {isLoading && <span style={styles.spinner}></span>}
            {isLoading 
              ? (isLoginMode ? 'Signing In...' : 'Creating Account...')
              : (isLoginMode ? 'Sign In' : 'Create Account')
            }
          </button>
        </form>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        input::placeholder {
          color: #737373;
        }
        
        input:focus {
          background: #262626 !important;
          border-color: #666666 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(59, 130, 246, 0.4) !important;
        }
        
        button:active:not(:disabled) {
          transform: translateY(-1px);
        }
        
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
        }
      `}</style>
    </div>
  );
};

export default Login;