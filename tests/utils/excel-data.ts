import ExcelJS from 'exceljs';
import path from 'node:path';
import fs from 'node:fs';

export type PokemonTestData = {
  id: number;
  name: string;
  abilities: string[];
};

const normalized = (value: unknown) => String(value ?? '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-');

export async function readPokemonData(): Promise<PokemonTestData[]> {
  const filePath = path.resolve(process.cwd(), 'tests/data/Datos-pruebas.xlsx');

  if (!fs.existsSync(filePath)) {
    throw new Error(`No se encontró el archivo: ${filePath}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('El archivo Excel no contiene hojas de trabajo');
  }

  const headers = new Map<string, number>();
  worksheet.getRow(1).eachCell((cell, columnNumber) => {
    headers.set(normalized(cell.value), columnNumber);
  });

  const idColumn = headers.get('id');
  const nameColumn = headers.get('name') ?? headers.get('nombre');
  const abilitiesColumn = headers.get('abilities') ?? headers.get('habilidades');

  if (!idColumn || !nameColumn) {
    throw new Error('Datos-pruebas.xlsx debe incluir columnas ID y Name (o Nombre)');
  }

  const rows: PokemonTestData[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const id = Number(row.getCell(idColumn).value);
    const name = String(row.getCell(nameColumn).value ?? '').trim().toLowerCase();
    const abilitiesValue = abilitiesColumn
      ? String(row.getCell(abilitiesColumn).value ?? '')
      : '';

    if (!Number.isInteger(id) || !name) return;

    const abilities = abilitiesValue
      .split(/[|,;]/)
      .map((ability) => ability.trim().toLowerCase())
      .filter(Boolean);

    rows.push({ id, name, abilities });
  });

  if (rows.length === 0) {
    throw new Error('Datos-pruebas.xlsx no contiene filas de datos');
  }

  return rows;
}
