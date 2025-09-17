import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { CompanyThread } from './entities/CompanyThread.js';
import { Post } from './entities/Post.js';
import { Reply } from './entities/Reply.js';
import 'dotenv/config';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '11062003cong',
  database: process.env.DB_NAME || 'bot-crawl',
  synchronize: true,
  logging: false,
  entities: [CompanyThread, Post, Reply],
});
