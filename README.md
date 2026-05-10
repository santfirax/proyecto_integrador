# SIMEM JSON to S3 Archiver

Proyecto Node.js para consumir datasets publicos de SIMEM y guardar cada respuesta JSON en un bucket S3 organizada por anio y mes.

## Estructura en S3

El archivo se sube con una clave como esta:

```text
S3_PREFIX/YYYY/MM/dataset-slug-YYYY-MM-DD_YYYY-MM-DD.json
```

Ejemplo:

```text
simem-data/2026/05/generacion-real-2026-05-01_2026-05-07.json
```

## Requisitos

- Node.js 18+.
- AWS CLI configurado localmente.
- Un bucket S3 existente.

## Configuracion

1. Copia `.env.example` a `.env`.
2. Ajusta `S3_BUCKET_NAME`.
3. Verifica que el perfil de AWS exista en `~/.aws/credentials`.

## Variables principales

- `AWS_PROFILE`: perfil local de AWS.
- `AWS_REGION`: region del bucket.
- `SIMEM_BASE_URL`: endpoint base de SIMEM.
- `START_DATE`: fecha inicial en formato `YYYY-MM-DD`.
- `END_DATE`: fecha final en formato `YYYY-MM-DD`.
- `REQUEST_PARAMETERS_JSON`: body JSON que se envia en el `POST`. Por defecto `[]`.
- `DATASETS_JSON`: opcional para sobrescribir los datasets por defecto.
- `S3_BUCKET_NAME`: bucket destino.
- `S3_PREFIX`: prefijo opcional dentro del bucket.
- `DRY_RUN`: si es `true`, consume la API pero no sube a S3.

## Datasets por defecto

- `Generacion Real` -> `055A4D`
- `Unidades Generacion` -> `670221`
- `Aporte Hidricos` -> `BA1C55`
- `Demanda comercial` -> `d55202`
- `Demanda Real` -> `14fabb`

## Uso

Validar sintaxis:

```bash
npm run check
```

Probar sin subir a S3:

```bash
DRY_RUN=true npm run archive
```

Probar solo un dataset y un mes:

```bash
DRY_RUN=true START_DATE=2023-01-01 END_DATE=2023-01-31 DATASETS_JSON='{"Generacion Real":"055A4D"}' npm run archive
```

Ejecutar flujo completo:

```bash
npm run archive
```
