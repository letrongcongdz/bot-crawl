import 'reflect-metadata';
import { AppDataSource } from './data-source.js';
import { runCrawlerAndSave } from './services/CrawlerService.ts';

AppDataSource.initialize()
  .then(async () => {
    console.log('Data Source has been initialized.');

    await runCrawlerAndSave();
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });
