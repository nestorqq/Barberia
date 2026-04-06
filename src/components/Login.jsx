// components/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';


const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('cliente'); 
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email, 
          password: password, 
          userType: userType 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        
        throw new Error(data.message || 'Error al entrar');
      }

      localStorage.setItem('usuario', JSON.stringify(data.user));
      
      alert("¡Bienvenido " + data.user.nombre + "!");
      navigate('/dashboard');

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-image">
        <img 
          src="https://images.unsplash.com/photo-1503951914875-3c4e35c0a5b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
          alt="Barbería Editorial"
        />
        <div className="image-overlay">
          <h2>Redefiniendo el Arte de la Barbería.</h2>
          <p>Experimenta el estándar editorial en cuidado personal masculino. Un espacio diseñado para el hombre moderno.</p>
        </div>
      </div>
      
      <div className="auth-form">
        <h1>The Editorial Barber</h1>
        <p className="subtitle">Iniciar Sesión · Selecciona tu tipo de acceso</p>
        
        <div className="role-selector">
          <button 
            type="button"
            className={`role-btn ${userType === 'cliente' ? 'active' : ''}`}
            onClick={() => setUserType('cliente')}
          >
            Acceso Cliente
          </button>
          <button 
            type="button"
            className={`role-btn ${userType === 'barbero' ? 'active' : ''}`}
            onClick={() => setUserType('barbero')}
          >
            Acceso Barbero/Admin
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>CORREO ELECTRÓNICO</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@editorial.com"
              required
            />
          </div>
          
          <div className="input-group">
            <div className="password-header">
              <label>CONTRASEÑA</label>
              <a href="#" className="forgot-link" onClick={(e) => e.preventDefault()}>¿OLVIDASTE TU CONTRASEÑA?</a>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="remember-group">
            <input 
              type="checkbox" 
              id="remember" 
             // checked={rememberMe}
              //onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember">Mantener sesión iniciada</label>
          </div>
          
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Ingresando...' : 'Entrar a la Experiencia'}
          </button>
        </form>
        
        <div className="auth-footer">
          ¿Aún no tienes cuenta? <Link to="/signup">Crear Cuenta de Cliente</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;