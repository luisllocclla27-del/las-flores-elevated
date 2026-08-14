# Análisis técnico — Web Restaurante Las Flores

**Fecha:** 13 de agosto de 2026
**Alcance analizado:** 95 archivos (todo `src/`, `supabase/`, configuración raíz y `scripts/build-static.js`). No se auditaron los binarios de `public/` ni `node_modules`.
**Stack:** TanStack Start 1.168 + React 19.2 + TypeScript 5.8 + Tailwind 4 + Supabase (Postgres, Auth, Storage, Edge Functions) + Vercel. 25.086 líneas TS/TSX en 79 archivos.

---

## Veredicto en una página

La aplicación es **funcionalmente ambiciosa y está muy completa** para el tamaño del equipo: carta en vivo, carrito con geolocalización y cálculo de delivery por distancia, reservas por zona con blackouts, panel de caja con Kanban y realtime, panel admin con analítica, módulo de empleo con RPC y CVs privados, rastreo público de pedidos y panel de motorizado. El módulo `features/jobs/` está hecho **muy bien** (RPC `SECURITY DEFINER`, `REVOKE INSERT`, bucket privado con límite de tamaño y MIME, URLs firmadas de 60 s, 13 tests) y es la prueba de que el equipo sabe hacerlo correctamente.

El problema es que **ese estándar no se aplicó al resto**. La seguridad del sistema descansa entera en las políticas RLS de Supabase, y esas políticas están abiertas. Hay tres cosas que un atacante puede hacer **hoy, sin herramientas especiales**:

1. **Convertirse en administrador** registrándose con cualquier Gmail y ejecutando una sola petición HTTP.
2. **Descargar la base de datos completa de clientes** — nombre, correo, teléfono, dirección exacta, coordenadas GPS e importe de cada pedido.
3. **Pedir comida real por S/ 0,01**, porque el precio y el total se calculan en el navegador y el servidor los acepta sin recalcular.

Además hay **dos funciones del panel admin que están rotas y crashean al abrirse** (gestión de zonas y bloqueo de fechas), y el flujo de reservas puede **decirle al cliente que su mesa está confirmada cuando no se guardó nada**.

Nada de esto es difícil de arreglar. La mayoría son cambios de pocas líneas en SQL y en dos o tres archivos. Lo urgente es el orden.

---

# P0 — Crítico: arreglar esta semana

## 1. Escalada de privilegios: cualquier usuario registrado puede hacerse admin

`supabase/storage_and_rls.sql:26-28`

```sql
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);
```

La política verifica *qué fila* puedes actualizar, pero no *qué columnas*. Y `profiles.role` acepta `'admin'` (`schema.sql:20`).

**Cómo se explota.** Registrarse con cualquier correo (el registro es abierto: Google, Facebook y email/contraseña con 6 caracteres mínimo), y ejecutar:

```
PATCH /rest/v1/profiles?id=eq.<mi_uuid>
Body: {"role":"admin"}
```

Listo. `/admin` y `/caja` verifican el rol leyendo esa misma tabla (`admin.tsx:117-126`, `caja.tsx:153-160`), así que el atacante entra al panel completo: carta, precios, pedidos, reservas, cupones, analítica y postulaciones con CVs.

**Arreglo.** Quitar `role` del alcance del usuario. La forma más simple y robusta:

```sql
DROP POLICY "Usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "perfil_propio_sin_rol" ON public.profiles FOR UPDATE
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));
```

Y adicionalmente `REVOKE UPDATE (role) ON public.profiles FROM authenticated;` como segunda barrera. Después, **auditar la tabla ahora mismo**: `SELECT id, email, role FROM profiles WHERE role <> 'client';` — si hay cuentas admin que no reconoces, ya ocurrió.

---

## 2. Fuga masiva de datos personales: `orders`, `reservations` y `profiles` son de lectura pública

`supabase/scratch/rls_policies.sql:22, 34` y `supabase/storage_and_rls.sql:22, 74, 108`

```sql
CREATE POLICY "Permitir lectura de orden propia o por ID" ON public.orders
FOR SELECT USING (true);          -- ← cualquiera, sin sesión

CREATE POLICY "Permitir lectura de reservas" ON public.reservations
FOR SELECT USING (true);

CREATE POLICY "Profiles son visibles públicamente" ON public.profiles
FOR SELECT USING (true);
```

La clave anon de Supabase es pública por diseño y además está hardcodeada en `src/lib/supabase.ts:5`, así que cualquiera la extrae del bundle. Con ella:

```
GET /rest/v1/orders?select=*      → todos los pedidos: client_name, client_email,
                                     client_phone, address, reference, latitude,
                                     longitude, total, payment_method, driver_pin
GET /rest/v1/reservations?select=* → todas las reservas con datos de contacto
GET /rest/v1/profiles?select=*     → todos los usuarios, sus correos, teléfonos y roles
```

**Por qué importa más de lo que parece.** Esto no es solo un incumplimiento de la Ley 29733 de Protección de Datos Personales (que aplica: son datos identificables de peruanos, tratados sin medidas de seguridad adecuadas, con sanciones de hasta 100 UIT). Es un riesgo físico para los clientes: la combinación *dirección exacta + hora de entrega + total en efectivo* es exactamente la información que se necesita para planear un asalto. El comentario del código dice que la política es "para la pantalla de rastreo", pero el efecto real es un volcado completo.

**Arreglo.** Reemplazar por políticas por titular, y mover el rastreo público a un token:

```sql
DROP POLICY "Permitir lectura de orden propia o por ID" ON public.orders;
CREATE POLICY "orders_select_propio_o_staff" ON public.orders FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff'))
  );
```

