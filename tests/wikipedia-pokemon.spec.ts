import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from './fixtures/environment.fixture';
import { readPokemonData } from './utils/excel-data';
import { formatCompletionTime } from './utils/date-time';
import { WikipediaPokemonPage } from './pages/WikipediaPokemonPage';

const imageExtensions = ['.jpg', '.jpeg', '.png', '.svg'];

function safeFileName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

test('Validar páginas de Pokémon en Wikipedia y descargar sus imágenes', async ({
  environment,
  page,
}, testInfo) => {
  const rows = await readPokemonData();
  const imagesDirectory = path.resolve(process.cwd(), 'images');
  fs.mkdirSync(imagesDirectory, { recursive: true });
  const pokemonPage = new WikipediaPokemonPage(page);

  try {
    for (const row of rows) {
      await test.step(row.name, async () => {
        await pokemonPage.open(row.name);

        const artworkCredit = await pokemonPage.getArtworkCredit();
        if (artworkCredit) {
          console.log(`[${environment.name}] ${row.name}: ${artworkCredit}`);
        }

        const download = await pokemonPage.downloadArtwork();
        const extension = path.extname(download.suggestedFilename).toLowerCase();
        expect(imageExtensions).toContain(extension);

        const destination = path.join(imagesDirectory, `${safeFileName(row.name)}${extension}`);
        fs.writeFileSync(destination, download.bytes);

        const fileSize = fs.statSync(destination).size;
        expect(fileSize).toBeGreaterThan(0);
        expect(fileSize, `El archivo ${destination} debe ser menor a 500000 bytes`).toBeLessThan(500_000);

        console.log(`[${environment.name}] Imagen guardada: ${destination} (${fileSize} bytes)`);
      });
    }

    console.log(`[${environment.name}] Finalización de la prueba web: ${formatCompletionTime()}`);
  } finally {
    console.log(`[${testInfo.title}] Finalizó el test web: ${formatCompletionTime()}`);
  }
});
