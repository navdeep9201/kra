(function(global){
  // Lazy-load sql.js from CDN when first needed
  let SQLPromise = null;
  let database = null;

  async function loadSQL() {
    if (SQLPromise) return SQLPromise;
    SQLPromise = new Promise(async (resolve, reject) => {
      try {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/sql-wasm.js';
        script.onload = async () => {
          const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${file}` });
          resolve(SQL);
        };
        script.onerror = () => reject(new Error('Failed to load sql.js'));
        document.head.appendChild(script);
      } catch (err) { reject(err); }
    });
    return SQLPromise;
  }

  async function openDatabase() {
    if (database) return database;
    const SQL = await loadSQL();
    const db = new SQL.Database();
    database = db;
    await initializeSchema();
    return database;
  }

  async function initializeSchema() {
    const db = database;
    if (!db) return;
    // Create tables if not exist
    db.run(`CREATE TABLE IF NOT EXISTS employees (
      emp_code TEXT PRIMARY KEY,
      name TEXT,
      division TEXT,
      designation TEXT,
      location TEXT,
      department TEXT,
      user_type TEXT
    );`);

    db.run(`CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      emp_code TEXT,
      kra_title TEXT,
      kpi_description TEXT,
      measurement_criteria TEXT,
      weightage INTEGER,
      mid_year_review TEXT,
      achieved_ratio INTEGER,
      calculated_score REAL,
      created_at DATETIME,
      updated_at DATETIME
    );`);

    db.run(`CREATE TABLE IF NOT EXISTS behavioural_competencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      emp_code TEXT,
      competency_name TEXT,
      behaviour_1 TEXT,
      behaviour_1_score INTEGER,
      behaviour_2 TEXT,
      behaviour_2_score INTEGER,
      competency_total_score REAL,
      other_remarks TEXT,
      reviewer_emp_code TEXT,
      created_at DATETIME,
      updated_at DATETIME
    );`);

    db.run(`CREATE TABLE IF NOT EXISTS competency_master (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competency_name TEXT UNIQUE,
      competency_description TEXT,
      is_active BOOLEAN DEFAULT 1,
      sort_order INTEGER
    );`);

    db.run(`CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_name TEXT UNIQUE,
      setting_value TEXT,
      effective_date DATE
    );`);
  }

  function run(sql, params=[]) {
    const db = database; if (!db) throw new Error('DB not open');
    return db.run(sql, params);
  }

  function all(sql, params=[]) {
    const db = database; if (!db) throw new Error('DB not open');
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  function get(sql, params=[]) {
    const rows = all(sql, params);
    return rows[0] || null;
  }

  function nowISO() { return new Date().toISOString(); }

  const DB = { openDatabase, run, all, get, nowISO };
  global.PMS_DB = DB;
})(window);
