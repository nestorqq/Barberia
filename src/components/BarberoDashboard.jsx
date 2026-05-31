// src/components/BarberoDashboard.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  obtenerCitas, 
  obtenerServicios, 
  obtenerPublicaciones, 
  crearServicio, 
  crearPublicacion,
  eliminarServicio,
  eliminarPublicacion,
  actualizarEstadoCita
} from '../api/dashboardApi';

const BarberoDashboard = () => {
  const [imageFile, setImageFile] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [serviceForm, setServiceForm] = useState({ nombre_servicio: '', descripcion: '', precio: '', duracion_min: '' });
  const [postForm, setPostForm] = useState({ id_servicio: '', descripcion_post: '' });
  const [savingService, setSavingService] = useState(false);
  const [savingPost, setSavingPost] = useState(false);

  const loadData = useCallback(async () => {
    if (!user || !user.id) return;

    const barberoId = user.id;

    try {
      setLoading(true);
      const [appointmentsData, servicesData, postsData] = await Promise.all([
        obtenerCitas('barbero', barberoId),
        obtenerServicios(barberoId),
        obtenerPublicaciones(barberoId)
      ]);
      setAppointments(appointmentsData || []);
      setServices((servicesData || []).filter((service) => !service.id_barbero || Number(service.id_barbero) === Number(barberoId)));
      setPosts((postsData || []).filter((post) => Number(post.id_barbero) === Number(barberoId)));
      setError(null);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la información. Revisa el servidor.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user, loadData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleServiceChange = (e) => {
    const { name, value } = e.target;
    setServiceForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePostChange = (e) => {
    const { name, value } = e.target;
    setPostForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setSavingService(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await crearServicio(
        user.id,
        serviceForm.nombre_servicio,
        serviceForm.descripcion,
        Number(serviceForm.precio),
        Number(serviceForm.duracion_min),
        imageFile
      );

      if (response.success || response.id_servicio) {
        setServiceForm({ nombre_servicio: '', descripcion: '', precio: '', duracion_min: '' });
        setImageFile(null);
        
        const fileInput = document.getElementById('service-image-input');
        if (fileInput) fileInput.value = '';

        setSuccess('Servicio creado correctamente con su imagen.');
        setTimeout(() => setSuccess(null), 4000);
        await loadData();
      } else {
        setError(response.message || 'El servidor rechazó el guardado.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor para crear el servicio.');
    } finally {
      setSavingService(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!user?.id || !postForm.id_servicio) return;
    setSavingPost(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await crearPublicacion(user.id, Number(postForm.id_servicio), postForm.descripcion_post);
      if (response.success || response.id_post) {
        setPostForm({ id_servicio: '', descripcion_post: '' });
        setSuccess('Publicación creada correctamente.');
        setTimeout(() => setSuccess(null), 4000);
        await loadData();
      } else {
        setError(response.message || 'No se pudo crear la publicación.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al crear la publicación.');
    } finally {
      setSavingPost(false);
    }
  };

  const handleDeleteService = async (id_servicio) => {
    if (!id_servicio) return;
    if (!window.confirm('¿Seguro que deseas eliminar este servicio? Se borrarán las publicaciones e imágenes asociadas.')) return;
    setError(null);
    setSuccess(null);
    try {
      const response = await eliminarServicio(id_servicio);
      if (response.success) {
        setSuccess('Servicio eliminado correctamente de la base de datos.');
        setTimeout(() => setSuccess(null), 4000);
        await loadData();
      } else {
        setError(response.message || 'No se pudo eliminar el servicio.');
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo eliminar. El servicio puede estar asignado a una cita activa.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleDeletePost = async (id_post) => {
    if (!id_post) return;
    if (!window.confirm('¿Seguro que deseas eliminar esta publicación?')) return;
    setError(null);
    setSuccess(null);
    try {
      const response = await eliminarPublicacion(id_post);
      if (response.success) {
        setSuccess('Publicación eliminada correctamente.');
        setTimeout(() => setSuccess(null), 4000);
        await loadData();
      } else {
        setError(response.message || 'No se pudo eliminar la publicación.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al eliminar la publicación.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleAceptarCita = async (id_cita) => {
    if (!id_cita) return;
    setError(null);
    setSuccess(null);
    try {
      await actualizarEstadoCita(id_cita, 'confirmada');
      setSuccess('Cita confirmada correctamente.');
      setTimeout(() => setSuccess(null), 4000);
      await loadData();
    } catch (err) {
      console.error('Error al aceptar cita:', err);
      setError(err.message || 'No se pudo confirmar la cita. Intenta nuevamente.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleCancelarCita = async (id_cita) => {
    if (!id_cita) return;
    if (!window.confirm('¿Deseas cancelar esta cita? Esta acción actualizará el estado a cancelada.')) return;
    setError(null);
    setSuccess(null);
    try {
      await actualizarEstadoCita(id_cita, 'cancelada');
      setSuccess('Cita cancelada correctamente.');
      setTimeout(() => setSuccess(null), 4000);
      await loadData();
    } catch (err) {
      console.error('Error al cancelar cita:', err);
      setError(err.message || 'No se pudo cancelar la cita. Intenta nuevamente.');
      setTimeout(() => setError(null), 4000);
    }
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">Panel Barbero/Admin</p>
          <h1>Hola {user?.name || 'barbero'}</h1>
          <p className="dashboard-subtitle">Gestiona servicios, citas y publicaciones desde aquí.</p>
        </div>
        <button onClick={handleLogout} className="btn-logout">Cerrar sesión</button>
      </header>

      {error && <div className="dashboard-error" style={{background: '#fde8e8', color: '#9b1c1c', padding: '12px', borderRadius: '8px', marginBottom: '15px', fontWeight: '500'}}>{error}</div>}
      {success && <div className="dashboard-success" style={{background: '#def7ec', color: '#03543f', padding: '12px', borderRadius: '8px', marginBottom: '15px', fontWeight: '500'}}>{success}</div>}

      <section className="dashboard-cards">
        <article className="dashboard-card">
          <h3>Tu perfil</h3>
          <p><strong>Nombre:</strong> {user?.name || '-'}</p>
          <p><strong>ID:</strong> {user?.id || '-'}</p>
          <p><strong>Rol:</strong> {user?.rol || 'barbero'}</p>
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
          ) : appointments.length === 0 ? (
            <p>No hay citas registradas.</p>
          ) : (
            <div className="appointments-list">
              {appointments.map((appointment) => (
                <div key={appointment.id_cita || appointment.id} className="appointment-item">
                  <h4>{appointment.nombre_servicio || 'Servicio'}</h4>
                  <p>{appointment.fecha_hora || 'Horario pendiente'}</p>
                  <span className={`status-pill status-${(appointment.estado || 'pendiente').toLowerCase()}`}>{appointment.estado || 'pendiente'}</span>
                  <p className="appointment-meta"><strong>Cliente:</strong> {appointment.nombre_cliente || 'Desconocido'}</p>
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '0.9rem' }}>
                    {appointment.estado === 'pendiente' && (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '0.65rem 1rem', fontSize: '0.95rem' }}
                        onClick={() => handleAceptarCita(appointment.id_cita || appointment.id)}
                      >
                        Confirmar cita
                      </button>
                    )}
                    {appointment.estado !== 'cancelada' && (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '0.65rem 1rem', fontSize: '0.95rem', background: '#9b1c1c', borderColor: '#7f1d1d' }}
                        onClick={() => handleCancelarCita(appointment.id_cita || appointment.id)}
                      >
                        Cancelar cita
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-panel">
          <h2>Servicios activos</h2>
          {loading ? (
            <p>Cargando servicios...</p>
          ) : services.length === 0 ? (
            <p>No hay servicios registrados.</p>
          ) : (
            <div className="appointments-list">
              {services.map((service) => (
                <div key={`serv-panel-${service.id_servicio}`} className="appointment-item" style={{position: 'relative'}}>
                  <button 
                    onClick={() => handleDeleteService(service.id_servicio)}
                    style={{position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#9b1c1c', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', zIndex: 10}}
                    title="Eliminar servicio"
                  >
                    ×
                  </button>

                  {service.url_imagen && (
                    <img 
                      src={service.url_imagen} 
                      alt={service.nombre_servicio} 
                      style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px', display: 'block' }} 
                    />
                  )}

                  <h4>{service.nombre_servicio}</h4>
                  <p style={{paddingRight: '20px', color: '#666', fontSize: '14px'}}>{service.descripcion || 'Sin descripción'}</p>
                  <p style={{marginTop: '8px'}}><strong>{service.precio} MXN</strong></p>
                  <p style={{color: '#888', fontSize: '13px'}}>{service.duracion_min} minutos</p>
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
        ) : posts.length === 0 ? (
          <p>No hay publicaciones aún.</p>
        ) : (
          <div className="appointments-list" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px'}}>
            {posts.map((post) => (
                <div key={`post-${post.id_post}`} className="appointment-item" style={{ position: 'relative' }}>
                  <button 
                    onClick={() => handleDeletePost(post.id_post)}
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#9b1c1c', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', zIndex: 10 }}
                    title="Eliminar publicación"
                  >
                    ×
                  </button>

                  {(post.url_imagen || post.imagen || post.servicio_imagen) && (
                    <img src={post.url_imagen || post.imagen || post.servicio_imagen} alt="Servicio publicado" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px', display: 'block' }} />
                  )}

                  <h4>Servicio ID {post.id_servicio}</h4>
                  <p style={{ paddingRight: '20px', color: '#444' }}>{post.descripcion_post}</p>
                  <p className="appointment-meta" style={{ marginTop: '8px' }}><strong>Barbero ID:</strong> {post.id_barbero}</p>
                </div>
              ))}
          </div>
        )}
      </section>

      <section className="dashboard-panel dashboard-form-section">
        <div className="dashboard-form-card">
          <h2>Agregar servicio</h2>
          <form onSubmit={handleCreateService}>
            <label>
              Nombre del servicio
              <input name="nombre_servicio" value={serviceForm.nombre_servicio} onChange={handleServiceChange} required />
            </label>
            <label>
              Descripción
              <textarea name="descripcion" value={serviceForm.descripcion} onChange={handleServiceChange} required />
            </label>
            <label>
              Precio (MXN)
              <input name="precio" type="number" value={serviceForm.precio} onChange={handleServiceChange} required />
            </label>
            <label>
              Duración (min)
              <input name="duracion_min" type="number" value={serviceForm.duracion_min} onChange={handleServiceChange} required />
            </label>
            <label>
              Imagen del servicio
              <input 
                id="service-image-input"
                type="file" 
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                style={{ marginTop: '5px', display: 'block' }}
              />
            </label>
            <button type="submit" disabled={savingService}>
              {savingService ? 'Guardando...' : 'Crear servicio'}
            </button>
          </form>
        </div>

        <div className="dashboard-form-card">
          <h2>Crear publicación</h2>
          <form onSubmit={handleCreatePost}>
            <label>
              Seleccionar servicio
              <select name="id_servicio" value={postForm.id_servicio} onChange={handlePostChange} required>
                <option value="">Selecciona un servicio</option>
                {services.map((service) => (
                  <option key={`opt-${service.id_servicio}`} value={service.id_servicio}>
                    {service.nombre_servicio}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Descripción de la publicación
              <textarea name="descripcion_post" value={postForm.descripcion_post} onChange={handlePostChange} required />
            </label>
            <button type="submit" disabled={savingPost || services.length === 0}>
              {savingPost ? 'Guardando...' : 'Crear publicación'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default BarberoDashboard;