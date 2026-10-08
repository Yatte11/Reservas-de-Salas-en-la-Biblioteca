# Guía de Contribución — Sistema de Reservas de Biblioteca

¡Gracias por contribuir a este proyecto! Esta guía define los estándares y flujos de trabajo que todo el equipo debe seguir para mantener la calidad y coherencia del código.

---

## 📋 Tabla de Contenidos

1. [Configuración del entorno](#1-configuración-del-entorno)
2. [Estrategia de ramas (GitHub Flow)](#2-estrategia-de-ramas-github-flow)
3. [Convenciones de commits](#3-convenciones-de-commits)
4. [Estándares de código](#4-estándares-de-código)
5. [Proceso de Pull Request](#5-proceso-de-pull-request)
6. [Pruebas](#6-pruebas)
7. [Uso responsable de IA en el desarrollo](#7-uso-responsable-de-ia-en-el-desarrollo)

---

## 1. Configuración del entorno

### Requisitos previos

- Node.js >= 18.x
- npm >= 9.x
- Git >= 2.40

### Pasos de instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/<org>/reservas-biblioteca.git
cd reservas-biblioteca

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores locales

# 4. Verificar que el proyecto funciona
npm test
npm start
```

---

## 2. Estrategia de ramas (GitHub Flow)

Usamos **GitHub Flow**, una estrategia simple y efectiva para equipos pequeños:

```
main
 └── feature/nombre-funcionalidad
 └── fix/descripcion-del-bug
 └── docs/actualizacion-documentacion
 └── test/nombre-prueba
 └── chore/tarea-de-mantenimiento
```

### Reglas de ramas

| Rama | Propósito | Protegida |
|------|-----------|-----------|
| `main` | Código estable, listo para producción | ✅ Sí |
| `feature/*` | Nueva funcionalidad | ❌ No |
| `fix/*` | Corrección de bugs | ❌ No |
| `docs/*` | Actualización de documentación | ❌ No |
| `test/*` | Adición o mejora de pruebas | ❌ No |

### Flujo de trabajo

```bash
# 1. Siempre partir desde main actualizado
git checkout main
git pull origin main

# 2. Crear rama para tu tarea
git checkout -b feature/reservar-sala

# 3. Desarrollar y hacer commits frecuentes
git add src/controllers/reservaController.js
git commit -m "feat(reservas): agregar endpoint POST /reservas"

# 4. Subir la rama
git push -u origin feature/reservar-sala

# 5. Abrir Pull Request en GitHub hacia main
```

---

## 3. Convenciones de commits

Seguimos la especificación **Conventional Commits**:

```
<tipo>(<alcance>): <descripción corta en imperativo>

[cuerpo opcional]

[pie de página opcional: BREAKING CHANGE, Closes #issue]
```

### Tipos válidos

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de un bug |
| `docs` | Solo cambios en documentación |
| `test` | Agregar o corregir pruebas |
| `refactor` | Refactorización sin cambio de comportamiento |
| `chore` | Cambios en build, dependencias, configs |
| `style` | Formato, espacios, comas (sin cambio lógico) |
| `perf` | Mejora de rendimiento |

### Ejemplos

```bash
# ✅ Correcto
git commit -m "feat(usuarios): agregar registro con validación de email"
git commit -m "fix(reservas): corregir validación de fecha de fin"
git commit -m "test(salas): agregar prueba unitaria para verificar disponibilidad"
git commit -m "docs(readme): actualizar instrucciones de instalación"

# ❌ Incorrecto
git commit -m "cambios"
git commit -m "fix bugs"
git commit -m "WIP"
```

---

## 4. Estándares de código

### Estructura de carpetas

```
src/
├── app.js              # Punto de entrada de la aplicación
├── config/             # Configuración (DB, Swagger, env)
├── controllers/        # Lógica de negocio de cada entidad
├── middlewares/        # Middlewares (auth, validación, errores)
├── models/             # Acceso a datos (queries SQL)
├── routes/             # Definición de rutas Express
└── utils/              # Funciones auxiliares reutilizables
tests/
├── unit/               # Pruebas unitarias por módulo
└── integration/        # Pruebas de integración de endpoints
```

### Convenciones de nomenclatura

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Archivos | `camelCase` | `reservaController.js` |
| Variables | `camelCase` | `fechaInicio` |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_DURACION_HORAS` |
| Funciones | `camelCase` + verbo | `obtenerReservas()` |
| Clases | `PascalCase` | `ReservaService` |
| Rutas API | `kebab-case` | `/api/v1/salas-disponibles` |

### Reglas de estilo

- Indentación: **2 espacios** (no tabs)
- Comillas: **simples** `'texto'`
- Punto y coma: **siempre** al final
- Longitud máxima de línea: **100 caracteres**
- Siempre manejar errores con `try/catch` en controladores
- Nunca hacer `console.log` en producción (usar el logger de utils)

### Ejemplo de controlador bien escrito

```javascript
// ✅ Correcto
const obtenerSalas = async (req, res, next) => {
  try {
    const salas = await SalaModel.obtenerTodas();
    return res.status(200).json({
      success: true,
      data: salas,
      total: salas.length,
    });
  } catch (error) {
    next(error);
  }
};

// ❌ Incorrecto
const getSalas = async (req, res) => {
  const salas = await SalaModel.obtenerTodas()
  console.log(salas)
  res.json(salas)
};
```

---

## 5. Proceso de Pull Request

### Antes de abrir un PR

- [ ] El código compila sin errores (`npm start`)
- [ ] Todas las pruebas pasan (`npm test`)
- [ ] No hay errores de linting (`npm run lint`)
- [ ] El código está debidamente comentado
- [ ] Actualizaste la documentación si fue necesario

### Plantilla de Pull Request

Al crear un PR en GitHub, usa esta plantilla:

```markdown
## Descripción
Breve descripción de los cambios realizados.

## Tipo de cambio
- [ ] Nueva funcionalidad (feat)
- [ ] Corrección de bug (fix)
- [ ] Documentación (docs)
- [ ] Pruebas (test)
- [ ] Refactorización (refactor)

## Cambios realizados
- Cambio 1
- Cambio 2

## Pruebas realizadas
Describe cómo probaste los cambios.

## Captura de pantalla (si aplica)

## Issues relacionados
Closes #<número-de-issue>
```

### Revisión de código

- Cada PR requiere **al menos 1 aprobación** antes de hacer merge
- El revisor debe verificar: lógica, seguridad, rendimiento y legibilidad
- Usar comentarios constructivos y específicos
- El autor del PR no puede aprobar su propio PR

---

## 6. Pruebas

### Ejecutar pruebas

```bash
# Todas las pruebas
npm test

# Solo pruebas unitarias
npm run test:unit

# Solo pruebas de integración
npm run test:integration

# Con reporte de cobertura
npm run test:coverage
```

### Umbral de cobertura requerido

- **Líneas:** ≥ 70%
- **Ramas:** ≥ 70%
- **Funciones:** ≥ 70%
- **Sentencias:** ≥ 70%

### Convención de archivos de prueba

```
tests/unit/reservaModel.test.js       → prueba del modelo
tests/unit/reservaController.test.js  → prueba del controlador
tests/integration/reservas.test.js    → prueba del endpoint completo
```

---

## 7. Uso responsable de IA en el desarrollo

Como equipo seguimos estas directrices para el uso de herramientas de IA (GitHub Copilot, ChatGPT, etc.):

### ✅ Hacer

- Usar IA para generar borradores de código, luego **revisar y adaptar**
- Documentar en el commit o PR qué partes fueron asistidas por IA
- Validar todo código generado por IA con pruebas antes de hacer merge
- Usar IA para generar pruebas, pero verificar que cubran casos borde

### ❌ No hacer

- Hacer merge de código generado por IA sin revisión humana
- Compartir con IA: credenciales, tokens, datos de usuarios reales, secretos del `.env`
- Asumir que el código de IA es seguro sin analizar posibles vulnerabilidades
- Usar IA para decisiones arquitectónicas sin validación del equipo

### Qué NO compartir con herramientas de IA públicas

- Contraseñas y tokens de acceso
- Datos personales de usuarios
- Claves JWT o secretos de cifrado
- URLs internas de producción
- Información confidencial del negocio

---

## ❓ ¿Dudas?

Abre un **Issue** en el repositorio con la etiqueta `question` o comunícate con el equipo directamente.
