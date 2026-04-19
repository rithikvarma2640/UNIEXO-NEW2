import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// User bookings
export const useUserBookings = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['userBookings', page, limit],
        queryFn: async () => {
            const { data } = await api.get('/bookings/my', { params: { page, limit } });
            const result = data.data;
            return { bookings: result?.data || result || [], pagination: result?.pagination };
        },
    });
};

// Vendor bookings
export const useVendorBookings = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['vendorBookings', page, limit],
        queryFn: async () => {
            const { data } = await api.get('/bookings/vendor', { params: { page, limit } });
            const result = data.data;
            return { bookings: result?.data || result || [], pagination: result?.pagination };
        },
    });
};

// Wallet
export const useWallet = () => {
    return useQuery({
        queryKey: ['wallet'],
        queryFn: async () => {
            const { data } = await api.get('/wallet');
            return data.data;
        },
    });
};

// Wallet transactions
export const useWalletTransactions = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['walletTransactions', page, limit],
        queryFn: async () => {
            const { data } = await api.get('/wallet/transactions', { params: { page, limit } });
            const result = data.data;
            return { transactions: result?.data || result || [], pagination: result?.pagination };
        },
    });
};

// Vendor vehicles
export const useVendorVehicles = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['vendorVehicles', page, limit],
        queryFn: async () => {
            const { data } = await api.get('/vehicles/vendor/my-vehicles', { params: { page, limit } });
            const result = data.data;
            return { vehicles: result?.data || result || [], pagination: result?.pagination };
        },
    });
};

// Vendor houses
export const useVendorHouses = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['vendorHouses', page, limit],
        queryFn: async () => {
            const { data } = await api.get('/houses/vendor/my-houses', { params: { page, limit } });
            const result = data.data;
            return { houses: result?.data || result || [], pagination: result?.pagination };
        },
    });
};

// User laundry orders
export const useUserLaundryOrders = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['userLaundryOrders', page, limit],
        queryFn: async () => {
            const { data } = await api.get('/laundry/orders/my', { params: { page, limit } });
            const result = data.data;
            return { orders: result?.data || result || [], pagination: result?.pagination };
        },
    });
};

// User marketplace items
export const useUserMarketplaceItems = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ['userMarketplaceItems', page, limit],
        queryFn: async () => {
            const { data } = await api.get('/marketplace/user/my-items', { params: { page, limit } });
            const result = data.data;
            return { items: result?.data || result || [], pagination: result?.pagination };
        },
    });
};

// Vendor profile
export const useVendorProfile = () => {
    return useQuery({
        queryKey: ['vendorProfile'],
        queryFn: async () => {
            const { data } = await api.get('/vendors/profile');
            return data.data;
        },
    });
};

// Vendor dashboard stats
export const useVendorDashboardStats = () => {
    return useQuery({
        queryKey: ['vendorDashboardStats'],
        queryFn: async () => {
            const { data } = await api.get('/vendors/dashboard/stats');
            return data.data;
        },
    });
};
