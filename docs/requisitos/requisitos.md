# Documento de Requisitos — Sistema de Reservas de Salas de Biblioteca

**Proyecto:** Sistema de Reservas de Salas de Biblioteca  
**Versión:** 1.0  
**Fecha:** Octubre 2026  
**Equipo:** Equipo 5 — Ingeniería de Software Moderna  

---

## 1. Introducción

### 1.1 Propósito

Este documento describe los requisitos funcionales y no funcionales del Sistema de Reservas de Salas de Biblioteca (SRSB), obtenidos mediante sesiones de elicitación asistidas por herramientas de IA generativa (ChatGPT y GitHub Copilot Chat).

### 1.2 Alcance

El sistema permite a estudiantes y personal universitario consultar, reservar y cancelar salas de estudio en una biblioteca universitaria a través de una API REST. Los administradores pueden gestionar el catálogo de salas y supervisar todas las reservas.

### 1.3 Prompt utilizado con IA para elicitación

> *"Actúa como analista de sistemas. Necesito los requisitos funcionales y no funcionales para un sistema web de reservas de salas de estudio en una biblioteca universitaria. Los usuarios son estudiantes y administradores. El sistema debe manejar autenticación, disponibilidad en tiempo real y cancelaciones. Dame al menos 10 requisitos funcionales y 5 no funcionales en formato estructurado."*

---

## 2. Requisitos Funcionales

| ID | Requisito | Prioridad | Estado |
|----|-----------|-----------|--------|
| RF-01 | El sistema debe permitir que un usuario se registre con nombre, correo institucional y contraseña | Alta | Implementado |
| RF-02 | El sistema debe autenticar usuarios mediante correo y contraseña, devolviendo un token JWT | Alta | Implementado |
| RF-03 | El sistema debe listar todas las salas activas disponibles en la biblioteca | Alta | Implementado |
| RF-04 | El sistema debe permitir consultar la disponibilidad de salas filtrando por fecha, hora de inicio y hora de fin | Alta | Implementado |
| RF-05 | El sistema debe permitir a un usuario autenticado crear una reserva para una sala en un horario específico | Alta | Implementado |
| RF-06 | El sistema debe impedir la creación de reservas con conflictos de horario para la misma sala | Alta | Implementado |
| RF-07 | El sistema debe permitir al usuario cancelar sus propias reservas activas | Alta | Implementado |
| RF-08 | El sistema debe permitir al usuario consultar el historial de sus reservas (activas, canceladas y completadas) | Media | Implementado |
| RF-09 | El sistema debe permitir a un administrador crear, editar y eliminar salas del catálogo | Media | Implementado |
| RF-10 | El sistema debe permitir a un administrador ver todas las reservas del sistema independientemente del usuario | Media | Implementado |
| RF-11 | El sistema debe mostrar la información detallada de una sala (nombre, capacidad, ubicación, descripción) | Media | Implementado |
| RF-12 | El sistema debe permitir al usuario actualizar su nombre y correo electrónico en su perfil | Baja | Implementado |

### 2.1 Análisis crítico de los requisitos generados por IA

La IA generó los requisitos RF-01 al RF-09 de manera correcta y bien estructurada. Sin embargo, se identificaron las siguientes ambigüedades que requirieron corrección:

**Requisito ambiguo 1 — IA generó:**
> *"El sistema debe notificar a los usuarios sobre sus reservas"*

**Problema:** Ambiguo. ¿Notificación por email, push, SMS? ¿Cuándo exactamente?  
**Corrección aplicada:** Se acotó a solo confirmación en la respuesta HTTP de la API (RF-05). Las notificaciones por email se dejan para una versión futura fuera del alcance actual.

**Requisito ambiguo 2 — IA generó:**
> *"El sistema debe gestionar múltiples tipos de usuarios con diferentes permisos"*

**Problema:** Demasiado vago. No especifica cuántos roles ni qué permisos concretos tiene cada uno.  
**Corrección aplicada:** Se definieron exactamente dos roles: `usuario` (puede reservar y cancelar sus propias reservas) y `admin` (gestión completa del catálogo y acceso a todas las reservas).

---

## 3. Requisitos No Funcionales

| ID | Requisito | Categoría | Métrica de verificación |
|----|-----------|-----------|------------------------|
| RNF-01 | La API debe responder en menos de 500ms para el 95% de las peticiones bajo carga normal (≤ 50 usuarios concurrentes) | Rendimiento | Prueba de carga con Artillery o k6 |
| RNF-02 | Las contraseñas deben almacenarse cifradas con bcrypt usando un factor de coste mínimo de 10 | Seguridad | Revisión de código + prueba unitaria |
| RNF-03 | El sistema debe limitar las peticiones a 100 por IP cada 15 minutos para prevenir ataques de fuerza bruta | Seguridad | Prueba de rate limiting |
| RNF-04 | La API debe devolver respuestas en formato JSON con estructura consistente (`success`, `mensaje`, `datos`) en todos los endpoints | Mantenibilidad | Revisión de contratos OpenAPI |
| RNF-05 | El sistema debe tener una disponibilidad del 99% en el ambiente de producción | Disponibilidad | Monitoreo con Railway health checks |
| RNF-06 | El código debe mantener una cobertura de pruebas unitarias mínima del 70% | Calidad | Reporte Jest con `--coverage` |
| RNF-07 | El sistema debe validar y sanitizar todas las entradas del usuario antes de procesarlas | Seguridad | Pruebas de validación con express-validator |

---

## 4. Evaluación INVEST de los Requisitos

| Criterio | ¿Se cumple? | Observación |
|----------|-------------|-------------|
| **I**ndependent | ✅ | Cada RF puede implementarse de forma independiente |
| **N**egotiable | ✅ | Los alcances fueron ajustados durante el análisis (ej. notificaciones) |
| **V**aluable | ✅ | Cada RF aporta valor directo al usuario final |
| **E**stimable | ✅ | Todos los RF tienen tamaño acotado (máx. 1 día de desarrollo) |
| **S**mall | ✅ | Ningún RF abarca más de un endpoint o funcionalidad |
| **T**estable | ✅ | Cada RF tiene criterios de aceptación verificables |
