import mongoose, { Schema, Document, Types } from 'mongoose';
import { ListingApprovalStatus } from '../../types/enums';

export interface IVehicle extends Document {
  _id: Types.ObjectId;
  vendorId: Types.ObjectId;
  name: string;
  type: string;
  brand: string;
  modelName: string;
  year: number;
  registrationNumber: string;
  fuelType: string;
  seatingCapacity: number;
  pricePerHour?: number;
  pricePerDay: number;
  images: string[];
  description?: string;
  features: string[];
  location: string;
  availability: {
    startDate: Date;
    endDate: Date;
  }[];
  approvalStatus: ListingApprovalStatus;
  rejectionReason?: string;
  isAvailable: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    modelName: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    registrationNumber: { type: String, required: true, unique: true, trim: true },
    fuelType: { type: String, required: true },
    seatingCapacity: { type: Number, required: true },
    pricePerHour: { type: Number, min: 0 },
    pricePerDay: { type: Number, required: true, min: 0 },
    images: [{ type: String }],
    description: { type: String, trim: true },
    features: [{ type: String }],
    location: { type: String, required: true, trim: true },
    availability: [
      {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
      },
    ],
    approvalStatus: {
      type: String,
      enum: Object.values(ListingApprovalStatus),
      default: ListingApprovalStatus.PENDING,
    },
    rejectionReason: { type: String },
    isAvailable: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

vehicleSchema.index({ vendorId: 1 });
vehicleSchema.index({ location: 1 });
vehicleSchema.index({ pricePerDay: 1 });
vehicleSchema.index({ approvalStatus: 1 });
vehicleSchema.index({ isAvailable: 1 });
vehicleSchema.index({ createdAt: -1 });
vehicleSchema.index({ type: 1, brand: 1 });

vehicleSchema.pre('find', function () {
  this.where({ isDeleted: false });
});
vehicleSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

export const Vehicle = mongoose.model<IVehicle>('Vehicle', vehicleSchema);
