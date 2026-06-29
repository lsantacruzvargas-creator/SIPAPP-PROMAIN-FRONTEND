# PROMAIN PERU SAC — Frontend

SPA React para el ERP de PROMAIN PERU SAC. Gestiona Órdenes de Trabajo, flujo comercial y reportes.

## Stack

- **React 19** + **Vite 8** (ESM)
- **React Router v7** — `HashRouter` (compatible con Cloudflare Pages sin configuración extra)
- **Tailwind CSS v3**
- Auth: JWT en `localStorage` con claves `promain_token` / `promain_usuario`

## Requisitos previos

- Node.js ≥ 20
- Backend corriendo (local o Railway)

## Instalación local

```bash
cd Frontend
npm install
```

Crear `.env` (nunca subir al repo):

```env
VITE_API_URL=http://localhost:3001
# Producción:
# VITE_API_URL=https://sipapp-promain-backend-production.up.railway.app
```

```bash
npm run dev      # http://localhost:5173
npm run build    # dist/ listo para deploy
```

## Estructura

```
Frontend/src/
├── utils/
│   └── fetchAuth.js       # BASE URL, getToken, getUsuario, logout, fetchAuth
├── components/
│   ├── Login.jsx
│   ├── Navbar.jsx          # Responsive, oculta links comerciales al rol tecnico
│   ├── Dashboard.jsx       # Kanban OTs + KPIs financieros (ocultos al tecnico)
│   ├── TablaOTs.jsx        # Lista OTs con filtros, badge estado, botón Anular
│   ├── FormOT.jsx          # Crear/editar OT — campos condicionales por tipo
│   ├── DetalleOT.jsx       # Ítems, compras, galería imágenes, lista archivos
│   ├── TablaClientes.jsx
│   ├── GestionUsuarios.jsx # Solo admin
│   ├── TablaCotizaciones.jsx  # → navega a OC o Factura con state
│   ├── TablaOrdenesCompra.jsx # Lee location.state.cotizacion para pre-seleccionar
│   └── TablaFacturas.jsx      # Modal de pago, detracción, estadoPago badges
└── App.jsx                # HashRouter + componente Protegida + Layout
```

## Rutas React

| Ruta | Roles | Componente |
|------|-------|-----------|
| `/login` | público | Login |
| `/dashboard` | admin, ejecutivo, encargado | Dashboard |
| `/ots` | todos | TablaOTs |
| `/ots/nueva/:tipo` | admin, ejecutivo | FormOT |
| `/ots/editar` | admin, ejecutivo | FormOT (recibe OT por `location.state`) |
| `/ots/:id` | todos | DetalleOT |
| `/clientes` | admin, ejecutivo, encargado | TablaClientes |
| `/cotizaciones` | admin, ejecutivo, encargado | TablaCotizaciones |
| `/ordenes-compra` | admin, ejecutivo, encargado | TablaOrdenesCompra |
| `/facturas` | admin, ejecutivo, encargado | TablaFacturas |
| `/usuarios` | admin | GestionUsuarios |

## Patrones de código

### fetchAuth
Toda llamada al API pasa por `fetchAuth` en lugar de `fetch` directamente:
```js
import { fetchAuth } from "../utils/fetchAuth.js";

const res = await fetchAuth("/api/ots", {
  method: "POST",
  body: JSON.stringify(data),
});
```
- Inyecta `Authorization: Bearer <token>` automáticamente
- Si la respuesta es 401 → limpia localStorage y redirige a `/login`
- Si el body es `FormData` → omite `Content-Type` (el navegador lo pone con el boundary)

### Estado de formularios
Un solo `useState` con objeto + `handleChange` genérico:
```js
const [form, setForm] = useState({ campo1: "", campo2: "" });
const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
```

### Navegación con estado (cross-linking)
Para pasar un objeto al formulario de edición o pre-seleccionar datos:
```js
navigate("/ordenes-compra", { state: { cotizacion: cot } });
// En el destino:
const { cotizacion } = useLocation().state || {};
```

### Carga en paralelo
Cuando los recursos son independientes:
```js
const [ots, clientes] = await Promise.all([
  fetchAuth("/api/ots").then(r => r.json()),
  fetchAuth("/api/clientes").then(r => r.json()),
]);
```

### Rol técnico
- No ve columnas de precio, monto, costos ni margen en TablaOTs ni DetalleOT
- No ve el Dashboard ni módulos comerciales
- `App.jsx` usa `rolesPermitidos` para redirigir a `/ots` si el rol no está autorizado

## Roles

| Rol | Dashboard | OTs ver | OTs crear/editar | Comercial | Clientes | Usuarios |
|-----|-----------|---------|-----------------|-----------|----------|----------|
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ejecutivo | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| encargado | ✅ | ✅ solo lectura | ❌ | ✅ | ✅ | ❌ |
| tecnico | ❌ | ✅ sin precios | ❌ | ❌ | ❌ | ❌ |

## Módulo comercial — flujo

```
TablaCotizaciones
  └─ botón "+ OC"      → navigate("/ordenes-compra", { state: { cotizacion } })
  └─ botón "+ Factura" → navigate("/facturas",       { state: { cotizacion } })

TablaFacturas
  └─ modal de pago → PATCH /api/facturas/:id/pago
     recalcula: estadoPago = sin_pago | pago_parcial | pagado
  └─ detracción 12% para cotizaciones tipo "servicio" (SUNAT SPOT)
```

## Deploy en Cloudflare Pages

1. Conectar repo GitHub → rama `main` → directorio raíz `Frontend/`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Variable de entorno en Cloudflare Pages:
   ```
   VITE_API_URL=https://<tu-backend>.up.railway.app
   ```
5. `HashRouter` no requiere `_redirects` ni configuración extra de rutas en Cloudflare.
