import 'reflect-metadata';
import { AppDataSource } from './data-source.js';
import { startBot } from './bot/index.js';
import { run } from 'node:test';
import { runCrawlerAndSave } from './services/CrawlerService.ts';

AppDataSource.initialize()
  .then(async () => {
    console.log('Data Source has been initialized.');

    await startBot();
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });
