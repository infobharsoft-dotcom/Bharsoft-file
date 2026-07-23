// ============ PAGE NAVIGATION ============
const navButtons = document.querySelectorAll('.navlinks button, [data-page]');
const pages = document.querySelectorAll('.page');

function showPage(pageName) {
  pages.forEach(page => page.classList.remove('active'));
  
  const targetPage = document.getElementById(`page-${pageName}`);
  if (targetPage) {
    targetPage.classList.add('active');
    window.scrollTo(0, 0);
  }
  
  document.querySelectorAll('.navlinks button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.page === pageName) {
      btn.classList.add('active');
    }
  });
}

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const pageName = btn.dataset.page;
    if (pageName) showPage(pageName);
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

const savedTheme = localStorage.getItem('theme') || 'dark';
htmlElement.setAttribute('data-theme', savedTheme);

// ============ DATABASE & SECURITY ============
let appScriptUrl = localStorage.getItem('appScriptUrl') || '';
let registeredAdmins = JSON.parse(localStorage.getItem('registeredAdmins')) || [];
let currentAdmin = JSON.parse(localStorage.getItem('currentAdmin')) || null;
let currentSession = localStorage.getItem('currentSession') || null;

// ============ LOGIN FLOW ============
const loginForm = document.getElementById('loginForm');
const otpForm = document.getElementById('otpForm');
const loginCard = document.getElementById('loginCard');
const otpCard = document.getElementById('otpCard');

let loginAttemptUser = null;
let generatedOTP = null;

document.addEventListener('DOMContentLoaded', function() {
  if (loginCard) loginCard.style.display = 'block';
  if (otpCard) otpCard.style.display = 'none';
  
  // Check if already logged in
  if (currentSession && currentAdmin) {
    showPage('admin');
    loadAdminPanel();
  }
});

// Login Submit
if (loginForm) {
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const user = document.getElementById('lUser').value.trim();
    const pass = document.getElementById('lPass').value.trim();
    
    if (!user || !pass) {
      document.getElementById('loginErr').textContent = 'Please enter username and password';
      return;
    }
    
    // Check if admin exists
    const admin = registeredAdmins.find(a => a.username === user);
    if (!admin) {
      document.getElementById('loginErr').textContent = 'Username not found';
      return;
    }
    
    if (admin.password !== btoa(pass)) {
      document.getElementById('loginErr').textContent = 'Password incorrect';
      return;
    }
    
    // Generate OTP
    generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    loginAttemptUser = user;
    
    document.getElementById('otpUserLabel').textContent = user;
    document.getElementById('demoOtpBanner').innerHTML = `
      <strong>✉️ OTP sent to:</strong> ${admin.email}<br>
      <strong>Demo mode:</strong> OTP: <code class="mono">${generatedOTP}</code>
    `;
    
    // In production: send via email
    console.log(`📧 OTP for ${user}: ${generatedOTP}`);
    
    loginCard.style.display = 'none';
    otpCard.style.display = 'block';
    document.getElementById('otpInput').value = '';
    document.getElementById('otpErr').textContent = '';
    document.getElementById('loginErr').textContent = '';
  });
}

// OTP Submit
if (otpForm) {
  otpForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const otp = document.getElementById('otpInput').value.trim();
    
    if (otp !== generatedOTP) {
      document.getElementById('otpErr').textContent = 'OTP incorrect. Try again.';
      return;
    }
    
    // Login success
    currentSession = 'session-' + Date.now();
    currentAdmin = registeredAdmins.find(a => a.username === loginAttemptUser);
    
    localStorage.setItem('currentSession', currentSession);
    localStorage.setItem('currentAdmin', JSON.stringify(currentAdmin));
    
    loginCard.style.display = 'none';
    otpCard.style.display = 'none';
    
    showPage('admin');
    loadAdminPanel();
    
    document.getElementById('loginForm').reset();
    document.getElementById('otpForm').reset();
    showToast('✓ Logged in successfully');
  });
}

document.getElementById('resendOtpBtn')?.addEventListener('click', function(e) {
  e.preventDefault();
  generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`📧 New OTP: ${generatedOTP}`);
  document.getElementById('demoOtpBanner').innerHTML = `
    <strong>✉️ OTP resent</strong><br>
    <code class="mono">${generatedOTP}</code>
  `;
  showToast('OTP resent');
});

document.getElementById('backToLoginBtn')?.addEventListener('click', function(e) {
  e.preventDefault();
  otpCard.style.display = 'none';
  loginCard.style.display = 'block';
  document.getElementById('otpInput').value = '';
  document.getElementById('otpErr').textContent = '';
});

// ============ ADMIN REGISTRATION ============
const registrationForm = document.getElementById('registrationForm');

