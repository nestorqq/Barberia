require('dotenv').config();

const express = require('express');
const app = express();
const db = require('./conexion');
const cors = require('cors');

const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { initTransporter, sendConfirmationToClient, sendConfirmationToBarbero, sendRefundToClient } = require('./emailService');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'barberia_servicios',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('JSON inválido en la solicitud:', err.message);
        return res.status(400).json({ message: 'JSON inválido en la solicitud' });
    }
    next(err);
});

app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Backend de Barberia activo' });
});

app.post('/login', (req, res) => {
    const { email, correo, password, userType } = req.body;

    const correoBuscar = (email || correo || '').toString().trim();
    const passwordBuscar = (password || '').toString().trim();
    const rolBuscar = (userType || '').toString().trim();

    console.log('-> POST /login recibida');
    if (!correoBuscar || !passwordBuscar || !rolBuscar) {
        return res.status(400).json({ message: "Faltan campos obligatorios para el login" });
    }
    const query = 'SELECT * FROM tabla_usuarios WHERE BINARY correo = ? AND rol = ?';

    db.query({ sql: query, timeout: 5000 }, [correoBuscar, rolBuscar], (err, results) => {
        if (err) {
            console.error("ERROR CRÍTICO DE MYSQL:", err);
            return res.status(500).json({ message: "Error en base de datos", sqlError: err.message });
        }

        if (results.length > 0) {
            const usuario = results[0];
            if (passwordBuscar === usuario.password.toString()) {
                return res.json({
                    message: "Bienvenido",
                    user: { id: usuario.id_user, name: usuario.nombre, rol: usuario.rol }
                });
            } else {
                return res.status(401).json({ message: "CONTRASEÑA INCORRECTA" });
            }
        } else {
            return res.status(401).json({ message: "USUARIO O ROL INCORRECTOS" });
        }
    });
});

app.post('/signup', (req, res) => {
    const { name, nombre, email, correo, phone, telefono, password, rol } = req.body;
    
    const nombreFinal = nombre || name || '';
    const emailFinal = correo || email || '';
    const telefonoFinal = telefono || phone || '';
    
    const telefonoLimpio = telefonoFinal.replace(/[\s\-()]/g, '');
    
    if (!nombreFinal || !emailFinal || !telefonoLimpio) {
      return res.status(400).json({ message: "Faltan campos obligatorios (nombre, email, teléfono)" });
    }

    const query = `
        INSERT INTO tabla_usuarios (nombre, correo, telefono, password, rol) 
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(query, [nombreFinal, emailFinal, telefonoLimpio, password, rol], (err, result) => {
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

app.post('/social-login', (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ message: 'Faltan campos obligatorios para el login social' });
    }

    const emailFinal = email.toString().trim();
    const nombreFinal = name.toString().trim();

    const findQuery = 'SELECT id_user, nombre, correo, telefono, rol FROM tabla_usuarios WHERE correo = ? LIMIT 1';
    db.query(findQuery, [emailFinal], (findErr, results) => {
        if (findErr) {
            console.error('Error al buscar usuario social:', findErr);
            return res.status(500).json({ message: 'Error de base de datos' });
        }

        if (results.length > 0) {
            return res.json({ success: true, user: results[0] });
        }

        const insertQuery = 'INSERT INTO tabla_usuarios (nombre, correo, telefono, password, rol) VALUES (?, ?, ?, ?, ?)';
        db.query(insertQuery, [nombreFinal, emailFinal, '', '', 'cliente'], (insertErr, insertResult) => {
            if (insertErr) {
                console.error('Error al crear usuario social:', insertErr);
                if (insertErr.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'El correo ya está registrado' });
                }
                return res.status(500).json({ message: 'Error de base de datos' });
            }

            const newUser = {
                id_user: insertResult.insertId,
                nombre: nombreFinal,
                correo: emailFinal,
                telefono: '',
                rol: 'cliente'
            };
            res.json({ success: true, user: newUser });
        });
    });
});

app.get('/citas', (req, res) => {
    const { id_barbero } = req.query;
    let query = `
        SELECT c.*, cli.nombre AS nombre_cliente, bar.nombre AS nombre_barbero, s.nombre_servicio
        FROM tabla_citas c
        LEFT JOIN tabla_usuarios cli ON c.id_cliente = cli.id_user
        LEFT JOIN tabla_usuarios bar ON c.id_barbero = bar.id_user
        LEFT JOIN tabla_servicios s ON c.id_servicio = s.id_servicio
    `;
    const params = [];

    if (id_barbero) {
        query += ' WHERE c.id_barbero = ?';
        params.push(parseInt(id_barbero, 10));
    }

    query += ' ORDER BY c.fecha_hora DESC';
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
    const query = `
        SELECT c.*, cli.nombre AS nombre_cliente, bar.nombre AS nombre_barbero, s.nombre_servicio
        FROM tabla_citas c
        LEFT JOIN tabla_usuarios cli ON c.id_cliente = cli.id_user
        LEFT JOIN tabla_usuarios bar ON c.id_barbero = bar.id_user
        LEFT JOIN tabla_servicios s ON c.id_servicio = s.id_servicio
        WHERE c.id_cliente = ?
        ORDER BY c.fecha_hora DESC
    `;
    db.query(query, [parseInt(id_cliente, 10)], (err, results) => {
        if (err) {
            console.error("Error en base de datos:", err);
            return res.status(500).json({ message: "Error interno" });
        }
        res.json(results || []);
    });
});

app.post('/citas', (req, res) => {
    const { id_user, id_cliente, id_barbero, id_servicio, fecha_hora, estado, nota, monto, payment_intent_id, payment_status } = req.body;
    const customerId = id_user || id_cliente;

    if (!customerId || !id_barbero || !id_servicio || !fecha_hora) {
        return res.status(400).json({ message: 'Faltan campos obligatorios para la cita' });
    }

    const fechaObjeto = new Date(fecha_hora);

    let fechaFinalSQL = fecha_hora;
    if (!isNaN(fechaObjeto.getTime())) {
        const pad = (num) => num.toString().padStart(2, '0');
        const YYYY = fechaObjeto.getFullYear();
        const MM = pad(fechaObjeto.getMonth() + 1);
        const DD = pad(fechaObjeto.getDate());
        const HH = pad(fechaObjeto.getHours());
        const mm = pad(fechaObjeto.getMinutes());
        const ss = pad(fechaObjeto.getSeconds());
        fechaFinalSQL = `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`;
    }

    const query = `INSERT INTO tabla_citas (id_cliente, id_barbero, id_servicio, fecha_hora, estado, nota, monto, payment_intent_id, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(query, [parseInt(customerId, 10), parseInt(id_barbero, 10), parseInt(id_servicio, 10), fechaFinalSQL, estado || 'pendiente', nota || null, monto || null, payment_intent_id || null, payment_status || 'pending'], (err, result) => {
        if (err) {
            console.error('Error al crear cita:', err);
            return res.status(500).json({ message: 'Error al crear la cita', error: err.message });
        }

        const id_cita = result.insertId;

        if (payment_status === 'completed') {
            const emailQuery = `
                SELECT c.*, cli.nombre AS nombre_cliente, cli.correo AS correo_cliente,
                       bar.nombre AS nombre_barbero, bar.correo AS correo_barbero,
                       s.nombre_servicio
                FROM tabla_citas c
                JOIN tabla_usuarios cli ON c.id_cliente = cli.id_user
                JOIN tabla_usuarios bar ON c.id_barbero = bar.id_user
                JOIN tabla_servicios s ON c.id_servicio = s.id_servicio
                WHERE c.id_cita = ?
            `;
            db.query(emailQuery, [id_cita], async (err2, rows) => {
                if (!err2 && rows.length > 0) {
                    const r = rows[0];
                    console.log('[CITA CREADA] Intentando enviar correos confirmación...');
                    try {
                        console.log(`  -> Enviando a cliente: ${r.correo_cliente}`);
                        await sendConfirmationToClient(r.correo_cliente, r.nombre_cliente, {
                            nombre_servicio: r.nombre_servicio,
                            nombre_barbero: r.nombre_barbero,
                            fecha_hora: r.fecha_hora,
                            monto: r.monto,
                            payment_intent_id: r.payment_intent_id,
                        });
                        console.log(`  -> Enviando a barbero: ${r.correo_barbero}`);
                        await sendConfirmationToBarbero(r.correo_barbero, r.nombre_barbero, {
                            nombre_cliente: r.nombre_cliente,
                            nombre_servicio: r.nombre_servicio,
                            fecha_hora: r.fecha_hora,
                            monto: r.monto,
                            nota: r.nota,
                        });
                        console.log('[CITA CREADA] ✅ Correos enviados exitosamente');
                    } catch (emailErr) {
                        console.error('[CITA CREADA] ❌ Error enviando correos:', emailErr.message);
                    }
                } else if (err2) {
                    console.error('[CITA CREADA] Error en query de correos:', err2.message);
                }
            });
        }

        res.json({ success: true, message: 'Cita creada con éxito', id_cita });
    });
});

app.put('/citas/:id', (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
        return res.status(400).json({ message: 'Se requiere el estado de la cita' });
    }

    const getQuery = `
        SELECT c.*, cli.nombre AS nombre_cliente, cli.correo AS correo_cliente,
               bar.nombre AS nombre_barbero, bar.correo AS correo_barbero,
               s.nombre_servicio
        FROM tabla_citas c
        JOIN tabla_usuarios cli ON c.id_cliente = cli.id_user
        JOIN tabla_usuarios bar ON c.id_barbero = bar.id_user
        JOIN tabla_servicios s ON c.id_servicio = s.id_servicio
        WHERE c.id_cita = ?
    `;

    db.query(getQuery, [parseInt(id, 10)], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error al obtener la cita' });
        if (rows.length === 0) return res.status(404).json({ message: 'Cita no encontrada' });

        const cita = rows[0];
        let updateQuery = 'UPDATE tabla_citas SET estado = ?';
        const params = [estado];

        let refund = false;
        if (estado === 'cancelada' && cita.payment_status === 'completed') {
            updateQuery += ', payment_status = ?, refundado_en = NOW()';
            params.push('refunded');
            refund = true;
        }

        updateQuery += ' WHERE id_cita = ?';
        params.push(parseInt(id, 10));

        db.query(updateQuery, params, async (err2, result) => {
            if (err2) {
                console.error('Error al actualizar la cita:', err2);
                return res.status(500).json({ message: 'Error al actualizar la cita' });
            }

            if (refund) {
                try {
                    console.log('[CITA CANCELADA] Intentando enviar correo de reembolso...');
                    console.log(`  -> Enviando a cliente: ${cita.correo_cliente}`);
                    await sendRefundToClient(cita.correo_cliente, cita.nombre_cliente, {
                        nombre_servicio: cita.nombre_servicio,
                        monto: cita.monto,
                        payment_intent_id: cita.payment_intent_id,
                    });
                    console.log('[CITA CANCELADA] ✅ Correo de reembolso enviado');
                } catch (emailErr) {
                    console.error('[CITA CANCELADA] ❌ Error enviando correo de reembolso:', emailErr.message);
                }

                return res.json({
                    success: true,
                    message: 'Cita cancelada y reembolso procesado',
                    refund: true,
                    refund_message: 'La cita ha sido cancelada. El reembolso se procesará automáticamente y se verá reflejado en un plazo no mayor a 48 horas.'
                });
            }

            res.json({ success: true, message: 'Estado de la cita actualizado' });
        });
    });
});

app.get('/barberos', (req, res) => {
    const query = `SELECT id_user, nombre, correo, telefono FROM tabla_usuarios WHERE rol = 'barbero' ORDER BY nombre ASC`;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error al obtener barberos' });
        res.json(results || []);
    });
});

app.get('/usuario/:id', (req, res) => {
    const { id } = req.params;
    const query = `SELECT id_user, nombre, correo, telefono, rol FROM tabla_usuarios WHERE id_user = ?`;
    db.query(query, [parseInt(id, 10)], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error al obtener usuario' });
        if (!results.length) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(results[0]);
    });
});

app.put('/usuario/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, correo, telefono, password } = req.body;
    const updates = [];
    const params = [];

    if (nombre) { updates.push('nombre = ?'); params.push(nombre); }
    if (correo) { updates.push('correo = ?'); params.push(correo); }
    if (telefono) { updates.push('telefono = ?'); params.push(telefono); }
    if (password) { updates.push('password = ?'); params.push(password); }

    if (!updates.length) return res.status(400).json({ message: 'Sin campos' });

    const query = `UPDATE tabla_usuarios SET ${updates.join(', ')} WHERE id_user = ?`;
    params.push(parseInt(id, 10));

    db.query(query, params, (err, result) => {
        if (err) return res.status(500).json({ message: 'Error al actualizar' });
        res.json({ success: true, message: 'Perfil actualizado correctamente' });
    });
});

app.get('/servicios', (req, res) => {
    const { id_barbero } = req.query;
    if (!id_barbero || id_barbero === 'null' || id_barbero === 'undefined') return res.json([]);

    const query = `
        SELECT s.*, img.url_imagen FROM tabla_servicios s
        LEFT JOIN tabla_imagenes img ON s.id_servicio = img.id_servicio
        WHERE s.id_barbero = ?
    `;
    db.query(query, [parseInt(id_barbero, 10)], (err, results) => {
        if (err) return res.status(500).json({ message: "Error al obtener servicios" });
        res.json(results);
    });
});

app.get('/publicaciones', (req, res) => {
    const { id_barbero } = req.query;
    const baseQuery = `
        SELECT p.id_post, p.id_barbero, p.id_servicio, p.descripcion_post, p.fecha_publicacion,
               s.nombre_servicio, b.nombre AS nombre_barbero,
               COALESCE(post_img.url_imagen, servicio_img.url_imagen) AS url_imagen
        FROM tabla_barbero_servicios p
        LEFT JOIN tabla_servicios s ON p.id_servicio = s.id_servicio
        LEFT JOIN tabla_usuarios b ON p.id_barbero = b.id_user
        LEFT JOIN tabla_imagenes post_img ON p.id_servicio = post_img.id_servicio
        LEFT JOIN tabla_imagenes servicio_img ON s.id_servicio = servicio_img.id_servicio
    `;

    if (!id_barbero || id_barbero === 'null' || id_barbero === 'undefined') {
        db.query(`${baseQuery} ORDER BY p.fecha_publicacion DESC`, (err, results) => {
            if (err) return res.status(500).json({ message: 'Error al obtener publicaciones' });
            return res.json(results);
        });
        return;
    }

    db.query(`${baseQuery} WHERE p.id_barbero = ? ORDER BY p.fecha_publicacion DESC`, [parseInt(id_barbero, 10)], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error al obtener publicaciones' });
        res.json(results);
    });
});

