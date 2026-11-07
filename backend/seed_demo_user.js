const bcrypt = require('bcryptjs');
const pool = require('./db');

async function seed() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('student123', salt);
  
  await pool.query(
    `INSERT INTO users (name, email, password_hash) 
     VALUES ('Mohammed Muzammil Pasha', 'muzammil@smartcity.edu', ?)
     ON DUPLICATE KEY UPDATE password_hash = ?`,
    [hash, hash]
  );
  console.log('Seeded muzammil@smartcity.edu successfully.');
  process.exit(0);
}

seed();
