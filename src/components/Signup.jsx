// components/Signup.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'cliente'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const signupImageUrl = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    const { name, email, phone, password, role } = formData;
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setError('Todos los campos son obligatorios');
      return;
    }
    
    // Validar formato de teléfono (mínimo 10 dígitos)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setError('El teléfono debe tener al menos 10 dígitos');
      return;
    }
    
    if (password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return;
    }
    
    setIsLoading(true);
    try {
      await signup(name, email, phone, password, role);
      setSuccessMsg('¡Cuenta creada con éxito! Redirigiendo al inicio de sesión...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-image" style={{ backgroundImage: `url(${signupImageUrl})` }}>
        <div className="image-overlay">
          <h2>Únete a la Experiencia Editorial</h2>
          <p>Un espacio donde el cuidado personal se encuentra con el diseño contemporáneo. Crea tu cuenta para gestionar tus citas.</p>
        </div>
      </div>
      
      <div className="auth-form">
        <h1>Nueva Cuenta</h1>
        <p className="subtitle">Selecciona tu rol y crea tu cuenta.</p>
        
        <div className="role-selector">
          <button 
            type="button"
            className={`role-btn ${formData.role === 'cliente' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, role: 'cliente'})}
          >
            Soy Cliente
          </button>
          <button 
            type="button"
            className={`role-btn ${formData.role === 'barbero' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, role: 'barbero'})}
          >
            Soy Barbero
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {successMsg && <div className="error-message" style={{ background: '#e6f7e6', color: '#2b6e3c', borderLeftColor: '#2b6e3c' }}>{successMsg}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>NOMBRE COMPLETO</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej. Julian Casablancas"
              required
            />
          </div>
          
          <div className="input-group">
            <label>CORREO ELECTRÓNICO</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.mx"
              required
            />
          </div>
          
          <div className="input-group">
            <label>TELÉFONO</label>
            <input 
              type="tel" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+52 (55) 0000 0000"
              required
            />
          </div>
          
          <div className="input-group">
            <label>CONTRASEÑA</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="********"
              required
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Creando cuenta...' : `Crear Cuenta como ${formData.role === 'barbero' ? 'Barbero' : 'Cliente'} →`}
          </button>
        </form>
        
        <div className="auth-footer">
          ¿Ya eres cliente? <Link to="/login">Iniciar Sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;