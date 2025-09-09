(function(global){
  const { $, $all, showToast } = PMS_UTILS;

  function renderForm(current) {
    const root = $('#timeWindowConfig'); if (!root) return;
    root.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'content-card';
    card.innerHTML = `
      <div class="form-group">
        <label>Current Active Window</label>
        <select id="activeWindow">
          <option value="none">None</option>
          <option value="goalSetting">Goal Setting (Aug-Sep)</option>
          <option value="midYear">Mid Year (Nov-Dec)</option>
          <option value="yearEnd">Year End</option>
        </select>
      </div>
      <button id="saveSystemSettings" class="btn-primary">Save Settings</button>
    `;
    root.appendChild(card);
    $('#activeWindow').value = current?.active || 'none';
    $('#saveSystemSettings').addEventListener('click', async ()=>{
      const active = $('#activeWindow').value;
      await PMS_API.updateSystemSettings({ active });
      showToast('System settings updated', 'success');
    });
  }

  async function onShow() {
    const tw = await PMS_API.getActiveTimeWindow();
    renderForm(tw);
  }

  async function init() { /* placeholder */ }

  global.PMS_MODULES = global.PMS_MODULES || {};
  global.PMS_MODULES.systemConfig = { init, onShow };
})(window);
