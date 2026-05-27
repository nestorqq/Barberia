const mysql = require('mysql2');


const connection = mysql.createConnection({
  host: 'localhost',
  user: 'ernesto2',      
  password: '',     
  database: 'barber_db'
});


connection.connect((err) => {
  if (err) {
    console.error('Error conectando a la DB: ' + err.stack);
    return;
  }
});

module.exports = connection;