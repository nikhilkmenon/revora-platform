
// REVORA Shared Utilities

// Sanitize user-provided text to prevent XSS
function sanitizeText(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// Navigate with role-based guard (placeholder; real auth checks JWT in backend)
function requireAuth(role) {
  const storedRole = sessionStorage.getItem('revora_role');
  if (!storedRole) {
    window.location.href = '../revora_auth/index.html';
    return false;
  }
  return true;
}

const API = window.API || 'https://YOUR-RAILWAY-API.up.railway.app/api/v1';

async function silentRefresh() {
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',   // sends httpOnly refresh cookie automatically
    });
    if (!res.ok) {
      sessionStorage.clear();
      window.location.href = '../revora_auth/index.html';
      return null;
    }
    const { accessToken } = await res.json();
    sessionStorage.setItem('access_token', accessToken);
    return accessToken;
  } catch {
    return null;
  }
}

// Authenticated fetch wrapper — refreshes token automatically
async function authFetch(url, options = {}) {
  let token = sessionStorage.getItem('access_token');
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: { ...options.headers, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (res.status === 401) {
    token = await silentRefresh();
    if (!token) return res;
    return fetch(url, {
      ...options,
      credentials: 'include',
      headers: { ...options.headers, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  }
  return res;
}

// Add noopener noreferrer to all external links dynamically
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('a[href^="http"]').forEach(function (link) {
    if (!link.href.includes(window.location.hostname)) {
      link.setAttribute('rel', 'noopener noreferrer');
      if (!link.getAttribute('target')) link.setAttribute('target', '_blank');
    }
  });

  // ARIA: ensure all icon-only buttons have aria-label
  document.querySelectorAll('button:not([aria-label])').forEach(function (btn) {
    const icon = btn.querySelector('.material-symbols-outlined');
    if (icon && !btn.textContent.trim().replace(icon.textContent.trim(), '').trim()) {
      btn.setAttribute('aria-label', icon.textContent.trim().replace(/_/g, ' '));
    }
  });
});