if (registrationForm) {
  registrationForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const confirmPass = document.getElementById('regConfirmPass').value.trim();
    
    // Validation
    if (!username || !email || !password || !confirmPass) {
      document.getElementById('regErr').textContent = 'All fields required';
      return;
    }
    
    // Email validation (Gmail only)
    if (!email.endsWith('@gmail.com')) {
      document.getElementById('regErr').textContent = 'Only Gmail addresses allowed (example@gmail.com)';
      return;
    }
    
    // Password validation
    if (password.length < 6) {
      document.getElementById('regErr').textContent = 'Password must be at least 6 characters';
      return;
    }
    
    if (password !== confirmPass) {
      document.getElementById('regErr').textContent = 'Passwords do not match';
      return;
    }
    
    // Check if admin already exists
    if (registeredAdmins.find(a => a.username === username)) {
      document.getElementById('regErr').textContent = 'Username already exists';
      return;
    }
    
    if (registeredAdmins.find(a => a.email === email)) {
      document.getElementById('regErr').textContent = 'Email already registered';
      return;
    }
    
    // Create new admin
    const newAdmin = {
      id: 'admin-' + Date.now(),
      username,
      email,
      password: btoa(password), // Basic encoding (use bcrypt in production)
      createdAt: new Date().toISOString(),
      verified: true
    };
    
    registeredAdmins.push(newAdmin);
    localStorage.setItem('registeredAdmins', JSON.stringify(registeredAdmins));
    
    // Log registration
    const activity = JSON.parse(localStorage.getItem('activity')) || [];
    activity.push({
      event: 'Admin Registration',
      detail: `${username} (${email}) registered successfully`,
      time: new Date().toISOString()
    });
    localStorage.setItem('activity', JSON.stringify(activity));
    
    showToast('✓ Admin registered successfully. Please login.');
    document.getElementById('registrationForm').reset();
    document.getElementById('regErr').textContent = '';
    
    // Switch to login
    setTimeout(() => {
      showPage('login');
      loginCard.style.display = 'block';
      otpCard.style.display = 'none';
    }, 1000);
  });
}

// ============ DATABASE MANAGEMENT ============
const dbSetupForm = document.getElementById('dbSetupForm');

if (dbSetupForm) {
  dbSetupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const dbUrl = document.getElementById('dbUrl').value.trim();
    
    if (!dbUrl) {
      document.getElementById('dbSetupErr').textContent = 'Database URL required';
      return;
    }
    
    // Validate URL format
    try {
      new URL(dbUrl);
    } catch (err) {
      document.getElementById('dbSetupErr').textContent = 'Invalid URL format';
      return;
    }
    
    // Test connection to Google Apps Script
    document.getElementById('dbSetupErr').textContent = 'Testing connection...';
    
    try {
      const response = await fetch(dbUrl + '?action=test', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      appScriptUrl = dbUrl;
      localStorage.setItem('appScriptUrl', dbUrl);
      
      document.getElementById('dbSetupErr').textContent = '';
      showToast('✓ Database connected successfully');
      
      // Update status
      const dbStatus = document.getElementById('dbStatus');
      if (dbStatus) {
        dbStatus.innerHTML = `<span style="color: var(--teal);">✓ Connected: ${dbUrl.substring(0, 50)}...</span>`;
      }
      
      this.reset();
    } catch (err) {
      document.getElementById('dbSetupErr').textContent = `Connection failed: ${err.message}. Make sure the Apps Script URL is correct and accessible.`;
    }
  });
}

// ============ ADMIN PANEL ============
function loadAdminPanel() {
  if (!currentAdmin) return;
  
  document.getElementById('adminUserName').textContent = currentAdmin.username;
  const expiryTime = new Date(Date.now() + 60 * 60000).toLocaleTimeString();
  document.getElementById('adminSessionExpiry').textContent = `expires ${expiryTime}`;
  
  loadServices();
  loadMessages();
  loadActivity();
  loadDatabases();
}

