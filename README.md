# CupoZero

Aplicacion React + Vite + Tailwind para publicar y gestionar cupones de descuento con codigo QR.

## Funcionalidades incluidas

- Home moderna y responsive con grid de cupones.
- Buscador por texto (comercio, descripcion, codigo).
- Filtros por categoria, comercio y fecha de validez.
- Cada cupon muestra comercio, descuento en euros, descripcion, categoria, fecha, condiciones, codigo y QR.
- Boton para copiar codigo al portapapeles.
- Panel de administracion privado con login.
- CRUD de cupones: crear, editar y eliminar.
- Subida de logo del comercio.
- Vista previa del cupon antes de publicar.
- Boton flotante de WhatsApp.
- Boton flotante Volver arriba.
- Animaciones suaves con Framer Motion.

## Credenciales de administrador

- Usuario: `CupoZero`
- Password: `Zero1&Cupones2.`

Tambien puedes sobrescribirlas desde variables de entorno.

## Instalacion

1. Instala dependencias:
`npm install`
2. Copia variables de entorno:
`cp .env.example .env`
3. Ejecuta en desarrollo:
`npm run dev`
4. Build de produccion:
`npm run build`

## Variables de entorno

- `VITE_ADMIN_USER`: usuario admin.
- `VITE_ADMIN_PASSWORD`: password admin.
- `VITE_WHATSAPP_NUMBER`: numero WhatsApp sin espacios ni simbolos.

## Persistencia y actualizacion automatica

- La app guarda datos en `localStorage` para persistir cambios del panel admin.
- Cada alta, edicion o baja de cupones se refleja inmediatamente en la web publica.
- En multiples pestanas, la vista se sincroniza usando el evento `storage`.

## Estructura de base de datos recomendada

Se incluye `db/schema.sql` con tablas para:

- `categories`
- `merchants`
- `coupons`
- `administrators`

Esto permite migrar facilmente a backend real (Node, Next.js API, etc.) y mantener el mismo modelo de datos.

## Seguridad implementada en esta version

- Ruta/panel admin protegido por autenticacion.
- Validaciones de formularios.
- Sanitizacion basica de texto para evitar inyeccion de tags HTML.

Nota: al ser una SPA sin backend, la autenticacion es de cliente. Para produccion se recomienda backend con sesiones/JWT, hash de contrasenas y control de permisos en servidor.