# ALBUMFIND — Checkpoint v0.1.0-alpha

Fecha: 10 de julio de 2026

## Estado

Primera base funcional y estable de ALBUMFIND para la administración digital de un álbum de láminas del Mundial 2026.

## Funcionalidades implementadas

### Dashboard

- Resumen general de la colección.
- Total de láminas obtenidas.
- Total de láminas faltantes.
- Total de repetidas.
- Porcentaje general de avance.
- Progreso por grupo.
- Progreso por selección.
- Indicadores visuales por lámina.
- Acceso directo al álbum.
- Acceso directo al inventario.

### Álbum interactivo

- Visualización por selección.
- Navegación entre equipos.
- Selección directa de país.
- Marcación de láminas obtenidas y faltantes.
- Incremento y reducción de repetidas.
- Restauración del inventario inicial.
- Persistencia local mediante Zustand y localStorage.

### Inventario

- Vista de láminas faltantes.
- Vista de láminas repetidas.
- Búsqueda por código o selección.
- Filtro por grupo.
- Filtro por selección.
- Desplegables personalizados.
- Copia de listas al portapapeles.
- Acceso directo desde cada resultado al álbum.

### Exportaciones

- Exportación CSV compatible con Excel.
- Exportación PDF.
- PDF compacto en formato A4 horizontal.
- Agrupación por selección.
- Códigos ordenados por número.
- Conteo por equipo.
- Banderas locales de las 48 selecciones.
- Paginación automática.
- Exportación conforme a los filtros activos.

## Datos iniciales

- 12 grupos.
- 48 selecciones.
- 20 láminas por selección.
- 960 láminas totales.
- Inventario inicial precargado.
- Catálogo y colección almacenados en archivos JSON.

## Arquitectura actual

- Next.js 16.
- React 19.
- TypeScript.
- Tailwind CSS 4.
- Zustand.
- jsPDF.
- Lucide React.
- Persistencia local en navegador.
- Aplicación prerenderizada mediante Next.js.

## Rutas disponibles

- `/` — Dashboard.
- `/album` — Álbum interactivo.
- `/inventory` — Faltantes, repetidas y exportaciones.

## Validación

En este checkpoint:

- `npm run lint` finaliza sin errores.
- `npm run build` finaliza correctamente.
- Todas las rutas principales compilan.
- La colección permanece después de recargar el navegador.
- Las exportaciones CSV y PDF fueron probadas.
- El repositorio se encontraba limpio antes de documentar el checkpoint.

## Limitaciones conocidas

- La colección está almacenada únicamente en el navegador.
- No existe autenticación de usuarios.
- No existe base de datos remota.
- No existe sincronización entre dispositivos.
- No existe respaldo o recuperación mediante archivo.
- Las banderas son recursos locales dentro de `public/flags`.

## Próxima etapa recomendada

Implementar respaldo y recuperación de la colección mediante exportación e importación JSON, antes de incorporar cuentas, base de datos o sincronización en línea.
