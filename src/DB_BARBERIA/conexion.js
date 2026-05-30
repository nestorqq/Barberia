const mysql = require('mysql2');

const poolConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  database: process.env.DB_DATABASE || 'barber_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 5000
};

const dbPassword = process.env.DB_PASSWORD?.trim();
if (dbPassword) {
  poolConfig.password = dbPassword;
}

const pool = mysql.createPool(poolConfig);

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error conectando a la DB: ' + (err.stack || err.message));
    return;
  }
  console.log('Conectado a la base de datos MySQL');
  connection.release();
});

module.exports = pool;