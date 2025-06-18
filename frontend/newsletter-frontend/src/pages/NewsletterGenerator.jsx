import React, { useState, useCallback } from 'react'; // Added useCallback
import { Upload, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js'; // <<< IMPORTANT: Import your Supabase client

const NewsletterGenerator = () => {
  const [formData, setFormData] = useState({
    topic: '',
    tone: '',
    user_prompt: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // --- Reusable Toast Function (Consider moving this to a central utility) ---
  const showToast = useCallback((message, type) => { // 'success', 'error', 'info'
    // This is a basic implementation of a toast. For a robust solution,
    // consider creating a dedicated React Toast component.
    setSuccessMessage(''); // Clear previous success message
    setError('');         // Clear previous error message

    if (type === 'success' || type === 'info') {
      setSuccessMessage(message);
    } else if (type === 'error') {
      setError(message);
    }

    setTimeout(() => {
      setSuccessMessage('');
      setError('');
    }, 5000); // Messages disappear after 5 seconds
  }, []);


  // --- Auth Token Retrieval Logic (Reused from other components) ---
  const getAuthToken = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Supabase getSession error:", sessionError);
        showToast('Authentication error. Please log in again.', 'error');
        navigate('/login', { replace: true });
        return null;
      }
      if (session) {
        return session.access_token;
      }
      // No session means not logged in
      console.warn("No active Supabase session found. Redirecting to login.");
      showToast('Authentication required. Please log in.', 'info');
      navigate('/login', { replace: true });
      return null;
    } catch (err) {
      console.error('Unexpected error in getAuthToken:', err);
      showToast('An unexpected authentication error occurred. Please try again.', 'error');
      navigate('/login', { replace: true });
      return null;
    }
  }, [navigate, showToast]); // Dependencies for useCallback

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    // --- AUTH FIX: Get token using Supabase SDK ---
    const authToken = await getAuthToken();
    if (!authToken) {
      // getAuthToken already handles navigation/toast
      setIsLoading(false); // Stop loading if no token
      return;
    }

    try {
      // Create FormData for multipart/form-data
      const data = new FormData();

      // Add form fields
      data.append('topic', formData.topic);
      data.append('tone', formData.tone || 'Professional');
      data.append('user_prompt', formData.user_prompt);

      // Add PDF file if selected
      if (selectedFile) {
        data.append('pdf_file', selectedFile);
      }

      // Make API call to Flask backend
      const response = await fetch('/api/generate', {
        method: 'POST',
        // --- AUTH FIX: Add Authorization header ---
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: data,
      });

      // --- AUTH FIX: Handle 401/403 responses ---
      if (response.status === 401 || response.status === 403) {
          console.error("Backend authentication failed during generation:", response.status, response.statusText);
          showToast('Session expired or unauthorized. Please log in again.', 'error');
          await supabase.auth.signOut(); // Ensure client-side session is cleared
          navigate('/login');
          return;
      }

      const result = await response.json();

      if (response.ok && result.success) {
        showToast(result.message, 'success'); // Use showToast for success
        
        // Reset form after successful submission
        setFormData({ topic: '', tone: '', user_prompt: '' });
        setSelectedFile(null);
        
        // Navigate to editor if redirect_to is provided
        if (result.redirect_to) {
          // --- REACT ROUTER FIX: Use navigate from react-router-dom ---
          setTimeout(() => {
            navigate(result.redirect_to); // Use navigate instead of window.location.href
          }, 1500); // Delay navigation to allow message to be seen
        }
        
      } else {
        // Handle API errors
        showToast(result.error || 'Failed to generate newsletter. Please try again.', 'error'); // Use showToast for error
      }
      
    } catch (err) {
      console.error('Error submitting form:', err);
      showToast('Network error. Please check your connection and try again.', 'error'); // Use showToast for network error
    } finally {
      setIsLoading(false);
    }
  };

  // Keyframes for animations
  // NOTE: These keyframes should ideally be in a separate CSS file or handled by a CSS-in-JS library.
  // Including them directly in a <style> tag like this will work but is not typical for React inline styles.
  const pulseKeyframes = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
      50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  return (
    <>
      <style>{pulseKeyframes}</style>
      <div style={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #171717 50%, #0a0a0a 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}>
        <button
        onClick={() => navigate('/home')}
        style={{
          position: 'absolute',
          top: '1.5rem',
          left: '1.5rem',
          zIndex: 50,
          padding: '0.75rem 1.25rem',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '0.75rem',
          color: '#93c5fd',
          fontWeight: '600',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(4px)'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(59, 130, 246, 0.2)';
          e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(59, 130, 246, 0.1)';
          e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
        }}
      >
        ← Home
      </button>

        {/* Animated Background Elements */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            position: 'absolute',
            bottom: '8rem',
            right: '8rem',
            width: '20rem',
            height: '20rem',
            background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(236, 72, 153, 0.1) 100%)',
            borderRadius: '50%',
            filter: 'blur(3rem)',
            animation: 'pulse 4s ease-in-out infinite'
          }}></div>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '33.333333%',
            width: '16rem',
            height: '16rem',
            background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(236, 72, 153, 0.08) 100%)',
            borderRadius: '50%',
            filter: 'blur(2rem)',
            animation: 'pulse 6s ease-in-out infinite'
          }}></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, transparent 0%, rgba(59, 130, 246, 0.02) 50%, transparent 100%)',
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.1) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>

        {/* Main Content Container */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '1.5rem'
        }}>
          <div style={{ width: '100%', maxWidth: '64rem' }}>

            {/* Header Section */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h1 style={{
                fontSize: 'clamp(3rem, 8vw, 4.5rem)',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
                marginBottom: '1.5rem',
                letterSpacing: '-0.025em',
                lineHeight: '1.1'
              }}>
                Newsletter Generator
              </h1>
              <div style={{
                width: '6rem',
                height: '0.25rem',
                background: 'linear-gradient(45deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                margin: '0 auto',
                borderRadius: '9999px',
                marginBottom: '1rem'
              }}></div>
              <p style={{
                color: '#d1d5db',
                fontSize: '1.25rem',
                maxWidth: '32rem',
                margin: '0 auto',
                lineHeight: '1.75'
              }}>
                Create stunning newsletters with AI-powered content generation
              </p>
            </div>

            {/* Main Form Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(10, 10, 10, 0.9) 100%)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '1.5rem',
              padding: 'clamp(2rem, 5vw, 3rem)',
              boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.1)'
            }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Topic and Tone Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: window.innerWidth >= 768 ? '1fr 1fr' : '1fr',
                  gap: '1.5rem'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{
                      display: 'block',
                      color: '#93c5fd',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em'
                    }}>
                      Topic *
                    </label>
                    <input
                      type="text"
                      name="topic"
                      value={formData.topic}
                      onChange={handleInputChange}
                      placeholder="Enter your topic"
                      required
                      style={{
                        width: '100%',
                        padding: '1rem 1.5rem',
                        background: 'rgba(55, 65, 81, 0.5)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '1rem',
                        color: 'white',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(4px)'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{
                      display: 'block',
                      color: '#93c5fd',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em'
                    }}>
                      Tone
                    </label>
                    <input
                      type="text"
                      name="tone"
                      value={formData.tone}
                      onChange={handleInputChange}
                      placeholder="Professional (default), casual, friendly..."
                      style={{
                        width: '100%',
                        padding: '1rem 1.5rem',
                        background: 'rgba(55, 65, 81, 0.5)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '1rem',
                        color: 'white',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(4px)'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Content Textarea */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{
                    display: 'block',
                    color: '#93c5fd',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}>
                    Content *
                  </label>
                  <textarea
                    name="user_prompt"
                    value={formData.user_prompt}
                    onChange={handleInputChange}
                    placeholder="Enter your newsletter content here..."
                    rows={6}
                    required
                    style={{
                      width: '100%',
                      padding: '1rem 1.5rem',
                      background: 'rgba(55, 65, 81, 0.5)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '1rem',
                      color: 'white',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(4px)',
                      resize: 'none',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* File Upload */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{
                    display: 'block',
                    color: '#93c5fd',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}>
                    PDF Template (Optional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2rem',
                      border: '2px dashed rgba(59, 130, 246, 0.4)',
                      borderRadius: '1rem',
                      background: 'rgba(55, 65, 81, 0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.6)';
                      e.target.style.background = 'rgba(55, 65, 81, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                      e.target.style.background = 'rgba(55, 65, 81, 0.3)';
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <Upload style={{
                          width: '2rem',
                          height: '2rem',
                          color: '#3b82f6',
                          margin: '0 auto 0.75rem',
                          transition: 'transform 0.3s ease'
                        }} />
                        <p style={{
                          color: '#d1d5db',
                          fontWeight: '500',
                          marginBottom: '0.25rem'
                        }}>
                          {selectedFile ? selectedFile.name : 'Choose PDF template or drag here'}
                        </p>
                        <p style={{
                          color: '#9ca3af',
                          fontSize: '0.875rem'
                        }}>
                          {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Upload a PDF template to use as base structure'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                {successMessage && (
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(5, 150, 105, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                    borderRadius: '1rem',
                    color: '#6ee7b7',
                    textAlign: 'center'
                  }}>
                    {successMessage}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(153, 27, 27, 0.5)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '1rem',
                    color: '#fca5a5',
                    textAlign: 'center'
                  }}>
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !formData.topic || !formData.user_prompt}
                  style={{
                    width: '100%',
                    padding: '1rem 2rem',
                    background: isLoading || !formData.topic || !formData.user_prompt
                      ? 'rgba(55, 65, 81, 0.5)'
                      : 'linear-gradient(45deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.125rem',
                    borderRadius: '1rem',
                    border: 'none',
                    cursor: isLoading || !formData.topic || !formData.user_prompt ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    opacity: isLoading || !formData.topic || !formData.user_prompt ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && formData.topic && formData.user_prompt) {
                      e.target.style.transform = 'scale(1.02)';
                      e.target.style.boxShadow = '0 25px 50px -12px rgba(59, 130, 246, 0.25)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 style={{
                        width: '1.5rem',
                        height: '1.5rem',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <span>Generating Newsletter...</span>
                    </>
                  ) : (
                    <>
                      <Send style={{ width: '1.5rem', height: '1.5rem' }} />
                      <span>Generate Newsletter</span>
                    </>
                  )}
                </button>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#93c5fd'
                  }}>
                    <div style={{
                      width: '0.5rem',
                      height: '0.5rem',
                      background: '#3b82f6',
                      borderRadius: '50%',
                      animation: 'bounce 1s infinite'
                    }}></div>
                    <div style={{
                      width: '0.5rem',
                      height: '0.5rem',
                      background: '#8b5cf6',
                      borderRadius: '50%',
                      animation: 'bounce 1s infinite 0.1s'
                    }}></div>
                    <div style={{
                      width: '0.5rem',
                      height: '0.5rem',
                      background: '#ec4899',
                      borderRadius: '50%',
                      animation: 'bounce 1s infinite 0.2s'
                    }}></div>
                  </div>
                  <p style={{
                    color: '#9ca3af',
                    marginTop: '0.75rem',
                    fontSize: '1.125rem'
                  }}>
                    {selectedFile ? 'Processing PDF template and generating content...' : 'Crafting your newsletter...'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <p style={{
                color: '#6b7280',
                fontSize: '0.875rem'
              }}>
                Powered by AI • Designed for creators
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewsletterGenerator;