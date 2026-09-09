// Utility to generate a secure bcrypt hash for Admin Password
// Usage: node hash_password.js "YourNewPassword"

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.log('\n❌ Please provide a password to hash.');
  console.log('Example: node hash_password.js "MySuperSecurePassword123!"\n');
  process.exit(1);
}

const SALT_ROUNDS = 12;

bcrypt.hash(password, SALT_ROUNDS).then(hash => {
  console.log('\n================================================================');
  console.log('✅ BCRYPT PASSWORD HASH GENERATED SUCCESSFULLY (12 rounds)');
  console.log('================================================================');
  console.log('\nPassword: ' + password);
  console.log('\nCopy and paste this into your Adminpanal/server/.env file:\n');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log('\n================================================================\n');
}).catch(err => {
  console.error('Error generating hash:', err);
  process.exit(1);
});
