/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const DATA_DIR = path.join(__dirname, '..', 'database/seeds');
const MIGRATION_DIR = path.join(__dirname, '..', 'database/migrations');

function readExcelFile(filename) {
  const workbook = xlsx.readFile(path.join(DATA_DIR, filename));
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet);
}

function generateMigration(entityName, data, columns) {
  const values = data
    .filter((item) => columns.every((col) => item[col] !== undefined))
    .map((item, index, filteredData) => {
      const rowValues = columns
        .map((col) => `'${item[col].replace(/'/g, "''")}'`)
        .join(', ');
      return `(${rowValues})${index === filteredData.length - 1 ? ';' : ','}`;
    })
    .join('\n        ');

  const className = `Seed${entityName}Data${Date.now()}`;

  return `import { MigrationInterface, QueryRunner } from 'typeorm';

export class ${className} implements MigrationInterface {
  name = '${className}';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\n\`INSERT INTO ${entityName.toLowerCase()} (${columns.join(', ')}) VALUES
    ${values}\`\n);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\`DELETE FROM ${entityName.toLowerCase()}\`);
  }
}`;
}

function writeMigrationFile(content, name) {
  const filename = `${Date.now()}-${name}.ts`;
  fs.writeFileSync(path.join(MIGRATION_DIR, filename), content);
  console.log(`Migration file created: ${filename}`);
}

function seed() {
  const entities = [
    {
      name: 'Cities',
      file: 'vn-cities.xls',
      columns: ['code', 'name'],
    },
    {
      name: 'Districts',
      file: 'vn-districts.xls',
      columns: ['code', 'name', 'city_code', 'city_name'],
    },
    {
      name: 'Wards',
      file: 'vn-wards.xls',
      columns: [
        'code',
        'name',
        'district_code',
        'district_name',
        'city_code',
        'city_name',
      ],
    },
  ];

  entities.forEach((entity) => {
    const data = readExcelFile(entity.file);
    const content = generateMigration(entity.name, data, entity.columns);
    writeMigrationFile(content, `Seed${entity.name}Data`);
  });
}

seed();
