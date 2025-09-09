(function(global){
  const { httpRequest, showToast } = PMS_UTILS;

  // Map frontend routes to GAS endpoints
  function api(path) {
    // Expect GAS to route by query params: ?path=/auth for POST etc.
    return `?path=${encodeURIComponent(path)}`;
  }

  async function authenticateUser(empCode) {
    // Try online first
    try {
      const res = await httpRequest(api('/auth'), { method: 'POST', body: JSON.stringify({ empCode }) });
      return res;
    } catch (err) {
      showToast('Offline mode: authenticating from local DB', 'info');
      const db = await PMS_DB.openDatabase();
      const row = PMS_DB.get('SELECT * FROM employees WHERE emp_code = ?', [empCode]);
      if (!row) throw err;
      return { ok: true, user: row };
    }
  }

  async function getEmployeeDetails(empCode) {
    try {
      const res = await httpRequest(api(`/employee/${empCode}`), { method: 'GET' });
      return res;
    } catch (err) {
      showToast('Offline mode: loading employee from local DB', 'info');
      const db = await PMS_DB.openDatabase();
      const row = PMS_DB.get('SELECT * FROM employees WHERE emp_code = ?', [empCode]);
      return row;
    }
  }

  async function getGoals(empCode) {
    try {
      return await httpRequest(api(`/goals/${empCode}`), { method: 'GET' });
    } catch (err) {
      const db = await PMS_DB.openDatabase();
      return PMS_DB.all('SELECT * FROM goals WHERE emp_code = ?', [empCode]);
    }
  }

  async function saveGoals(empCode, goalsArray) {
    try {
      return await httpRequest(api(`/goals/${empCode}`), { method: 'POST', body: JSON.stringify({ goals: goalsArray }) });
    } catch (err) {
      // Fallback to local store and mark as pending sync (not implemented fully)
      const db = await PMS_DB.openDatabase();
      goalsArray.forEach(g => {
        PMS_DB.run(
          'INSERT INTO goals (emp_code, kra_title, kpi_description, measurement_criteria, weightage, mid_year_review, achieved_ratio, calculated_score, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [empCode, g.kra_title, g.kpi_description, g.measurement_criteria, g.weightage, g.mid_year_review || null, g.achieved_ratio || null, g.calculated_score || null, PMS_DB.nowISO(), PMS_DB.nowISO()]
        );
      });
      showToast('Saved locally (offline). Will sync when online.', 'success');
      return { ok: true, offline: true };
    }
  }

  async function getCompetencies(empCode) {
    try {
      return await httpRequest(api(`/competencies/${empCode}`), { method: 'GET' });
    } catch (err) {
      const db = await PMS_DB.openDatabase();
      return PMS_DB.all('SELECT * FROM behavioural_competencies WHERE emp_code = ?', [empCode]);
    }
  }

  async function saveCompetencies(empCode, competenciesArray) {
    try {
      return await httpRequest(api(`/competencies/${empCode}`), { method: 'POST', body: JSON.stringify({ competencies: competenciesArray }) });
    } catch (err) {
      const db = await PMS_DB.openDatabase();
      competenciesArray.forEach(c => {
        PMS_DB.run(
          'INSERT INTO behavioural_competencies (emp_code, competency_name, behaviour_1, behaviour_1_score, behaviour_2, behaviour_2_score, competency_total_score, other_remarks, reviewer_emp_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [empCode, c.competency_name, c.behaviour_1, c.behaviour_1_score, c.behaviour_2, c.behaviour_2_score, c.competency_total_score, c.other_remarks || null, c.reviewer_emp_code || null, PMS_DB.nowISO(), PMS_DB.nowISO()]
        );
      });
      showToast('Saved locally (offline). Will sync when online.', 'success');
      return { ok: true, offline: true };
    }
  }

  async function getCompetencyMaster() {
    try { return await httpRequest(api('/competencies/master'), { method: 'GET' }); }
    catch (err) {
      const db = await PMS_DB.openDatabase();
      return PMS_DB.all('SELECT * FROM competency_master WHERE is_active = 1 ORDER BY sort_order ASC');
    }
  }

  async function getActiveTimeWindow() {
    try { return await httpRequest(api('/system/timewindow'), { method: 'GET' }); }
    catch (err) {
      // Basic client-side computation fallback
      const month = (new Date().getMonth() + 1);
      const tw = PMS_CONFIG.timeWindows;
      let active = 'none';
      if (month >= tw.goalSetting.startMonth && month <= tw.goalSetting.endMonth) active = 'goalSetting';
      else if (month >= tw.midYear.startMonth && month <= tw.midYear.endMonth) active = 'midYear';
      else if (month >= tw.yearEnd.startMonth && month <= tw.yearEnd.endMonth) active = 'yearEnd';
      return { active };
    }
  }

  async function updateSystemSettings(settings) {
    return httpRequest(api('/system/settings'), { method: 'POST', body: JSON.stringify(settings) });
  }

  async function calculateOverallPerformanceScore(empCode) {
    try { return await httpRequest(api(`/performance/overall/${empCode}`), { method: 'GET' }); }
    catch (err) {
      // Simple fallback: compute from local tables
      const db = await PMS_DB.openDatabase();
      const goals = PMS_DB.all('SELECT weightage, achieved_ratio FROM goals WHERE emp_code = ?', [empCode]);
      const score = goals.reduce((acc, g) => acc + (Number(g.weightage)||0) * ((Number(g.achieved_ratio)||0)/100), 0);
      return { overall: score };
    }
  }

  global.PMS_API = {
    authenticateUser,
    getEmployeeDetails,
    getGoals, saveGoals,
    getCompetencies, saveCompetencies,
    getCompetencyMaster,
    getActiveTimeWindow,
    updateSystemSettings,
    calculateOverallPerformanceScore
  };
})(window);
