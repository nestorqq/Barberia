import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reservarCita, obtenerBarberos, obtenerServicios } from '../api/dashboardApi';

const ReservarServicio = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [barberos, setBarberos] = useState([]);
  const [barberoSeleccionadoId, setBarberoSeleccionadoId] = useState('');
  const [servicios, setServicios] = useState([]);
  const [servicioSeleccionadoId, setServicioSeleccionadoId] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [cargando, setCargando] = useState(false);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setExito('');

    if (!barberoSeleccionadoId || !servicioSeleccionadoId || !fechaHora) {
      setError('Selecciona un barbero, servicio y fecha antes de reservar.');
      return;
    }

    setCargando(true);

    try {
      await reservarCita({
        id_cliente: user.id,
        id_barbero: barberoSeleccionadoId,
        id_servicio: servicioSeleccionadoId,
        fecha_hora: fechaHora,
        nota,
        estado: 'pendiente'
      });

      setExito('Reserva creada con éxito. Revisa tu historial para ver los detalles.');
      setServicioSeleccionadoId('');
      setFechaHora('');
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
                  {servicio.nombre_servicio} - ${servicio.precio || servicio.precio_servicio}
                </option>
              ))}
            </select>
          </label>

          <label>
            Fecha y hora
            <input
              type="datetime-local"
              value={fechaHora}
              onChange={(e) => setFechaHora(e.target.value)}
            />
          </label>

          <label>
            Nota adicional
            <textarea
              placeholder="Si tienes instrucciones o preferencias, escríbelas aquí"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
          </label>

          <button type="submit" disabled={cargando}>
            {cargando ? 'Guardando reserva...' : 'Confirmar reserva'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default ReservarServicio;
