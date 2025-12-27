# Guía: Cómo usar Git Flow

¡Excelente! Ya tenés `git-flow` inicializado. Esta es una herramienta que automatiza el manejo de ramas que configuramos antes. Ahora no tenés que hacer merge manual, Git Flow lo hace por vos.

## 🌟 1. Nuevas Funcionalidades (Features)

Cuando quieras empezar a programar algo nuevo (ej: una nueva pantalla o mejora):

```bash
# Empieza una nueva funcionalidad
git flow feature start nombre-de-la-mejora
```

_Esto crea una rama automáticamente desde `develop` y te posiciona en ella._

Cuando termines de programar y probar:

```bash
# Termina la funcionalidad
git flow feature finish nombre-de-la-mejora
```

_Esto hace 3 cosas automágicamente:_

1. Hace merge de tu rama a `develop`.
2. Borra la rama de la funcionalidad.
3. Te vuelve a posicionar en `develop`.

---

## 🚀 2. Subir a Producción (Releases)

Cuando `develop` ya está listo para que el mundo lo vea (lo que antes hacíamos con merge a master):

```bash
# Empieza la version
git flow release start 1.0.0
```

Cuando confirmas que todo está bien:

```bash
# Termina la version
git flow release finish 1.0.0
```

_Esto hace el trabajo pesado:_

1. Hace merge a `master`.
2. Crea una etiqueta (tag) con la versión.
3. Hace merge de vuelta a `develop` (por si hubo cambios en el release).
4. Borra la rama de release.

**¡No te olvides de subir los cambios!**

```bash
git push origin master --tags
git push origin develop
```

---

## 🚑 3. Arreglos Urgentes (Hotfixes)

Si hay un error crítico en producción que hay que arreglar YA sin tocar lo que estás haciendo en `develop`:

```bash
git flow hotfix start arreglar-error-critico
```

_(Se crea desde `master`)_. Al terminar:

```bash
git flow hotfix finish arreglar-error-critico
```

_(Se une a `master` y a `develop` al mismo tiempo)_.

---

## 💡 Resumen de Comandos Rápidos

| Acción                 | Comando                             |
| :--------------------- | :---------------------------------- |
| **Nueva Mejora**       | `git flow feature start <nombre>`   |
| **Terminar Mejora**    | `git flow feature finish <nombre>`  |
| **Pasar a Producción** | `git flow release start <version>`  |
| **Terminar Versión**   | `git flow release finish <version>` |
| **Bug Urgente en PDF** | `git flow hotfix start <nombre>`    |

---

## 💎 Mejores Prácticas (Para ser un PRO)

1.  **Commits pequeños y frecuentes**: No esperes a terminar toda la funcionalidad. Hacé commits cada vez que completes un "pedacito" (ej: "Diseño de botón listo", "Validación agregada"). Esto te da "puntos de guardado" por si algo sale mal.
2.  **Ramas Atómicas (Una cosa por vez)**: Evitá hacer muchas cosas diferentes en una sola rama. Es mejor tener 3 ramas pequeñas que se cierran rápido que una gigante que dura una semana.
3.  **No mezcles Temas**: Si estás en `feature/historia-clinica` y ves un error en el `footer`, **NO lo arregles ahí**. Terminá lo que estás haciendo (hacé commit), volvé a `develop`, y creá un `bugfix/arreglo-footer`.
4.  **Limpia tus ramas**: Siempre hacé `finish` cuando termines algo. Eso mantiene tu lista de ramas limpia y organizada.

---

### ¿Qué hago ahora?

Como ya subimos todo hoy, de ahora en adelante cuando quieras agregar algo (por ejemplo, "mejorar el diseño de turnos"), simplemente ejecutá:
`git flow feature start mejor-diseno-turnos`
