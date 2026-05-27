import { SubscriptionPlan } from './types';

export const BSC_USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';
export const TREASURY_WALLET = '0xF781cAAe46F60dB3C9De68D9A2b906Be46A78296';
export const FUTUA_SIMULA_DOWNLOAD_URL = 'https://drive.google.com/file/d/1-Tj8hhrYWHyeRMXlpGuWswHgEVs3nvVv/view?usp=drivesdk';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: '1_MONTH',
    name: 'Futua Simula 1개월 구독권',
    durationMonths: 1,
    priceTotal: 2,
    pricePerMonth: 2,
    features: [
      'Futua Simula 선물 시뮬레이터 30일 완전 가동',
      '전체 거래쌍 해제 (BTC/USDT, ETH/USDT 등)',
      '실시간 모의 체결 인클루시버티 탑재',
      'Netlify Database 안전 연동 (상태 실시간 백업)',
      '기본 가상 거래 지원'
    ],
  },
  {
    id: '6_MONTHS',
    name: 'Futua Simula 6개월 프리미엄 구독권',
    durationMonths: 6,
    priceTotal: 12,
    pricePerMonth: 2,
    features: [
      'Futua Simula 선물 시뮬레이터 180일 완전 가동',
      '전체 거래쌍 해제 및 24/7 백업 세션 유지',
      'Netlify Database 우선 복원 트랙 지원',
      '체결 우선권 분석 시뮬레이션 탑재',
      '구독 중단 없는 지속 사용 보장'
    ],
  },
  {
    id: '12_MONTHS',
    name: 'Futua Simula 12개월 VIP 독점 구독권',
    durationMonths: 12,
    priceTotal: 17,
    pricePerMonth: 1.41,
    features: [
      'Futua Simula 선물 시뮬레이터 365일 무제한 가동',
      '전체 기능 우선 점검 가동권 부여',
      '최대 29% 비용 세이브 독점 혜택 적용',
      'Netlify DB 2중 암호화 데이터베이스 안전 보관',
      '차기 메이저 버전 자동 업그레이드 지원'
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
    subject: '[Futua Simula] 구독 만료 및 자동 갱신 예정 안내',
    emailBody: `안녕하세요, Futua Simula 구독자님. 

회원님의 선물 거래 터미널 구독이 3일 뒤에 종료될 예정입니다. 
스마트 정산 월렛 잔액 및 가스비를 체크하여 중단 없는 서비스를 경험해 보십시오.

- 상품명: Futua Simula 선물 시뮬레이터 라이선스
- 결제 예정가: {PRICE} USDT
- 결제 네트워크: Binance Smart Chain (BSC BEP-20)
- Netlify DB 연동 여부: Connected (안전 보관됨)

만일 자동 결제를 계속 이용하기를 원치 않으시면 터미널 대시보드 내에서 "구독 해지"를 선택해 주십시오.

감사합니다.
Futua Simula Dev Team`,
    pushBody: '⚠️ [Futua Simula] 구독이 3일 후 만료됩니다. 지갑 잔액(USDT)을 점검해 주세요!',
  },
  PAYMENT_FAILED: {
    subject: '[🚫 결제 실패] Futua Simula 구독 갱신 지연 알림',
    emailBody: `안녕하세요, Futua Simula 가입자님.

오늘 예정되었던 회원님의 구독 갱신 결제가 정상적으로 처리되지 못했습니다. 
보유하신 MetaMask 지갑의 잔고 혹은 네트워크 상태를 즉시 재점검해 주시기 바랍니다.

- 사유: 스마트 컨트랙트 지출 한도 가스비(BNB) 부족 혹은 USDT 잔고 부족
- 청구 내용: {PLAN_NAME} ({PRICE} USDT)
- 복원 방법: Futua Simula Port 화면 접속 -> 지갑에 자금 충전 실행

결제가 정상 반영되기 전까지 선물 터미널 라이선스가 임시 일시 중단되며 Free Trial 모드로 강등 처리됩니다.

감사합니다.
Futua Simula Netlify Engine`,
    pushBody: '🚨 [결제 실패] Futua Simula 구독 갱신의 가스비(BNB) 또는 USDT 잔액 요건이 부족합니다!',
  },
  ACTIVATION_SUCCESS: {
    subject: '[✓ 구독 완료] Futua Simula 프리미엄 라이선스 활성화 성공',
    emailBody: `안녕하세요, Futua Simula 구독자님.

성공적으로 블록체인 스마트 결제 서명이 수락되어, 프리미엄 거래 터미널 구독 라이선스가 활성화되었습니다.

- 정상 납부 금액: {PRICE} USDT
- 트랜잭션 해시: {TX_HASH}
- 상태: Netlify Serverless DB 연장 갱신 완료
- 만료 시각: {EXPIRY_DATE} (GMT+9)

설치 파일 다운로드 탭에서 최신 Portable 버전을 인스톨하고, 즉시 무제한 선물 시뮬레이터를 가동하십시오.

감사합니다.
Futua Simula Web3 Core`,
    pushBody: '🎉 [구독 완료] Futua Simula 라이선스가 활성화되었습니다! 다운로드가 개방되었습니다.',
  },
};

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  isBlocked: boolean;
}

