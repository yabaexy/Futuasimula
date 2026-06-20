export type NetworkType = 'BSC_MAINNET' | 'BSC_TESTNET';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  bnbBalance: number;
  usdtBalance: number;
  wydaBalance: number;
  network: NetworkType;
}

export type SubscriptionDuration = '2_MONTHS' | '6_MONTHS' | '12_MONTHS' | 'LIFETIME' | 'CENSORED_LIFETIME' | 'FREE';

export interface SubscriptionPlan {
  id: SubscriptionDuration;
  name: string;
  durationMonths: number;
  priceTotal: number;
  pricePerMonth: number;
  priceTotalWyda?: number;
  pricePerMonthWyda?: number;
  features: string[];
}

export interface UserSubscription {
  planId: SubscriptionDuration;
  activatedAt: string | null;
  expiresAt: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'NONE';
  dbSynced: boolean; // Tracking Netlify DB connection status
  lastSyncTime: string | null;
  serialKey?: string; // Active 15-digit numeric code
  devices?: string[]; // Logged in device physical identifiers (Max 5)
}

export interface BSCTransaction {
  hash: string;
  blockNumber: number;
  timestamp: string;
  from: string;
  to: string;
  value: number; // Token amount (USDT or WYDA)
  tokenSymbol: 'USDT' | 'BNB' | 'WYDA';
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

export interface Subscriber {
  id: string;
  name: string;
  email: string;
  planId: SubscriptionDuration;
  activatedAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'NONE';
  walletAddress: string | null;
  phoneNumber?: string;
  notes?: string;
  serialKey?: string; // 15-digit numeric serial key
}

export interface SerialKey {
  key: string; // 15-digit numeric code
  planId: SubscriptionDuration;
  expiresAt: string | null;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';
  activatedAt?: string;
  assignedToEmail?: string;
  assignedToWallet?: string;
  devices?: string[]; // Logged in device physical identifiers (Max 5)
}

