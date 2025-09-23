import 'reflect-metadata';
import { AppDataSource } from './data-source.js';
import { startCronJob } from './CronJob.ts';

AppDataSource.initialize()
  .then(async () => {
    console.log('Data Source has been initialized.');

    await startCronJob();
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });
