import { Router } from 'express';
import { getAllCompanies, getCompanyById } from '../controllers/CrawlController.ts';

const router = Router();

router.get('/companies', getAllCompanies);
router.get('/companies/:id', getCompanyById);

export default router;
