const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'karyaa-crm',
  password: 'darshan',
  port: 5432,
});

async function run() {
  await client.connect();
  try {
    const res = await client.query('SELECT id FROM users LIMIT 1');
    const userId = res.rows[0].id;
    console.log('User ID:', userId);

    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: userId, role: 'SALES_EXECUTIVE' }, 'Qz8JvN2mW4kLp9XsRt6HyFa3BcDe7UgPi0MnYvKr5TxAwEzCbHuIoPlQxRsTdFgV', { expiresIn: '1d' });
    console.log('Token:', token);

    const http = require('http');
    const data = JSON.stringify({
      customer_name: "Test User",
      mobile: "8234567892",
      source: "WEBSITE",
      project_id: "00000000-0000-0000-0000-000000000000"
    });

    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/leads',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
    });
    
    req.on('error', (e) => console.error(e));
    req.write(data);
    req.end();
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
