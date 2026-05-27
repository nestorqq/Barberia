import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAppointments, getServices, getPosts } from '../api/dashboardApi';

const BarberoDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [appointmentsData, servicesData, postsData] = await Promise.all([
        getAppointments('barbero'),
        getServices(),
        getPosts()
      ]);

      setAppointments(appointmentsData);
      setServices(servicesData);
      setPosts(postsData);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">Panel Barbero/Admin</p>
          <h1>Hola {user?.name || 'Barbero'}</h1>
          <p className="dashboard-subtitle">Gestiona servicios, citas y publicaciones desde aquí.</p>
        </div>
        <button onClick={handleLogout} className="btn-logout">Cerrar sesión</button>
      </header>

      <section className="dashboard-cards">
        <article className="dashboard-card">
          <h3>Tu perfil</h3>
          <p><strong>Nombre:</strong> {user?.name || '-'}</p>
          <p><strong>Email:</strong> {user?.email || '-'}</p>
          <p><strong>Rol:</strong> Barbero / Admin</p>
        </article>

        <article className="dashboard-card dashboard-highlight">
          <h3>Resumen operativo</h3>
          <p>Revisa tu agenda, controla servicios publicados y mantén tu feed de barbería actualizado.</p>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <h2>Agenda de citas</h2>
          {loading ? (
            <p>Cargando agenda...</p>
          ) : (
            <div className="appointments-list">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="appointment-item">
                  <h4>{appointment.service || appointment.title || 'Servicio'}</h4>
                  <p>{appointment.date || appointment.fecha_hora || 'Horario pendiente'}</p>
                  <span className={`status-pill status-${(appointment.status || 'pendiente').toLowerCase()}`}>{appointment.status || 'pendiente'}</span>
                  <p className="appointment-meta"><strong>Cliente:</strong> {appointment.client || appointment.nombre_cliente || 'Desconocido'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-panel">
          <h2>Servicios activos</h2>
          {loading ? (
            <p>Cargando servicios...</p>
          ) : (
            <div className="appointments-list">
              {services.map((service) => (
                <div key={service.id} className="appointment-item">
                  <h4>{service.title || service.nombre_servicio || 'Servicio'}</h4>
                  <p>{service.duration ? `${service.duration} minutos` : `${service.precio || '—'} MXN`}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-panel dashboard-posts">
        <h2>Publicaciones recientes</h2>
        {loading ? (
          <p>Cargando publicaciones...</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="appointment-item">
              <h4>{post.title || post.descripcion_post || 'Nuevo post'}</h4>
              <p>{post.description || post.descripcion_post || ''}</p>
              <p className="appointment-meta"><strong>Fecha:</strong> {post.date || post.fecha_publicacion || 'Sin fecha'}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default BarberoDashboard;
