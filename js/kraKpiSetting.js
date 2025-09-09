(function(global){
  const { $, $all, showToast, sum, clampNumber } = PMS_UTILS;

  function createGoalRow(goal={}, idx) {
    const wrapper = document.createElement('div');
    wrapper.className = 'goal-row content-card';
    wrapper.innerHTML = `
      <div class="form-group">
        <label>KRA Title</label>
        <input type="text" class="kra-title" value="${goal.kra_title||''}" />
      </div>
      <div class="form-group">
        <label>KPI Description</label>
        <input type="text" class="kpi-description" value="${goal.kpi_description||''}" />
      </div>
      <div class="form-group">
        <label>Measurement Criteria</label>
        <input type="text" class="measurement-criteria" value="${goal.measurement_criteria||''}" />
      </div>
      <div class="form-group">
        <label>Weightage (%)</label>
        <input type="number" min="0" max="100" class="weightage" value="${goal.weightage||0}" />
      </div>
    `;
    return wrapper;
  }

  function readGoalsFromUI() {
    const rows = $all('#goalsContainer .goal-row');
    return rows.map(row => ({
      kra_title: $('.kra-title', row).value.trim(),
      kpi_description: $('.kpi-description', row).value.trim(),
      measurement_criteria: $('.measurement-criteria', row).value.trim(),
      weightage: clampNumber(Number($('.weightage', row).value||0), 0, 100)
    }));
  }

  function validateGoals(goals) {
    let ok = true; let messages = [];
    if (goals.length < 4 || goals.length > 5) { ok = false; messages.push('Must have 4-5 SMART Goals.'); }
    const totalWt = sum(goals.map(g=> g.weightage||0));
    if (totalWt > 100) { ok = false; messages.push('Total weightage must not exceed 100%.'); }
    goals.forEach((g,i)=>{ if ((g.weightage||0) < 4) { ok=false; messages.push(`KRA ${i+1} weightage must be at least 4%.`); } });
    return { ok, messages, totalWt };
  }

  async function renderGoals(goals=[]) {
    const container = $('#goalsContainer');
    container.innerHTML = '';
    goals.forEach((g, i) => container.appendChild(createGoalRow(g, i)));
    updateTotals();
  }

  function updateTotals() {
    const goals = readGoalsFromUI();
    const { totalWt } = validateGoals(goals);
    $('#totalWeightage').textContent = `${totalWt}%`;
  }

  async function onAddGoal() {
    const container = $('#goalsContainer');
    container.appendChild(createGoalRow({}, container.children.length));
    updateTotals();
  }

  async function onSaveGoals() {
    const goals = readGoalsFromUI();
    const { ok, messages } = validateGoals(goals);
    if (!ok) { showToast(messages.join(' '), 'error'); return; }
    const session = PMS_AUTH.getSession();
    await PMS_API.saveGoals(session.empCode, goals);
    showToast('Goals saved', 'success');
  }

  async function onShow() {
    const session = PMS_AUTH.getSession(); if (!session) return;
    const time = await PMS_API.getActiveTimeWindow();
    const active = time.active || 'none';
    $('#goalsWindowStatus').textContent = `Active window: ${active}`;
    const editable = active === 'goalSetting';
    $all('#goalsForm input, #addGoalBtn, #saveGoalsBtn').forEach(el => { el.disabled = !editable; });
    const goals = await PMS_API.getGoals(session.empCode);
    await renderGoals(goals || []);
  }

  async function init() {
    const container = $('#goalsContainer');
    if (!container) return;
    $('#addGoalBtn').addEventListener('click', onAddGoal);
    $('#saveGoalsBtn').addEventListener('click', onSaveGoals);
    container.addEventListener('input', (e)=>{
      if (e.target.classList.contains('weightage')) updateTotals();
    });
  }

  global.PMS_MODULES = global.PMS_MODULES || {};
  global.PMS_MODULES.kraKpi = { init, onShow };
})(window);