Para el rastreo de invitados: añadir una columna `tracking_token uuid DEFAULT gen_random_uuid()`, usar `/rastreo/<order_id>?t=<token>` y servirlo con una RPC `SECURITY DEFINER` que devuelva solo `status`, `order_number` y ETA — nunca dirección ni total. Igual para `reservations`. Para `profiles`, restringir a `id = auth.uid() OR is_admin()`.

---

## 3. El panel de motorizado tiene PINs maestros hardcodeados

`src/routes/d/$orderId.tsx:235-241`

```js
if (
  cleanInput === "2026" ||
  cleanInput === "1234" ||
  (exactDriverPin && cleanInput === String(exactDriverPin).trim()) ||
  (phoneLast4 && cleanInput === phoneLast4) ||
  (orderLast4 && cleanInput.toUpperCase() === orderLast4.toUpperCase())
) {
  localStorage.setItem(`driver_auth_${orderId}`, "true");
```

Son **cinco** puertas y cuatro no deberían existir. Cualquiera que abra `/d/<id>` y escriba `2026` entra al panel de reparto de ese pedido: nombre, teléfono, dirección, referencia, GPS, comanda y monto a cobrar en efectivo. Y puede marcar el pedido como entregado.

Hay tres agravantes que se refuerzan entre sí:

- **El PIN viaja al navegador antes de pedirlo.** `d/$orderId.tsx:51-55` hace `select("*, order_items(*)")` — que incluye `driver_pin` — en el `useEffect` de carga, mientras que la pantalla de PIN está en la línea 251. El PIN ya está en la pestaña Network de DevTools. La verificación es una comparación de strings en JavaScript, es decorativa.
- **La sesión se guarda como un booleano en localStorage** (línea 242). `localStorage.setItem('driver_auth_<cualquier-uuid>','true')` + recargar = acceso sin PIN.
- **Los UUID no hay que adivinarlos**: el hallazgo #2 los entrega en bloque con `GET /rest/v1/orders?select=id`.

Y el PIN se genera con `Math.random()` **en el navegador del cliente** (`src/lib/supabase.ts:401-404`), sin límite de intentos: 9.000 combinaciones se agotan en segundos. Si el reintento de `createOrder` elimina la columna `driver_pin` (`supabase.ts:434`), `whatsappDispatch.ts:38` anuncia el PIN `"1234"` — que coincide con el backdoor.

**Arreglo.** Borrar los literales `"2026"`, `"1234"`, `phoneLast4` y `orderLast4`. Mover `driver_pin` a una tabla sin política de SELECT (o revocar el privilegio de columna para `anon`), guardarlo hasheado, generarlo en Postgres con `gen_random_bytes`, y validarlo en una RPC `SECURITY DEFINER` que devuelva un token de corta duración. Añadir bloqueo tras 5 intentos.

---

## 4. Manipulación de precios: se puede pedir por S/ 0,01

`src/context/CartContext.tsx:47-52, 117` → `src/components/CartSidebar.tsx:388, 461-489` → `src/lib/supabase.ts:411-419`

El carrito se rehidrata desde `localStorage` sin validar nada:

```js
const saved = localStorage.getItem("las_flores_cart");
const parsed = JSON.parse(saved);
if (Array.isArray(parsed)) setItems(parsed);   // el precio viene de aquí
```

El total se calcula en el navegador (`CartSidebar.tsx:388`: `Math.max(0, totalPrice - discountAmount + DELIVERY_FEE)`) y se envía tal cual. Y `createOrder` **inserta literalmente lo que recibe**: no vuelve a leer `products.price` en ningún momento. La única comprobación previa al pago (`CartSidebar.tsx:429-434`) consulta `is_available`, nunca `price`.

**Cómo se explota.** En la consola del navegador:

```js
localStorage.setItem('las_flores_cart', JSON.stringify(
  [{id:'x', name:'Puca Picante', price:0.01, quantity:1}]));
location.reload();
```

Checkout con "efectivo" → se crea un pedido real, con comanda real, que llega a cocina y que el motorizado cobrará a S/ 0,01. El `delivery_fee` es igualmente manipulable falseando las coordenadas GPS que se envían para reducir `distance_km`.

**Arreglo.** Es el cambio estructural más importante del informe: el pedido debe crearse en el servidor. Una RPC `SECURITY DEFINER` (o Edge Function) que reciba **solo** `[{product_id, quantity}]`, el código de cupón y las coordenadas; que lea los precios de `products`, calcule delivery con la lógica de `deliveryUtils.ts`, valide el cupón, escriba `orders` + `order_items` y devuelva el pedido. Luego **revocar el INSERT directo de `anon` sobre `orders` y `order_items`**. El patrón ya existe y funciona en el proyecto: `supabase/jobs.sql:114-191` (`submit_job_application`).

---

## 5. Relay de correo abierto: se puede enviar phishing firmado con el dominio del restaurante

`supabase/functions/send-email/index.ts:3-6, 17, 33-39`

```ts
const corsHeaders = { "Access-Control-Allow-Origin": "*", ... };
const { to, subject, html, from, replyTo } = await req.json();
body: JSON.stringify({ from: from || "...", to, subject, html })
```

La función acepta del cliente el remitente, el destinatario y el **HTML completo**. No hay allowlist de `from`, ni de `to`, ni sanitización, ni rate limiting. Aunque `verify_jwt` esté activo, la clave anon *es* un JWT válido y es pública.

**Cómo se explota.** Un `curl` con la anon key basta para enviar correos desde `pedidos@restaurantelasflores.com` a cualquier dirección, con **SPF y DKIM válidos del dominio real**, vía la cuenta de Resend del restaurante. Consecuencias: campaña de phishing atribuible al restaurante, quema de la reputación del dominio (después de eso los correos legítimos de confirmación caen en spam), agotamiento de la cuota y posible suspensión de la cuenta Resend. El reintento a `onboarding@resend.dev` (líneas 47-61) permite además saltarse la validación de dominio.

**Arreglo.** En la Edge Function: fijar `from` server-side desde una lista blanca ignorando el body; no aceptar `html` arbitrario — recibir `{template, params}` y renderizar la plantilla en el servidor con escaping; restringir `Access-Control-Allow-Origin` al dominio propio; exigir JWT de usuario real o secreto compartido; rate limit por IP.

---

## 6. Dos juegos de políticas RLS en conflicto, y gana el permisivo

`supabase/scratch/rls_policies.sql:24-25, 42-43`

```sql
CREATE POLICY "Permitir actualización de pedidos a personal autenticado" ON public.orders
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Modificación de productos solo autenticados" ON public.products
FOR ALL USING (auth.role() = 'authenticated');
```

`auth.role() = 'authenticated'` **no significa "personal"**: significa cualquiera con una sesión, y el registro es abierto. `FOR ALL` incluye `DELETE`. Y como las políticas de Postgres se combinan con OR, si este script se ejecutó junto al de `storage_and_rls.sql` (que sí exige rol `admin`/`staff`), **la permisiva gana**.

**Cómo se explota.** Registrarse con cualquier Gmail y: `PATCH /rest/v1/products` con `{"price":0.10}` sobre toda la carta; `DELETE /rest/v1/products` para vaciarla; `PATCH /rest/v1/orders` con `{"status":"cancelled"}` sobre los pedidos del día.

**Arreglo.** Auditar qué está realmente aplicado en producción — `SELECT * FROM pg_policies WHERE schemaname='public';` — y hacer `DROP POLICY` de estas tres. Dejar solo las basadas en `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN (...))`, siempre con `WITH CHECK` además de `USING`. Mejor: usar la función `public.is_admin()` que ya existe y está bien hecha en `jobs.sql:71-87`. Y sacar ese archivo de `scratch/` — un directorio llamado "borrador" no debe contener las políticas de seguridad de producción.

**Falta por completo la RLS de `coupons`**: no hay ninguna política en el repo, y el cliente hace `UPDATE` sobre esa tabla (`CartSidebar.tsx:527-533`), lo que sugiere que está abierta. Si lo está: `PATCH /rest/v1/coupons` con `{"discount_value":100}`.

---

# P1 — Alto: arreglar este mes

## Funcionalidad rota

**7. Editar zonas y crear bloqueos de fecha crashean al abrirse.** `AdminZoneModal.tsx:14` y `AdminBlackoutModal.tsx:14` hacen `if (!isOpen || !zone) return null;` **antes** de sus 7-8 hooks, y el padre los monta siempre (`AdminZonesSection.tsx:320, 330` pasan `isOpen` como prop). Al pasar de `false` a `true`, React va de 0 hooks a 8 → *"Rendered more hooks than during the previous render"*. Son **dos funciones del panel admin que hoy no funcionan**. Arreglo: mover el `return null` después de los hooks, o montar condicionalmente en el padre (`{isZoneModalOpen && <AdminZoneModal ... />}`). ESLint ya lo reporta 16 veces.

**8. Las reservas pueden confirmarse sin guardarse.** `src/lib/supabase.ts:376-377`:

```js
console.warn("Retornando confirmación local de reserva resiliente.");
return { id: `RES-${Date.now()}`, ...payload };
```

Tras dos intentos fallidos devuelve un objeto sintético. `reservas.tsx:493` lo trata como éxito: suena el chime, se envía el correo de "Confirmación Oficial de Reserva" y se muestra el código. **El cliente llega al restaurante con una reserva que nunca existió.** Lo mismo en `reservas.tsx:546-551`, `contacto.tsx:109-113` (`alert("...pero se ha procesado correctamente")`) y `eventos.tsx:166-175`. Arreglo: eliminar los fallbacks sintéticos y propagar el error. Un "no pudimos guardar tu reserva, llámanos al 980 723 422" es infinitamente mejor que una confirmación falsa.

**9. `sendEmail` siempre devuelve `true`.** `emailService.ts:32-62`: el `error` de `functions.invoke` se descarta, el `catch` está vacío y la función termina en `return true`. El `false` es inalcanzable. Los correos de confirmación pueden no salir nunca sin ninguna señal.

**10. El descuento nunca se guarda en el pedido.** `CartSidebar.tsx:452-489` envía `subtotal`, `delivery_fee` y `total`, pero **no** `discount_amount` ni `coupon_code`. Sin embargo `AdminAnalyticsSection.tsx:122-123` y `CashierAuditModal.tsx:53` los leen. Resultado: el total descontado y los "pedidos con cupón" del panel admin y del arqueo de caja **siempre reportan cero**.

**11. El contador de usos de cupón nunca se incrementa.** `CartSidebar.tsx:527` — `supabase.rpc(...).catch(...)`. `.rpc()` no expone `.catch` (es un error real de `tsc`: TS2551), y Supabase devuelve errores en `{error}` en lugar de lanzarlos. El fallback es código muerto: si la RPC no existe, `max_uses` deja de aplicarse y un cupón de un uso se usa infinitas veces.

**12. `order_items` se rompe silenciosamente al mes de operación.** `admin.tsx:166-168` y `caja.tsx:204-206`:

```js
const { data: itemsData } = await supabase
  .from("order_items")
  .select("*, products(name, image_url)");   // sin filtro, sin límite
```

Es la única consulta del proyecto sin ningún filtro (sus hermanas sí usan `.gte()` y `.limit()`). PostgREST corta en 1.000 filas por defecto. A ~3 ítems por pedido, esa tabla llega a 1.000 filas en aproximadamente un mes — y desde ese momento **los ítems de los pedidos recientes dejan de aparecer en caja y en admin**. Arreglo: `.in("order_id", ordData.map(o => o.id))`, o mejor embeberlos en la consulta de `orders` (`select("*, order_items(*, products(name, image_url))")`), lo que además elimina una consulta del ciclo.

## Seguridad de segundo nivel

**13. Cupones validados 100 % en el navegador.** `CartSidebar.tsx:325-388`: `is_active`, `max_uses`, `min_order_total` y la restricción por tipo de pedido son todos `if` en JavaScript, y el descuento se calcula en el cliente. Tampoco se comprueba ninguna fecha de vigencia (`valid_from`/`valid_until` no se usan) ni hay tope al descuento porcentual. Además `GET /rest/v1/coupons?select=*` lista todos los códigos, incluidos los inactivos y los de campañas futuras. Se resuelve con la misma RPC del hallazgo #4.

**14. Inyección de HTML en los correos.** `emailService.ts:78, 113, 148, 228, 246, 270, 335-339` interpola datos del usuario sin escapar. El más grave es `:339` — el `message` del formulario de contacto. Un atacante envía un mensaje con `</p><a href="https://phishing.tld">Valide su cuenta de administrador</a>` y el correo llega a `contacto@restaurantelasflores.com` desde el propio dominio, con DKIM válido, pareciendo una notificación legítima del sistema. Arreglo: una función `escapeHtml()` en cada interpolación, o mejor mover el renderizado de plantillas a la Edge Function (hallazgo #5).

**15. Faltan todas las cabeceras de seguridad.** `vercel.json` solo define `Cache-Control`. Sin `X-Frame-Options`/`frame-ancestors`, un sitio malicioso embebe `/admin`, `/caja` o `/d/<id>` en un iframe transparente y hace clickjacking sobre "Confirmar entrega" o "Cancelar pedido". Sin `Referrer-Policy`, el `orderId` del panel de motorizado se filtra a Google Maps y Waze en la cabecera `Referer` (`d/$orderId.tsx:481-502`). Sin CSP, cualquier XSS futuro puede exfiltrar la sesión de Supabase desde `localStorage`. Bloque a añadir:

```json
{"key":"Strict-Transport-Security","value":"max-age=63072000; includeSubDomains; preload"},
{"key":"X-Frame-Options","value":"DENY"},
{"key":"X-Content-Type-Options","value":"nosniff"},
{"key":"Referrer-Policy","value":"strict-origin-when-cross-origin"},
{"key":"Permissions-Policy","value":"geolocation=(self), camera=(), microphone=()"},
{"key":"Content-Security-Policy","value":"default-src 'self'; connect-src 'self' https://*.supabase.co https://api.maptiler.com https://maps.googleapis.com; img-src 'self' data: blob: https:; script-src 'self' 'unsafe-inline' https://maps.googleapis.com; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"}
```

(`geolocation` debe permitirse en `self`: el checkout la usa.)

**16. Clave de Google Maps posiblemente sin restringir.** El propio comentario de `GoogleTrackingMap.tsx:123-124` admite que "funcionará si la key no tiene restricciones estrictas". Las claves `VITE_` son públicas por diseño — eso está bien — pero **la restricción es obligatoria**. Rotar la clave, restringirla por referrer HTTP a `restaurantelasflores.com/*` y solo a la Maps JavaScript API, y poner un tope de cuota diaria. Si no, cualquiera la extrae del bundle y consume presupuesto facturable. El `.env.local` también contiene un `VERCEL_OIDC_TOKEN` vivo: conviene rotarlo y no distribuir ese archivo (el `.gitignore` lo excluye correctamente, pero viaja en la copia de trabajo).

**17. Buckets de Storage públicos y sin restricciones.** `storage_and_rls.sql:124-130, 155-161`: `menu-images` y `user-avatars` son `public = true`, sin `file_size_limit`, sin `allowed_mime_types`, y la política "usuarios pueden subir su propio avatar" no valida la carpeta contra `auth.uid()`. Cualquier usuario registrado sube un `.svg` con JavaScript y obtiene phishing alojado en la infraestructura del restaurante. Contrasta con `jobs.sql:220-241`, donde está hecho correctamente. Arreglo:

```sql
UPDATE storage.buckets SET file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp']
WHERE id IN ('user-avatars','menu-images');
```

y añadir `AND (storage.foldername(name))[1] = auth.uid()::text` al `WITH CHECK`. Nota aparte: `AdminProductModal.tsx:187` sube al bucket `'products'`, que **no está declarado en ninguna migración** — sus políticas y límites son desconocidos y no versionados.

**18. Formularios públicos sin anti-abuso.** `contacto.tsx:84-89` lee valores del DOM sin validar ni truncar; solo hay `required` en HTML (que se salta con `curl`). Sin CAPTCHA, sin rate limit, sin verificación de propiedad del correo. Se puede inundar `contact_messages` y `reservations`, y **reservar mesas a nombre de terceros usando su correo real** — el sistema les envía la confirmación oficial sin verificar nada. Añadir Turnstile o hCaptcha y validación server-side.

---

# P2 — Rendimiento

Mediciones reales de un `vite build` ejecutado sobre una copia del proyecto.

## Bundle inicial de la home: ~917 KB crudos / ~267 KB gzip

| Chunk | Crudo | Gzip |
|---|---|---|
| `index` (entry: `__root` + CartSidebar + CustomerHistoryModal + LoginModal) | 259,6 KB | 75,0 KB |
| `vendor-supabase` | 203,2 KB | 52,0 KB |
| `vendor-react` (incluye react-leaflet) | 188,9 KB | 58,4 KB |
| **`vendor-maps` (leaflet)** | **151,4 KB** | **47,3 KB** |
| `vendor-icons` (lucide) | 27,0 KB | 9,6 KB |
| chunk de la ruta `/` | 86,0 KB | 24,2 KB |
| `styles.css` (bloqueante) | 149,8 KB | 22,5 KB |

**19. Leaflet (166 KB) entra en el bundle de TODAS las páginas — y es un arreglo de una línea.** `LocationSelector.tsx:43` hace correctamente `import()` dinámico, pero `vite.config.ts:29` lo anula: `id.includes("node_modules/react")` **también hace match con `node_modules/react-leaflet`**, que acaba dentro de `vendor-react` (chunk crítico). El bundle compilado lo confirma: el entry tiene un `import` **estático** de `vendor-maps`. Resultado: 151 KB de JS + 15 KB de CSS de mapas se descargan en la home, donde el mapa solo aparece en el paso de delivery del carrito.

Arreglo — anclar el patrón y mover react-leaflet:

```js
if (id.includes("/node_modules/react/") || id.includes("/node_modules/react-dom/")) return "vendor-react";
if (id.includes("/node_modules/leaflet") || id.includes("/node_modules/react-leaflet")) return "vendor-maps";
```

**Ganancia: -166 KB crudos / -50 KB gzip del critical path de todas las rutas (≈ -19 % del JS inicial), por 10 minutos de trabajo.**

**20. `CartSidebar` (1.537 líneas, 68 KB) está montado en el root.** `__root.tsx:326`. Arrastra al entry `CustomerHistoryModal` (887 líneas), `LoginModal`, `LocationSelector` y `emailService`. Y **ejecuta en todas las páginas aunque el carrito esté cerrado**: `CartSidebar.tsx:133-225` es un `useEffect` de 92 líneas que llama `supabase.auth.getSession()` y registra 4 listeners globales. Es decir, una petición de sesión a Supabase en cada carga de `/galeria`. Además `site-footer.tsx:17`, `UserAuthButton.tsx:64` y `CartSidebar.tsx:135` consultan la sesión por separado: **3 consultas de auth duplicadas por página**. Arreglo: `React.lazy` montado solo cuando `isOpen || items.length > 0`, y un provider de sesión compartido. Ganancia: -100 KB del entry, -2 consultas por página.

## Realtime: ~3.900 consultas por hora en horario de almuerzo

**21. Cada evento de realtime refetchea el dashboard completo, sin debounce.** `admin.tsx:92-103` suscribe 4 tablas con `event: "*"` y cada una llama `fetchData()`, que lanza **7 consultas**. `caja.tsx:266-297` hace lo mismo con 3 tablas y **3 consultas**. `grep -rni "debounce\|throttle" src` → **0 resultados**.

Con ~60 pedidos/hora × 4 transiciones de estado ≈ 300 eventos/hora en `orders`:

| Pestaña abierta | Consultas/hora | Egress/hora |
|---|---|---|
| `/admin` × 1 | ≈ 2.100 | 90-150 MB |
| `/caja` × 1 | ≈ 900 | 75-90 MB |
| **1 admin + 2 pantallas de caja** | **≈ 3.900** | **≈ 250 MB** |

Agravantes: `caja.tsx:333` hace `await fetchData()` **y además** el `UPDATE` dispara el handler de realtime → **doble refetch (6 consultas) por cada clic de estado**. Un cambio de precio de un producto refetchea pedidos, reservas y cupones. Y los payloads de realtime (`payload.new`) se descartan, cuando podrían aplicarse como delta al estado local sin ninguna consulta.

Arreglo: debounce de 300-800 ms, aplicar el delta de `payload.new` en lugar de refetchear, canales separados por tabla que solo refresquen su slice, y quitar el `await fetchData()` redundante. **Ganancia: -90 % de consultas y -95 % de egress.**

**22. Bucle de retroalimentación en caja.** `caja.tsx:227-230` hace un `UPDATE` por cada reserva vencida, sin `await`, **en cada `fetchData()`** (≈900 veces/hora). Cada `UPDATE` genera un evento de realtime en `reservations` que dispara otro `fetchData()`. Arreglo: un solo `.update(...).in("id", ids)`, ejecutado una vez al montar, o un cron en Postgres.

**23. Menú en vivo: un canal WebSocket por cliente navegando.** `liveProducts.ts:220-237` suscribe `products` y `categories` con `event:"*"` y refetchea 2 consultas sin límite. `MenuModal` está montado en la home, `/carta`, `/restaurante`, `/eventos` y `/familia-las-flores`, así que **cada visitante mantiene un canal abierto**. Si el admin edita 10 platos, cada cliente conectado dispara 20 consultas. Y el nombre de canal se genera con `Date.now()+Math.random()` (línea 222), así que nunca se reutiliza: cada montaje abre un WebSocket nuevo.

## Renderizado

**24. Cero `React.memo` en todo el proyecto**, y un O(N×M) en el camino caliente. `CashierOrderCard.tsx:35` hace `orderItems.filter(item => item.order_id === order.id)` **por tarjeta y por render**: con 200 pedidos × 1.000 order_items = 200.000 comparaciones por render, × ~900 renders/hora de realtime ≈ **180 millones de comparaciones por hora** en la pestaña de caja. Arreglo: construir un `Map<order_id, items[]>` una vez con `useMemo` (O(N+M)).

Además: `CashierOrderCard.tsx:31` crea un `setInterval` de 30 s **por tarjeta** (60 comandas = 60 timers y 60 re-renders escalonados); `admin.tsx:271-297` recalcula `filteredReservations`, `filteredOrders` y `filteredProducts` en cada pulsación de tecla sin `useMemo` ni debounce; y no hay virtualización en listas de hasta 500 pedidos. **Ganancia estimada: -75 % de tiempo de scripting en `/caja` y `/admin`.**

## SEO y primera carga

**25. Todas las rutas sirven el HTML de la portada.** Esto merece explicación porque es sutil. `scripts/build-static.js` levanta un `vite preview`, hace `GET /` una sola vez, y guarda **esa** respuesta como `dist/index.html`. Luego `vercel.json:22-26` reescribe **todas** las URLs a `/index.html`.

Consecuencia: un crawler que pide `/carta` recibe el HTML renderizado de la **home** — con el `<title>`, la meta description, el Open Graph y el JSON-LD de la home. Los meta por ruta definidos en cada archivo (`carta.tsx`, `reservas.tsx`, etc.) nunca llegan a un crawler. Y un usuario que abre un enlace directo a `/reservas` ve durante un instante la portada antes de que React hidrate y cambie de vista.

Para un restaurante local que compite por "restaurante ayacucho" en Google, esta es probablemente **la pérdida de negocio más caro-por-línea-de-código de todo el informe**. Además el proyecto sí genera un servidor SSR completo (`dist/server/server.js`) que nunca se ejecuta, y el script de build es frágil: puerto fijo, `setTimeout` de 2 s, 15 reintentos.

Arreglo: desplegar con el adaptador Vercel/Nitro de TanStack Start (SSR real), o como mínimo pre-renderizar cada ruta pública por separado (`/`, `/carta`, `/reservas`, `/eventos`, `/galeria`, `/familia-las-flores`, `/tesoros-ayacucho`, `/contacto`, `/restaurante`, `/unete-al-equipo`) y dejar SPA solo para `/admin`, `/caja` y `/d/$orderId`. **Ganancia: FCP -1,5 a -3 s en 4G, y SEO + previews de WhatsApp/Facebook funcionando por primera vez.**

**26. Las 172 imágenes se revalidan en cada visita.** `vercel.json:4-11` aplica `max-age=0, must-revalidate` a todo lo que no esté bajo `/assets/`, y las imágenes viven en `/imagenes-reales/**` e `/inicio/**`. `/galeria` carga **79 imágenes**: son 79 round-trips condicionales (304) antes de pintar el grid, aunque los bytes ya estén en caché. Con ~200 ms de RTT en la red móvil de Ayacucho, eso es latencia pura y evitable. Arreglo (5 minutos): añadir reglas `immutable` para `/imagenes-reales/(.*)` e `/inicio/(.*)`.

**27. 12 variantes de fuentes Google en el critical path.** `__root.tsx:113-121` carga 7 pesos de Playfair Display y 5 de Spectral (~250-350 KB de WOFF2) en una hoja de estilos de tercero bloqueante. Lo bien hecho: hay `preconnect` a ambos orígenes y `display=swap`. Lo mejorable: reducir a 4 variantes y auto-hospedarlas en `/assets/` (donde sí aplica el `immutable` que ya está configurado). Ganancia: LCP -200 a -300 ms.

**28. Falta `defaultPreload: "intent"` en el router.** `src/router.tsx:11-12`. Una línea que elimina 150-400 ms percibidos en cada navegación interna.

**29. Código muerto que arrastra una dependencia.** `GoogleTrackingMap.tsx` (293 líneas) y `DeliveryTrackingMap.tsx` no los importa nadie. `@react-google-maps/api` está en `dependencies` y no aparece en ningún chunk. Borrar ambos y `npm rm @react-google-maps/api`.

---

# P3 — Calidad y mantenibilidad

| Métrica | Valor |
|---|---|
| Líneas TS/TSX | 25.086 en 79 archivos |
| Los 5 archivos más grandes | 6.295 líneas = **25,1 % del código** |
| Archivos > 500 líneas | 13 |
| Ocurrencias de `any` | **105** (ESLint: 115) |
| `useEffect` | 74 · `useQuery`/`useMutation`: **0** |
| Llamadas `.from()` directas | 96 en 23 archivos |
| Errores de `tsc --noEmit` | **10** |
| Problemas de ESLint | **18.659** (18.506 de Prettier) |
| Tests | 27, todos pasan en 1,84 s |
| `React.memo` | 0 |

**30. React Query está instalado, provisto… y sin usar.** El `QueryClient` se crea en `router.tsx:6` y el `Provider` se monta en `__root.tsx:325`, pero **no hay un solo `useQuery` ni `useMutation`** en 25.000 líneas. En su lugar: 74 `useEffect` con fetch manual. Esto no es cosmético — causa bugs concretos: `caja.tsx:180-247` lanza 3 consultas secuenciales sin `AbortController`, y como realtime dispara `fetchData` en cada evento, **las respuestas fuera de orden se pisan entre sí** (race condition clásica). Hay 8 avisos reales de `exhaustive-deps` con dependencias faltantes. Migrar `caja.tsx` y `admin.tsx` a React Query resolvería de golpe las races, la deduplicación, la invalidación por realtime y el debounce, y eliminaría ~40 `useEffect`.

**31. Efectos secundarios dentro de actualizadores de estado.** `caja.tsx:191-199` y `:236-245` llaman `playOrderChime()` y `setNewOrderNotification()` **dentro** de un updater de `setOrders`. El updater debe ser puro; React 19 lo invoca dos veces en StrictMode → sonido y toast duplicados. Es exactamente el bug que el comentario de `:263-266` dice haber arreglado con `soundEnabledRef`, pero solo lo arregló en el canal de realtime, no aquí.

**32. Toda la capa de datos del admin es `any`.** `admin.tsx:57-62` declara `reservations`, `orders`, `orderItems`, `products`, `categories` y `coupons` como `useState<any[]>([])`, aunque `supabase.ts:18-92` ya define `Profile`, `Category`, `Product`, `ReservationPayload` y `OrderPayload`. Y `supabase.ts:272` es `createReservation(payload: any)`, ignorando el `ReservationPayload` declarado 220 líneas antes. Arreglo de alto rendimiento: `supabase gen types typescript` y `createClient<Database>(...)` — elimina la mayoría de los 105 `any` de una vez.

**33. Diez errores reales de TypeScript.** Verificados con dependencias instaladas. Los que tienen efecto en runtime:
- `supabase.ts:402-403` — `driver_pin` no existe en `OrderPayload`, aunque `createOrder` lo genera y lo envía.
- `reservas.tsx:199` — el mapeo de zonas desde la BD **pierde `category` y `badge`**: `FALLBACK_ZONES` los define, pero en cuanto `listRestaurantZones()` devuelve datos, los badges de las 7 zonas quedan vacíos.
- `familia-las-flores.tsx` — `"administracion"` no es asignable al tipo del área (6 ocurrencias).
- `CartSidebar.tsx:527` — el `.catch` inexistente del hallazgo #11.

**34. `npm run lint` es inutilizable, y eso oculta 153 hallazgos reales.** 18.659 problemas, de los cuales el 99,2 % es ruido de Prettier por finales de línea: `admin.tsx` está en LF mientras `reservas.tsx`, `caja.tsx`, `index.tsx`, `CartSidebar.tsx` y el resto están en CRLF. Con ese volumen nadie corre el linter, y quedan enterrados los 115 `no-explicit-any`, 16 `rules-of-hooks` (el crash del hallazgo #7), 8 `exhaustive-deps` y 7 `no-empty`. Arreglo de un commit: `.gitattributes` con `* text=auto eol=lf`, un `prettier --write .`, y ESLint en CI. **De 18.659 a ~153 problemas visibles.**

**35. Duplicación medida.**
- `getLocalYYYYMMDD` **definida 4 veces** con firmas distintas (`admin.tsx:38`, `caja.tsx:28`, `AdminAnalyticsSection.tsx:27`, `CashierKanbanView.tsx:18`). Y dos sitios usan la variante con bug `new Date().toISOString().split("T")[0]` (`AdminBlackoutModal.tsx:16`, `CashierReservationCard.tsx:45`), que **en Perú (UTC-5) devuelve el día siguiente después de las 19:00**: el modal de blackout se abre en la fecha equivocada todas las noches.
- `lib/orderStatus.ts` está bien hecho pero **solo lo importan 3 de 13** archivos que manejan estados. `CashierOrderCard.tsx:45-99` reimplementa la normalización con `includes()` de substrings y redefine labels y colores.
- `toFixed(2)` aparece **61 veces**; no existe ningún `formatPrice` compartido.
- `wa.me/51980723422` hardcodeado en **7 archivos**; `contacto@restaurantelasflores.com` en 4.
- **Inconsistencia visible al cliente:** el sitio anuncia desayunos desde las **07:00** (`index.tsx:106`, `contacto.tsx:38`, `site-footer.tsx:114`), pero `reservas.tsx:113-115` solo ofrece slots desde las **09:00**.
- Rutas distintas para la misma foto de plato entre `index.tsx:9-12` y `restaurante.tsx:5-7`.

*Contrapunto justo:* `utils/deliveryUtils.ts` **sí** centraliza correctamente tarifas y radio, y `CartSidebar` los consume sin duplicar. Ese es el patrón a replicar.

**36. 14 modales, ninguna abstracción común, guerra de z-index.** Los valores van de `z-[60]` a `z-[99999]`. Solo 3 usan `createPortal`; el resto renderiza in-place, que es justamente lo que fuerza la escalada. Y `index.tsx:326` define un modal propio además. Un único `<Modal>` con portal, backdrop, Escape, focus-trap y `role="dialog"` simplifica 14 componentes a la vez.

**37. Accesibilidad: los modales son el punto débil.** Cero `role="dialog"` o `aria-modal` en todo el proyecto; cero gestión de foco (ningún `.focus()` ni `autoFocus`), así que el foco se queda en el fondo al abrir cualquier modal; solo 1 de 15 overlays cierra con Escape (`CartSidebar.tsx:569-585`); 27 de 235 botones no tienen nombre accesible (casi todos la "X" de cerrar); y hay 33 `alert()` como mecanismo de feedback, incluidos errores críticos de checkout. **Bien hecho:** las 63 `<img>` tienen `alt` (0 faltantes) y las 65 `.map()` que renderizan JSX tienen `key` (0 faltantes) — eso es más disciplina de la habitual.

**38. Errores tragados en silencio.** 7 `catch {}` completamente vacíos, incluidos `CartContext.tsx:83, 93, 107` (el usuario pierde el carrito sin saberlo). `CartSidebar.tsx:444-446` comenta *"Si no se puede verificar stock, continuar con el pedido"* — se aceptan pedidos de platos agotados si la consulta falla. Y 101 `console.warn`/`console.error` como único manejo de error, sin reporte a ningún servicio, aunque `lib/error-capture.ts` existe y podría usarse.

**39. Tests: la cobertura está en el módulo menos crítico.** 27 tests, todos pasan. `jobApi.test.ts` (8 tests) es excelente. Pero `cart.test.ts:5-15` **redefine la función bajo prueba dentro del propio test** — es una copia de `CartContext.tsx:116-117`, así que pasaría aunque el carrito estuviera completamente roto (valor cero). Y no hay ningún test de: `createOrder`/`createReservation` con sus fallbacks en cascada (el código más frágil del proyecto), el checkout completo, la validación de cupones, el cálculo del total con descuento, `normalizeOrderStatus`, los guards de rol, ni las políticas RLS. Nótese que `jobsSql.test.ts` demuestra que **el patrón de testear el SQL de RLS ya existe y funciona** en este repo — solo se aplicó a *jobs*. Replicarlo para `orders`, `reservations`, `products` y `coupons` habría detectado la mitad de los hallazgos P0 de este informe.

**40. Estructura a medio migrar.** `src/features/` existe con la forma correcta (`jobs/{api,rules,types,components}`, `zones/{api,types}`) — y no por casualidad es el código mejor tipado y mejor testeado del repo. Pero `src/components/` sigue siendo un cajón plano de 44 archivos que mezcla marketing, admin, caja y checkout. Completar la migración a `features/{checkout,reservas,admin,caja}` siguiendo el patrón de `features/jobs/`.

**41. Los cinco monolitos.**

| Archivo | Líneas | Qué mezcla |
|---|---|---|
| `routes/reservas.tsx` | 1.562 | 7 zonas + horarios + países hardcodeados, stepper de 4 pasos, auth Google/Facebook, 17 `useState`, 10 `useEffect`, envío de correo |
| `components/CartSidebar.tsx` | 1.537 | Carrito + geolocalización + reverse-geocode + cupones + checkout + pago + sesión OAuth con `postMessage`/`storage` + 5 pantallas + 25 estilos inline |
| `routes/index.tsx` | 1.208 | 2 bloques JSON-LD, catálogo de festividades y lugares, 3 componentes no exportados, 7 secciones de landing |
| `routes/caja.tsx` | 1.158 | Guard de rol, 3 consultas, realtime, auto-cancelación, filtros, 26 `useState`, 2 vistas × 2 layouts |
| `routes/admin.tsx` | 830 | Guard, 6 tablas, **30 `useState`** (13 de ellos `any`), 4 handlers CRUD, 7 modales |

---

# Plan de acción por orden de impacto

## Esta semana — cierra los agujeros explotables

1. **Auditar `profiles` ahora**: `SELECT id, email, role FROM profiles WHERE role <> 'client';` Si hay admins que no reconoces, la brecha ya se usó.
2. **Rehacer las políticas RLS** de `profiles` (#1), `orders`, `reservations` (#2), `products` (#6), y crear las de `coupons`. Verificar lo aplicado con `SELECT * FROM pg_policies WHERE schemaname='public';` — el repo tiene dos juegos en conflicto y no sabes cuál está vivo.
3. **Borrar los PINs maestros** `"2026"` y `"1234"` de `d/$orderId.tsx:235-241`. Son 4 líneas.
4. **Cerrar la Edge Function `send-email`**: fijar `from` server-side, no aceptar `html` del cliente, restringir CORS (#5).
5. **Rotar** la clave de Google Maps con restricción por referrer + tope de cuota, y el token OIDC de Vercel (#16).
6. **Añadir las cabeceras de seguridad** a `vercel.json` (#15). 10 minutos.

## Próximas dos semanas — deja de perder dinero y confianza

7. **Mover la creación del pedido al servidor** (#4). Es el cambio estructural clave: RPC `SECURITY DEFINER` que recalcula precios, delivery y cupón, y `REVOKE INSERT` de `anon` sobre `orders`. Resuelve también #13. Usa `jobs.sql:114-191` como plantilla.
8. **Arreglar los dos modales que crashean** (#7). Dos líneas movidas, desbloquea gestión de zonas y blackouts.
9. **Eliminar las confirmaciones falsas** de reserva, contacto y eventos (#8) y el `return true` de `sendEmail` (#9).
10. **Persistir `discount_amount` y `coupon_code`** en el pedido (#10) y arreglar el contador de cupones (#11).
11. **Filtrar `order_items`** (#12). Una cláusula `.in()` en dos archivos, antes de que la tabla pase de 1.000 filas.
12. **Escapar HTML en los correos** (#14).

## Mes siguiente — rendimiento y SEO

13. **`manualChunks`** (#19): una regex, -50 KB gzip en todas las rutas. La mejor relación impacto/esfuerzo del informe.
14. **`Cache-Control` de imágenes** (#26) y `defaultPreload: "intent"` (#28). 10 minutos combinados.
15. **Debounce + deltas en realtime** (#21, #22): -90 % de consultas.
16. **SSR o pre-render por ruta** (#25). El más caro en esfuerzo, y probablemente el de mayor retorno comercial: hoy Google y WhatsApp ven la portada en todas las URLs.
17. **`React.memo` + índice `Map` de items** (#24) y `React.lazy` del CartSidebar (#20).

## Continuo — que el código no vuelva a llegar aquí

18. **`.gitattributes` + `prettier --write` + ESLint en CI** (#34). Un commit convierte el linter en algo utilizable, y ESLint ya detectaba el crash de #7 por su cuenta.
19. **`supabase gen types typescript`** y tipar el cliente (#32). Elimina la mayoría de los 105 `any`.
20. **Migrar a React Query** empezando por `caja.tsx` y `admin.tsx` (#30).
21. **Tests de checkout, cupones y RLS** (#39), replicando `jobApi.test.ts` y `jobsSql.test.ts`. Reescribir `cart.test.ts` para que importe del código real.
22. **Extraer un `<Modal>` común** (#36, #37) y **dividir los monolitos** (#41) siguiendo el patrón de `features/jobs/`.

---

## Nota metodológica

Cada hallazgo se verificó leyendo el código real, no por inferencia. Las mediciones de bundle provienen de un `vite build` ejecutado sobre una copia del proyecto con dependencias instaladas; `tsc --noEmit`, `eslint` y `vitest` se ejecutaron igual. Los descartados tras verificación incluyen: XSS por `dangerouslySetInnerHTML` (`__root.tsx:179` interpola un objeto estático, no datos de usuario — no explotable), el módulo de empleo completo (`jobs.sql` + `features/jobs/` están correctamente securizados), y `console.log` con PII (revisados los 104 `console.*`; solo `emailService.ts:45-49` imprime un correo de destinatario, visible únicamente al propio usuario).
