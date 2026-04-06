const mysql = require('mysql2');


const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',      
  password: '',     
  database: 'barberia_db' 
});


connection.connect((err) => {
  if (err) {
    console.error('Error conectando a la DB: ' + err.stack);
    return;
  }
  console.log('¡Conectado exitosamente a MySQL de XAMPP!');
});

module.exports = connection;