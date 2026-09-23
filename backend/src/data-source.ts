import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const ssl = process.env.DATABASE_SSL === 'true';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [join(__dirname, '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'database', 'migrations', '*.{ts,js}')],
  synchronize: false,
  ssl: ssl ? { rejectUnauthorized: false } : false,
});
