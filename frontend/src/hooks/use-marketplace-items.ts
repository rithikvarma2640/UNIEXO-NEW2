import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface MarketplaceItem {
    _id: string;
    sellerId: any;
    title: string;
    description: string;
    category: string;
    price: number;
    condition: string;
    images: string[];
    location: string;
    isSold: boolean;
    createdAt: string;
}

export const useMarketplaceItems = (filters: any = {}) => {
    return useQuery({
        queryKey: ['marketplaceItems', filters],
        queryFn: async () => {
            const { data } = await api.get('/marketplace', { params: filters });
            // Backend returns { success, message, data: { data: [...], pagination: {...} } }
            const result = data.data;
            return (result?.data || result || []) as MarketplaceItem[];
        },
    });
};

export const useMarketplaceItem = (id: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['marketplaceItem', id],
        queryFn: async () => {
            const { data } = await api.get(`/marketplace/${id}`);
            return data.data as MarketplaceItem;
        },
        enabled: !!id && (options?.enabled ?? true),
    });
};
