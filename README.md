#  Tracker de Ingeniería · Facultad de Ingeniería UNNE

Aplicación web para **seguir, organizar y visualizar el progreso académico** de las carreras de Ingeniería de la Facultad de Ingeniería de la **Universidad Nacional del Nordeste (UNNE)**.

Este proyecto busca transformar el plan de estudios en una herramienta visual e interactiva, que permita saber rápidamente qué materias están aprobadas, cuáles están en curso, qué correlativas faltan y cuánto queda para completar la carrera.

---

## Carreras

Actualmente incluye las siguientes carreras:

### Ingeniería Civil

Con sus cuatro orientaciones:

- Proyecto de Estructuras en Obras Civiles
- Proyecto y Construcción de Obras Civiles
- Hidráulica
- Vías de Comunicación

### Ingeniería Electromecánica

Con sus tres opciones:

- Automática
- Fabricación
- Térmica

### Ingeniería Mecánica

Con la opción:

- Máquinas Agrícolas

---

## Funcionalidades

### Seguimiento de materias

Cada materia puede tener uno de los siguientes estados:

- Pendiente
- En curso
- Regular
- Aprobada

El progreso queda guardado localmente en el navegador.

### Correlativas dinámicas

La aplicación analiza automáticamente las correlativas de cada materia.

Si todavía no se cumplen los requisitos:

> 🔒 Materia bloqueada

Cuando se cumplen:

> ✓ Podés cursarla

---

### Estadísticas

Permite visualizar el avance de la carrera mediante:

- porcentaje de materias aprobadas
- materias pendientes
- materias en curso
- materias regularizadas
- avance general del plan
- progreso por año

---

### Mapa del plan

El plan de estudios también puede visualizarse mediante un mapa que permite identificar rápidamente:

- materias aprobadas
- materias en curso
- materias regularizadas
- materias pendientes
- materias bloqueadas
- materias disponibles para cursar

---

### Búsqueda y filtros

Incluye herramientas para encontrar rápidamente una materia y filtrar el plan según su estado.

También dispone de una vista:

- Compacta
- Cómoda

---

### Notas y fechas

Cada materia puede almacenar información adicional, como:

- nota
- fecha
- observaciones personales

---

### Importar y exportar

El progreso puede exportarse en formato JSON para guardar una copia.

También es posible importar posteriormente ese archivo para recuperar el estado del seguimiento.

## Tecnologías

El proyecto utiliza:

- React
- Vite
- JavaScript
- CSS
- LocalStorage
- JSON

---

## Estructura

```text
ingenieria-unne-tracker/
├── .gitignore
├── index.html
├── package.json
├── README.md
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx
    ├── styles.css
    ├── data/
    │   └── curriculum.js
    └── lib/
        └── storage.js
```
---

## Información académica

La información de los planes de estudio y sus correlatividades fue incorporada a partir de la documentación y resoluciones correspondientes utilizadas para construir el proyecto.

⚠️ **Importante**: este proyecto no es una aplicación oficial de la Universidad Nacional del Nordeste ni reemplaza la información publicada por la Facultad de Ingeniería.

A fines de tomar decisiones académicas importantes, se recomienda consultar siempre la normativa y los canales oficiales de la Facultad.

Desarrollado por **Santino Cuadra**.

Proyecto realizado con fines educativos y como herramienta personal para el seguimiento de carreras de Ingeniería.
