import { Request, Response } from 'express';

import CreateCustomerService from '@modules/customers/services/CreateCustomerService';

import { container } from 'tsyringe';

export default class CustomersController {
  public async create(request: Request, response: Response): Promise<Response> {
    const createCustomerService = container.resolve(CreateCustomerService);
    const { email, name } = request.body;

    const newCostumer = await createCustomerService.execute({ email, name });

    return response.json(newCostumer);
  }
}
