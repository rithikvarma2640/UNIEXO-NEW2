import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface CreateOrderParams {
    serviceType: 'vehicle' | 'house' | 'laundry' | 'marketplace';
    referenceId: string;
    amount: number;
}

interface VerifyPaymentParams {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export const useCreatePaymentOrder = () => {
    return useMutation({
        mutationFn: async (data: CreateOrderParams) => {
            const res = await api.post('/payments/create-order', data);
            return res.data;
        },
    });
};

export const useVerifyPayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: VerifyPaymentParams) => {
            const res = await api.post('/payments/verify', data);
            return res.data;
        },
        onSuccess: () => {
            // Invalidate queries to update dashboard statuses
            queryClient.invalidateQueries({ queryKey: ['userBookings'] });
            queryClient.invalidateQueries({ queryKey: ['vendorBookings'] });
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
            queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
        },
    });
};
