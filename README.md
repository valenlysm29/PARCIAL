# PARCIAL
# 🍽 Sazón — Sistema de Gestión de Restaurante

> *Alta Cocina Peruana · Aplicación Web Modular*

---

## 👥 Integrantes

| Integrante | Módulo asignado |
|---|---|
| Espinoza Mayta Adriana| Módulo 1 — Gestión de Platos |
| Palomino Lima Alessanda | Módulo 2 — Toma de Pedidos |
| Santos Almonte Jesilin | Módulo 3 — Tablero de Cocina |
| Rodriguez Zavaleta Valeria| Módulo 4 — Facturación y Cobro |

---

## 📋 Descripción del Sistema

**Sazón** es una aplicación web de gestión integral para restaurantes de cocina peruana, desarrollada como sistema multimódulo sin backend. Toda la información se persiste en el navegador mediante `localStorage`, lo que permite que los datos fluyan entre módulos y se mantengan intactos al recargar la página.

La interfaz sigue una estética de **alta cocina**: fondo oscuro profundo, acentos en dorado bronce, tipografía elegante y efectos de *glassmorphism* con `backdrop-blur`. Cada módulo es una página HTML independiente que comparte una hoja de estilos base y sus propios archivos CSS y JS específicos.

---

## 📁 Estructura de Archivos

```
sazon/
│
├── index.html              # Dashboard — Centro de control
├── platos.html             # Módulo 1 — Gestión de Platos
├── pedidos.html            # Módulo 2 — Toma de Pedidos
├── cocina.html             # Módulo 3 — Tablero de Cocina
├── facturacion.html        # Módulo 4 — Facturación y Cobro
│
├── css/
│   ├── base.css            # Estilos globales (variables, navbar, botones, forms…)
│   ├── dashboard.css       # Estilos del Dashboard e index
│   ├── platos.css          # Estilos específicos del módulo Platos
│   ├── pedidos.css         # Estilos específicos del módulo Pedidos
│   ├── cocina.css          # Estilos específicos del módulo Cocina
│   └── facturacion.css     # Estilos específicos del módulo Facturación
│
└── js/
    ├── utils.js            # Utilidades compartidas (Storage, toast, modal, helpers)
    ├── dashboard.js        # Lógica del Dashboard (contadores en tiempo real)
    ├── platos.js           # Lógica CRUD de platos
    ├── pedidos.js          # Lógica de toma y gestión de pedidos
    ├── cocina.js           # Lógica del tablero de cocina
    └── facturacion.js      # Lógica de facturación, IGV y cobro
```

---

## 🧩 Módulos Desarrollados

### 🏠 Dashboard (`index.html`)
Centro de control principal. Muestra 4 tarjetas interactivas con contadores en vivo (platos registrados, pedidos activos, pedidos en cocina y cuentas cerradas). Incluye un reloj con fecha y hora actualizados en tiempo real.

---

### 🍽 Módulo 1 — Gestión de Platos (`platos.html`)
CRUD completo del menú del restaurante.

- Registro con código único autogenerado (`PL001`, `PL002`…)
- Validaciones estrictas: código sin espacios, nombre de 3–60 chars (no solo números), descripción de 10–250 chars, precio mayor a 0, tiempo de preparación entre 1 y 120 minutos
- Categorías: Entrada, Fondo, Postre, Bebida, Especial
- Gestión de alérgenos con selección múltiple: si se marca "Ninguno" se deshabilitan los demás; si se marca "Otro" se habilita un campo obligatorio
- Estados Activo / Inactivo
- Filtros por nombre, categoría y estado
- Eliminación bloqueada si el plato tiene pedidos asociados
- Persistencia en `localStorage`

---

### 📋 Módulo 2 — Toma de Pedidos (`pedidos.html`)
Registro de pedidos por mesa y mozo.

- Código de pedido autogenerado (`PED001`, `PED002`…)
- Selección de mesa (1–50) y mozo (mín. 3 caracteres)
- Solo se listan platos con estado **Activo**
- Múltiples platos por pedido con control de cantidad y observación especial por ítem
- Sistema de prioridades: Normal, Alta, Urgente — si es Urgente exige justificación de mínimo 10 caracteres
- Subtotal por plato y total general calculados en tiempo real
- Cancelación de pedidos desde el historial

---

### 👨‍🍳 Módulo 3 — Tablero de Cocina (`cocina.html`)
Panel de producción en tiempo real.

- Lista todos los pedidos enviados (excluye cancelados y entregados)
- Muestra: mesa, mozo, lista de platos, alérgenos resaltados, observaciones y prioridad
- Flujo de estados: **Pendiente → En Preparación → Listo para servir → Entregado**, avanzable por ítem individual o por pedido completo
- Los pedidos **Urgentes** parpadean con borde dorado animado
- Los pedidos se ordenan por prioridad (Urgente primero)
- Auto-actualización cada 15 segundos

---

### 💳 Módulo 4 — Facturación y Cobro (`facturacion.html`)
Cierre de cuenta y registro de pago.

- Búsqueda por número de mesa; solo muestra pedidos con estado **Entregado**
- Cálculo automático de Subtotal, IGV (18%) y Total
- Descuentos con validación (no negativos, no superiores al subtotal) y justificación obligatoria (mín. 10 chars)
- Métodos de pago: Efectivo, Tarjeta, Yape/Plin
- Si el pago es en efectivo, calcula el vuelto y valida que el monto recibido sea suficiente
- La cuenta queda marcada como **Pagada** y se bloquea para ediciones posteriores
- Historial de cuentas cerradas

---

## ▶ Instrucciones para Ejecutar el Proyecto

El proyecto no requiere instalación ni servidor. Solo necesitas un navegador moderno (Chrome, Edge o Firefox recomendado).

**Pasos:**

1. Descarga o clona la carpeta `sazon/` completa, asegurándote de mantener la estructura de archivos intacta.

2. Abre el archivo `index.html` directamente en tu navegador haciendo doble clic, o arrastrándolo a una pestaña del navegador.

3. Navega entre los módulos usando la barra de navegación fija en la parte superior.

> ⚠️ **Importante:** todos los archivos deben estar en la **misma carpeta** para que los enlaces relativos a CSS y JS funcionen correctamente. No muevas archivos individualmente.

> 💡 **Tip:** para una experiencia óptima, usa Google Chrome o Microsoft Edge en su versión más reciente. El proyecto hace uso de `backdrop-filter` y `localStorage`, ambos soportados por estos navegadores.

---

## 🔗 Flujo de Datos entre Módulos

```
Módulo 1 (Platos)
    └─► guarda en localStorage["sazon_platos"]
            │
            ▼
Módulo 2 (Pedidos)  ──► lee platos activos ──► guarda en localStorage["sazon_pedidos"]
            │
            ▼
Módulo 3 (Cocina)   ──► lee y actualiza estados de pedidos
            │
            ▼
Módulo 4 (Facturación) ──► lee pedidos entregados ──► guarda en localStorage["sazon_facturas"]
```

---

## 🛠 Tecnologías Utilizadas

- **HTML5** — estructura semántica modular
- **CSS3** — glassmorphism, animaciones, variables CSS, gradientes
- **JavaScript ES6+** — módulos independientes por página, sin frameworks
- **localStorage** — persistencia de datos entre módulos y sesiones
- **Animate.css 4** — transiciones y entradas de elementos
- **Google Fonts** — Playfair Display, Cormorant Garamond, Jost

---

*Proyecto académico parcial — Ingeniería Industrial · 2026*
