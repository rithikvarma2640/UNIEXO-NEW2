import { connectDatabase } from './src/database/connection';
import { Vehicle } from './src/database/models/Vehicle';
import { VehicleService } from './src/modules/vehicle/vehicle.service';

async function testDelete() {
    await connectDatabase();
    console.log('Connected to DB');

    // Find demo vehicle
    const vehicle = await Vehicle.findOne({ name: 'demo' });
    if (!vehicle) {
        console.log('Demo vehicle not found');
        process.exit(0);
    }

    console.log('Found vehicle:', {
        _id: vehicle._id,
        vendorId: vehicle.vendorId,
        name: vehicle.name
    });

    const service = new VehicleService();
    try {
        // Attempt delete
        await service.delete(vehicle._id.toString(), vehicle.vendorId.toString());
        console.log('Successfully deleted vehicle!');
    } catch (err: any) {
        console.error('Failed to delete:', err.message);
    }

    process.exit(0);
}

testDelete();
