// ============ PAGE NAVIGATION ============
const navButtons = document.querySelectorAll('.navlinks button, [data-page]');
const pages = document.querySelectorAll('.page');

function showPage(pageName) {
  // Hide all pages
  pages.forEach(page => page.classList.remove('active'));
  
  // Show requested page
  const targetPage = document.getElementById(`page-${pageName}`);
  if (targetPage) {
    targetPage.classList.add('active');
    window.scrollTo(0, 0);
  }
  
  // Update nav active state
  document.querySelectorAll('.navlinks button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.page === pageName) {
      btn.classList.add('active');
    }
  });
}

// Navigation button click handlers
navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const pageName = btn.dataset.page;
    if (pageName) {
      showPage(pageName);
    }
  });
});

// ============ THEME TOGGLE ============
const themeToggle = document.getElementById('themeToggle');
const htmlElement = document.documentElement;

themeToggle.addEventListener('click', () => {
  const currentTheme = htmlElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  htmlElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'dark';
htmlElement.setAttribute('data-theme', savedTheme);

// ============ LOGIN FLOW ============
const loginForm = document.getElementById('loginForm');
const otpForm = document.getElementById('otpForm');
const loginCard = document.getElementById('loginCard');
const otpCard = document.getElementById('otpCard');

let currentUser = null;
let sessionToken = null;

// Initialize login card visibility
document.addEventListener('DOMContentLoaded', function() {
  // Make sure cards are properly initialized
  if (loginCard) loginCard.style.display = 'block';
  if (otpCard) otpCard.style.display = 'none';
});

// Login Submit - Shows OTP page
if (loginForm) {
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const user = document.getElementById('lUser').value.trim();
    const pass = document.getElementById('lPass').value.trim();
    
    if (!user || !pass) {
      document.getElementById('loginErr').textContent = 'Please enter username and password';
      return;
    }
    
    // Demo mode: accept any credentials
    currentUser = user;
    document.getElementById('otpUserLabel').textContent = user;
    document.getElementById('demoOtpBanner').innerHTML = `<strong>Demo mode:</strong> Any 6-digit code works. Try: <code class="mono">123456</code>`;
    
    // Show OTP card
    loginCard.style.display = 'none';
    otpCard.style.display = 'block';
    document.getElementById('otpInput').value = '';
    document.getElementById('otpErr').textContent = '';
    document.getElementById('loginErr').textContent = '';
  });
}

// OTP Submit - Login to admin
if (otpForm) {
  otpForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const otp = document.getElementById('otpInput').value.trim();
    
    if (otp.length === 6 && /^\d+$/.test(otp)) {
      sessionToken = 'demo-token-' + Date.now();
      
      // Hide both cards
      loginCard.style.display = 'none';
      otpCard.style.display = 'none';
      
      // Navigate to admin
      showPage('admin');
      loadAdminPanel();
      
      // Reset form
      document.getElementById('loginForm').reset();
      document.getElementById('otpForm').reset();
    } else {
      document.getElementById('otpErr').textContent = 'Invalid code. Enter 6 digits.';
    }
  });
}

// Resend OTP
document.getElementById('resendOtpBtn')?.addEventListener('click', function(e) {
  e.preventDefault();
  showToast('OTP resent to your email');
});

// Back to Login
document.getElementById('backToLoginBtn')?.addEventListener('click', function(e) {
  e.preventDefault();
  otpCard.style.display = 'none';
  loginCard.style.display = 'block';
  document.getElementById('otpInput').value = '';
  document.getElementById('otpErr').textContent = '';
});

// ============ ADMIN PANEL ============
function loadAdminPanel() {
  if (!currentUser) return;
  
  document.getElementById('adminUserName').textContent = currentUser;
  const expiryTime = new Date(Date.now() + 30 * 60000).toLocaleTimeString();
  document.getElementById('adminSessionExpiry').textContent = `expires ${expiryTime}`;
  
  loadServices();
  loadMessages();
  loadActivity();
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', function() {
  sessionToken = null;
  currentUser = null;
  
  // Reset forms
  document.getElementById('loginForm')?.reset();
  document.getElementById('otpForm')?.reset();
  
  // Reset card displays
  loginCard.style.display = 'block';
  otpCard.style.display = 'none';
  
  showPage('home');
  showToast('Logged out');
});

// ============ SERVICES MANAGEMENT ============
let services = JSON.parse(localStorage.getItem('services')) || [
  {
    id: 1,
    title: 'Email relay',
    icon: '✉️',
    capability: 'mail',
    description: 'Send emails through Bharsoft without exposing backend details.',
    execUrl: ''
  },
  {
    id: 2,
    title: 'Member discovery',
    icon: '🔍',
    capability: 'discovery',
    description: 'List and search for other connected sites in the ecosystem.',
    execUrl: ''
  }
];

