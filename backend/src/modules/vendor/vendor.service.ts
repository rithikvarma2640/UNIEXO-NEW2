import { VendorRepository } from './vendor.repository';
import { CloudinaryService } from '../../services/cloudinary.service';
import { User, Wallet, Vehicle, House, Booking } from '../../database/models';
import { UserRole, VendorApprovalStatus } from '../../types/enums';
import { ConflictError, NotFoundError, BadRequestError } from '../../utils/errors';
import { PaginationQuery } from '../../types';

export class VendorService {
  private vendorRepo: VendorRepository;

  constructor() {
    this.vendorRepo = new VendorRepository();
  }

  async register(
    userId: string,
    data: {
      businessName: string;
      businessAddress: string;
      businessPhone: string;
      description?: string;
    },
  ) {
    const existing = await this.vendorRepo.findByUserId(userId);
    if (existing) {
      throw new ConflictError('Vendor profile already exists');
    }

    const profile = await this.vendorRepo.create({ ...data, userId: userId as any });

    // Update user role to vendor
    await User.findByIdAndUpdate(userId, { role: UserRole.VENDOR });

    return profile;
  }

  async getProfile(userId: string) {
    const profile = await this.vendorRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Vendor profile not found');
    return profile;
  }

  async updateProfile(userId: string, data: Partial<{
    businessName: string;
    businessAddress: string;
    businessPhone: string;
    description: string;
    serviceType: string;
  }>) {
    const profile = await this.vendorRepo.updateProfile(userId, data);
    if (!profile) throw new NotFoundError('Vendor profile not found');
    return profile;
  }

  async uploadDocuments(userId: string, files: Express.Multer.File[]) {
    const profile = await this.vendorRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Vendor profile not found');

    const urls = await CloudinaryService.uploadMultiple(files, 'vendor-docs');
    return this.vendorRepo.updateDocuments(profile._id.toString(), urls);
  }

  async approveVendor(vendorProfileId: string, status: string, rejectionReason?: string) {
    const profile = await this.vendorRepo.findById(vendorProfileId);
    if (!profile) throw new NotFoundError('Vendor profile not found');

    // Allow re-approval of rejected vendors
    if (profile.approvalStatus === VendorApprovalStatus.APPROVED && status === 'approved') {
      throw new BadRequestError('Vendor is already approved');
    }

    const approvalStatus =
      status === 'approved' ? VendorApprovalStatus.APPROVED : VendorApprovalStatus.REJECTED;

    if (approvalStatus === VendorApprovalStatus.REJECTED && !rejectionReason) {
      throw new BadRequestError('Rejection reason is required');
    }

    const updated = await this.vendorRepo.updateApproval(
      vendorProfileId,
      approvalStatus,
      rejectionReason,
    );

    // Create wallet for approved vendor
    if (approvalStatus === VendorApprovalStatus.APPROVED) {
      const existingWallet = await Wallet.findOne({ userId: profile.userId });
      if (!existingWallet) {
        await Wallet.create({ userId: profile.userId });
      }
    }

    return updated;
  }

  async listVendors(query: PaginationQuery, status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.approvalStatus = status;
    return this.vendorRepo.findAll(filter, query);
  }

  async getDashboardStats(userId: string) {
    const profile = await this.vendorRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Vendor profile not found');

    const vendorBookings = await Booking.find({ vendorId: userId });

    const totalOrders = vendorBookings.length;
    const pendingOrders = vendorBookings.filter(b => b.status === 'pending').length;
    const completedOrders = vendorBookings.filter(b => b.status === 'completed').length;
    const revenue = vendorBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.totalAmount - (b.commissionAmount || 0)), 0);

    // Keeping original stats just in case
    const totalVehicles = await Vehicle.countDocuments({ vendorId: userId });
    const totalHouses = await House.countDocuments({ vendorId: userId });

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      revenue,
      traffic: 0, // Placeholder for traffic analytics
      totalVehicles,
      totalHouses,
      status: profile.approvalStatus,
    };
  }
}
