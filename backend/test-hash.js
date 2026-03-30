const bcrypt = require('bcryptjs');

async function test() {
  const hash = '$2a$10$KIX2JYkKfr0G2HL0aURvZOmYzB4rSwvPJnHqP03F9WQqB5XDAH9eS';
  const password = 'Test@123';
  const match = await bcrypt.compare(password, hash);
  console.log('Hash matches password:', match);
  
  // Also generate a fresh hash
  const freshHash = await bcrypt.hash(password, 10);
  console.log('Fresh hash:', freshHash);
}

test().catch(console.error);
