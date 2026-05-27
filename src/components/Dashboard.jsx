import React from 'react';
import { useAuth } from '../context/AuthContext';
import BarberoDashboard from './BarberoDashboard';
import ClientDashboard from './ClientDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return <div className="dashboard-page"><p>Cargando usuario...</p></div>;
  }

  const userRolActual = user.role || user.rol;

  console.log('Usuario actual:', user);
  console.log('Rol detectado:', userRolActual);
  console.log('¿Es barbero de verdad?:', userRolActual === 'barbero');

  return userRolActual === 'barbero' ? <BarberoDashboard /> : <ClientDashboard />;
};

export default Dashboard;