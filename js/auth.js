(function(global){
  const { $, showToast, setLoading, saveSession, loadSession, clearSession } = PMS_UTILS;
  const SESSION_KEY = 'pms_session';

  function getSession() { return loadSession(SESSION_KEY, null); }
  function setSession(session) { saveSession(SESSION_KEY, session); }
  function clearUserSession() { clearSession(SESSION_KEY); }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    const empCode = $('#empCode').value.trim();
    if (!empCode) { $('#loginError').textContent = 'Employee code is required'; return; }
    setLoading(true);
    try {
      const res = await PMS_API.authenticateUser(empCode);
      if (res && (res.ok || res.user)) {
        const user = res.user || res;
        setSession({ empCode: user.emp_code || empCode, role: user.user_type || 'Individual User', name: user.name || '' });
        showToast('Login successful', 'success');
        await onAuthenticated();
      } else {
        $('#loginError').textContent = 'Invalid employee code';
      }
    } catch (err) {
      $('#loginError').textContent = 'Login failed. Please try again.';
      console.error(err);
    } finally { setLoading(false); }
  }

  async function onAuthenticated() {
    const session = getSession();
    if (!session) return;
    $('#loginSection').style.display = 'none';
    $('#dashboardSection').style.display = 'block';
    $('#userName').textContent = session.name || session.empCode;
    $('#userRole').textContent = session.role;
    // role-based admin tab visibility
    const isAdmin = /admin/i.test(session.role);
    PMS_UTILS.$all('.admin-only').forEach(el => el.style.display = isAdmin ? '' : 'none');
    await PMS_DB.openDatabase();
    // Load profile data
    const emp = await PMS_API.getEmployeeDetails(session.empCode);
    if (emp) {
      PMS_UTILS.$('#profileEmpCode').textContent = emp.emp_code || session.empCode;
      PMS_UTILS.$('#profileName').textContent = emp.name || '';
      PMS_UTILS.$('#profileDivision').textContent = emp.division || '';
      PMS_UTILS.$('#profileDesignation').textContent = emp.designation || '';
      PMS_UTILS.$('#profileLocation').textContent = emp.location || '';
      PMS_UTILS.$('#profileDepartment').textContent = emp.department || '';
    }
    // Initialize modules
    await window.PMS_MAIN.initializeModules();
  }

  function bindAuthUI() {
    const form = $('#loginForm');
    if (form) form.addEventListener('submit', handleLoginSubmit);
    const logoutBtn = $('#logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
      clearUserSession();
      location.reload();
    });
  }

  async function initAuth() {
    bindAuthUI();
    const session = getSession();
    if (session && session.empCode) {
      await onAuthenticated();
    }
  }

  global.PMS_AUTH = { initAuth, getSession };
})(window);
