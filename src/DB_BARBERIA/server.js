require('dotenv').config();

const express = require('express');
const app = express();
const db = require('./conexion');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Backend de Barberia activo' });
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.post('/login', (req, res) => {
    const { email, correo, password, userType } = req.body;
    
    const correoBuscar = (email || correo || '').toString().trim(); 
    const passwordBuscar = (password || '').toString().trim();
    const rolBuscar = (userType || '').toString().trim();

    console.log('-> POST /login recibida');
    console.log('   body:', req.body);
    console.log('   correoBuscar:', correoBuscar, 'rolBuscar:', rolBuscar);

    if (!correoBuscar || !passwordBuscar || !rolBuscar) {
        return res.status(400).json({ message: "Faltan campos obligatorios para el login" });
    }
    const query = 'SELECT * FROM tabla_usuarios WHERE BINARY correo = ? AND rol = ?';

    db.query({ sql: query, timeout: 5000 }, [correoBuscar, rolBuscar], (err, results) => {
        if (err) {
            console.error("ERROR CRÍTICO DE MYSQL:", err);
            return res.status(500).json({ 
                message: "Error en base de datos", 
                sqlError: err.message 
            });
        }
        
        if (results.length > 0) {
            const usuario = results[0];

            if (passwordBuscar === usuario.password.toString()) {
                console.log("Login exitoso para el usuario:", usuario.nombre);
                return res.json({
                    message: "Bienvenido",
                    user: {
                        id: usuario.id_user,
                        name: usuario.nombre, 
                        rol: usuario.rol       
                    }
                });
            } else {
                console.log("Contraseña incorrecta para:", correoBuscar);
                return res.status(401).json({ message: "CONTRASEÑA INCORRECTA" });
            }
        } else {
            console.log("Usuario o Rol no encontrados para:", { correoBuscar, rolBuscar });
            return res.status(401).json({ message: "USUARIO O ROL INCORRECTOS" });
        }
    });
});

