// X Whiteboard Popup Script

const API_BASE = 'http://localhost:3002';
const SUPABASE_URL = ''; // Will be set from storage
const SUPABASE_ANON_KEY = ''; // Will be set from storage

// Elements
const loginView = document.getElementById('login-view');
const connectedView = document.getElementById('connected-view');
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const errorDiv = document.getElementById('error');
const userEmailSpan = document.getElementById('user-email');

// Show error message
function showError(message) {
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

// Hide error message
function hideError() {
  errorDiv.style.display = 'none';
}

// Show login view
function showLoginView() {
  loginView.style.display = 'block';
  connectedView.style.display = 'none';
}

// Show connected view
function showConnectedView(email) {
  loginView.style.display = 'none';
  connectedView.style.display = 'block';
  userEmailSpan.textContent = email || 'Connected';
}

// Check authentication status
async function checkAuth() {
  try {
    const result = await chrome.storage.local.get(['authToken', 'userEmail']);

    if (result.authToken) {
      // Verify the token is still valid by making a test request
      const response = await fetch(`${API_BASE}/api/posts`, {
        headers: {
          'Authorization': `Bearer ${result.authToken}`,
        },
      });

      if (response.ok) {
        showConnectedView(result.userEmail);
        return;
      } else {
        // Token is invalid, clear it
        await chrome.storage.local.remove(['authToken', 'userEmail']);
      }
    }

    showLoginView();
  } catch (error) {
    console.error('Auth check error:', error);
    showLoginView();
  }
}

// Handle login
async function handleLogin(email, password) {
  hideError();
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';

  try {
    // Get Supabase credentials from storage or use defaults
    const settings = await chrome.storage.local.get(['supabaseUrl', 'supabaseAnonKey']);
    const supabaseUrl = settings.supabaseUrl || 'https://wnhgdbavutmfirqdsddy.supabase.co';
    const supabaseAnonKey = settings.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduaGdkYmF2dXRtZmlycWRzZGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDQ3NDcsImV4cCI6MjA4NTIyMDc0N30.soa1QrNhTcp9CdEGKdT9g8PRzPn-D_2yQNUo_lc7iGI';

    // Sign in with Supabase
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || data.error || 'Login failed');
    }

    // Store the access token
    await chrome.storage.local.set({
      authToken: data.access_token,
      userEmail: email,
      refreshToken: data.refresh_token,
    });

    showConnectedView(email);
  } catch (error) {
    console.error('Login error:', error);
    showError(error.message || 'Failed to sign in');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
}

// Handle logout
async function handleLogout() {
  await chrome.storage.local.remove(['authToken', 'userEmail', 'refreshToken']);
  showLoginView();
}

// Event listeners
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (email && password) {
    handleLogin(email, password);
  }
});

logoutBtn.addEventListener('click', handleLogout);

// Initialize
document.addEventListener('DOMContentLoaded', checkAuth);
