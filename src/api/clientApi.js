const BASE_URL = process.env.REACT_APP_API_URL || 'https://barberia-production-7969.up.railway.app';

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}`);
  }
  return data;
};

export const getUser = async (id) => {
  return fetchJson(`${BASE_URL}/user/${id}`);
};

export const updateUser = async (id, data) => {
  return fetchJson(`${BASE_URL}/user/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const getMyAppointments = async (clientId) => {
  return fetchJson(`${BASE_URL}/citas/cliente/${clientId}`);
};

export const createAppointment = async (data) => {
  return fetchJson(`${BASE_URL}/citas`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};
