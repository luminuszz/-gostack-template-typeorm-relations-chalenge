import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customerExists = await this.customersRepository.findById(customer_id);

    if (!customerExists) {
      throw new AppError('Customer not exists');
    }

    const existsProducts = await this.productsRepository.findAllById(products);

    if (!existsProducts.length) {
      throw new AppError('Could not find any products', 400);
    }
    const existenProductsIds = existsProducts.map(product => product.id);

    const checkInexistemProducts = products.filter(
      product => !existenProductsIds.includes(product.id),
    );

    if (checkInexistemProducts.length) {
      checkInexistemProducts.map(product => {
        throw new AppError(`Could not find product ${product.id}`, 400);
      });
    }

    const findProductWithQuantityAvailable = products.filter(
      product =>
        existsProducts.filter(p => p.id === product.id)[0].quantity <
        product.quantity,
    );

    if (findProductWithQuantityAvailable.length) {
      findProductWithQuantityAvailable.map(product => {
        throw new AppError(
          `The quantity ${product.quantity} is not Avaible for ${product.id}`,
          400,
        );
      });
    }

    const seriaLaizedProducts = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: existsProducts.filter(
        filterProduct => filterProduct.id === product.id,
      )[0].price,
    }));

    const order = await this.ordersRepository.create({
      customer: customerExists,
      products: seriaLaizedProducts,
    });

    const { order_products } = order;

    const ordeadProductsQuantity = order_products.map(product => ({
      id: product.product_id,
      quantity:
        existsProducts.filter(p => p.id === product.product_id)[0].quantity -
        product.quantity,
    }));

    await this.productsRepository.updateQuantity(ordeadProductsQuantity);

    return order;
  }
}

export default CreateOrderService;
