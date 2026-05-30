import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { actualizarPerfilUsuario } from '../api/dashboardApi';

const EditarPerfil = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: ''
      });
    }
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');
    setStatusMessage('');

    if (!form.name || !form.email || !form.phone) {
      setError('Completa los campos obligatorios antes de guardar.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        nombre: form.name,
        correo: form.email,
        telefono: form.phone
      };

      if (form.password) {
        payload.password = form.password;
      }

      await actualizarPerfilUsuario(user.id, payload);
      updateProfile({ name: form.name, email: form.email, phone: form.phone });
      setStatusMessage('Perfil actualizado correctamente.');
      setForm((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      setError('No se pudo guardar el perfil. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">Editar perfil</p>
          <h1>Actualiza tu información</h1>
          <p className="dashboard-subtitle">Mantén tu perfil al día para recibir mejores recomendaciones y confirmaciones de cita.</p>
        </div>
        <button type="button" className="btn-logout" onClick={() => navigate(-1)}>
          Volver
        </button>
      </header>

      <section className="dashboard-form-card">
        <h2>Información Personal</h2>
        <form onSubmit={handleSave}>
          {error && <div className="dashboard-error">{error}</div>}
          {statusMessage && <div className="dashboard-success">{statusMessage}</div>}

          <label>
            Nombre completo
            <input name="name" value={form.name} onChange={handleChange} type="text" placeholder="Tu nombre" />
          </label>

          <label>
            Correo electrónico
            <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="correo@ejemplo.com" />
          </label>

          <label>
            Teléfono
            <input name="phone" value={form.phone} onChange={handleChange} type="tel" placeholder="(555) 123-4567" />
          </label>

          <label>
            Nueva contraseña
            <input name="password" value={form.password} onChange={handleChange} type="password" placeholder="Dejar en blanco para no cambiar" />
          </label>

          <button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default EditarPerfil;
