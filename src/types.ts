export type NetworkType = 'BSC_MAINNET' | 'BSC_TESTNET';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  bnbBalance: number;
  usdtBalance: number;
  network: NetworkType;
}

export type SubscriptionDuration = '1_MONTH' | '6_MONTHS' | '12_MONTHS' | 'FREE';

export interface SubscriptionPlan {
  id: SubscriptionDuration;
  name: string;
  durationMonths: number;
  priceTotal: number;
  pricePerMonth: number;
  features: string[];
}

export interface UserSubscription {
  planId: SubscriptionDuration;
  activatedAt: string | null;
  expiresAt: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'NONE';
  dbSynced: boolean; // Tracking Netlify DB connection status
  lastSyncTime: string | null;
}

export interface BSCTransaction {
  hash: string;
  blockNumber: number;
  timestamp: string;
  from: string;
  to: string;
  value: number; // USDT amount
  tokenSymbol: 'USDT' | 'BNB';
  gasFee: number; // BNB
  action: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
}

export type NotificationChannel = 'EMAIL' | 'PUSH' | 'BOTH';

export interface NotificationSetting {
  enableEmail: boolean;
  enablePush: boolean;
  targetEmail: string;
  daysBeforeExpiry: number; // e.g., 3 days, 7 days
}

export type NotificationType = 'EXPIRY_WARNING' | 'PAYMENT_FAILED' | 'ACTIVATION_SUCCESS';

export interface NotificationLog {
  id: string;
  timestamp: string;
  type: NotificationType;
  channel: 'EMAIL' | 'PUSH';
  recipient: string;
  subject: string;
  content: string;
  status: 'SENT' | 'FAILED';
  dbSynced: boolean;
}

export interface GeolocationState {
  ip: string;
  countryCode: string; // ISO Code (e.g. KR, US, NO)
  countryName: string;
  isBlocked: boolean;
  detectedMethod: 'API' | 'MANUAL_SIMULATION';
}

export interface BlockedCountry {
  code: string;
  nameKO: string;
  nameEN: string;
}

