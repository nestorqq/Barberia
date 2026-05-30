// src/api/dashboardApi.js
const BASE_URL = 'http://127.0.0.1:5000';

// Auxiliar para peticiones GET estandarizadas
const fetchJson = async (url) => {
  const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};



export const obtenerCitas = async (role, userId) => {
  if (role === 'barbero' && userId) {
    return await fetchJson(`${BASE_URL}/citas?id_barbero=${userId}`);
  }
  if (role === 'barbero') {
    return await fetchJson(`${BASE_URL}/citas`);
  }
  if (userId) return await fetchJson(`${BASE_URL}/citas/cliente/${userId}`);
  return await fetchJson(`${BASE_URL}/citas`);
};

export const obtenerBarberos = async () => {
  return await fetchJson(`${BASE_URL}/barberos`);
};

export const reservarCita = async (appointment) => {
  const response = await fetch(`${BASE_URL}/citas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appointment)
  });
  return response.json();
};

export const obtenerPerfilUsuario = async (id) => {
  return await fetchJson(`${BASE_URL}/usuario/${id}`);
};

export const actualizarPerfilUsuario = async (id, profile) => {
  const response = await fetch(`${BASE_URL}/usuario/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  });
  return response.json();
};

// MODIFICADO: Ahora recibe el id_barbero y lo concatena si existe para filtrar en el backend
export const obtenerServicios = async (id_barbero) => {
  const url = id_barbero ? `${BASE_URL}/servicios?id_barbero=${id_barbero}` : `${BASE_URL}/servicios`;
  return await fetchJson(url);
};

// MODIFICADO: Ahora recibe el id_barbero y lo concatena si existe para filtrar en el backend
export const obtenerPublicaciones = async (id_barbero) => {
  const url = id_barbero ? `${BASE_URL}/publicaciones?id_barbero=${id_barbero}` : `${BASE_URL}/publicaciones`;
  return await fetchJson(url);
};



// Alta de Servicio: Envía la imagen física mediante FormData
export const crearServicio = async (id_barbero, nombre_servicio, descripcion, precio, duracion_min, archivoImagen) => {
  const formData = new FormData();
  formData.append('id_barbero', id_barbero);
  formData.append('nombre_servicio', nombre_servicio);
  formData.append('descripcion', descripcion);
  formData.append('precio', precio);
  formData.append('duracion_min', duracion_min);
  if (archivoImagen) {
    formData.append('imagen', archivoImagen);
  }

  const response = await fetch(`${BASE_URL}/servicios`, {
    method: 'POST',
    body: formData
  });
  return response.json();
};

// Alta de Publicación: Envía datos planos en formato JSON stringificado
export const crearPublicacion = async (id_barbero, id_servicio, descripcion_post) => {
  const response = await fetch(`${BASE_URL}/publicaciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_barbero, id_servicio, descripcion_post })
  });
  return response.json();
};


export const eliminarServicio = async (id) => {
  const response = await fetch(`${BASE_URL}/servicios/${id}`, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error del servidor HTTP ${response.status}`);
  }
  return response.json();
};

export const eliminarPublicacion = async (id) => {
  const response = await fetch(`${BASE_URL}/publicaciones/${id}`, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};