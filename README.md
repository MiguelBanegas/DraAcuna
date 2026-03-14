# Dra Acuna

Proyecto frontend en React + Vite con testing unitario (Vitest) y E2E (Playwright).

## Scripts

- `npm run dev`: iniciar app en desarrollo
- `npm test`: correr tests unitarios/integración (Vitest)
- `npm run test:watch`: tests en modo watch
- `npm run e2e`: correr tests end-to-end (Playwright)
- `npm run e2e:ui`: abrir runner UI de Playwright

## E2E (Playwright)

Los tests E2E están en `e2e/consultas.e2e.spec.js` y cubren:

- crear consulta
- editar consulta existente
- cancelar y confirmar eliminación

### Requisito inicial

Instalar navegador de Playwright una sola vez:

```bash
npx playwright install chromium
```

### Ejecución

```bash
npm run e2e
```

El servidor de Vite se levanta automáticamente desde `playwright.config.js`.

### Ejecutar un caso puntual

```bash
npx playwright test e2e/consultas.e2e.spec.js -g "editar consulta existente"
```
