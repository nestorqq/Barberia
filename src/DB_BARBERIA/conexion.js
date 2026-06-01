const mysql = require('mysql2');

const poolConfig = {
  host: process.env.MYSQLHOST || '127.0.0.1',
  port: parseInt(process.env.MYSQLPORT, 10) || 3306,
  user: process.env.MYSQLUSER || 'root',
  database: process.env.MYSQLDATABASE || 'railway', // En Railway la BD por defecto se llama 'railway'
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 5000
};

const dbPassword = process.env.MYSQLPASSWORD?.trim();
if (dbPassword) {
  poolConfig.password = dbPassword;
}

const pool = mysql.createPool(poolConfig);

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error conectando a la DB: ' + (err.stack || err.message));
    return;
  }
  console.log('Conectado a la base de datos MySQL (Nube)');
  connection.release();
});

module.exports = pool;