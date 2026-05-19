require('dotenv').config();
const mysql = require('mysql2/promise');

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });
  await conn.execute(`
    INSERT IGNORE INTO section_settings (section_name, subtitle, title, title_highlight, title_gradient, description)
    VALUES ('projects', 'What I\\'ve Built', 'Featured ', 'Projects', 'linear-gradient(135deg, #818cf8 0%, #38bdf8 100%)', 'Real-world DevOps & automation projects — built, deployed, and documented end-to-end.')
  `);
  console.log('Seeded projects header.');
  await conn.end();
}

seed();
