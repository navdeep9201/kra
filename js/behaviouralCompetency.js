(function(global){
  const { $, $all, showToast, clampNumber } = PMS_UTILS;

  function createCompetencyRow(c) {
    const row = document.createElement('div');
    row.className = 'competency-row content-card';
    row.innerHTML = `
      <div class="form-group">
        <label>Competency</label>
        <input type="text" class="competency-name" value="${c.competency_name||''}" disabled />
      </div>
      <div class="form-group">
        <label>Behaviour 1</label>
        <input type="text" class="behaviour-1" value="${c.behaviour_1||''}" />
      </div>
      <div class="form-group">
        <label>Score 1</label>
        <select class="score-1">
          ${[5,4,3,2,1].map(s=>`<option ${Number(c.behaviour_1_score)===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Behaviour 2</label>
        <input type="text" class="behaviour-2" value="${c.behaviour_2||''}" />
      </div>
      <div class="form-group">
        <label>Score 2</label>
        <select class="score-2">
          ${[5,4,3,2,1].map(s=>`<option ${Number(c.behaviour_2_score)===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Total</label>
        <input type="text" class="total-score" value="${Number(c.competency_total_score||0).toFixed(1)}" disabled />
      </div>
      <div class="form-group" style="grid-column: 1/-1;">
        <label>Other Remarks</label>
        <input type="text" class="remarks" value="${c.other_remarks||''}" maxlength="500" />
      </div>
    `;
    return row;
  }

  function readCompetenciesFromUI() {
    return $all('#competencyContainer .competency-row').map(row => {
      const s1 = Number($('.score-1', row).value||0);
      const s2 = Number($('.score-2', row).value||0);
      const avg = (s1 + s2) / 2;
      return {
        competency_name: $('.competency-name', row).value,
        behaviour_1: $('.behaviour-1', row).value.trim(),
        behaviour_1_score: clampNumber(s1, 1, 5),
        behaviour_2: $('.behaviour-2', row).value.trim(),
        behaviour_2_score: clampNumber(s2, 1, 5),
        competency_total_score: Number(avg.toFixed(1)),
        other_remarks: $('.remarks', row).value.trim()
      };
    });
  }

  function validateCompetencies(list) {
    let ok = true; let messages = [];
    list.forEach((c,i)=>{
      if (!c.behaviour_1 || !c.behaviour_2) { ok=false; messages.push(`${c.competency_name}: need exactly 2 behaviours`); }
      if (c.behaviour_1_score < 1 || c.behaviour_1_score > 5 || c.behaviour_2_score < 1 || c.behaviour_2_score > 5) { ok=false; messages.push(`${c.competency_name}: scores must be 1-5`); }
      if ((c.other_remarks||'').length > 500) { ok=false; messages.push(`${c.competency_name}: remarks too long`); }
    });
    return { ok, messages };
  }

  function computeOverallScore(list) {
    if (!list.length) return 0;
    const total = list.reduce((acc, c)=> acc + (Number(c.competency_total_score)||0), 0);
    return Number((total / list.length).toFixed(1));
  }

  async function render(list) {
    const container = $('#competencyContainer');
    container.innerHTML = '';
    list.forEach(c => container.appendChild(createCompetencyRow(c)));
    updateOverall();
  }

  function updateOverall() {
    const list = readCompetenciesFromUI();
    const overall = computeOverallScore(list);
    $('#overallCompetencyScore').textContent = overall.toFixed(1);
  }

  async function onSave() {
    const session = PMS_AUTH.getSession(); if (!session) return;
    const list = readCompetenciesFromUI();
    const { ok, messages } = validateCompetencies(list);
    if (!ok) { showToast(messages.join(' '), 'error'); return; }
    await PMS_API.saveCompetencies(session.empCode, list);
    showToast('Competencies saved', 'success');
  }

  async function onShow() {
    const time = await PMS_API.getActiveTimeWindow();
    const isYearEnd = (time.active === 'yearEnd');
    $('#competencyWindowStatus').textContent = `Active window: ${time.active||'none'}`;
    $all('#competencyForm input, #competencyForm select, #saveCompetenciesBtn').forEach(el=> el.disabled = !isYearEnd);
    const session = PMS_AUTH.getSession(); if (!session) return;
    const master = await PMS_API.getCompetencyMaster();
    const existing = await PMS_API.getCompetencies(session.empCode);
    const map = new Map((existing||[]).map(e=> [e.competency_name, e]));
    const list = (master||[]).map(m => map.get(m.competency_name) || { competency_name: m.competency_name, behaviour_1_score: 3, behaviour_2_score: 3 });
    await render(list);
  }

  async function init() {
    $('#saveCompetenciesBtn').addEventListener('click', onSave);
    $('#competencyContainer').addEventListener('input', (e)=>{
      if (e.target.matches('.score-1, .score-2')) updateOverall();
      if (e.target.matches('.behaviour-1, .behaviour-2')) updateOverall();
    });
  }

  global.PMS_MODULES = global.PMS_MODULES || {};
  global.PMS_MODULES.competency = { init, onShow };
})(window);
