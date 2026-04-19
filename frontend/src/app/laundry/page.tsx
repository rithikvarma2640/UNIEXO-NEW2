'use client';

import { useState } from 'react';
import { ListingCard } from '@/components/listing-card';
import { SearchBar } from '@/components/search-bar';
import { Card } from '@/components/ui/card';

import { useLaundryServices } from '@/hooks/use-laundry-services';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import { AddLaundryServiceDialog } from '@/components/add-laundry-service-dialog';

export default function LaundryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: services, isLoading } = useLaundryServices();
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'admin';

  const mappedServices = (services || []).map(service => ({
    id: service._id,
    title: service.name,
    type: 'laundry' as const,
    price: service.services?.[0]?.price || 0,
    unit: service.services?.[0]?.unit || 'load',
    image: service.images?.[0] || 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&q=80',
    category: 'Laundry',
    vendorName: service.providerName || 'Unknown Provider',
    rating: 0,
    href: `/laundry/${service._id}`,
  }));

  const filteredServices = mappedServices.filter(v => 
    v.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Laundry Services</h1>
          <p className="text-muted-foreground">Expert cleaning, delivered to your door.</p>
        </div>
        {isAdmin && <AddLaundryServiceDialog />}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="mb-6">
            <SearchBar 
              className="max-w-md w-full" 
              placeholder="Search laundry services..." 
              buttonText="Search"
              onSearch={setSearchTerm} 
            />
          </div>

          <div className="flex justify-between items-center mb-6 text-sm text-muted-foreground">
            <span>Showing {filteredServices.length} services</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredServices.map((service) => (
                  <ListingCard key={service.id} {...service} />
                ))}
              </div>

              {filteredServices.length === 0 && (
                <div className="text-center py-20 border rounded-2xl border-dashed">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium">No services found</h3>
                  <p className="text-muted-foreground">Try adjusting your search term.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
