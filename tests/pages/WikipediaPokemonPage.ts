import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Resultado de una descarga de imagen obtenida desde Wikipedia/Wikimedia.
 */
export type DownloadedImage = {
  /** Nombre sugerido por la URL del archivo original. */
  suggestedFilename: string;
  /** Contenido binario completo de la imagen. */
  bytes: Buffer;
};

/**
 * Page Object de una página Pokémon en Wikipedia.
 * Encapsula navegación, créditos del artwork y descarga de la imagen principal.
 */
export class WikipediaPokemonPage {
  readonly page: Page;
  readonly mainHeading: ReturnType<Page['getByRole']>;

  /**
   * Crea el Page Object con una página de Playwright activa.
   * @param page Página utilizada durante la prueba.
   */
  constructor(page: Page) {
    this.page = page;
    this.mainHeading = this.page.getByRole('heading', { level: 1 });
  }

  /**
   * Convierte un nombre simple al formato utilizado por las rutas de Wikipedia.
   * Por ejemplo, `mr mime` se transforma en `Mr_Mime`.
   * @param name Nombre del Pokémon obtenido del archivo Excel.
   * @returns Nombre compatible con el segmento de la URL de Wikipedia.
   */
  static toWikipediaName(name: string): string {
    return name
      .trim()
      .split(/[-\s]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('_');
  }

  /**
   * Abre la página Wikipedia correspondiente al Pokémon.
   * Valida simultáneamente el encabezado principal y el título del documento.
   * @param pokemonName Nombre del Pokémon leído desde el Excel.
   * @throws Lanza una falla de Playwright si la navegación no carga o el título no coincide.
   */
  async open(pokemonName: string): Promise<void> {
    const wikiName = WikipediaPokemonPage.toWikipediaName(pokemonName);
    await this.page.goto(`https://en.wikipedia.org/wiki/${encodeURIComponent(wikiName)}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(this.mainHeading).toContainText(wikiName.replaceAll('_', ' '));
    await expect(this.page).toHaveTitle(new RegExp(wikiName.replaceAll('_', ' '), 'i'));
  }

  /**
   * Obtiene el texto del artista o diseñador mostrado junto al artwork.
   * @returns Texto encontrado en la infobox, o null si no fue posible identificarlo.
   */
  async getArtworkCredit(): Promise<string | null> {
    const artworkCredit = this.page.locator('.infobox').getByText(/artwork by/i);

    if (await artworkCredit.count()) {
      return (await artworkCredit.first().innerText()).trim();
    }

    const designer = this.page
      .locator('.infobox')
      .getByRole('link')
      .filter({ hasText: /Sugimori|Nishida|Nishino|Turner/ })
      .first();

    if (await designer.count()) {
      return `Diseñador/dibujante: ${await designer.innerText()}`;
    }

    return null;
  }

  /**
   * Abre el visor de Wikimedia mediante la imagen principal, selecciona el archivo original
   * y descarga sus bytes para que el test los guarde localmente.
   * @returns Nombre sugerido y contenido binario de la imagen descargada.
   * @throws Lanza una falla si la imagen, el enlace original o la respuesta HTTP no están disponibles.
   */
  async downloadArtwork(): Promise<DownloadedImage> {
    const imageLink = this.page.locator('.infobox a:has(img)').first();
    await expect(imageLink).toBeVisible({ timeout: 15_000 });
    await imageLink.click();

    const downloadButton = this.page.getByRole('button', { name: 'Download this file' });
    await expect(downloadButton).toBeVisible({ timeout: 15_000 });
    await downloadButton.click();

    const originalLink = this.page
      .locator('a[href*="upload.wikimedia.org"]:visible')
      .first();
    await expect(originalLink).toBeVisible({ timeout: 15_000 });

    const originalUrl = await originalLink.getAttribute('href');
    expect(originalUrl, 'El enlace original de Wikimedia debe existir').toBeTruthy();

    const downloadUrl = new URL(originalUrl!, this.page.url()).toString();
    const response = await this.page.request.get(downloadUrl);
    expect(response.ok(), `La descarga debe ser exitosa: HTTP ${response.status()}`).toBeTruthy();

    const suggestedFilename = decodeURIComponent(
      new URL(downloadUrl).pathname.split('/').pop() ?? '',
    );

    return {
      suggestedFilename,
      bytes: await response.body(),
    };
  }
}
