interface TelegramUpdate {
    update_id: number;
    message?: {
        message_id: number;
        from: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
        };
        chat: {
            id: number;
        };
        text?: string;
        contact?: {
            phone_number: string;
            first_name?: string;
            last_name?: string;
            user_id?: number;
        };
    };
}
export declare function sendSellerBotMessage(text: string): Promise<boolean>;
export declare const sendBotMessage: typeof sendSellerBotMessage;
export declare function sendCustomerBotMessage(chatId: string | number, text: string, replyMarkup?: any): Promise<boolean>;
export declare function sendDebtReminder(customerId: string, daysLeft: number): Promise<boolean>;
export declare function startPolling(): Promise<void>;
export declare function stopPolling(): void;
export declare function getDaysUntil(date: Date): number;
export declare function formatAmount(amount: number): string;
export declare function formatDate(date: Date): string;
export declare function handleTelegramUpdate(update: TelegramUpdate): Promise<void>;
export {};
//# sourceMappingURL=telegram.service.d.ts.map