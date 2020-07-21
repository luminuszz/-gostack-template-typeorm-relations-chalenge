import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Customer from '../infra/typeorm/entities/Customer';
import ICustomersRepository from '../repositories/ICustomersRepository';

interface IRequest {
  name: string;
  email: string;
}

@injectable()
class CreateCustomerService {
  constructor(
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ name, email }: IRequest): Promise<Customer> {
    const checkCostumer = await this.customersRepository.findByEmail(email);

    if (checkCostumer) {
      throw new AppError('User exists', 400);
    }

    const newCostumer = await this.customersRepository.create({ email, name });

    return newCostumer;
  }
}

export default CreateCustomerService;
