declare module 'midtrans-client' {
    interface SnapConfig {
      isProduction: boolean;
      serverKey: string;
      clientKey?: string;
    }
  
    interface TransactionDetails {
      transaction_details: {
        order_id: string;
        gross_amount: number;
      };
      customer_details?: {
        first_name?: string;
        email?: string;
        phone?: string;
      };
      credit_card?: {
        secure?: boolean;
      };
      callbacks?: {
        finish?: string;
      };
    }
  
    interface TransactionResponse {
      token?: string;
      redirect_url?: string;
    }
  
    export class Snap {
      constructor(config: SnapConfig);
      createTransaction(details: TransactionDetails): Promise<TransactionResponse>;
    }
}