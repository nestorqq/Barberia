// components/Dashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleText = () => {
    if (user?.role === 'admin') return 'Administrador / Barbero';
    return 'Cliente';
  };

  return (
    <div className="dashboard-container">
      <div className="welcome-card">
        <h2>¡Bienvenido, {user?.name || 'Usuario'}!</h2>
        <p>Has iniciado sesión como <strong>{getRoleText()}</strong>.</p>
        <p style={{ marginTop: '1rem' }}>Este es tu panel de control. Próximamente podrás gestionar tus citas de barbería.</p>
        <button onClick={handleLogout} className="btn-logout">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default Dashboard;