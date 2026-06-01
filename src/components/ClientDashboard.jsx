import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerCitas, obtenerPublicaciones } from '../api/dashboardApi';

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const [appointmentsData, postsData] = await Promise.all([
          obtenerCitas('cliente', user?.id),
          obtenerPublicaciones()
        ]);
        setAppointments(appointmentsData || []);
        setPosts(postsData || []);
      } catch (err) {
        console.error('Error al cargar contenido:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadContent();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const goTo = (path) => {
    navigate(path);
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

      <section className="client-dashboard-grid">
        <main className="client-feed-panel">
          <div className="feed-header">
            <div>
              <p className="dashboard-label">Feed de Barbería</p>
              <h2>Explora nuevas publicaciones</h2>
            </div>
            <p className="feed-description">Descubre publicaciones recientes de tus barberos y encuentra inspiración para tu próxima cita.</p>
          </div>

          {loading ? (
            <p>Cargando feed...</p>
          ) : posts.length === 0 ? (
            <p>No hay publicaciones disponibles por ahora.</p>
          ) : (
            <div className="feed-grid">
              {posts.map((post) => (
                  <article key={post.id_post} className="feed-card">
                    <div className="feed-card-image-wrapper">
                      {(post.url_imagen || post.imagen || post.servicio_imagen) ? (
                        <img src={post.url_imagen || post.imagen || post.servicio_imagen} alt={post.nombre_servicio || 'Publicación'} className="feed-card-image" />
                      ) : (
                        <div className="feed-card-placeholder">Sin imagen</div>
                      )}
                    </div>
                    <div className="feed-card-body">
                      <div className="feed-card-meta">
                        <span className="feed-card-user">{post.nombre_barbero || `Barbero #${post.id_barbero || 'N/A'}`}</span>
                        <strong>{post.nombre_servicio || 'Servicio'}</strong>
                      </div>
                      <p className="feed-card-text">{post.descripcion_post || 'Descripción no disponible.'}</p>
                      <div className="feed-card-footer">
                        <span>{new Date(post.fecha_publicacion || Date.now()).toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                  </article>
              ))}
            </div>
          )}
        </main>

        <aside className="client-panel">
          <div className="client-panel-card">
            <h3>Bienvenido, {user?.name || 'Cliente'}</h3>
            <p>Tu panel personal está listo para ayudarte a reservar y revisar tus citas.</p>
          </div>

          <div className="client-panel-card">
            <h3>Próximas citas</h3>
            {loading ? (
              <p>Cargando citas...</p>
            ) : appointments.length === 0 ? (
              <p>No tienes citas agendadas aún.</p>
            ) : (
              <ul className="appointment-summary-list">
                {appointments.slice(0, 3).map((item) => (
                  <li key={item.id_cita || item.id}>
                    <strong>{item.nombre_servicio || item.servicio || 'Servicio'}</strong>
                    <span>{item.fecha_hora || item.fecha || 'Fecha pendiente'}</span>
                    <span className={`status-pill status-${(item.estado || 'pendiente').toLowerCase()}`}>{item.estado || 'Pendiente'}</span>
                    {item.payment_status === 'completed' && item.estado !== 'cancelada' && (
                      <span className="payment-badge payment-badge-paid">✅ Pagado</span>
                    )}
                    {item.payment_status === 'completed' && item.estado === 'cancelada' && (
                      <span className="payment-badge payment-badge-pending">🔄 Reembolso en proceso</span>
                    )}
                    {item.payment_status === 'refunded' && (
                      <span className="payment-badge payment-badge-refunded">🔁 Reembolsado</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="client-panel-card">
            <h3>Acciones rápidas</h3>
            <div className="quick-actions">
              <button type="button" className="action-chip" onClick={() => goTo('/reservar')}>Reservar servicio</button>
              <button type="button" className="action-chip" onClick={() => goTo('/historial')}>Ver historial</button>
              <button type="button" className="action-chip" onClick={() => goTo('/perfil')}>Editar perfil</button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default ClientDashboard;
