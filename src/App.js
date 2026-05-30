import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import BarberoDashboard from './components/BarberoDashboard';
import ReservarServicio from './components/BookService';
import Historial from './components/History';
import EditarPerfil from './components/EditProfile';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/reservar" element={
              <PrivateRoute>
                <ReservarServicio />
              </PrivateRoute>
            } />
            <Route path="/historial" element={
              <PrivateRoute>
                <Historial />
              </PrivateRoute>
            } />
            <Route path="/perfil" element={
              <PrivateRoute>
                <EditarPerfil />
              </PrivateRoute>
            } />

            <Route path="/barbero-dashboard" element={
              <PrivateRoute>
                <BarberoDashboard />
              </PrivateRoute>
            } />

            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;