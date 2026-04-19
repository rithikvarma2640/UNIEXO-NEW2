import { VehicleRepository } from './vehicle.repository';
import { CloudinaryService } from '../../services/cloudinary.service';
import { VendorProfile } from '../../database/models';
import { ListingApprovalStatus, VendorApprovalStatus } from '../../types/enums';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors';
import { PaginationQuery } from '../../types';

import { IVehicle } from '../../database/models';

export class VehicleService {
  private vehicleRepo: VehicleRepository;

  constructor() {
    this.vehicleRepo = new VehicleRepository();
  }

  async create(
    vendorId: string,
    data: Partial<IVehicle> & { model?: string },
    files?: Express.Multer.File[],
  ) {
    // Verify vendor is approved
    const vendor = await VendorProfile.findOne({ userId: vendorId });
    if (!vendor || vendor.approvalStatus !== VendorApprovalStatus.APPROVED) {
      throw new ForbiddenError('Vendor must be approved to create listings');
    }

    let images: string[] = [];
    if (files && files.length > 0) {
      const allowedFiles = files.slice(0, 1);
      images = await CloudinaryService.uploadMultiple(allowedFiles, 'vehicles');
    }

    // Map 'model' from request to 'modelName' in DB schema
    const { model, ...rest } = data as any;

    const vehicle = await this.vehicleRepo.create({
      ...rest,
      modelName: model || rest.modelName,
      vendorId: vendorId as any,
      images,
      approvalStatus: ListingApprovalStatus.APPROVED, // auto-approve from approved vendors
    });

    return vehicle;
  }

  async getById(id: string) {
    const vehicle = await this.vehicleRepo.findById(id);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    return vehicle;
  }

  async update(vehicleId: string, vendorId: string, data: Partial<IVehicle>) {
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    const vId = typeof vehicle.vendorId === 'object' && vehicle.vendorId._id
      ? vehicle.vendorId._id.toString()
      : vehicle.vendorId.toString();

    if (vId !== vendorId) {
      throw new ForbiddenError('You can only update your own vehicles');
    }

    return this.vehicleRepo.update(vehicleId, data);
  }

  async uploadImages(vehicleId: string, vendorId: string, files: Express.Multer.File[]) {
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    const vId = typeof vehicle.vendorId === 'object' && vehicle.vendorId._id
      ? vehicle.vendorId._id.toString()
      : vehicle.vendorId.toString();

    if (vId !== vendorId) {
      throw new ForbiddenError('You can only update your own vehicles');
    }

    const urls = await CloudinaryService.uploadMultiple(files, 'vehicles');
    return this.vehicleRepo.addImages(vehicleId, urls);
  }

  async delete(vehicleId: string, vendorId: string) {
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    const vId = (vehicle.vendorId as any)._id
      ? (vehicle.vendorId as any)._id.toString()
      : vehicle.vendorId.toString();

    if (vId !== vendorId) {
      throw new ForbiddenError(`You can only delete your own vehicles. Owner: ${vId}, Requester: ${vendorId}`);
    }

    await this.vehicleRepo.softDelete(vehicleId);
  }

  async setAvailability(
    vehicleId: string,
    vendorId: string,
    availability: { startDate: Date; endDate: Date }[],
  ) {
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    const vId = typeof vehicle.vendorId === 'object' && vehicle.vendorId._id
      ? vehicle.vendorId._id.toString()
      : vehicle.vendorId.toString();

    if (vId !== vendorId) {
      throw new ForbiddenError('You can only update your own vehicles');
    }

    return this.vehicleRepo.updateAvailability(vehicleId, availability);
  }

  async listPublic(query: {
    page?: number;
    limit?: number;
    type?: string;
    brand?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    startDate?: string;
    endDate?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const filter: Record<string, any> = {
      approvalStatus: ListingApprovalStatus.APPROVED,
      isAvailable: true,
    };

    if (query.type) filter.type = query.type;
    if (query.brand) filter.brand = query.brand;
    if (query.location) filter.location = { $regex: query.location, $options: 'i' };
    if (query.minPrice || query.maxPrice) {
      filter.pricePerDay = {};
      if (query.minPrice) filter.pricePerDay.$gte = query.minPrice;
      if (query.maxPrice) filter.pricePerDay.$lte = query.maxPrice;
    }

    const paginationQuery: PaginationQuery = {
      page: query.page,
      limit: query.limit,
      sort: query.sort || 'createdAt',
      order: query.order || 'desc',
    };

    return this.vehicleRepo.findAll(filter, paginationQuery);
  }

  async listByVendor(vendorId: string, query: PaginationQuery) {
    return this.vehicleRepo.findByVendor(vendorId, query);
  }

  async approveVehicle(vehicleId: string, status: string, rejectionReason?: string) {
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    const approvalStatus =
      status === 'approved' ? ListingApprovalStatus.APPROVED : ListingApprovalStatus.REJECTED;

    if (approvalStatus === ListingApprovalStatus.REJECTED && !rejectionReason) {
      throw new BadRequestError('Rejection reason is required');
    }

    return this.vehicleRepo.updateApproval(vehicleId, approvalStatus, rejectionReason);
  }
}
