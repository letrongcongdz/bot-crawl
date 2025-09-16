import type { Request, Response, NextFunction } from 'express';
import { CompanyThreadService } from '../services/CompanyThreadlService.ts';

const companyThreadlService = new CompanyThreadService();

export const getAllCompanies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companies = await companyThreadlService.findAllCompanies();
    res.json(companies);
  } catch (e) {
    next(e);
  }
};

export const getCompanyById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params } = req;
    if (!params.id) {
      return res.status(400).json({ error: 'ID is required' });
    }
    const companyId = parseInt(params.id);

    const companies = await companyThreadlService.findDetailCompany(companyId);
    res.json(companies);
  } catch (e) {
    next(e);
  }
};
