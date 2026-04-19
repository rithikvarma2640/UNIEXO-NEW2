import { LaundryRepository } from './laundry.repository';
import { AdminSettings } from '../../database/models';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { PaginationQuery } from '../../types';
import { env } from '../../config/env';

export class LaundryServiceModule {
  private laundryRepo: LaundryRepository;

  constructor() {
    this.laundryRepo = new LaundryRepository();
  }

  // Admin-only: Add laundry provider
  async createService(data: {
    name: string;
    description: string;
    providerName: string;
    providerPhone: string;
    providerAddress: string;
    services: { name: string; price: number; unit: string }[];
  }) {
    return this.laundryRepo.createService(data);
  }

  async getServiceById(id: string) {
    const service = await this.laundryRepo.findServiceById(id);
    if (!service) throw new NotFoundError('Laundry service not found');
    return service;
  }

  async listServices(query: PaginationQuery) {
    return this.laundryRepo.findAllServices({ isActive: true }, query);
  }

  async updateService(id: string, data: Record<string, unknown>) {
    const service = await this.laundryRepo.findServiceById(id);
    if (!service) throw new NotFoundError('Laundry service not found');
    return this.laundryRepo.updateService(id, data as any);
  }

  async deleteService(id: string) {
    await this.laundryRepo.deleteService(id);
  }

  // User: Place order 
  async placeOrder(
    userId: string,
    data: {
      laundryServiceId: string;
      items: { serviceName: string; quantity: number }[];
      deliveryAddress: string;
      pickupDate?: string;
      notes?: string;
    },
  ) {
    const laundryService = await this.laundryRepo.findServiceById(data.laundryServiceId);
    if (!laundryService) throw new NotFoundError('Laundry service not found');
    if (!laundryService.isActive) throw new BadRequestError('Laundry service is not active');

    // Calculate totals
    const orderItems = data.items.map((item) => {
      const serviceDetail = laundryService.services.find((s) => s.name === item.serviceName);
      if (!serviceDetail) throw new BadRequestError(`Service "${item.serviceName}" not found`);
      return {
        serviceName: item.serviceName,
        quantity: item.quantity,
        pricePerUnit: serviceDetail.price,
        total: serviceDetail.price * item.quantity,
      };
    });

    const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);

    // Get commission
    const commissionSetting = await AdminSettings.findOne({ key: 'commission_percent' });
    const commissionPercent = commissionSetting
      ? (commissionSetting.value as number)
      : env.DEFAULT_COMMISSION_PERCENT;
    const commissionAmount = (totalAmount * commissionPercent) / 100;

    const order = await this.laundryRepo.createOrder({
      userId: userId as any,
      laundryServiceId: data.laundryServiceId as any,
      items: orderItems,
      totalAmount,
      commissionAmount,
      commissionPercent,
      deliveryAddress: data.deliveryAddress,
      pickupDate: data.pickupDate ? new Date(data.pickupDate) : undefined,
      notes: data.notes,
    });

    return order;
  }

  async getOrderById(id: string) {
    const order = await this.laundryRepo.findOrderById(id);
    if (!order) throw new NotFoundError('Order not found');
    return order;
  }

  async getUserOrders(userId: string, query: PaginationQuery) {
    return this.laundryRepo.findOrdersByUser(userId, query);
  }

  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.laundryRepo.findOrderById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    return this.laundryRepo.updateOrderStatus(orderId, status);
  }

  async listAllOrders(query: PaginationQuery, status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    return this.laundryRepo.findAllOrders(filter, query);
  }
}
