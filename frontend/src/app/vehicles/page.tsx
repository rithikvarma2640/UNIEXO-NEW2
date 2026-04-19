'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ListingCard } from '@/components/listing-card';
import { Button } from '@/components/ui/button';
import { Car, Bike, MapPin } from 'lucide-react';

import { useVehicles } from '@/hooks/use-vehicles';
import { useAuthStore } from '@/store/auth.store';
import { AddVehicleDialog } from '@/components/add-vehicle-dialog';

function VendorGroup({ vendorName, location, vehicles }: { vendorName: string, location: string, vehicles: any[] }) {
  const cars = vehicles.filter(v => v.rawType === 'car' || v.rawType?.toLowerCase() === 'car');
  const bikes = vehicles.filter(v => v.rawType !== 'car' && v.rawType?.toLowerCase() !== 'car');

  const renderCard = (vehicle: any) => (
    <Link key={vehicle.id} href={vehicle.href} className="group flex flex-col gap-3 cursor-pointer">
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted flex items-center justify-center">
        {vehicle.image ? (
          <img 
            src={vehicle.image} 
            alt={vehicle.title} 
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Car className="w-12 h-12 opacity-20 mb-2" />
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-base line-clamp-1">{vehicle.rawLocation}</h3>
          <div className="flex items-center gap-1 text-sm">
            <span>★</span>
            <span>{vehicle.rating}</span>
          </div>
        </div>
        <div className="text-muted-foreground text-sm line-clamp-1 capitalize">{vehicle.title} · {vehicle.rawType}</div>
        <div className="mt-1 flex items-center gap-1.5 text-sm">
          <span className="font-semibold text-base text-foreground">₹{vehicle.pricePerDay}</span>
          <span className="text-muted-foreground">/day</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-semibold text-base text-foreground">₹{vehicle.pricePerHour}</span>
          <span className="text-muted-foreground">/hr</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-4 mb-10 w-full pt-4 border-t">
      <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
        <MapPin className="w-5 h-5 text-muted-foreground" />
        {vendorName}
      </h2>
      
      <div className="flex flex-col gap-8">
        {cars.length > 0 && (
          <div>
            <div className="text-lg font-medium mb-4 text-muted-foreground flex items-center gap-2">
              <Car className="w-5 h-5" /> Cars
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-8">
              {cars.map(renderCard)}
            </div>
          </div>
        )}

        {bikes.length > 0 && (
          <div>
            <div className="text-lg font-medium mb-4 text-muted-foreground flex items-center gap-2">
              <Bike className="w-5 h-5" /> Bikes
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-8">
              {bikes.map(renderCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  const [typeFilter, setTypeFilter] = useState<'all' | 'car' | 'bike'>('all');
  
  const { data: vehicles, isLoading } = useVehicles();
  const { user } = useAuthStore();

  const isVendor = user?.role === 'vendor';

  const mappedVehicles = (vehicles || []).map(v => ({
    id: v._id,
    title: v.name,
    type: 'vehicle' as const,
    pricePerDay: v.pricePerDay || 0,
    pricePerHour: v.pricePerHour || Math.round((v.pricePerDay || 0) / 24) || 0,
    image: v.images?.[0] || '',
    attributes: [
      { icon: Car, label: 'Type', value: v.type },
      { icon: Car, label: 'Seats', value: `${v.seatingCapacity || 4} Person` },
    ],
    vendorName: v.vendorId?.name || 'Unknown Vendor',
    rating: 4.8,
    href: `/vehicles/${v._id}`,
    rawType: v.type,
    rawLocation: typeof v.location === 'string' ? v.location : (v as any).location?.address || '',
  }));

  const filteredVehicles = mappedVehicles.filter(v => {
    if (typeFilter === 'car') {
      return v.rawType === 'car';
    } else if (typeFilter === 'bike') {
      return ['bike', 'scooter'].includes(v.rawType);
    }
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Vehicles for Rent</h1>
          <p className="text-muted-foreground">Find the perfect ride for your next journey.</p>
        </div>
        {isVendor && <AddVehicleDialog />}
      </div>

      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div className="text-sm font-medium text-muted-foreground">
          Showing {filteredVehicles.length} vehicles
        </div>
        
        <div className="flex gap-2">
          <Button 
            size="sm"
            variant={typeFilter === 'car' ? 'default' : 'outline'} 
            className={typeFilter === 'car' ? 'bg-primary text-primary-foreground' : ''}
            onClick={() => setTypeFilter(typeFilter === 'car' ? 'all' : 'car')}
          >
            <Car className="w-4 h-4 mr-2" /> Cars
          </Button>
          <Button 
            size="sm"
            variant={typeFilter === 'bike' ? 'default' : 'outline'} 
            className={typeFilter === 'bike' ? 'bg-primary text-primary-foreground' : ''}
            onClick={() => setTypeFilter(typeFilter === 'bike' ? 'all' : 'bike')}
          >
            <Bike className="w-4 h-4 mr-2" /> Bikes
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="space-y-12">
            {Object.entries(
              filteredVehicles.reduce((acc, vehicle) => {
                const vendorName = vehicle.vendorName || 'Independent Hosts';
                if (!acc[vendorName]) {
                  acc[vendorName] = {
                    location: vehicle.rawLocation || 'Multiple Locations',
                    vehicles: []
                  };
                }
                acc[vendorName].vehicles.push(vehicle);
                return acc;
              }, {} as Record<string, { location: string, vehicles: typeof filteredVehicles }>)
            )
            .sort((a, b) => a[0].localeCompare(b[0])) // Basic alphabetic sort first, can be enhanced with priority later
            .map(([vendorName, data]) => (
              <VendorGroup 
                key={vendorName} 
                vendorName={vendorName} 
                location={data.location} 
                vehicles={data.vehicles} 
              />
            ))}
          </div>

          {filteredVehicles.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              No vehicles found. Try adjusting your filters.
            </div>
          )}
        </>
      )}
    </div>
  );
}
