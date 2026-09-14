# PENSIONES - Sistema de Gestión de Pensiones (Versión GitHub Pages)

Sistema de citas de pensiones con control por roles: **Administrador**, **Telefonista** y **Ejecutivo**. Incluye login, calendario de citas, gestión de reuniones y cierre de procesos.

> **Nota sobre datos:** GitHub Pages solo permite archivos estáticos, por lo que esta versión guarda los datos en el navegador (`localStorage`). Los datos son por equipo/navegador y se pierden al limpiar el historial. Para una base de datos compartida usa la versión con servidor (`pensiones-web`).

---

## 🚀 Cómo subirla a GitHub

### Paso 1: Crear un repositorio en GitHub
1. Entra a [github.com](https://github.com) e inicia sesión.
2. Haz clic en el botón verde **"New"** (Nuevo repositorio).
3. Nombra el repositorio, por ejemplo `pensiones`.
4. Déjalo como **Público** (GitHub Pages gratuito requiere repositorio público) y crea el repositorio.

### Paso 2: Subir los archivos
**Opción A - Desde GitHub (sin programas):**
1. Dentro de tu repositorio, entra a la pestaña **Code** y haz clic en **"Add file" → "Upload files"**.
2. Arrastra todos los archivos de esta carpeta (`index.html`, `admin.html`, `telefonista.html`, `ejecutivo.html`, `styles.css`, `app.js`).
3. Escribe un mensaje de commit (ej: "Versión inicial") y haz clic en **"Commit changes"**.

**Opción B - Desde Git instalado en tu PC:**
```
git init
git add .
git commit -m "Versión inicial PENSIONES"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/pensiones.git
git push -u origin main
```

### Paso 3: Activar GitHub Pages
1. En tu repositorio, ve a **Settings** → **Pages**.
2. En **Source**, elige **"Deploy from a branch"**.
3. Selecciona la rama **`main`** y carpeta **`/ (root)`**.
4. Haz clic en **"Save"**.

### Paso 4: Tu sitio estará en
```
https://TU-USUARIO.github.io/pensiones/
```

---

## 🔑 Credenciales de acceso

| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | `admin` | `admin123` |
| Telefonista | `telefonista` | `tel123` |
| Ejecutivo | `ejecutivo` | `ejec123` |

---

## 📋 Funcionalidades

- **Login** con acceso por roles.
- **Administrador:** dashboard con estadísticas, agendar/editar/eliminar citas, calendario, lista con filtros y reporte por ejecutivo.
- **Telefonista:** registra todos los datos del pensionado, asigna ejecutivo y fecha de cita.
- **Ejecutivo:** selecciona su nombre, ve sus citas asignadas, marca **reunión realizada**, **proceso concretado** y **fecha de cierre**.

## 📁 Archivos

| Archivo | Descripción |
|---|---|
| `index.html` | Página de inicio de sesión |
| `admin.html` | Panel del administrador |
| `telefonista.html` | Panel de la telefonista |
| `ejecutivo.html` | Panel del ejecutivo |
| `styles.css` | Estilos de la aplicación |
| `app.js` | Lógica de la aplicación |