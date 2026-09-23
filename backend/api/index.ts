import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverless from 'serverless-http';
import type { VercelRequest, VercelResponse } from '@vercel/node';
// Importa desde dist/, no desde src/: para cuando esto corre, "npm run
// build" (tsc real, vía nest build) ya generó el JS con los decoradores de
// Nest ya resueltos. Si Vercel compilara este archivo junto con los de Nest
// (con esbuild), emitDecoratorMetadata no funciona bien ahí y la inyección
// de dependencias se rompe — este archivo, al no tener decoradores propios,
// sí es seguro que Vercel lo compile solo; dist/ ya es JS plano.
import { AppModule } from '../dist/app.module';
import { configurarApp } from '../dist/bootstrap';

type ServerlessHandler = ReturnType<typeof serverless>;

// A través de invocaciones "calientes" de la misma función, Vercel reusa el
// proceso — cachear la app evita reconstruir todo Nest en cada request.
let handlerPromise: Promise<ServerlessHandler> | null = null;

async function crearHandler(): Promise<ServerlessHandler> {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter, { logger: ['error', 'warn'] });
  await configurarApp(app);
  await app.init();
  return serverless(expressApp);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!handlerPromise) handlerPromise = crearHandler();
  const serverlessHandler = await handlerPromise;
  await serverlessHandler(req, res);
}
