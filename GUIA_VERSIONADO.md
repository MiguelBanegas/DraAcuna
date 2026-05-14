# Guía: Cómo lanzar una nueva versión (Versioning)

Para que el sistema de notificaciones funcione y los usuarios sepan cuándo actualizar, es importante seguir estos pasos cada vez que hagas una mejora o arreglo.

## 1. Actualizar el archivo de versión

Editá el archivo `public/version.json` con el nuevo número:

```json
{
  "version": "1.1.X",
  "timestamp": 1735295000000
}
```

> [!NOTE]
> Lo que dispara la notificación en el navegador de los pacientes es el cambio en el campo `"version"`.
> El `"timestamp"` asegura que el navegador no use una copia vieja guardada en su memoria (caché).

### 💡 Cómo obtener el timestamp actual:
- **En el navegador:** Abrir consola (F12) y ejecutar `Date.now()`.
- **En la terminal:** Ejecutar `node -e "console.log(Date.now())"`.
- **En PowerShell:** Ejecutar `[DateTimeOffset]::Now.ToUnixTimeMilliseconds()`.

## 2. Guardar el cambio en Git

Asegurate de estar en la rama `develop` y guardá el cambio localmente:

```powershell
git add .
git commit -m "chore: actualizar version a 1.1.X"
```

## 3. Iniciar el proceso de Release

Usamos Git Flow para preparar la salida a producción:

```powershell
git flow release start 1.1.X
```

## 4. Finalizar el Release

Este paso une todo a `master`, crea la etiqueta (tag) y vuelve a `develop`:

```powershell
git flow release finish -m "Release version 1.1.X" 1.1.X
```

## 5. Sincronizar con GitHub

Subí las ramas y las etiquetas al repositorio remoto:

```powershell
git push origin develop master --tags
```

## 6. Actualizar el Servidor (VPS)

Entrá a tu servidor vía SSH y descargá los cambios:

1. `git pull origin master`
2. Reiniciá el servicio: `pm2 restart dra-acuna` (o el comando que corresponda).

---

### 💡 Regla de Oro para los números de versión:

- **1.1.X (Parche)**: Errores corregidos o cambios visuales menores.
- **1.X.0 (Minor)**: Nuevas funcionalidades o pantallas.
- **X.0.0 (Major)**: Cambios estructurales masivos.

¡Listo! Siguiendo estos pasos mantenés un historial profesional y a tus usuarios siempre actualizados.
