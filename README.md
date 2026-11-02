# Pruebas automatizadas con Playwright

Proyecto de pruebas automatizadas para consultar la API de Pokémon y validar el resultado por ID y por nombre mediante datos cargados desde Excel.

## Tecnologías utilizadas

- Node.js 18 o superior
- npm
- Playwright Test
- TypeScript
- dotenv
- ExcelJS

## 1. Instalar Node.js

### macOS

Instalar Node.js con Homebrew:

```bash
brew install node
```

Si no tiene Homebrew, instale Node.js desde:

```text
https://nodejs.org/
```

Verificar las instalaciones:

```bash
node --version
npm --version
```

## 2. Clonar el proyecto

```bash
git clone https://github.com/aarteagavargas/playwright-test.git
cd playwright-test
```

## 3. Instalar las dependencias

```bash
npm install
```

Instalar los navegadores utilizados por Playwright:

```bash
npx playwright install
```

En macOS/Linux, si instala Playwright por primera vez en una máquina sin dependencias del sistema, también puede ejecutar:

```bash
npx playwright install --with-deps
```

## 4. Configurar las variables de ambiente

Copiar la plantilla del archivo de ambiente:

```bash
cp .env.example .env
```

Editar `.env` y configurar el ambiente y las claves secretas:

```dotenv
TEST_ENV=QA
SECRET_KEY_QA=reemplazar-con-la-clave-real-qa
SECRET_KEY_CERT=reemplazar-con-la-clave-real-cert
```

Opcionalmente, para ejecutar directamente desde la terminal sin crear `.env`:

```bash
TEST_ENV=QA SECRET_KEY_QA='clave-real-qa' npx playwright test
```

Valores admitidos para `TEST_ENV`:

- `QA`
- `CERT`

El archivo `.env` no debe subirse al repositorio. Solo se debe compartir `.env.example` con valores ficticios.

## 5. Configurar el archivo de datos

Colocar el archivo Excel en esta ruta:

```text
tests/data/Datos-pruebas.xlsx
```

La primera fila debe contener los encabezados. Cada fila desde la segunda representa una prueba.

Columnas admitidas:

| Columna | Obligatoria | Ejemplo |
|---|---|---|
| `ID` | Sí | `25` |
| `Name` o `Nombre` | Sí | `pikachu` |
| `Abilities` o `Habilidades` | No | `static, lightning-rod` |

Ejemplo:

| ID | Name | Abilities |
|---|---|---|
| 25 | pikachu | static, lightning-rod |
| 1 | bulbasaur | overgrow, chlorophyll |

Las abilities pueden estar separadas por comas, punto y coma o barras verticales (`|`).

## 6. Ejecutar las pruebas

### Ambiente QA

Usando las variables configuradas en `.env`:

```bash
npx playwright test
```

Definiendo las variables en la terminal:

```bash
TEST_ENV=QA SECRET_KEY_QA='clave-real-qa' npx playwright test
```

### Ambiente CERT

```bash
TEST_ENV=CERT SECRET_KEY_CERT='clave-real-cert' npx playwright test
```

### Ejecutar una prueba específica

Prueba de Pokémon:

```bash
TEST_ENV=QA SECRET_KEY_QA='clave-real-qa' npx playwright test tests/pokemon.fixture.spec.ts
```

Prueba POST de JSONPlaceholder:

```bash
TEST_ENV=QA SECRET_KEY_QA='clave-real-qa' npx playwright test tests/jsonplaceholder-post.spec.ts
```

### Ejecutar únicamente en Chromium

```bash
TEST_ENV=QA SECRET_KEY_QA='clave-real-qa' npx playwright test tests/pokemon.fixture.spec.ts --project=chromium
```

## 7. Cobertura de las pruebas de API

### Prueba de Pokémon

Para cada fila del archivo Excel, la prueba ejecuta dos consultas al endpoint:

```text
https://pokeapi.co/api/v2/pokemon/{id}
https://pokeapi.co/api/v2/pokemon/{name}
```

Las consultas realizan las siguientes validaciones:

- El estado HTTP debe indicar una respuesta exitosa.
- El ID recibido coincide con el ID del Excel.
- El nombre recibido coincide con el nombre del Excel.
- La propiedad `abilities` existe y contiene al menos una habilidad.
- Cuando el Excel incluye habilidades esperadas, estas coinciden con las devueltas por la API.
- El tiempo de respuesta de cada petición debe ser menor a 10 segundos.

### Prueba de JSONPlaceholder

La prueba envía una petición POST al endpoint:

```text
https://jsonplaceholder.typicode.com/posts
```

El cuerpo contiene `title`, `body` y `userId`. La prueba valida:

- El estado HTTP es `201 Created`.
- El tiempo de respuesta es menor a 10 segundos.
- El `title`, `body` y `userId` enviados coinciden con los devueltos.
- El servidor devuelve un `id` numérico.

Antes de ejecutar, el fixture registra el SHA-256 de la clave configurada para el ambiente QA o CERT. Al finalizar, la prueba registra fecha y hora de finalización.

## 8. Visualizar el reporte

El archivo de configuración está preparado para generar el reporte HTML:

```bash
npx playwright test --reporter=html
npx playwright show-report
```

También puede abrirse el reporte generado por una ejecución anterior:

```bash
npx playwright show-report
```

Playwright iniciará un servidor local y mostrará una dirección similar a:

```text
http://localhost:9323
```

Para detener el servidor, presione `Control+C` en la terminal.

También es posible mostrar los resultados directamente en la terminal:

```bash
npx playwright test tests/pokemon.fixture.spec.ts --reporter=line
```

## 9. Archivos de interés

- `tests/pokemon.fixture.spec.ts`: pruebas del endpoint Pokémon.
- `tests/fixtures/environment.fixture.ts`: fixture de ambiente y secreto SHA-256.
- `tests/utils/excel-data.ts`: lectura y transformación del archivo Excel.
- `tests/data/Datos-pruebas.xlsx`: datos utilizados por las pruebas.
- `.env.example`: plantilla de variables de ambiente.
- `playwright.config.ts`: configuración de navegadores, reportes y ejecución.
- `.github/workflows/playwright.yml`: ejecución automática de pruebas en GitHub Actions.

## Seguridad

- Nunca escribir claves reales dentro de archivos `.spec.ts`, configuraciones o funciones.
- Nunca subir el archivo `.env`.
- La clave secreta se transforma con SHA-256 dentro del fixture antes de registrarla en la consola.
- No compartir capturas de terminal ni reportes que contengan valores secretos reales.

Prueba web de Wikipedia:

```bash
TEST_ENV=QA SECRET_KEY_QA='clave-real-qa' npx playwright test tests/wikipedia-pokemon.spec.ts --project=chromium
```

### Prueba web de Wikipedia

La prueba lee una fila por Pokémon desde `Datos-pruebas.xlsx` y:

- Abre `https://en.wikipedia.org/wiki/{nombre-del-pokemon}`.
- Valida el título H1 y el título de la página.
- Registra el texto que identifica al dibujante o creador del artwork.
- Hace clic en la imagen interactiva y usa el botón/enlace Download del visor.
- Guarda o reemplaza el archivo dentro de `images/<nombre-pokemon>.<extensión>`.
- Valida extensiones `.jpg`, `.jpeg`, `.png` o `.svg` sin distinguir mayúsculas.
- Valida que el archivo exista, tenga contenido y pese menos de 500000 bytes.
- Registra fecha y hora de finalización.