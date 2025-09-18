import 'reflect-metadata';
import { AppDataSource } from './data-source.js';
import { startBot } from './bot/index.js';

AppDataSource.initialize()
  .then(async () => {
    console.log('Data Source has been initialized.');

    await startBot();
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });
