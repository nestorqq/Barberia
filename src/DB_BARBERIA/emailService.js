const nodemailer = require('nodemailer');

let transporter = null;
let testUrl = null;

const initTransporter = async () => {
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
    console.log('\n==========================================');
    console.log('[EMAIL] Usando Gmail SMTP');
    console.log(`  User: ${process.env.GMAIL_USER}`);
    console.log('==========================================\n');
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    testUrl = `https://ethereal.email/login?user=${testAccount.user}`;
    console.log('\n==========================================');
    console.log('[EMAIL] CORREOS DE PRUEBA (Ethereal)');
    console.log('==========================================');
    console.log(`  User: ${testAccount.user}`);
    console.log(`  Pass: ${testAccount.pass}`);
    console.log(`  Ver correos: ${testUrl}`);
    console.log('==========================================\n');
  }
  return transporter;
};

const getTransporter = () => {
  if (!transporter) throw new Error('Email transporter not initialized');
  return transporter;
};

const formatDate = (fecha_hora) => {
  const d = new Date(fecha_hora);
  return d.toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const sendConfirmationToClient = async (clienteEmail, clienteNombre, datos) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #1a1a2e; margin: 0;">✂️ Barbería</h1>
        <p style="color: #666; margin: 4px 0 0;">Reserva confirmada</p>
      </div>
      <p style="font-size: 16px; color: #333;">Hola <strong>${clienteNombre}</strong>,</p>
      <p style="color: #333;">Tu reserva ha sido confirmada y el pago procesado exitosamente.</p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #666;">Servicio</td><td style="padding: 6px 0; font-weight: bold;">${datos.nombre_servicio}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Barbero</td><td style="padding: 6px 0; font-weight: bold;">${datos.nombre_barbero}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Fecha y hora</td><td style="padding: 6px 0; font-weight: bold;">${formatDate(datos.fecha_hora)}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Monto pagado</td><td style="padding: 6px 0; font-weight: bold; color: #27ae60;">$${parseFloat(datos.monto).toFixed(2)}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">ID de transacción</td><td style="padding: 6px 0; font-size: 13px; color: #888;">${datos.payment_intent_id}</td></tr>
        </table>
      </div>
      <div style="background: #e8f5e9; border-radius: 8px; padding: 12px; margin: 16px 0; text-align: center;">
        <span style="color: #27ae60; font-weight: bold;">✅ Pago confirmado</span>
      </div>
      <p style="color: #999; font-size: 13px; text-align: center; margin-top: 24px;">
        Este es un correo automatizado. Por favor no responder.<br>
        Barbería — Proyecto escolar
      </p>
    </div>
  `;

  const fromEmail = process.env.GMAIL_USER || 'no-reply@barberia.edu';
  const info = await transporter.sendMail({
    from: `"Barbería" <${fromEmail}>`,
    to: clienteEmail,
    subject: 'Reserva confirmada - Barberia',
    html,
  });

  if (testUrl) {
    console.log(`\n[EMAIL] Correo enviado a CLIENTE (${clienteEmail}):`);
    console.log(`   Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  } else {
    console.log(`[EMAIL] Correo enviado a CLIENTE (${clienteEmail})`);
  }
};

const sendConfirmationToBarbero = async (barberoEmail, barberoNombre, datos) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #1a1a2e; margin: 0;">📅 Nueva cita</h1>
        <p style="color: #666; margin: 4px 0 0;">Tienes una nueva reserva</p>
      </div>
      <p style="font-size: 16px; color: #333;">Hola <strong>${barberoNombre}</strong>,</p>
      <p style="color: #333;">Se ha registrado una nueva cita en tu agenda.</p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #666;">Cliente</td><td style="padding: 6px 0; font-weight: bold;">${datos.nombre_cliente}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Servicio</td><td style="padding: 6px 0; font-weight: bold;">${datos.nombre_servicio}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Fecha y hora</td><td style="padding: 6px 0; font-weight: bold;">${formatDate(datos.fecha_hora)}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Monto</td><td style="padding: 6px 0; font-weight: bold;">$${parseFloat(datos.monto).toFixed(2)}</td></tr>
          ${datos.nota ? `<tr><td style="padding: 6px 0; color: #666;">Nota</td><td style="padding: 6px 0;">${datos.nota}</td></tr>` : ''}
        </table>
      </div>
      <p style="color: #999; font-size: 13px; text-align: center; margin-top: 24px;">
        Barbería — Proyecto escolar
      </p>
    </div>
  `;

  const fromEmail = process.env.GMAIL_USER || 'no-reply@barberia.edu';
  const info = await transporter.sendMail({
    from: `"Barbería" <${fromEmail}>`,
    to: barberoEmail,
    subject: 'Nueva cita programada - Barberia',
    html,
  });

  if (testUrl) {
    console.log(`\n[EMAIL] Correo enviado a BARBERO (${barberoEmail}):`);
    console.log(`   Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  } else {
    console.log(`[EMAIL] Correo enviado a BARBERO (${barberoEmail})`);
  }
};

const sendRefundToClient = async (clienteEmail, clienteNombre, datos) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #1a1a2e; margin: 0;">🔄 Reembolso procesado</h1>
        <p style="color: #666; margin: 4px 0 0;">Barbería</p>
      </div>
      <p style="font-size: 16px; color: #333;">Hola <strong>${clienteNombre}</strong>,</p>
      <p style="color: #333;">La cita que tenías agendada ha sido cancelada. El reembolso ya fue procesado.</p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #666;">Servicio</td><td style="padding: 6px 0; font-weight: bold;">${datos.nombre_servicio}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Monto reembolsado</td><td style="padding: 6px 0; font-weight: bold; color: #e67e22;">$${parseFloat(datos.monto).toFixed(2)}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">ID de transacción</td><td style="padding: 6px 0; font-size: 13px; color: #888;">${datos.payment_intent_id}</td></tr>
        </table>
      </div>
      <div style="background: #fef3e2; border-radius: 8px; padding: 12px; margin: 16px 0; text-align: center;">
        <span style="color: #e67e22; font-weight: bold;">🔄 Reembolso procesado — El saldo se reflejará en tu cuenta en un plazo no mayor a 48 horas.</span>
      </div>
      <p style="color: #999; font-size: 13px; text-align: center; margin-top: 24px;">
        Este es un correo automatizado. Por favor no responder.<br>
        Barbería — Proyecto escolar
      </p>
    </div>
  `;

  const fromEmail = process.env.GMAIL_USER || 'no-reply@barberia.edu';
  const info = await transporter.sendMail({
    from: `"Barbería" <${fromEmail}>`,
    to: clienteEmail,
    subject: 'Reembolso procesado - Barberia',
    html,
  });

  if (testUrl) {
    console.log(`\n[EMAIL] Correo de REEMBOLSO enviado a CLIENTE (${clienteEmail}):`);
    console.log(`   Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  } else {
    console.log(`[EMAIL] Correo de REEMBOLSO enviado a CLIENTE (${clienteEmail})`);
  }
};

module.exports = { initTransporter, sendConfirmationToClient, sendConfirmationToBarbero, sendRefundToClient };