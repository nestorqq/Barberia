import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerCitas } from '../api/dashboardApi';

const Historial = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await obtenerCitas('cliente', user?.id);
        setAppointments(data || []);
      } catch (err) {
        console.error('Error al cargar historial:', err);
        setError('No se pudo cargar el historial. Intenta más tarde.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadHistory();
    }
  }, [user]);

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">Historial de reservas</p>
          <h1>Tu historial de citas</h1>
          <p className="dashboard-subtitle">Revisa todas tus reservas anteriores y su estado actual.</p>
        </div>
        <button type="button" className="btn-logout" onClick={() => navigate(-1)}>
          Volver
        </button>
      </header>

      <section className="dashboard-form-card">
        <h2>Reservas recientes</h2>
        {error && <div className="dashboard-error">{error}</div>}
        {loading ? (
          <p>Cargando historial...</p>
        ) : appointments.length === 0 ? (
          <p>No hay citas registradas en tu historial.</p>
        ) : (
          <div className="appointments-list">
            {appointments.map((item) => (
              <article key={item.id_cita || item.id} className="appointment-item">
                <div>
                  <h4>{item.nombre_servicio || item.servicio || 'Servicio'}</h4>
                  <p>{item.nombre_barbero ? `Barbero: ${item.nombre_barbero}` : 'Barbero no disponible'}</p>
                </div>
                <div className="appointment-meta">
                  <p>Fecha: {item.fecha_hora || item.fecha || 'Pendiente'}</p>
                  <p>Estado: <span className={`status-pill status-${(item.estado || 'pendiente').toLowerCase()}`}>{item.estado || 'Pendiente'}</span></p>
                  {item.nota && <p>Nota: {item.nota}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Historial;
