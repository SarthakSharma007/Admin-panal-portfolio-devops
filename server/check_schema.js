const { promisePool } = require('./config/db');

async function check() {
  const [rows] = await promisePool.execute('DESCRIBE skills');
  console.log(rows);
  process.exit(0);
}
check();
