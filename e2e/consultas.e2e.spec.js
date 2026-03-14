import { expect, test } from '@playwright/test';

const pacienteApi = {
  id: 1,
  nombre_completo: 'Juan Perez',
  dni: '12345678',
  obra_social: 'OSDE',
};

const baseConsultaApi = {
  id: 10,
  paciente_id: 1,
  paciente_nombre: 'Juan Perez',
  fecha_hora: '2026-03-03T10:00:00.000Z',
  motivo: 'Control general',
  diagnostico: 'Sin hallazgos',
  tratamiento: 'Hidratacion',
  observaciones: 'Sin novedades',
  proxima_consulta: '',
  signos_vitales: {},
  fecha_creacion: '2026-03-03T10:00:00.000Z',
};

function json(route, body, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function mockApi(page) {
  const state = {
    consultas: [structuredClone(baseConsultaApi)],
    createdBodies: [],
    updatedBodies: [],
    deletedIds: [],
  };

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const path = url.pathname;

    if (path.endsWith('/pacientes') && method === 'GET') {
      const q = url.searchParams.get('q');
      if (q !== null) {
        return json(route, [pacienteApi]);
      }
      return json(route, [pacienteApi]);
    }

    if (path.endsWith('/pacientes/1') && method === 'GET') {
      return json(route, pacienteApi);
    }

    if (path.endsWith('/consultas/search') && method === 'GET') {
      const q = (url.searchParams.get('q') || '').toLowerCase();
      const pacienteId = url.searchParams.get('pacienteId');
      const fecha = url.searchParams.get('fecha');

      let result = state.consultas;
      if (q === '_____no_match_____') {
        result = [];
      } else if (q) {
        result = result.filter((c) => c.motivo.toLowerCase().includes(q));
      }
      if (pacienteId) {
        result = result.filter((c) => String(c.paciente_id) === String(pacienteId));
      }
      if (fecha) {
        result = result.filter((c) => c.fecha_hora.startsWith(fecha));
      }

      return json(route, result);
    }

    if (path.endsWith('/consultas') && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      state.createdBodies.push(body);
      const created = {
        id: 100 + state.consultas.length,
        paciente_id: body.paciente_id,
        paciente_nombre: 'Juan Perez',
        fecha_hora: body.fecha_hora,
        motivo: body.motivo,
        diagnostico: body.diagnostico || '',
        tratamiento: body.tratamiento || '',
        observaciones: body.observaciones || '',
        proxima_consulta: body.proxima_consulta || '',
        signos_vitales: body.signos_vitales || {},
        fecha_creacion: body.fecha_hora,
      };
      state.consultas.unshift(created);
      return json(route, created, 201);
    }

    if (path.match(/\/api\/consultas\/\d+$/) && method === 'PUT') {
      const id = Number(path.split('/').pop());
      const body = JSON.parse(request.postData() || '{}');
      state.updatedBodies.push({ id, body });
      const idx = state.consultas.findIndex((c) => c.id === id);
      const existing = state.consultas[idx];
      const updated = {
        ...existing,
        ...{
          paciente_id: body.paciente_id,
          fecha_hora: body.fecha_hora,
          motivo: body.motivo,
          diagnostico: body.diagnostico,
          tratamiento: body.tratamiento,
          observaciones: body.observaciones,
          proxima_consulta: body.proxima_consulta,
          signos_vitales: body.signos_vitales,
        },
      };
      state.consultas[idx] = updated;
      return json(route, updated);
    }

    if (path.match(/\/api\/consultas\/\d+$/) && method === 'DELETE') {
      const id = Number(path.split('/').pop());
      state.deletedIds.push(id);
      state.consultas = state.consultas.filter((c) => c.id !== id);
      return route.fulfill({ status: 204, body: '' });
    }

    return json(route, []);
  });

  return state;
}

async function authenticate(page) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'e2e-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'demo' }));
  });
}

test.describe('Consultas E2E', () => {
  test('crear consulta', async ({ page }) => {
    const state = await mockApi(page);
    await authenticate(page);
    await page.goto('/consultas');

    await page.getByRole('button', { name: 'Nueva Consulta' }).click();
    await expect(page).toHaveURL(/\/consultas\/nueva$/);

    await page.locator('input[id^="react-select-"]').first().fill('Juan');
    await page.getByText('Juan Perez - DNI: 12345678').first().click();
    await page.getByPlaceholder('Describa el motivo de la consulta...').fill('Dolor de garganta');
    await page.getByRole('button', { name: 'Guardar' }).click();

    await expect(page).toHaveURL(/\/consultas$/);
    expect(state.createdBodies.length).toBe(1);
    expect(state.createdBodies[0].motivo).toBe('Dolor de garganta');
  });

  test('editar consulta existente', async ({ page }) => {
    const state = await mockApi(page);
    await authenticate(page);
    await page.goto('/consultas');

    await page.getByRole('button', { name: 'Nueva Consulta' }).click();
    await page.locator('input[id^="react-select-"]').first().fill('Juan');
    await page.getByText('Juan Perez - DNI: 12345678').first().click();
    await page.getByPlaceholder('Describa el motivo de la consulta...').fill('Consulta para editar E2E');
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page).toHaveURL(/\/consultas$/);

    const createdId = state.consultas[0].id;
    await page.getByPlaceholder('Buscar texto (min. 3 caracteres)...').fill('editar E2E');
    await page.waitForTimeout(450);
    await page.locator('button[title="Editar"]').first().click();

    await expect(page).toHaveURL(new RegExp(`/consultas/${createdId}/editar$`));
    const diagnostico = page.locator('textarea[name="diagnostico"]');
    await expect(page.getByRole('button', { name: 'Actualizar' })).toBeVisible();
    await diagnostico.fill('Diagnostico actualizado E2E');
    await page.getByRole('button', { name: 'Actualizar' }).click();

    await expect(page).toHaveURL(/\/consultas$/);
    expect(state.updatedBodies.length).toBe(1);
    expect(state.updatedBodies[0].id).toBe(createdId);
    expect(state.updatedBodies[0].body.diagnostico).toBe('Diagnostico actualizado E2E');
  });

  test('cancelar y confirmar eliminacion', async ({ page }) => {
    const state = await mockApi(page);
    await authenticate(page);
    await page.goto('/consultas');

    await page.getByPlaceholder('Buscar texto (min. 3 caracteres)...').fill('Control');
    await page.waitForTimeout(450);
    await expect(page.locator('button[title="Eliminar"]').first()).toBeVisible();

    await page.locator('button[title="Eliminar"]').first().click();
    await expect(page.locator('.swal2-popup')).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.locator('.swal2-popup')).toBeHidden();
    expect(state.deletedIds).toHaveLength(0);

    await expect(page.locator('button[title="Eliminar"]').first()).toBeVisible();
    await page.locator('button[title="Eliminar"]').first().click();
    await expect(page.locator('.swal2-popup')).toBeVisible();
    await page.getByRole('button', { name: 'Sí, eliminar' }).click();
    await expect.poll(() => state.deletedIds.includes(10)).toBeTruthy();
  });
});