export const ISO_COUNTRIES: CountryConfig[] = [
  { code: '+82', name: '대한민국 (South Korea)', flag: '🇰🇷', isBlocked: false },
  { code: '+1', name: '미국/캐나다 (USA/Canada)', flag: '🇺🇸', isBlocked: false },
  { code: '+81', name: '일본 (Japan)', flag: '🇯🇵', isBlocked: false },
  { code: '+44', name: '영국 (UK)', flag: '🇬🇧', isBlocked: false },
  { code: '+65', name: '싱가포르 (Singapore)', flag: '🇸🇬', isBlocked: false },
  { code: '+84', name: '베트남 (Vietnam)', flag: '🇻🇳', isBlocked: false },
  { code: '+61', name: '호주 (Australia)', flag: '🇦🇺', isBlocked: false },
  { code: '+49', name: '독일 (Germany)', flag: '🇩🇪', isBlocked: false },
  { code: '+33', name: '프랑스 (France)', flag: '🇫🇷', isBlocked: false },
  { code: '+63', name: '필리핀 (Philippines)', flag: '🇵🇭', isBlocked: false },
  { code: '+66', name: '태국 (Thailand)', flag: '🇹🇭', isBlocked: false },
  
  // Blocked Countries (차단 규제지역)
  { code: '+53', name: '쿠바 (Cuba)', flag: '🇨🇺', isBlocked: true },
  { code: '+98', name: '이란 (Iran)', flag: '🇮🇷', isBlocked: true },
  { code: '+850', name: '북한 (North Korea)', flag: '🇰🇵', isBlocked: true },
  { code: '+963', name: '시리아 (Syria)', flag: '🇸🇾', isBlocked: true },
  { code: '+380', name: '우크라이나 (Ukraine)', flag: '🇺🇦', isBlocked: true },
  { code: '+7', name: '러시아 (Russia)', flag: '🇷🇺', isBlocked: true },
  { code: '+375', name: '벨라루스 (Belarus)', flag: '🇧🇾', isBlocked: true },
  { code: '+86', name: '중국 (China)', flag: '🇨🇳', isBlocked: true },
  { code: '+852', name: '홍콩 (Hong Kong)', flag: '🇭🇰', isBlocked: true },
  { code: '+853', name: '마카오 (Macau)', flag: '🇲🇴', isBlocked: true },
  { code: '+58', name: '베네수엘라 (Venezuela)', flag: '🇻🇪', isBlocked: true },
  { code: '+354', name: '아이슬란드 (Iceland)', flag: '🇮🇸', isBlocked: true },
  { code: '+47', name: '노르웨이 (Norway)', flag: '🇳🇴', isBlocked: true },
  { code: '+46', name: '스웨덴 (Sweden)', flag: '🇸🇪', isBlocked: true },
  { code: '+358', name: '핀란드 (Finland)', flag: '🇫🇮', isBlocked: true },
  { code: '+45', name: '덴마크 (Denmark)', flag: '🇩🇰', isBlocked: true },
];

