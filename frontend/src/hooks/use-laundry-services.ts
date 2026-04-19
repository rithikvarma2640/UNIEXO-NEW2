import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface LaundryService {
    _id: string;
    name: string;
    description: string;
    providerName: string;
    providerPhone: string;
    providerAddress: string;
    services: {
        name: string;
        price: number;
        unit: string;
    }[];
    images: string[];
    isActive: boolean;
    createdAt: string;
}

export const useLaundryServices = (filters: any = {}) => {
    return useQuery({
        queryKey: ['laundryServices', filters],
        queryFn: async () => {
            const { data } = await api.get('/laundry/services', { params: filters });
            // Backend returns { success, message, data: { data: [...], pagination: {...} } }
            const result = data.data;
            return (result?.data || result || []) as LaundryService[];
        },
    });
};

export const useLaundryService = (id: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['laundryService', id],
        queryFn: async () => {
            const { data } = await api.get(`/laundry/services/${id}`);
            return data.data as LaundryService;
        },
        enabled: !!id && (options?.enabled ?? true),
    });
};

interface CreateLaundryOrderParams {
    laundryServiceId: string;
    items: { serviceName: string; quantity: number }[];
    deliveryAddress: string;
    pickupDate?: string;
    notes?: string;
}

export const useCreateLaundryOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateLaundryOrderParams) => {
            const res = await api.post('/laundry/orders', data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userOrders'] });
        },
    });
};