function loadDatabases() {
  const body = document.getElementById('databasesBody');
  if (!body) return;
  
  const databases = JSON.parse(localStorage.getItem('databases')) || [];
  body.innerHTML = '';
  
  if (databases.length === 0) {
    body.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-lo);">No databases connected</td></tr>';
    return;
  }
  
  body.innerHTML = databases.map((db, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td class="mono">${db.url.substring(0, 60)}...</td>
      <td><span class="badge" style="background:rgba(45,212,191,.15);color:var(--teal);">✓ Active</span></td>
      <td class="row-actions">
        <button class="icon-btn" onclick="testDatabase(${idx})">Test</button>
        <button class="icon-btn danger" onclick="deleteDatabase(${idx})">Remove</button>
      </td>
    </tr>
  `).join('');
}

function testDatabase(idx) {
  const databases = JSON.parse(localStorage.getItem('databases')) || [];
  const db = databases[idx];
  
  fetch(db.url + '?action=test')
    .then(r => r.json())
    .then(data => {
      showToast('✓ Database responding');
      console.log('Database test response:', data);
    })
    .catch(err => {
      showToast('✗ Database not responding: ' + err.message, true);
    });
}

function deleteDatabase(idx) {
  if (!confirm('Remove this database?')) return;
  
  let databases = JSON.parse(localStorage.getItem('databases')) || [];
  databases.splice(idx, 1);
  localStorage.setItem('databases', JSON.stringify(databases));
  
  loadDatabases();
  showToast('Database removed');
}

document.getElementById('addDatabaseBtn')?.addEventListener('click', function() {
  const form = document.getElementById('dbForm');
  if (form) form.classList.toggle('active');
});

document.getElementById('cancelDbBtn')?.addEventListener('click', function() {
  const form = document.getElementById('dbForm');
  if (form) {
    form.classList.remove('active');
    document.getElementById('dbInputUrl').value = '';
    document.getElementById('dbFormErr').textContent = '';
  }
});

document.getElementById('saveDbBtn')?.addEventListener('click', async function() {
  const dbUrl = document.getElementById('dbInputUrl').value.trim();
  const dbFormErr = document.getElementById('dbFormErr');
  
  if (!dbUrl) {
    dbFormErr.textContent = 'Database URL required';
    return;
  }
  
  try {
    new URL(dbUrl);
  } catch {
    dbFormErr.textContent = 'Invalid URL format';
    return;
  }
  
  dbFormErr.textContent = 'Testing...';
  
  try {
    const response = await fetch(dbUrl + '?action=test', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: Backend not responding`);
    }
    
    // Check response format
    const data = await response.text();
    if (!data) {
      throw new Error('Empty response from backend');
    }
    
    // Save database
    let databases = JSON.parse(localStorage.getItem('databases')) || [];
    databases.push({
      id: 'db-' + Date.now(),
      url: dbUrl,
      addedAt: new Date().toISOString(),
      status: 'active'
    });
    localStorage.setItem('databases', JSON.stringify(databases));
    
    // Log
    const activity = JSON.parse(localStorage.getItem('activity')) || [];
    activity.push({
      event: 'Database Added',
      detail: dbUrl,
      time: new Date().toISOString()
    });
    localStorage.setItem('activity', JSON.stringify(activity));
    
    dbFormErr.textContent = '';
    showToast('✓ Database added successfully');
    document.getElementById('dbForm').classList.remove('active');
    document.getElementById('dbInputUrl').value = '';
    loadDatabases();
  } catch (err) {
    dbFormErr.innerHTML = `
      <strong>❌ Connection Error:</strong><br>
      ${err.message}<br><br>
      <small>Make sure:<br>
      • URL is correct<br>
      • Apps Script is deployed as Web App<br>
      • Execution access is set correctly<br>
      • Network is available</small>
    `;
  }
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', function() {
  if (!confirm('Log out?')) return;
  
  currentSession = null;
  currentAdmin = null;
  localStorage.removeItem('currentSession');
  localStorage.removeItem('currentAdmin');
  
  loginCard.style.display = 'block';
  otpCard.style.display = 'none';
  
  document.getElementById('loginForm')?.reset();
  document.getElementById('otpForm')?.reset();
  
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
    grid.innerHTML = '<div class="empty-state">No services yet</div>';
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
  if (aboutPreview) aboutPreview.innerHTML = grid.innerHTML;
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
  if (form) form.classList.remove('active');
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
  
  services.push({
    id: Date.now(),
    title,
    icon,
    capability,
    description: desc,
    execUrl
  });
  
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
      <td><span class="badge">${msg.sent ? '✓ sent' : '○ pending'}</span></td>
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
  
  body.innerHTML = activity.slice().reverse().slice(0, 50).map(act => `
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
    event: 'Contact Message',
    detail: `From: ${name} (${email})`,
    time: new Date().toISOString()
  });
  localStorage.setItem('activity', JSON.stringify(activity));
  
  showToast('Message sent! We\'ll be in touch.');
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
  }, 4000);
}

// ============ FOOTER STATUS ============
function checkBackend() {
  const status = document.getElementById('footerStatus');
  if (appScriptUrl) {
    status.textContent = '✓ backend connected';
    status.style.color = 'var(--teal)';
  } else {
    status.textContent = '○ no database configured';
    status.style.color = 'var(--text-lo)';
  }
}

checkBackend();

// Check existing registrations on load
document.addEventListener('DOMContentLoaded', function() {
  if (registeredAdmins.length === 0) {
    // No admins, show registration needed
    const regBtn = document.getElementById('regTab');
    if (regBtn) regBtn.style.display = 'block';
  }
});
