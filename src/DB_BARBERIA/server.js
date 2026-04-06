const express = require ('express');
const app = express();
const db = require('./conexion');
const cors = require('cors');

app.use(cors());
app.use(express.json());

app.post('/login' , (req , res ) => {
    const{email, password , userType} = req.body ; 
    console.log("Intentando login con:", { email, userType });
    
    const query = 'SELECT * FROM tabla_usuarios WHERE correo = ?  AND rol = ? ';

    db.query(query , [email , userType], async (err, results) => {

        console.log("Resultados de la DB:", results);

        if(err){
            return res.status(500).json({message:"Error en base de datos"});
        }
        if(results.length > 0){
        const usuario = results[0];

           if(password === usuario.contrasenia){
            res.json({
                message: "Bienvenido",
                user:{
                    id: usuario.id_user,
                    nombre: usuario.nombre,
                    rol: usuario.rol 
                }
            })
           }
        }else {
            res.status(401).json({message : " USUARIO O CLAVE INCORRECTOS"});
        }
    });
});

app.listen(5000,() => console.log("SERVIDOR ESCUCHANDO EN EL PUERTO 5000 "))