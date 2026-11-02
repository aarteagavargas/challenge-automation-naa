import { test, expect } from './fixtures/environment.fixture';
import { formatCompletionTime } from './utils/date-time';

const POST_URL = 'https://jsonplaceholder.typicode.com/posts';

test('Crear una publicación mediante POST', async ({ environment, request }, testInfo) => {
  const payload = {
    title: 'Prueba automatizada Playwright',
    body: 'Validación del endpoint POST de JSONPlaceholder',
    userId: 1,
  };
  const startedAt = Date.now();

  try {
    const response = await request.post(POST_URL, { data: payload });
    const elapsedMilliseconds = Date.now() - startedAt;

    expect(response.status(), 'El POST debe retornar 201').toBe(201);
    expect(elapsedMilliseconds, 'El tiempo de respuesta debe ser menor a 10 segundos')
      .toBeLessThan(10_000);

    const body = await response.json();

    expect(body.title).toBe(payload.title);
    expect(body.body).toBe(payload.body);
    expect(body.userId).toBe(payload.userId);
    expect(body.id).toEqual(expect.any(Number));

    console.log(
      `[${environment.name}] POST completado | ID creado: ${body.id}`,
      `| duración: ${elapsedMilliseconds} ms`,
      `| finalización: ${formatCompletionTime()}`,
    );
  } finally {
    console.log(`[${testInfo.title}] Finalizó el test: ${formatCompletionTime()}`);
  }
});
