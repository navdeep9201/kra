(function(global){
  const { $, showToast } = PMS_UTILS;

  async function onExportPdf() {
    showToast('PDF export not implemented yet', 'info');
  }
  async function onExportExcel() {
    showToast('Excel export not implemented yet', 'info');
  }

  async function renderPreview() {
    const root = $('#reportPreview'); if (!root) return;
    const session = PMS_AUTH.getSession(); if (!session) return;
    const perf = await PMS_API.calculateOverallPerformanceScore(session.empCode);
    root.innerHTML = `<div class="content-card"><h3>Overall Performance</h3><p>${(perf.overall||0).toFixed ? perf.overall.toFixed(2) : perf.overall}%</p></div>`;
  }

  async function onShow() { await renderPreview(); }
  async function init() {
    $('#exportPdfBtn').addEventListener('click', onExportPdf);
    $('#exportExcelBtn').addEventListener('click', onExportExcel);
  }

  global.PMS_MODULES = global.PMS_MODULES || {};
  global.PMS_MODULES.reports = { init, onShow };
})(window);
