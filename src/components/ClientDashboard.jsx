import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAppointments } from '../api/dashboardApi';

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppointments = async () => {
      const data = await getAppointments('cliente', user?.id);
      setAppointments(data);
      setLoading(false);
    };

    loadAppointments();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">Panel Cliente</p>
          <h1>¡Hola de nuevo, {user?.name || 'Cliente'}!</h1>
          <p className="dashboard-subtitle">Aquí están tus próximas citas y tus acciones recomendadas.</p>
        </div>
        <button onClick={handleLogout} className="btn-logout">Cerrar sesión</button>
      </header>

      <section className="dashboard-cards">
        <article className="dashboard-card">
          <h3>Mi perfil</h3>
          <p><strong>Nombre:</strong> {user?.name || '-'}</p>
          <p><strong>Email:</strong> {user?.email || '-'}</p>
          <p><strong>Rol:</strong> Cliente</p>
        </article>

        <article className="dashboard-card dashboard-highlight">
          <h3>Resumen</h3>
          <p>Accede a tus reservaciones, revisa horarios y mantente actualizado con los mejores servicios.</p>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <h2>Próximas citas</h2>
          {loading ? (
            <p>Cargando citas...</p>
          ) : (
            <div className="appointments-list">
              {appointments.length === 0 ? (
                <p>No tienes citas agendadas aún.</p>
              ) : (
                appointments.map((item) => (
                  <div key={item.id} className="appointment-item">
                    <h4>{item.service}</h4>
                    <p>{item.date}</p>
                    <span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span>
                    <p className="appointment-meta"><strong>Barbero:</strong> {item.barber || 'Asignado pronto'}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="dashboard-panel">
          <h2>Acciones rápidas</h2>
          <div className="quick-actions">
            <button type="button" className="action-chip">Reservar servicio</button>
            <button type="button" className="action-chip">Ver historial</button>
            <button type="button" className="action-chip">Editar perfil</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ClientDashboard;
