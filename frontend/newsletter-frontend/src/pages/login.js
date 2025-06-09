import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase credentials
const SUPABASE_URL = 'https://wsgemoximzgvjmputncl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZ2Vtb3hpbXpndmptcHV0bmNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNTk0NTcsImV4cCI6MjA2NDkzNTQ1N30.Bxd03q7Zr-GKL0gQ98ukTjf1L0YVl6nlJFaCODjMtqQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const VioletAuth = () => {
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
    // Check if user is already authenticated
    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        showMessage('Invalid email or password', 'error');
      } else {
        showMessage(error.message, 'error');
      }
      return;
    }

    showMessage('Login successful! Welcome back!', 'success');
    setTimeout(() => {
      setUser(data.user);
    }, 1000);
  };

  const handleSignup = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    });

    if (error) {
      showMessage(error.message, 'error');
      return;
    }

    if (data.user && !data.user.email_confirmed_at) {
      showMessage('Account created! Please check your email for confirmation link.', 'info');
      setTimeout(() => {
        switchMode('login');
        setFormData(prev => ({ ...prev, email: email }));
      }, 3000);
    } else if (data.user) {
      showMessage('Account created successfully! Welcome!', 'success');
      setTimeout(() => {
        setUser(data.user);
      }, 1000);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      showMessage('Error logging out', 'error');
    }

    setUser(null);
    setFormData({
      email: '',
      password: '',
      confirmPassword: ''
    });
    setMessage(null);
    switchMode('login');
  };

  const styles = {
    container: {
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      margin: 0
    },
    card: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '40px',
      width: '100%',
      maxWidth: '500px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 25px 45px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      animation: 'fadeIn 0.6s ease-out'
    },
    title: {
      textAlign: 'center',
      color: 'white',
      marginBottom: '10px',
      fontSize: '2.5rem',
      fontWeight: '300',
      textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
    },
    subtitle: {
      textAlign: 'center',
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: '30px',
      fontSize: '1rem',
      fontWeight: '400'
    },
    modeToggle: {
      display: 'flex',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '50px',
      padding: '4px',
      marginBottom: '30px',
      position: 'relative'
    },
    modeBtn: {
      flex: 1,
      padding: '12px 20px',
      border: 'none',
      borderRadius: '50px',
      background: 'transparent',
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      zIndex: 2,
      position: 'relative'
    },
    modeBtnActive: {
      color: 'white',
      background: 'linear-gradient(45deg, #ff6b6b, #ee5a24, #ff9ff3)',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
    },
    formGroup: {
      marginBottom: '25px',
      position: 'relative'
    },
    input: {
      width: '100%',
      padding: '15px 20px',
      border: 'none',
      borderRadius: '50px',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      fontSize: '16px',
      outline: 'none',
      border: '2px solid transparent',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box'
    },
    inputFocus: {
      background: 'rgba(255, 255, 255, 0.2)',
      borderColor: 'rgba(255, 255, 255, 0.5)',
      transform: 'scale(1.02)'
    },
    passwordReqs: {
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.6)',
      marginTop: '5px',
      paddingLeft: '20px',
      opacity: showPasswordReqs ? 1 : 0,
      transition: 'opacity 0.3s ease'
    },
    btn: {
      width: '100%',
      padding: '15px',
      border: 'none',
      borderRadius: '50px',
      background: 'linear-gradient(45deg, #ff6b6b, #ee5a24, #ff9ff3)',
      color: 'white',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginBottom: '15px',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      disabled: isLoading
    },
    btnDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    message: {
      textAlign: 'center',
      padding: '12px',
      borderRadius: '15px',
      marginBottom: '20px',
      fontWeight: '500',
      transition: 'all 0.3s ease'
    },
    messageSuccess: {
      background: 'rgba(76, 175, 80, 0.2)',
      color: '#4caf50',
      border: '1px solid rgba(76, 175, 80, 0.3)'
    },
    messageError: {
      background: 'rgba(244, 67, 54, 0.2)',
      color: '#f44336',
      border: '1px solid rgba(244, 67, 54, 0.3)'
    },
    messageInfo: {
      background: 'rgba(33, 150, 243, 0.2)',
      color: '#2196f3',
      border: '1px solid rgba(33, 150, 243, 0.3)'
    },
    dashboard: {
      textAlign: 'center'
    },
    userInfo: {
      background: 'rgba(255, 255, 255, 0.1)',
      padding: '25px',
      borderRadius: '15px',
      margin: '20px 0'
    },
    welcome: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#ff9ff3',
      marginBottom: '15px'
    },
    userInfoText: {
      color: 'white',
      margin: '12px 0',
      fontSize: '16px'
    },
    features: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '15px',
      marginTop: '20px'
    },
    featureCard: {
      background: 'rgba(255, 255, 255, 0.05)',
      padding: '15px',
      borderRadius: '10px',
      textAlign: 'center'
    },
    featureTitle: {
      color: '#ff9ff3',
      fontSize: '14px',
      marginBottom: '5px'
    },
    featureText: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '12px'
    },
    logoutBtn: {
      background: 'linear-gradient(45deg, #ff4757, #c44569)',
      padding: '12px 35px',
      border: 'none',
      borderRadius: '25px',
      color: 'white',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    spinner: {
      display: 'inline-block',
      width: '20px',
      height: '20px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '50%',
      borderTop: '2px solid white',
      animation: 'spin 1s linear infinite',
      marginRight: '10px'
    }
  };

  if (user) {
    const lastLogin = user.last_sign_in_at ? 
      new Date(user.last_sign_in_at).toLocaleString() : 
      'First time login';

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.dashboard}>
            <h1 style={styles.title}>Dashboard</h1>
            <div style={styles.userInfo}>
              <p style={styles.welcome}>Welcome back!</p>
              <p style={styles.userInfoText}>📧 {user.email}</p>
              <p style={styles.userInfoText}>🆔 {user.id.substring(0, 8)}...</p>
              <p style={styles.userInfoText}>🕒 Last login: {lastLogin}</p>
            </div>
            
            <div style={styles.features}>
              <div style={styles.featureCard}>
                <h4 style={styles.featureTitle}>Secure Auth</h4>
                <p style={styles.featureText}>Protected by Supabase</p>
              </div>
              <div style={styles.featureCard}>
                <h4 style={styles.featureTitle}>Real-time</h4>
                <p style={styles.featureText}>Instant updates</p>
              </div>
              <div style={styles.featureCard}>
                <h4 style={styles.featureTitle}>Scalable</h4>
                <p style={styles.featureText}>Ready for growth</p>
              </div>
              <div style={styles.featureCard}>
                <h4 style={styles.featureTitle}>Modern UI</h4>
                <p style={styles.featureText}>Beautiful design</p>
              </div>
            </div>
            
            <button style={styles.logoutBtn} onClick={handleLogout}>
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
        <h1 style={styles.title}>
          {isLoginMode ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p style={styles.subtitle}>
          {isLoginMode ? 'Sign in to your account' : 'Join us today and get started'}
        </p>
        
        <div style={styles.modeToggle}>
          <button
            style={{
              ...styles.modeBtn,
              ...(isLoginMode ? styles.modeBtnActive : {})
            }}
            onClick={() => switchMode('login')}
          >
            Sign In
          </button>
          <button
            style={{
              ...styles.modeBtn,
              ...(!isLoginMode ? styles.modeBtnActive : {})
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
            <div style={styles.passwordReqs}>
              Password must be at least 6 characters long
            </div>
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
              ...styles.btn,
              ...(isLoading ? styles.btnDisabled : {})
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
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }
        
        input:focus {
          background: rgba(255, 255, 255, 0.2) !important;
          border-color: rgba(255, 255, 255, 0.5) !important;
          transform: scale(1.02) !important;
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default VioletAuth;