app.post('/signup', (req, res) => {
    const { nombre, correo, email, telefono, password, rol } = req.body;
    const emailFinal = correo || email; 

    const query = `
        INSERT INTO tabla_usuarios (nombre, correo, telefono, password, rol) 
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(query, [nombre, emailFinal, telefono, password, rol], (err, result) => {
        if (err) {
            console.error("ERROR AL REGISTRAR EN MYSQL:", err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: "El correo ya está registrado" });
            }
            return res.status(500).json({ message: "Error interno al registrar" });
        }
        res.json({ success: true, message: "Usuario registrado con éxito", userId: result.insertId });
    });
});

app.get('/citas', (req, res) => {
    const { id_barbero } = req.query;
    let query = 'SELECT * FROM tabla_citas';
    const params = [];

    if (id_barbero) {
        query += ' WHERE id_barbero = ?';
        params.push(parseInt(id_barbero, 10));
    }

    query += ' ORDER BY fecha_hora DESC';
    db.query(query, params, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error al obtener citas" });
        }
        res.json(results);
    });
});

app.get('/citas/cliente/:id_cliente', (req, res) => {
    const { id_cliente } = req.params;
    console.log("-> Solicitando citas del cliente ID:", id_cliente);

    const query = 'SELECT * FROM tabla_citas WHERE id_cliente = ? ORDER BY fecha_hora DESC';

    db.query(query, [parseInt(id_cliente, 10)], (err, results) => {
        if (err) {
            console.error("Error en base de datos al traer citas de cliente:", err);
            return res.status(500).json({ message: "Error interno en el servidor" });
        }
        res.json(results || []);
    });
});

app.post('/citas', (req, res) => {
    const { id_user, id_cliente, id_barbero, id_servicio, fecha_hora, estado } = req.body;
    const customerId = id_user || id_cliente;

    if (!customerId || !id_barbero || !id_servicio || !fecha_hora) {
        return res.status(400).json({ message: 'Faltan campos obligatorios para la cita' });
    }

    const query = `INSERT INTO tabla_citas (id_cliente, id_barbero, id_servicio, fecha_hora, estado) VALUES (?, ?, ?, ?, ?)`;
    db.query(query, [parseInt(customerId, 10), parseInt(id_barbero, 10), parseInt(id_servicio, 10), fecha_hora, estado || 'pendiente'], (err, result) => {
        if (err) {
            console.error('Error al crear cita:', err);
            return res.status(500).json({ message: 'Error al crear la cita', error: err.message });
        }
        res.json({ success: true, message: 'Cita creada con éxito', id_cita: result.insertId });
    });
});

app.get('/barberos', (req, res) => {
    console.log('-> Petición GET /barberos');
    const query = `SELECT id_user, nombre, correo, telefono FROM tabla_usuarios WHERE rol = 'barbero' ORDER BY nombre ASC`;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener barberos:', err);
            return res.status(500).json({ message: 'Error al obtener barberos', error: err.message });
        }
        res.json(results || []);
    });
});

app.get('/usuario/:id', (req, res) => {
    const { id } = req.params;
    const query = `SELECT id_user, nombre, correo, telefono, rol FROM tabla_usuarios WHERE id_user = ?`;
    db.query(query, [parseInt(id, 10)], (err, results) => {
        if (err) {
            console.error('Error al obtener usuario:', err);
            return res.status(500).json({ message: 'Error al obtener usuario', error: err.message });
        }
        if (!results.length) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(results[0]);
    });
});

app.put('/usuario/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, correo, telefono, password } = req.body;
    const updates = [];
    const params = [];

    if (nombre) {
        updates.push('nombre = ?');
        params.push(nombre);
    }
    if (correo) {
        updates.push('correo = ?');
        params.push(correo);
    }
    if (telefono) {
        updates.push('telefono = ?');
        params.push(telefono);
    }
    if (password) {
        updates.push('password = ?');
        params.push(password);
    }

    if (!updates.length) {
        return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
    }

    const query = `UPDATE tabla_usuarios SET ${updates.join(', ')} WHERE id_user = ?`;
    params.push(parseInt(id, 10));

    db.query(query, params, (err, result) => {
        if (err) {
            console.error('Error al actualizar usuario:', err);
            return res.status(500).json({ message: 'Error al actualizar el usuario', error: err.message });
        }
        res.json({ success: true, message: 'Perfil actualizado correctamente' });
    });
});

app.get('/servicios', (req, res) => {
    const { id_barbero } = req.query; 
    console.log("-> Petición GET /servicios. ID Barbero recibido:", id_barbero);
    
    if (!id_barbero || id_barbero === 'null' || id_barbero === 'undefined') {
        console.log("ID de barbero no válido en /servicios.");
        return res.json([]);
    }

    const barberoIdNum = parseInt(id_barbero, 10);
    if (isNaN(barberoIdNum)) {
        console.log("id_barbero no es un número válido en /servicios:", id_barbero);
        return res.status(400).json({ message: 'id_barbero debe ser numérico' });
    }

    const query = `
        SELECT 
            s.*, 
            img.url_imagen 
        FROM tabla_servicios s
        LEFT JOIN tabla_imagenes img ON s.id_servicio = img.id_servicio
        WHERE s.id_barbero = ?
    `; 

    console.log('Ejecutando consulta /servicios con id_barbero =', barberoIdNum);
    console.log('Consulta SQL servicios:', query.replace(/\s+/g, ' ').trim());

    db.query(query, [barberoIdNum], (err, results) => {
        if (err) {
            console.error("Error en MySQL servicios:", err);
            return res.status(500).json({ message: "Error al obtener servicios", error: err.message });
        }
        res.json(results);
    });
});

app.get('/publicaciones', (req, res) => {
    const { id_barbero } = req.query;
    console.log('-> Petición GET /publicaciones. ID Barbero recibido:', id_barbero);

    const baseQuery = `
        SELECT 
            p.id_post, 
            p.id_barbero, 
            p.id_servicio, 
            p.descripcion_post, 
            p.fecha_publicacion,
            s.nombre_servicio,
            b.nombre AS nombre_barbero,
            img.url_imagen
        FROM tabla_barbero_servicios p
        LEFT JOIN tabla_servicios s ON p.id_servicio = s.id_servicio
        LEFT JOIN tabla_usuarios b ON p.id_barbero = b.id_user
        LEFT JOIN tabla_imagenes img ON p.id_servicio = img.id_servicio
    `;

    if (!id_barbero || id_barbero === 'null' || id_barbero === 'undefined') {
        const allQuery = `${baseQuery} ORDER BY p.fecha_publicacion DESC`;
        console.log('Ejecutando consulta /publicaciones sin filtro de barbero.');
        db.query(allQuery, (err, results) => {
            if (err) {
                console.error('Error en MySQL publicaciones (all):', err);
                return res.status(500).json({ message: 'Error al obtener publicaciones', error: err.message });
            }
            return res.json(results);
        });
        return;
    }

    const barberoIdNum = parseInt(id_barbero, 10);
    if (isNaN(barberoIdNum)) {
        console.log('id_barbero no es un número válido en /publicaciones:', id_barbero);
        return res.status(400).json({ message: 'id_barbero debe ser numérico' });
    }

    const filteredQuery = `${baseQuery} WHERE p.id_barbero = ? ORDER BY p.fecha_publicacion DESC`;
    console.log('Ejecutando consulta /publicaciones con id_barbero =', barberoIdNum);
    db.query(filteredQuery, [barberoIdNum], (err, results) => {
        if (err) {
            console.error('Error en MySQL publicaciones:', err);
            return res.status(500).json({ message: 'Error al obtener publicaciones', error: err.message });
        }
        res.json(results);
    });
});

app.post('/servicios', upload.single('imagen'), (req, res) => {
    const { id_barbero, nombre_servicio, descripcion, precio, duracion_min } = req.body;
    
    if (!id_barbero) {
        console.log('POST /servicios: falta id_barbero en el body');
        return res.status(400).json({ message: 'id_barbero es requerido' });
    }

    const numBarbero = parseInt(id_barbero, 10);
    if (isNaN(numBarbero)) {
        console.log('POST /servicios: id_barbero no es numérico:', id_barbero);
        return res.status(400).json({ message: 'id_barbero debe ser numérico' });
    }
    const numPrecio = parseFloat(precio).toFixed(2); 
    const numDuracion = parseInt(duracion_min, 10);

    const queryServicio = `
        INSERT INTO tabla_servicios (id_barbero, nombre_servicio, descripcion, precio, duracion_min) 
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(queryServicio, [numBarbero, nombre_servicio, descripcion, numPrecio, numDuracion], (err, result) => {
        if (err) {
            console.error("ERROR REAL DE MYSQL AL INSERTAR SERVICIO:", err);
            return res.status(500).json({ message: "Error interno en MySQL", error: err.message });
        }
        
        const id_servicio = result.insertId;

        if (req.file) {
            const url_imagen = `http://localhost:5000/uploads/${req.file.filename}`;
            const queryImagen = 'INSERT INTO tabla_imagenes (id_servicio, url_imagen) VALUES (?, ?)';
            
            db.query(queryImagen, [id_servicio, url_imagen], (imgErr) => {
                if (imgErr) console.error("Error en tabla_imagenes:", imgErr);
                return res.json({ success: true, message: "Servicio e imagen creados", id_servicio });
            });
        } else {
            return res.json({ success: true, message: "Servicio creado sin imagen", id_servicio });
        }
    });
});

