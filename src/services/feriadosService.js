const API_BASE_URL = 'https://api.argentinadatos.com/v1/feriados';

const feriadosCache = new Map();

const normalizeFeriado = (feriado) => ({
  fecha: feriado.fecha,
  nombre: feriado.nombre,
  tipo: feriado.tipo,
});

export const getFeriadosByYear = async (year) => {
  const normalizedYear = Number(year);

  if (!Number.isInteger(normalizedYear)) {
    throw new Error('El año de feriados es inválido');
  }

  if (feriadosCache.has(normalizedYear)) {
    return feriadosCache.get(normalizedYear);
  }

  const response = await fetch(`${API_BASE_URL}/${normalizedYear}`);

  if (!response.ok) {
    throw new Error(`No se pudieron cargar los feriados del año ${normalizedYear}`);
  }

  const data = await response.json();
  const normalizedData = Array.isArray(data) ? data.map(normalizeFeriado) : [];
  feriadosCache.set(normalizedYear, normalizedData);
  return normalizedData;
};

export const getFeriadosMapByYears = async (years) => {
  const uniqueYears = [...new Set(years.map(Number).filter(Number.isInteger))];
  const feriadosArrays = await Promise.all(uniqueYears.map(getFeriadosByYear));

  return feriadosArrays.flat().reduce((map, feriado) => {
    map.set(feriado.fecha, feriado);
    return map;
  }, new Map());
};

export const getFeriadoByDate = async (date) => {
  if (!date) {
    return null;
  }

  const normalizedDate = typeof date === 'string' ? date : date.toISOString().slice(0, 10);
  const [year] = normalizedDate.split('-');
  const feriados = await getFeriadosByYear(Number(year));
  return feriados.find((feriado) => feriado.fecha === normalizedDate) || null;
};

export const clearFeriadosCache = () => {
  feriadosCache.clear();
};
