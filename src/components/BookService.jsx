import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reservarCita, obtenerBarberos, obtenerServicios } from '../api/dashboardApi';
import PaymentModal from './PaymentModal';

const ReservarServicio = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [barberos, setBarberos] = useState([]);
  const [barberoSeleccionadoId, setBarberoSeleccionadoId] = useState('');
  const [servicios, setServicios] = useState([]);
  const [servicioSeleccionadoId, setServicioSeleccionadoId] = useState('');
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [cargando, setCargando] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const horasDisponibles = [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00'
  ];

  useEffect(() => {
    const cargarBarberos = async () => {
      try {
        const datos = await obtenerBarberos();
        setBarberos(datos || []);
      } catch (err) {
        console.error('Error al cargar barberos:', err);
        setError('No se pudieron cargar los barberos. Intenta más tarde.');
      }
    };

    cargarBarberos();
  }, []);

  useEffect(() => {
    const cargarServicios = async () => {
      if (!barberoSeleccionadoId) {
        setServicios([]);
        return;
      }

      try {
        const datos = await obtenerServicios(barberoSeleccionadoId);
        setServicios(datos || []);
      } catch (err) {
        console.error('Error al cargar servicios:', err);
        setError('No se pudieron cargar los servicios del barbero.');
      }
    };

    cargarServicios();
  }, [barberoSeleccionadoId]);

  useEffect(() => {
    if (servicioSeleccionadoId) {
      const encontrado = servicios.find(
        s => (s.id_servicio || s.id) === parseInt(servicioSeleccionadoId)
      );
      setServicioSeleccionado(encontrado || null);
    } else {
      setServicioSeleccionado(null);
    }
  }, [servicioSeleccionadoId, servicios]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    setExito('');

    if (!barberoSeleccionadoId || !servicioSeleccionadoId || !fechaSeleccionada || !horaSeleccionada) {
      setError('Selecciona un barbero, servicio, fecha y hora antes de reservar.');
      return;
    }

    if (!servicioSeleccionado) {
      setError('Servicio no encontrado. Intenta de nuevo.');
      return;
    }

    setShowPayment(true);
  };

  const handlePaymentSuccess = async (txnId) => {
    setShowPayment(false);
    setCargando(true);

    try {
      const fecha_hora = `${fechaSeleccionada} ${horaSeleccionada}:00`;
      const precio = parseFloat(servicioSeleccionado.precio || servicioSeleccionado.precio_servicio || 0);

      await reservarCita({
        id_cliente: user.id,
        id_barbero: barberoSeleccionadoId,
        id_servicio: servicioSeleccionadoId,
        fecha_hora,
        nota,
        estado: 'pendiente',
        monto: precio,
        payment_intent_id: txnId,
        payment_status: 'completed'
      });

      setExito('Reserva creada con éxito. Revisa tu historial para ver los detalles.');
      setServicioSeleccionadoId('');
      setServicioSeleccionado(null);
      setFechaSeleccionada('');
      setHoraSeleccionada('');
      setNota('');
    } catch (err) {
      console.error('Error al reservar cita:', err);
      setError('No se pudo completar la reserva. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">Reservar cita</p>
          <h1>Reserva tu próximo servicio</h1>
          <p className="dashboard-subtitle">Encuentra un barbero disponible, elige el servicio y fija tu cita en minutos.</p>
        </div>
        <button type="button" className="btn-logout" onClick={() => navigate(-1)}>
          Volver
        </button>
      </header>

      <section className="dashboard-form-card">
        <h2>Datos de la reserva</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="dashboard-error">{error}</div>}
          {exito && <div className="dashboard-success">{exito}</div>}

          <label>
            Seleccionar barbero
            <select
              value={barberoSeleccionadoId}
              onChange={(e) => {
                setBarberoSeleccionadoId(e.target.value);
                setServicioSeleccionadoId('');
              }}
            >
              <option value="">Selecciona un barbero</option>
              {barberos.map((barbero) => (
                <option key={barbero.id_user || barbero.id} value={barbero.id_user || barbero.id}>
                  {barbero.nombre || barbero.name} - {barbero.email || barbero.correo}
                </option>
              ))}
            </select>
          </label>

          <label>
            Seleccionar servicio
            <select
              value={servicioSeleccionadoId}
              onChange={(e) => setServicioSeleccionadoId(e.target.value)}
              disabled={!barberoSeleccionadoId}
            >
              <option value="">Selecciona un servicio</option>
              {servicios.map((servicio) => (
                <option key={servicio.id_servicio || servicio.id} value={servicio.id_servicio || servicio.id}>
                  {servicio.nombre_servicio} — ${parseFloat(servicio.precio || servicio.precio_servicio).toFixed(2)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Seleccionar fecha
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </label>

          <div className="time-selector-block">
            <p className="time-selector-label">Seleccionar hora</p>
            <div className="time-slider">
              {horasDisponibles.map((hora) => (
                <button
                  key={hora}
                  type="button"
                  className={`time-pill ${horaSeleccionada === hora ? 'selected' : ''}`}
                  onClick={() => setHoraSeleccionada(hora)}
                >
                  {hora}
                </button>
              ))}
            </div>
            {horaSeleccionada && <p className="selected-time">Hora elegida: {horaSeleccionada}</p>}
          </div>

          <label>
            Nota adicional
            <textarea
              placeholder="Si tienes instrucciones o preferencias, escríbelas aquí"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
          </label>

          {servicioSeleccionado && (
            <div className="payment-summary">
              <p className="payment-summary-label">Total a pagar:</p>
              <p className="payment-summary-amount">
                ${parseFloat(servicioSeleccionado.precio || servicioSeleccionado.precio_servicio || 0).toFixed(2)}
              </p>
            </div>
          )}

          <button type="submit" disabled={cargando || !servicioSeleccionado}>
            {cargando
              ? 'Guardando reserva...'
              : servicioSeleccionado
                ? `Reservar y pagar — $${parseFloat(servicioSeleccionado.precio || servicioSeleccionado.precio_servicio || 0).toFixed(2)}`
                : 'Selecciona un servicio'
            }
          </button>
        </form>
      </section>

      {showPayment && servicioSeleccionado && (
        <PaymentModal
          monto={parseFloat(servicioSeleccionado.precio || servicioSeleccionado.precio_servicio || 0)}
          nombreServicio={servicioSeleccionado.nombre_servicio}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
};

export default ReservarServicio;
