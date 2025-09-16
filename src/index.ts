import 'reflect-metadata';
import express from 'express';
import { AppDataSource } from './data-source.js';
import router from './routes/index.ts';
import { ErrorHandler } from './middlewares/ErrorHandler.ts';
import { runCrawlerAndSave } from './services/CrawlerService.ts';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api', router);

app.use(ErrorHandler);

AppDataSource.initialize()
  .then(async () => {
    console.log('Data Source has been initialized.');

    await runCrawlerAndSave();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });
