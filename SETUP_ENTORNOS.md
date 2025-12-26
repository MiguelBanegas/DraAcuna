# 🚀 Guía de Configuración de Entornos

## Una vez que tengas PostgreSQL instalado:

### 1️⃣ Crear la Base de Datos de Desarrollo

Abrí pgAdmin 4 o la terminal de PostgreSQL y ejecutá:

```sql
CREATE DATABASE dra_acuna_dev;
```

### 2️⃣ Exportar la Estructura desde Producción

Conectate a tu VPS por SSH y ejecutá:

```bash
# Exportar SOLO la estructura (sin datos)
pg_dump -U tu_usuario -h localhost -d dra_acuna_prod --schema-only > estructura.sql

# O si querés exportar con datos de prueba (cuidado con datos sensibles):
pg_dump -U tu_usuario -h localhost -d dra_acuna_prod > backup_completo.sql
```

### 3️⃣ Descargar el archivo a tu PC

Usá SCP, SFTP o WinSCP para descargar el archivo `estructura.sql` a tu PC.

### 4️⃣ Importar en tu BD Local

En tu PC, ejecutá:

```bash
# Navegar a donde descargaste el archivo
cd C:\ruta\donde\descargaste

# Importar a la BD local
psql -U postgres -d dra_acuna_dev -f estructura.sql
```

### 5️⃣ Configurar el Backend Local

```bash
cd C:\Users\pc\Desktop\DraAcuna\server

# Copiar el ejemplo y editarlo
copy .env.example .env

# Editar .env con tu contraseña de PostgreSQL
```

### 6️⃣ Probar el Backend Local

```bash
cd C:\Users\pc\Desktop\DraAcuna\server
npm install
npm run dev
```

Debería arrancar en http://localhost:3000

### 7️⃣ Probar el Frontend

```bash
cd C:\Users\pc\Desktop\DraAcuna
npm run dev
```

Ahora usará la API local (gracias a .env.development)

---

## 🎯 Resultado Final

- **Desarrollo**: Frontend → API Local → BD Local
- **Producción**: Frontend → API VPS → BD VPS

¡Avisame cuando termines de instalar PostgreSQL y seguimos!
