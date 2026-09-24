import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
// Importa desde dist/, no desde src/: para cuando esto corre, "npm run
// build" (tsc real, vía nest build) ya generó el JS con los decoradores de
// Nest ya resueltos. Si Vercel compilara este archivo junto con los de Nest
// (con esbuild), emitDecoratorMetadata no funciona bien ahí y la inyección
// de dependencias se rompe — este archivo, al no tener decoradores propios,
// sí es seguro que Vercel lo compile solo; dist/ ya es JS plano.
import { AppModule } from '../dist/app.module';
import { configurarApp } from '../dist/bootstrap';

// Vercel invoca la función con (req, res) de Node — y una app de Express
// ya ES un request listener con esa firma, así que se le pasan directo.
// (Nada de adaptadores estilo AWS Lambda: esperan (event, context) y
// terminan entregándole a Express una URL vacía.)
const expressApp = express();

// A través de invocaciones "calientes" de la misma función, Vercel reusa el
// proceso — cachear el arranque evita reconstruir todo Nest en cada request.
let listo: Promise<void> | null = null;

async function arrancar(): Promise<void> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: ['error', 'warn'],
  });
  await configurarApp(app);
  await app.init();
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!listo) listo = arrancar();
  await listo;
  expressApp(req, res);
}
