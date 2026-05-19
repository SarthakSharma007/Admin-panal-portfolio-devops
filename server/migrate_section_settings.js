require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('Connected to MySQL database.');

    // 1. Create section_settings table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS section_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        section_name VARCHAR(255) NOT NULL UNIQUE,
        subtitle VARCHAR(255),
        title VARCHAR(255),
        title_highlight VARCHAR(255),
        title_gradient VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.execute(createTableQuery);
    console.log('Created section_settings table.');

    // 2. Seed default data for 'skills'
    const seedQuery = `
      INSERT IGNORE INTO section_settings 
      (section_name, subtitle, title, title_highlight, title_gradient, description)
      VALUES 
      ('skills', 'MY TOOLKIT', 'Technologies & ', 'Skills', 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', 'The tools and technologies I use to build, deploy, and scale cloud-native systems.')
    `;
    await connection.execute(seedQuery);
    console.log('Seeded default data for skills section.');

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrate();
