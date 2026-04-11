import API_URL from '../utils/apiConfig';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const mapExceptionFromAPI = (item) => ({
  id: item.id,
  fecha: item.fecha,
  tipo: item.tipo,
  motivo: item.motivo,
  horaInicio: item.hora_inicio,
  horaFin: item.hora_fin,
  bloqueaTurnos: Boolean(item.bloquea_turnos),
});

const mapExceptionToAPI = (item) => ({
  fecha: item.fecha,
  tipo: item.tipo,
  motivo: item.motivo,
  hora_inicio: item.horaInicio,
  hora_fin: item.horaFin,
  bloquea_turnos: item.bloqueaTurnos,
});

export const getAgendaExcepciones = async (fechaInicio, fechaFin) => {
  let url = `${API_URL}/agenda-excepciones`;

  if (fechaInicio && fechaFin) {
    url += `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
  }

  const response = await fetch(url, { headers: getHeaders() });
  if (!response.ok) {
    throw new Error('Error al cargar las excepciones de agenda');
  }

  const data = await response.json();
  return data.map(mapExceptionFromAPI);
};

export const createAgendaExcepcion = async (payload) => {
  const response = await fetch(`${API_URL}/agenda-excepciones`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(mapExceptionToAPI(payload)),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al crear la excepción de agenda');
  }

  return mapExceptionFromAPI(data);
};

export const updateAgendaExcepcion = async (id, payload) => {
  const response = await fetch(`${API_URL}/agenda-excepciones/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(mapExceptionToAPI(payload)),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al actualizar la excepción de agenda');
  }

  return mapExceptionFromAPI(data);
};

export const deleteAgendaExcepcion = async (id) => {
  const response = await fetch(`${API_URL}/agenda-excepciones/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al eliminar la excepción de agenda');
  }

  return data;
};
