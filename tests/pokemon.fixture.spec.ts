import { test, expect } from './fixtures/environment.fixture';
import type { APIRequestContext } from '@playwright/test';
import { readPokemonData, type PokemonTestData } from './utils/excel-data';

function formatCompletionTime(): string {
  return new Date().toLocaleString('es-CO', {
    dateStyle: 'full',
    timeStyle: 'long',
  });
}

async function validatePokemonLookup(
  request: APIRequestContext,
  lookup: number | string,
  expected: PokemonTestData,
) {
  const startedAt = Date.now();
  const response = await request.get(
    `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(String(lookup))}`,
  );
  const elapsedMilliseconds = Date.now() - startedAt;

  expect(response.ok(), `La petición para ${lookup} debe ser exitosa`).toBeTruthy();
  expect(elapsedMilliseconds, `Tiempo de respuesta para ${lookup}`).toBeLessThan(10_000);

  const pokemon = await response.json();
  expect(pokemon.id, 'ID recibido').toBe(expected.id);
  expect(pokemon.name, 'Nombre recibido').toBe(expected.name);
  expect(Array.isArray(pokemon.abilities), 'Abilities debe ser una lista').toBeTruthy();
  expect(pokemon.abilities.length, 'Debe retornar al menos una ability').toBeGreaterThan(0);

  const returnedAbilities = pokemon.abilities
    .map((entry: { ability: { name: string } }) => entry.ability.name)
    .sort();

  if (expected.abilities.length > 0) {
    expect(returnedAbilities).toEqual(expect.arrayContaining([...expected.abilities].sort()));
  }

  return { elapsedMilliseconds, returnedAbilities };
}

test('Validar Pokémon leídos desde Datos-pruebas.xlsx por ID y nombre', async ({
  environment,
  request,
}, testInfo) => {
  const rows = await readPokemonData();
  const startedAt = Date.now();

  try {
    for (const row of rows) {
      await test.step(`Fila: ${row.id} - ${row.name}`, async () => {
        await validatePokemonLookup(request, row.id, row);
        await validatePokemonLookup(request, row.name, row);
      });
    }

    console.log(
      `[${environment.name}] Prueba completada`,
      `| duración total: ${Date.now() - startedAt} ms`,
      `| finalización: ${formatCompletionTime()}`,
    );
  } finally {
    console.log(`[${testInfo.title}] Finalizó el test: ${formatCompletionTime()}`);
  }
});