function loadServices() {
  const grid = document.getElementById('servicesGrid');
  const adminBody = document.getElementById('servicesAdminBody');
  
  if (!grid || !adminBody) return;
  
  grid.innerHTML = '';
  adminBody.innerHTML = '';
  
  if (services.length === 0) {
    grid.innerHTML = '<div class="empty-state">No services yet. Add one to get started.</div>';
    return;
  }
  
  services.forEach(svc => {
    grid.innerHTML += `
      <div class="card">
        <div class="ic">${svc.icon}</div>
        <h4>${svc.title}</h4>
        <p>${svc.description}</p>
        ${svc.capability ? `<div style="margin-top:10px;"><span class="badge">${svc.capability}</span></div>` : ''}
      </div>
    `;
    
    adminBody.innerHTML += `
      <tr>
        <td class="title">${svc.icon} ${svc.title}</td>
        <td>${svc.description}</td>
        <td class="row-actions">
          <button class="icon-btn" onclick="editService(${svc.id})">Edit</button>
          <button class="icon-btn danger" onclick="deleteService(${svc.id})">Delete</button>
        </td>
      </tr>
    `;
  });
  
  const aboutPreview = document.getElementById('aboutServicesPreview');
  if (aboutPreview) {
    aboutPreview.innerHTML = grid.innerHTML;
  }
}

document.getElementById('newServiceBtn')?.addEventListener('click', function() {
  const form = document.getElementById('serviceForm');
  if (form) {
    form.classList.add('active');
    document.getElementById('svTitle').value = '';
    document.getElementById('svIcon').value = '';
    document.getElementById('svCapability').value = '';
    document.getElementById('svExecUrl').value = '';
    document.getElementById('svDesc').value = '';
  }
});

document.getElementById('cancelServiceBtn')?.addEventListener('click', function() {
  const form = document.getElementById('serviceForm');
  if (form) {
    form.classList.remove('active');
  }
});

document.getElementById('saveServiceBtn')?.addEventListener('click', function() {
  const title = document.getElementById('svTitle').value;
  const icon = document.getElementById('svIcon').value || '⚙️';
  const capability = document.getElementById('svCapability').value;
  const execUrl = document.getElementById('svExecUrl').value;
  const desc = document.getElementById('svDesc').value;
  
  if (!title || !desc) {
    showToast('Title and description required');
    return;
  }
  
  const newService = {
    id: Date.now(),
    title,
    icon,
    capability,
    description: desc,
    execUrl
  };
  
  services.push(newService);
  localStorage.setItem('services', JSON.stringify(services));
  loadServices();
  document.getElementById('serviceForm').classList.remove('active');
  showToast('Service added');
});

function editService(id) {
  showToast('Edit feature coming soon');
}

function deleteService(id) {
  services = services.filter(s => s.id !== id);
  localStorage.setItem('services', JSON.stringify(services));
  loadServices();
  showToast('Service deleted');
}

// ============ MESSAGES ============
function loadMessages() {
  const body = document.getElementById('messagesBody');
  if (!body) return;
  
  const messages = JSON.parse(localStorage.getItem('messages')) || [];
  
  if (messages.length === 0) {
    body.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-lo);">No messages yet</td></tr>';
    return;
  }
  
  body.innerHTML = messages.map(msg => `
    <tr>
      <td>${msg.name}</td>
      <td>${msg.message.substring(0, 50)}...</td>
      <td><span class="badge">${msg.sent ? 'sent' : 'pending'}</span></td>
      <td class="mono">${new Date(msg.date).toLocaleDateString()}</td>
    </tr>
  `).join('');
}

// ============ ACTIVITY LOG ============
function loadActivity() {
  const body = document.getElementById('activityBody');
  if (!body) return;
  
  const activity = JSON.parse(localStorage.getItem('activity')) || [];
  
  if (activity.length === 0) {
    body.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text-lo);">No activity yet</td></tr>';
    return;
  }
  
  body.innerHTML = activity.slice().reverse().map(act => `
    <tr>
      <td>${act.event}</td>
      <td>${act.detail}</td>
      <td class="mono">${new Date(act.time).toLocaleTimeString()}</td>
    </tr>
  `).join('');
}

// ============ CONTACT FORM ============
document.getElementById('contactForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const name = document.getElementById('cName').value;
  const email = document.getElementById('cEmail').value;
  const msg = document.getElementById('cMsg').value;
  
  const messages = JSON.parse(localStorage.getItem('messages')) || [];
  messages.push({
    name,
    email,
    message: msg,
    date: new Date().toISOString(),
    sent: false
  });
  localStorage.setItem('messages', JSON.stringify(messages));
  
  const activity = JSON.parse(localStorage.getItem('activity')) || [];
  activity.push({
    event: 'New contact message',
    detail: `From: ${name} (${email})`,
    time: new Date().toISOString()
  });
  localStorage.setItem('activity', JSON.stringify(activity));
  
  showToast('Message sent! We\'ll be in touch soon.');
  this.reset();
});

// ============ ADMIN TABS ============
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    const tabName = this.dataset.tab;
    
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    
    this.classList.add('active');
    const panel = document.getElementById(`tab-${tabName}`);
    if (panel) panel.classList.add('active');
  });
});

// ============ TOAST NOTIFICATION ============
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('error');
  if (isError) toast.classList.add('error');
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ============ FOOTER STATUS ============
function checkBackend() {
  const status = document.getElementById('footerStatus');
  status.textContent = '✓ backend connected';
  status.style.color = 'var(--teal)';
}

checkBackend();
