import { SubscriptionPlan } from './types';

export const BSC_USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';
export const BSC_WYDA_CONTRACT = '0xD84B7E8b295d9Fa9656527AC33Bf4F683aE7d2C4';
export const TREASURY_WALLET = '0xF781cAAe46F60dB3C9De68D9A2b906Be46A78296';
export const FUTUA_SIMULA_DOWNLOAD_URL = 'https://drive.google.com/file/d/1-Tj8hhrYWHyeRMXlpGuWswHgEVs3nvVv/view?usp=drivesdk';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: '1_MONTH',
    name: 'Futua Simula 1 Month Subscription',
    durationMonths: 1,
    priceTotal: 2,
    pricePerMonth: 2,
    priceTotalWyda: 350,
    pricePerMonthWyda: 350,
    features: [
      'Futua Simula futures simulator 30 days full operation',
      'Unlock all trading pairs (BTC/USDT, ETH/USDT, etc.)',
      'Real-time simulated execution execution engine',
      'Secure Netlify Database integration (real-time state backup)',
      'Basic virtual trading support'
    ],
  },
  {
    id: '6_MONTHS',
    name: 'Futua Simula 6 Months Premium Subscription',
    durationMonths: 6,
    priceTotal: 12,
    pricePerMonth: 2,
    priceTotalWyda: 2000,
    pricePerMonthWyda: 333.33,
    features: [
      'Futua Simula futures simulator 180 days full operation',
      'Unlock all trading pairs & maintain 24/7 backup session',
      'Priority restore track support via Netlify Database',
      'Execution priority analysis simulation included',
      'Guaranteed continuous use without subscription interruption'
    ],
  },
  {
    id: '12_MONTHS',
    name: 'Futua Simula 12 Months VIP Exclusive Subscription',
    durationMonths: 12,
    priceTotal: 17,
    pricePerMonth: 1.41,
    priceTotalWyda: 4000,
    pricePerMonthWyda: 333.33,
    features: [
      'Futua Simula futures simulator 365 days unlimited operation',
      'Priority system check and operation rights granted',
      'Exclusive benefit of up to 29% cost savings applied',
      'Secure double-encrypted database storage on Netlify DB',
      'Automatic upgrades to future major versions supported'
    ],
  },
];

export interface NotificationTemplate {
  subject: string;
  emailBody: string;
  pushBody: string;
}

export const DEFAULT_TEMPLATES: Record<string, NotificationTemplate> = {
  EXPIRY_WARNING: {
    subject: '[Futua Simula] Subscription Expiring Soon & Auto-Renewal Notice',
    emailBody: `Hello, Futua Simula subscriber.

Your futures trading terminal subscription is scheduled to end in 3 days.
Please check your smart settlement wallet balance and gas fees to experience uninterrupted service.

- Product Name: Futua Simula Futures Simulator License
- Expected Payment: {PRICE} USDT
- Payment Network: Binance Smart Chain (BSC BEP-20)
- Netlify DB Integration Status: Connected (Securely Stored)

If you do not wish to continue the auto-renewal, please select "Cancel Subscription" in the terminal dashboard.

Thank you.
Futua Simula Dev Team`,
    pushBody: '⚠️ [Futua Simula] Subscription expires in 3 days. Please check your wallet balance (USDT)!',
  },
  PAYMENT_FAILED: {
    subject: '[🚫 Payment Failed] Futua Simula Subscription Renewal Delayed Notice',
    emailBody: `Hello, Futua Simula subscriber.

Your scheduled subscription renewal payment today could not be processed normally.
Please immediately check your MetaMask wallet balance or network connection.

- Reason: Insufficient gas fees (BNB) or insufficient USDT balance for smart contract deduction
- Billing Details: {PLAN_NAME} ({PRICE} USDT)
- Restoration: Connect to Futua Simula Port -> Top up funds in your wallet

Until the payment is processed normally, your futures terminal license will be temporarily suspended and demoted to Free Trial mode.

Thank you.
Futua Simula Netlify Engine`,
    pushBody: '🚨 [Payment Failed] Insufficient gas (BNB) or USDT balance to renew Futua Simula subscription!',
  },
  ACTIVATION_SUCCESS: {
    subject: '[✓ Subscription Approved] Futua Simula Premium License Activated successfully',
    emailBody: `Hello, Futua Simula subscriber.

Your blockchain smart payment signature has been successfully accepted, and your premium trading terminal subscription license is now active.

- Standard Payment Amount: {PRICE} USDT
- Transaction Hash: {TX_HASH}
- Status: Netlify Serverless DB renewal update completed
- Expiry Time: {EXPIRY_DATE} (GMT+9)

Please download the latest Portable version from the installation files tab, install it, and launch your unlimited futures simulator immediately.

Thank you.
Futua Simula Web3 Core`,
    pushBody: '🎉 [Subscription Active] Futua Simula license activated! Downloads are now unlocked.',
  },
};

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  isBlocked: boolean;
}

export const ISO_COUNTRIES: CountryConfig[] = [
  { code: '+82', name: 'South Korea', flag: '🇰🇷', isBlocked: false },
  { code: '+1', name: 'USA/Canada', flag: '🇺🇸', isBlocked: false },
  { code: '+81', name: 'Japan', flag: '🇯🇵', isBlocked: false },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧', isBlocked: false },
  { code: '+65', name: 'Singapore', flag: '🇸🇬', isBlocked: false },
  { code: '+84', name: 'Vietnam', flag: '🇻🇳', isBlocked: false },
  { code: '+61', name: 'Australia', flag: '🇦🇺', isBlocked: false },
  { code: '+49', name: 'Germany', flag: '🇩🇪', isBlocked: false },
  { code: '+33', name: 'France', flag: '🇫🇷', isBlocked: false },
  { code: '+63', name: 'Philippines', flag: '🇵🇭', isBlocked: false },
  { code: '+66', name: 'Thailand', flag: '🇹🇭', isBlocked: false },
  
  // Blocked Countries (Sanctioned and restricted)
  { code: '+53', name: 'Cuba', flag: '🇨🇺', isBlocked: true },
  { code: '+98', name: 'Iran', flag: '🇮🇷', isBlocked: true },
  { code: '+850', name: 'North Korea', flag: '🇰🇵', isBlocked: true },
  { code: '+963', name: 'Syria', flag: '🇸🇾', isBlocked: true },
  { code: '+380', name: 'Ukraine', flag: '🇺🇦', isBlocked: true },
  { code: '+7', name: 'Russia', flag: '🇷🇺', isBlocked: true },
  { code: '+375', name: 'Belarus', flag: '🇧🇾', isBlocked: true },
  { code: '+86', name: 'China', flag: '🇨🇳', isBlocked: true },
  { code: '+852', name: 'Hong Kong', flag: '🇭🇰', isBlocked: true },
  { code: '+853', name: 'Macau', flag: '🇲🇴', isBlocked: true },
  { code: '+58', name: 'Venezuela', flag: '🇻🇪', isBlocked: true },
  { code: '+354', name: 'Iceland', flag: '🇮🇸', isBlocked: true },
  { code: '+47', name: 'Norway', flag: '🇳🇴', isBlocked: true },
  { code: '+46', name: 'Sweden', flag: '🇸🇪', isBlocked: true },
  { code: '+358', name: 'Finland', flag: '🇫🇮', isBlocked: true },
  { code: '+45', name: 'Denmark', flag: '🇩🇰', isBlocked: true },
];