app.post('/publicaciones', (req, res) => {
    const { id_barbero, id_servicio, descripcion_post } = req.body;

    if (!id_barbero) {
        console.log('POST /publicaciones: falta id_barbero en el body');
        return res.status(400).json({ message: 'id_barbero es requerido' });
    }

    const numBarbero = parseInt(id_barbero, 10);
    if (isNaN(numBarbero)) {
        console.log('POST /publicaciones: id_barbero no es numérico:', id_barbero);
        return res.status(400).json({ message: 'id_barbero debe ser numérico' });
    }
    
    if (!id_servicio) {
        return res.status(400).json({ message: 'id_servicio es requerido' });
    }

    const query = `
        INSERT INTO tabla_barbero_servicios (id_barbero, id_servicio, descripcion_post) 
        VALUES (?, ?, ?)
    `;

    db.query(query, [numBarbero, parseInt(id_servicio, 10), descripcion_post], (err, result) => {
        if (err) {
            console.error("Error al insertar publicación:", err);
            return res.status(500).json({ message: "Error en el servidor al crear publicación" });
        }
        res.json({ success: true, message: "Publicación creada con éxito", id_post: result.insertId });
    });
});

app.delete('/servicios/:id', (req, res) => {
    let { id } = req.params;
    if (id.includes(':')) id = id.split(':')[0];

    const query = 'DELETE FROM tabla_servicios WHERE id_servicio = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error(" ERROR REAL DE MYSQL AL ELIMINAR SERVICIO:", err);
            return res.status(500).json({ message: "Error de restricción en MySQL" });
        }
        return res.json({ success: true, message: "Servicio eliminado" });
    });
});

app.delete('/publicaciones/:id', (req, res) => {
    let { id } = req.params;
    if (id.includes(':')) id = id.split(':')[0];

    const query = 'DELETE FROM tabla_barbero_servicios WHERE id_post = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error(" ERROR REAL DE MYSQL AL ELIMINAR PUBLICACIÓN:", err);
            return res.status(500).json({ message: "Error al eliminar la publicación" });
        }
        return res.json({ success: true, message: "Publicación eliminada" });
    });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`SERVIDOR ESCUCHANDO EN EL PUERTO ${port}`));