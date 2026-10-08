# 📚 Sistema de Reservas de Salas de Biblioteca

[![CI Pipeline](https://github.com/<org>/reservas-biblioteca/actions/workflows/ci.yml/badge.svg)](https://github.com/<org>/reservas-biblioteca/actions)
[![Cobertura de pruebas](https://img.shields.io/badge/cobertura-80%25-brightgreen)]()
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)]()
[![Licencia](https://img.shields.io/badge/licencia-MIT-blue)]()

API REST para la gestión y reserva de salas de estudio en una biblioteca universitaria. Desarrollada como parte de la **Práctica 3 — Ingeniería de Software Moderna** aplicando el ciclo de vida SDLC con herramientas de IA generativa.

---

## 🚀 Funcionalidades principales

- 🔐 **Autenticación** de usuarios con JWT
- 🏛️ **Gestión de salas**: crear, consultar, actualizar y eliminar salas
- 📅 **Reservas**: crear, cancelar y consultar reservas por usuario o sala
- 🔍 **Disponibilidad**: consultar salas disponibles por fecha y horario
- 👤 **Gestión de usuarios**: registro, login y perfil
- 🛡️ **Seguridad**: rate limiting, validación de entradas, helmet

---

## 🏗️ Arquitectura

```
reservas-biblioteca/
├── src/
│   ├── app.js                  # Punto de entrada Express
│   ├── config/
│   │   ├── database.js         # Conexión SQLite
│   │   └── swagger.js          # Configuración Swagger UI
│   ├── controllers/
│   │   ├── authController.js   # Registro e inicio de sesión
│   │   ├── salaController.js   # CRUD de salas
│   │   ├── reservaController.js# CRUD de reservas
│   │   └── usuarioController.js# Gestión de perfil
│   ├── middlewares/
│   │   ├── authMiddleware.js   # Verificación JWT
│   │   ├── errorHandler.js     # Manejo centralizado de errores
│   │   └── validators.js       # Validaciones con express-validator
│   ├── models/
│   │   ├── usuarioModel.js     # Queries de usuarios
│   │   ├── salaModel.js        # Queries de salas
│   │   └── reservaModel.js     # Queries de reservas
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── salaRoutes.js
│   │   ├── reservaRoutes.js
│   │   └── usuarioRoutes.js
│   └── utils/
│       └── logger.js           # Logger simple
├── tests/
│   ├── unit/                   # Pruebas unitarias Jest
│   └── integration/            # Pruebas de integración Supertest
├── database/
│   └── schema.sql              # DDL del esquema de base de datos
├── docs/
│   ├── arquitectura/           # Diagramas C4 y decisiones arquitectónicas
│   ├── requisitos/             # Requisitos funcionales, no funcionales y backlog
│   └── reflexion/              # Reflexión crítica del equipo (Parte 5)
├── .github/
│   └── workflows/
│       └── ci.yml              # Pipeline CI/CD GitHub Actions
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── CONTRIBUTING.md
```

---

## ⚙️ Instalación y configuración

### Requisitos previos

- [Node.js](https://nodejs.org/) >= 18.x
- [npm](https://www.npmjs.com/) >= 9.x
- [Docker](https://www.docker.com/) (opcional, para despliegue)

### Instalación local

```bash
# Clonar el repositorio
git clone https://github.com/<org>/reservas-biblioteca.git
cd reservas-biblioteca

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar en modo desarrollo
npm run dev
```

La API estará disponible en `http://localhost:3000`.

La documentación Swagger estará en `http://localhost:3000/api-docs`.

### Con Docker

```bash
# Construir y levantar todos los servicios
docker-compose up --build

# Solo en background
docker-compose up -d
```

---

## 📡 Endpoints principales

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/api/v1/auth/registro` | Registrar nuevo usuario | ❌ |
| `POST` | `/api/v1/auth/login` | Iniciar sesión | ❌ |
| `GET` | `/api/v1/salas` | Listar todas las salas | ✅ |
| `GET` | `/api/v1/salas/disponibles` | Salas disponibles por fecha/hora | ✅ |
| `POST` | `/api/v1/salas` | Crear sala (solo admin) | ✅ |
| `GET` | `/api/v1/reservas` | Mis reservas | ✅ |
| `POST` | `/api/v1/reservas` | Crear reserva | ✅ |
| `DELETE` | `/api/v1/reservas/:id` | Cancelar reserva | ✅ |

Documentación completa en `/api-docs` (Swagger UI).

---

## 🧪 Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Con reporte de cobertura
npm run test:coverage

# Solo pruebas unitarias
npm run test:unit

# Solo pruebas de integración
npm run test:integration
```

---

## 🤝 Contribuir

Consulta [CONTRIBUTING.md](./CONTRIBUTING.md) para conocer las convenciones de código, ramas, commits y el proceso de Pull Request.

### Ramas del equipo

| Integrante | Rama principal de trabajo |
|------------|--------------------------|
| Integrante 1 | `feature/autenticacion` |
| Integrante 2 | `feature/gestion-salas` |
| Integrante 3 | `feature/gestion-reservas` |
| Integrante 4 | `feature/pruebas-seguridad` |
| Integrante 5 | `feature/despliegue-ci-cd` |

---

## 📄 Documentación del proyecto

| Documento | Ubicación |
|-----------|-----------|
| Requisitos funcionales y no funcionales | `docs/requisitos/requisitos.md` |
| Product Backlog | `docs/requisitos/product-backlog.md` |
| Diagrama de arquitectura C4 | `docs/arquitectura/arquitectura.md` |
| Modelo Entidad-Relación | `docs/arquitectura/modelo-er.md` |
| Especificación OpenAPI | `docs/arquitectura/openapi.yaml` |
| Reflexión crítica del equipo | `docs/reflexion/reflexion-critica.md` |

---

## 👥 Equipo

Desarrollado por el **Equipo 5** — Ingeniería de Software Moderna

---

## 📜 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](./LICENSE) para más detalles.
