import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';

const Login = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null); // Keep this for clarity, but navigation logic primarily relies on auth state listener
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPasswordReqs, setShowPasswordReqs] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // --- Message Handling (moved up for use in useCallback) ---
  const showMessage = useCallback((text, type) => {
    setMessage({ text, type });
    // Auto-hide success/info messages after 5 seconds
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        setMessage(null);
      }, 5000);
    }
  }, []); // No dependencies for this simple function

  // --- Supabase Session Management and Navigation ---
  useEffect(() => {
    let navigationTimeoutId; // Store timeout ID for cleanup

    const handleAuthState = async (session) => {
      const currentUser = session ? session.user : null;
      setUser(currentUser); // Update local user state

      // If a user is authenticated AND the current path is '/login',
      // then navigate to '/home'.
      if (currentUser && location.pathname === '/login') {
        // Only navigate if we are currently on the login page
        // Delay navigation to allow success message to show
        navigationTimeoutId = setTimeout(() => {
          navigate("/home", { replace: true }); // Use replace to prevent back button to login
        }, 1500); // Increased delay to 1.5 seconds for better visibility of message
      }
    };

    // 1. Initial check when the component mounts
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthState(session);
    });


    // 2. Listen for authentication state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        handleAuthState(session); // Re-use the handler
    });

    // Cleanup function for useEffect
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      if (navigationTimeoutId) {
        clearTimeout(navigationTimeoutId); // Clear any pending navigation
      }
    };
  }, [navigate, location.pathname, showMessage]); // Dependencies: Add showMessage if used within handleAuthState for consistency


  // --- Form Handling ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const switchMode = (mode) => {
    setIsLoginMode(mode === 'login');
    setMessage(null); // Clear messages when switching modes
    setFormData({ // Clear form data when switching modes
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

    if (!isLoginMode && password !== confirmPassword) {
      showMessage('Passwords do not match', 'error');
      return;
    }

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
      console.error('Auth handler error:', error);
      showMessage('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        showMessage(error.message || 'Login failed. Please check your credentials.', 'error');
        return;
      }

      if (data.user && data.session) {
        showMessage('Login successful! Welcome back!', 'success');
        // Do NOT navigate here. The useEffect listener will handle it after the state updates.
      } else {
        showMessage('Login failed. Please check your credentials or verify your email.', 'error');
      }
    } catch (error) {
      console.error('Network or unexpected login error:', error);
      showMessage('Network error or unexpected login issue. Please try again.', 'error');
    }
  };

  const handleSignup = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: 'http://127.0.0.1:5000/login',
        }
      });

      if (error) {
        showMessage(error.message || 'Registration failed.', 'error');
        return;
      }

      if (data.user && !data.session) {
        showMessage('Account created! Please check your email for a verification link.', 'info');
        // Do not switch mode or pre-fill email immediately if relying on auth state change
        // You might still want to switch mode to 'login' after a delay for UX
        setTimeout(() => {
          switchMode('login');
          setFormData(prev => ({ ...prev, email: email }));
        }, 3000);
      } else if (data.user && data.session) {
        showMessage('Account created successfully! Welcome!', 'success');
        // Do NOT navigate here. useEffect will handle.
      }
    } catch (error) {
      console.error('Network or unexpected signup error:', error);
      showMessage('Network error or unexpected signup issue. Please try again.', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Logout error:', error.message);
        showMessage(error.message, 'error');
      } else {
        showMessage('Successfully logged out!', 'info');
      }
    } catch (error) {
      console.error('Network error during logout:', error);
      showMessage('Network error during logout. Please try again.', 'error');
    } finally {
      setFormData({
        email: '',
        password: '',
        confirmPassword: ''
      });
      setMessage(null);
      switchMode('login');
    }
  };

  // --- Inline Styles (Moved to a separate object for clarity) ---
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
      opacity: 0, // Default to hidden
      transition: 'opacity 0.3s ease',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    passwordReqsVisible: { // New style for visible password requirements
        opacity: 1
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
              <div style={{ ...styles.passwordReqs, ...(showPasswordReqs ? styles.passwordReqsVisible : {}) }}>
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

      <style jsx="true">{`
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