'use client';

import { useState } from 'react';
import { ListingCard } from '@/components/listing-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Home, MapPin } from 'lucide-react';

import { useHouses } from '@/hooks/use-houses';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { AddHouseDialog } from '@/components/add-house-dialog';

function VendorGroup({ vendorName, location, rooms }: { vendorName: string, location: string, rooms: any[] }) {
  const pgs = rooms.filter(r => r.propertyType === 'pg');
  const individualRooms = rooms.filter(r => r.propertyType === 'room');

  const renderCard = (room: any) => (
    <Link key={room.id} href={room.href} className="group flex flex-col gap-3 cursor-pointer">
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted flex items-center justify-center">
        {room.image ? (
          <img 
            src={room.image} 
            alt={room.title} 
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Home className="w-12 h-12 opacity-20 mb-2" />
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-base line-clamp-1">{room.rawLocation}</h3>
          <div className="flex items-center gap-1 text-sm">
            <span>★</span>
            <span>New</span>
          </div>
        </div>
        <div className="text-muted-foreground text-sm line-clamp-1 capitalize">{room.title} · {room.propertyType === 'pg' ? 'PG' : 'Room'}</div>
        <div className="mt-1 flex items-center gap-1.5 text-sm">
          {room.propertyType === 'pg' ? (
            <>
              <span className="font-semibold text-base text-foreground">₹{room.pricePerMonth}</span>
              <span className="text-muted-foreground">/month</span>
            </>
          ) : (
            <>
              <span className="font-semibold text-base text-foreground">₹{room.pricePerDay}</span>
              <span className="text-muted-foreground">/day</span>
            </>
          )}
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
        {pgs.length > 0 && (
          <div>
            <div className="text-lg font-medium mb-4 text-muted-foreground flex items-center gap-2">
              <Home className="w-5 h-5" /> PGs
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-8">
              {pgs.map(renderCard)}
            </div>
          </div>
        )}

        {individualRooms.length > 0 && (
          <div>
            <div className="text-lg font-medium mb-4 text-muted-foreground flex items-center gap-2">
              <Home className="w-5 h-5" /> Rooms
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-8">
              {individualRooms.map(renderCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HousesPage() {
  const [typeFilter, setTypeFilter] = useState<'all' | 'pg' | 'room'>('all');

  const { data: rooms, isLoading } = useHouses();
  const { user } = useAuthStore();

  const isVendor = user?.role === 'vendor';

  const mappedRooms = (rooms || []).map(r => ({
    id: r._id,
    title: r.title,
    type: 'house' as const,
    propertyType: r.propertyType,
    pricePerMonth: r.pricePerMonth || 0,
    pricePerDay: r.pricePerDay || 0,
    image: r.images?.[0] || '',
    vendorName: r.vendorId?.name || 'Unknown Vendor',
    rating: 0,
    href: `/houses/${r._id}`,
    rawLocation: r.city || r.address || '',
  }));

  const filteredRooms = mappedRooms.filter(v => {
    if (typeFilter === 'pg') {
      return v.propertyType === 'pg';
    } else if (typeFilter === 'room') {
      return v.propertyType === 'room';
    }
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Rooms & Houses</h1>
          <p className="text-muted-foreground">Find the perfect stay for any duration.</p>
        </div>
        {isVendor && <AddHouseDialog />}
      </div>

      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div className="text-sm font-medium text-muted-foreground">
          Showing {filteredRooms.length} properties
        </div>
        
        <div className="flex gap-2">
          <Button 
            size="sm"
            variant={typeFilter === 'pg' ? 'default' : 'outline'} 
            className={typeFilter === 'pg' ? 'bg-primary text-primary-foreground' : ''}
            onClick={() => setTypeFilter(typeFilter === 'pg' ? 'all' : 'pg')}
          >
            <Home className="w-4 h-4 mr-2" /> PGs
          </Button>
          <Button 
            size="sm"
            variant={typeFilter === 'room' ? 'default' : 'outline'} 
            className={typeFilter === 'room' ? 'bg-primary text-primary-foreground' : ''}
            onClick={() => setTypeFilter(typeFilter === 'room' ? 'all' : 'room')}
          >
            <Home className="w-4 h-4 mr-2" /> Rooms
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
              filteredRooms.reduce((acc, room) => {
                const vendorName = room.vendorName || 'Independent Hosts';
                if (!acc[vendorName]) {
                  acc[vendorName] = {
                    location: room.rawLocation || 'Multiple Locations',
                    rooms: []
                  };
                }
                acc[vendorName].rooms.push(room);
                return acc;
              }, {} as Record<string, { location: string, rooms: typeof filteredRooms }>)
            )
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([vendorName, data]) => (
              <VendorGroup 
                key={vendorName} 
                vendorName={vendorName} 
                location={data.location} 
                rooms={data.rooms} 
              />
            ))}
          </div>

          {filteredRooms.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              No properties found. Try adjusting your filters.
            </div>
          )}
        </>
      )}
    </div>
  );
}
