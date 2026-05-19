const { promisePool } = require('./config/db');

async function fix() {
  await promisePool.execute('DELETE FROM skill_categories');
  await promisePool.execute('DELETE FROM skills WHERE icon IS NOT NULL OR emoji IS NOT NULL OR bg IS NOT NULL');
  console.log('Cleaned up. Now you can run migrate_skills.js again.');
  process.exit(0);
}
fix();
