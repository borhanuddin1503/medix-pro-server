export interface IPaymentIntentResponse {
    success: boolean;
    message: string;
    clientSecret?: string | null;
}