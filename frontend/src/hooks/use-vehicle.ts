import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Vehicle } from './use-vehicles';

export const useVehicle = (id: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['vehicle', id],
        queryFn: async () => {
            const { data } = await api.get(`/vehicles/${id}`);
            return data.data as Vehicle;
        },
        enabled: !!id && (options?.enabled ?? true),
    });
};
