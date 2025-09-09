(function(global){
  const CONFIG = {
    appName: 'Performance Management System',
    version: '0.1.0',
    env: 'development',
    // Replace with your deployed GAS web app base URL (doGet/doPost)
    apiBaseUrl: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
    // Time window month ranges (inclusive) for UI toggles
    timeWindows: {
      goalSetting: { startMonth: 8, endMonth: 9 },     // Aug-Sep
      midYear: { startMonth: 11, endMonth: 12 },       // Nov-Dec
      yearEnd: { startMonth: 1, endMonth: 3 }          // Example: Jan-Mar
    },
    // Local DB name
    sqlite: {
      dbName: 'pms_client.db'
    }
  };

  global.PMS_CONFIG = CONFIG;
})(window);
