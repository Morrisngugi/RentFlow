const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function updatePassword() {
  const password = 'Test@123';
  const hash = await bcrypt.hash(password, 10);
  
  const client = new Client({
    user: 'rentflow_user',
    password: 'rentflow_pass',
    host: 'rentflow-postgres',
    port: 5432,
    database: 'rentflow_db',
  });

  await client.connect();
  const result = await client.query(
    'UPDATE users SET "passwordHash" = $1 WHERE email = $2 RETURNING email, role',
    [hash, 'kmoses@gmail.com']
  );
  console.log('Updated:', result.rows);
  await client.end();
}

updatePassword().catch(console.error);