app.post('/servicios', upload.single('imagen'), (req, res) => {
    const { id_barbero, nombre_servicio, descripcion, precio, duracion_min } = req.body;
    if (!id_barbero) return res.status(400).json({ message: 'id_barbero es requerido' });

    const queryServicio = `
        INSERT INTO tabla_servicios (id_barbero, nombre_servicio, descripcion, precio, duracion_min) 
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(queryServicio, [parseInt(id_barbero, 10), nombre_servicio, descripcion, parseFloat(precio).toFixed(2), parseInt(duracion_min, 10)], (err, result) => {
        if (err) return res.status(500).json({ message: "Error interno en MySQL" });

        const id_servicio = result.insertId;
        if (req.file) {
            const url_imagen = req.file.path; 
            db.query('INSERT INTO tabla_imagenes (id_servicio, url_imagen) VALUES (?, ?)', [id_servicio, url_imagen], (imgErr) => {
                return res.json({ success: true, message: "Servicio e imagen creados", id_servicio });
            });
        } else {
            return res.json({ success: true, message: "Servicio creado sin imagen", id_servicio });
        }
    });
});

app.post('/publicaciones', (req, res) => {
    const { id_barbero, id_servicio, descripcion_post } = req.body;
    const query = `INSERT INTO tabla_barbero_servicios (id_barbero, id_servicio, descripcion_post) VALUES (?, ?, ?)`;
    db.query(query, [parseInt(id_barbero, 10), parseInt(id_servicio, 10), descripcion_post], (err, result) => {
        if (err) return res.status(500).json({ message: "Error en el servidor" });
        res.json({ success: true, message: "Publicación creada con éxito", id_post: result.insertId });
    });
});

app.delete('/servicios/:id', (req, res) => {
    let { id } = req.params;
    db.query('DELETE FROM tabla_servicios WHERE id_servicio = ?', [id.split(':')[0]], (err, result) => {
        if (err) return res.status(500).json({ message: "Error de restricción" });
        return res.json({ success: true, message: "Servicio eliminado" });
    });
});

app.delete('/publicaciones/:id', (req, res) => {
    let { id } = req.params;
    db.query('DELETE FROM tabla_barbero_servicios WHERE id_post = ?', [id.split(':')[0]], (err, result) => {
        if (err) return res.status(500).json({ message: "Error al eliminar" });
        return res.json({ success: true, message: "Publicación eliminada" });
    });
});

const cron = require('node-cron');
const twilio = require('twilio');

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

cron.schedule('* * * * *', () => {
    console.log('\n=== [CRON] CONTROL DE CITAS ACTIVO (PROD) ===');

    const ahoraUTC = new Date();
    
    const inicioRango = new Date(ahoraUTC.getTime() + 23 * 60 * 60 * 1000);
    const finRango = new Date(ahoraUTC.getTime() + 25 * 60 * 60 * 1000);

    const inicioISO = inicioRango.toISOString().slice(0, 19).replace('T', ' ');
    const finISO = finRango.toISOString().slice(0, 19).replace('T', ' ');

    console.log(` -> Ventana de escaneo: ${inicioISO} UTC a ${finISO} UTC`);

    const query = `
        SELECT 
            c.id_cita, 
            c.fecha_hora,
            cli.nombre AS nombre_cliente, 
            cli.telefono AS tel_cliente,
            bar.nombre AS nombre_barbero,
            bar.telefono AS tel_barbero
        FROM tabla_citas c
        JOIN tabla_usuarios cli ON c.id_cliente = cli.id_user
        JOIN tabla_usuarios bar ON c.id_barbero = bar.id_user
        WHERE c.estado = 'pendiente'
          AND c.fecha_hora BETWEEN ? AND ?
          AND c.ultimo_recordatorio IS NULL
    `;

    db.query(query, [inicioISO, finISO], (err, citas) => {
        if (err) {
            console.error(' -> [CRON ERROR] Error en base de datos:', err);
            return;
        }

        if (citas.length === 0) {
            console.log(' -> Sin eventos próximos en este ciclo.');
            return;
        }

        citas.forEach(cita => {
            console.log(` -> Evento entrante. ID Cita: ${cita.id_cita}.`);

            const horaLegible = new Date(cita.fecha_hora).toLocaleTimeString('es-MX', {
                timeZone: 'America/Mexico_City',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            const mensajeCliente = `Hola ${cita.nombre_cliente}, te recordamos tu cita en la Barbería mañana a las ${horaLegible}. ¡Te esperamos!`;
            const mensajeBarbero = `Hola ${cita.nombre_barbero}, te recordamos que mañana tienes una cita programada con el cliente ${cita.nombre_cliente} a las ${horaLegible}.`;

            enviarMensajeWhatsApp(cita.tel_cliente, mensajeCliente, 'cliente');
            enviarMensajeWhatsApp(cita.tel_barbero, mensajeBarbero, 'barbero');

            db.query('UPDATE tabla_citas SET ultimo_recordatorio = NOW() WHERE id_cita = ?', [cita.id_cita], (updErr) => {
                if (updErr) console.error(` -> [ERROR DB] Error al bloquear recordatorio duplicado:`, updErr);
            });
        });
    });
});

function enviarMensajeWhatsApp(telefono, mensaje, tipo = 'desconocido') {
    if (!telefono) {
        console.error(` -> [Twilio REJECT] Teléfono vacío para ${tipo}. Mensaje: ${mensaje}`);
        return;
    }

    const originalTelefonos = telefono;
    let limpio = telefono.toString().replace(/[^0-9]/g, '');

    console.log(` -> [Twilio DEBUG] Preparando envío WhatsApp (${tipo}).`, {
        tipo,
        telefono_original: originalTelefonos,
        telefono_sin_numeros: limpio,
        mensaje
    });

    if (limpio.length === 13 && limpio.startsWith('521')) {
        limpio = limpio.substring(3); 
    } else if (limpio.length === 12 && limpio.startsWith('52')) {
        limpio = limpio.substring(2); 
    }

    if (limpio.length === 10) {
        limpio = `+52${limpio}`;
    } else if (limpio.length > 10 && !limpio.startsWith('+')) {
        limpio = `+${limpio}`;
    } else if (limpio.length === 0) {
        console.error(` -> [Twilio REJECT] El número queda vacío después de limpiar: ${originalTelefonos}`);
        return;
    } else {
        console.error(` -> [Twilio REJECT] El número no tiene una estructura válida (mide ${limpio.length} dígitos): ${originalTelefonos}`);
        return;
    }

    const stringDestino = `whatsapp:${limpio}`;
    console.log(` -> Despachando WhatsApp hacia: ${stringDestino} (tipo: ${tipo})`);

    twilioClient.messages.create({
        body: mensaje,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: stringDestino
    })
        .then(message => {
            console.log(` -> [Twilio SUCCESS] Notificación enviada. SID: ${message.sid}`);
        })
        .catch(error => {
            console.error(` -> [Twilio ERROR] No se pudo entregar a ${stringDestino}. Motivo:`, error.message);
        });
}

initTransporter().catch(console.error);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`SERVIDOR ESCUCHANDO EN EL PUERTO ${port}`));