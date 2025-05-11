import './src/boilerplate.polyfill';

import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

import { SnakeNamingStrategy } from './src/snake-naming.strategy';

dotenv.config({
  path: `.env`,
});

export const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  namingStrategy: new SnakeNamingStrategy(),
  subscribers: ['src/entity-subscribers/*.subscriber{.ts,.js}'],
  entities: ['src/modules/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  extra:
    process.env.DB_SSL == 'true'
      ? {
          ssl: {
            rejectUnauthorized: false,
          },
        }
      : {},
});
