const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const fetchJson = async (url) => {
  const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
};

const fallbackAppointments = (role) => {
  if (role === 'barbero') {
    return [
      { id: 1, service: 'Corte premium', client: 'Carlos M.', date: '2026-06-05 13:00', status: 'confirmada' },
      { id: 2, service: 'Afeitado clásico', client: 'Laura R.', date: '2026-06-07 10:30', status: 'pendiente' },
      { id: 3, service: 'Barba + recorte', client: 'Miguel T.', date: '2026-06-10 16:00', status: 'confirmada' }
    ];
  }

  return [
    { id: 1, service: 'Corte premium', barber: 'Ernesto B.', date: '2026-06-05 13:00', status: 'confirmada' },
    { id: 2, service: 'Afeitado clásico', barber: 'Laura V.', date: '2026-06-07 10:30', status: 'pendiente' }
  ];
};

const fallbackServices = () => [
  { id: 1, title: 'Corte clásico', price: '250.00', duration: '30 min' },
  { id: 2, title: 'Barba definida', price: '190.00', duration: '20 min' },
  { id: 3, title: 'Combo corte + barba', price: '420.00', duration: '55 min' }
];

const fallbackPosts = () => [
  { id: 1, title: 'Nuevo estilo degradado', description: 'Publicación reciente con técnica de degradado moderno.', date: '2026-05-21' },
  { id: 2, title: 'Antes y después', description: 'Transformación de barba con línea perfecta y limpieza facial.', date: '2026-05-18' }
];

export const getAppointments = async (role, userId) => {
  try {
    if (role === 'barbero') {
      return await fetchJson(`${BASE_URL}/citas`);
    }
    if (userId) {
      return await fetchJson(`${BASE_URL}/citas/cliente/${userId}`);
    }
    return await fetchJson(`${BASE_URL}/citas`);
  } catch (error) {
    return fallbackAppointments(role);
  }
};

export const getServices = async () => {
  try {
    return await fetchJson(`${BASE_URL}/servicios`);
  } catch (error) {
    return fallbackServices();
  }
};

export const getPosts = async () => {
  try {
    return await fetchJson(`${BASE_URL}/barbero_servicios`);
  } catch (error) {
    return fallbackPosts();
  }
};
