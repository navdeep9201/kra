(function(global){
  const { $, $all, showToast } = PMS_UTILS;

  function applyAchievementToUI(goals) {
    // Extend goals UI in place: add select for achieved ratio and computed score
    const rows = PMS_UTILS.$all('#goalsContainer .goal-row');
    rows.forEach((row, idx) => {
      if (!row.querySelector('.achieved-ratio')) {
        const wrap = document.createElement('div');
        wrap.className = 'form-group';
        wrap.innerHTML = `
          <label>Confirmed Achieved Ratio</label>
          <select class="achieved-ratio">
            ${[25,50,75,100,125].map(v=>`<option value="${v}">${v}%</option>`).join('')}
          </select>
        `;
        row.appendChild(wrap);
      }
      if (!row.querySelector('.calc-score')) {
        const wrap2 = document.createElement('div');
        wrap2.className = 'form-group';
        wrap2.innerHTML = `
          <label>Calculated Score</label>
          <input type="text" class="calc-score" value="0" disabled />
        `;
        row.appendChild(wrap2);
      }
    });
    updateCalculatedScores();
  }

  function updateCalculatedScores() {
    const rows = PMS_UTILS.$all('#goalsContainer .goal-row');
    rows.forEach(row => {
      const weight = Number(row.querySelector('.weightage')?.value||0);
      const ratio = Number(row.querySelector('.achieved-ratio')?.value||0);
      const calc = (weight * ratio) / 100;
      const out = row.querySelector('.calc-score');
      if (out) out.value = calc.toFixed(2);
    });
  }

  async function onShow() {
    const time = await PMS_API.getActiveTimeWindow();
    const isYearEnd = time.active === 'yearEnd';
    if (isYearEnd) {
      applyAchievementToUI();
      PMS_UTILS.$('#goalsActions')?.classList.remove('hide');
      PMS_UTILS.$('#goalsContainer')?.addEventListener('change', (e)=>{
        if (e.target.classList.contains('achieved-ratio')) updateCalculatedScores();
      });
    }
  }

  async function init() { /* no-op for now */ }

  global.PMS_MODULES = global.PMS_MODULES || {};
  global.PMS_MODULES.achievement = { init, onShow };
})(window);
