require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  console.log('Checking existing columns...');
  const [cols] = await conn.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects'`,
    [process.env.DB_NAME]
  );
  const existing = new Set(cols.map(c => c.COLUMN_NAME));
  console.log('Existing columns:', [...existing].join(', '));

  const columns = [
    [`slug`,           `VARCHAR(120) UNIQUE`],
    [`num`,            `VARCHAR(10)`],
    [`label`,          `VARCHAR(150)`],
    [`short_desc`,     `TEXT`],
    [`gradient`,       `VARCHAR(300)`],
    [`accent_a`,       `VARCHAR(60)`],
    [`accent_b`,       `VARCHAR(60)`],
    [`hero`,           `TINYINT(1) DEFAULT 0`],
    [`overview`,       `TEXT`],
    [`problem`,        `TEXT`],
    [`solution`,       `TEXT`],
    [`tech_stack_json`,`JSON`],
    [`timeline_json`,  `JSON`],
    [`learnings_json`, `JSON`],
  ];

  for (const [col, def] of columns) {
    if (existing.has(col)) {
      console.log(`  SKIP (exists): ${col}`);
    } else {
      await conn.execute(`ALTER TABLE projects ADD COLUMN ${col} ${def}`);
      console.log(`  ADDED: ${col}`);
    }
  }

  console.log('Migration complete!');
  await conn.end();
}

migrate().catch(err => { console.error(err); process.exit(1); });
