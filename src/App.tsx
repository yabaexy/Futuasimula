import React, { useState, useEffect } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { SubscriptionTiers } from './components/SubscriptionTiers';
import { SubscriptionStatus } from './components/SubscriptionStatus';
import { TransactionHistory } from './components/TransactionHistory';
import { NotificationManager } from './components/NotificationManager';
import { SubscriberManager } from './components/SubscriberManager';
import { MiniGameZone } from './components/MiniGameZone';
import { WalletState, UserSubscription, BSCTransaction, SubscriptionDuration, Subscriber } from './types';
import { SUBSCRIPTION_PLANS, TREASURY_WALLET } from './data';
import { ShieldAlert, CheckCircle2, XCircle, Zap, Database, CreditCard, Users, Gamepad2 } from 'lucide-react';

export default function App() {
  // Tabs Navigation State
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SUBSCRIBERS' | 'GAMES'>('DASHBOARD');

  // 1. Web3 Wallet State
  const [wallet, setWallet] = useState<WalletState>(() => {
    const saved = localStorage.getItem('FUTUA_SIMULA_WALLET');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      isConnected: false,
      address: null,
      bnbBalance: 0,
      usdtBalance: 0,
      network: 'BSC_MAINNET',
    };
  });

  // 2. Active Subscription State with persistent cache emulating Netlify DB
  const [subscription, setSubscription] = useState<UserSubscription>(() => {
    const saved = localStorage.getItem('FUTUA_SIMULA_SUB');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      planId: 'FREE',
      activatedAt: null,
      expiresAt: null,
      status: 'NONE',
      dbSynced: true,
      lastSyncTime: new Date().toLocaleString(),
    };
  });

  // 3. Transactions Ledger State
  const [transactions, setTransactions] = useState<BSCTransaction[]>(() => {
    const saved = localStorage.getItem('FUTUA_SIMULA_TXS');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [
      {
        hash: '0x3f5c9e46a782b13098f98ecbe1b2c4e5781a8296a18d3632906fe548296b92f7',
        blockNumber: 38291045,
        timestamp: new Date().toLocaleString(),
        from: '0x0000000000000000000000000000000000000000',
        to: '0xF781cAAe46F60dB3C9De68D9A2b906Be46A78296',
        value: 1.0,
        tokenSymbol: 'BNB',
        gasFee: 0.00012,
        action: '초기 Netlify DB 동기화 검출 완료',
        status: 'SUCCESS',
      },
    ];
  });

  // 4. Default Seed Generator for Subscribers Database
  const getSubscribersSeeds = (): Subscriber[] => {
    const today = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    const expiredDate = new Date();
    expiredDate.setMonth(expiredDate.getMonth() - 1);
    const expiredStartDate = new Date();
    expiredStartDate.setMonth(expiredStartDate.getMonth() - 2);

    return [
      {
        id: 'SUB-38192',
        name: 'Savrina User',
        email: 'savrina25x@gmail.com', // Prepopulated safely on target details
        planId: '12_MONTHS',
        activatedAt: today.toISOString(),
        expiresAt: sixMonthsFromNow.toISOString(),
        status: 'ACTIVE',
        walletAddress: '0x8390f775485246999027B3197955F781cAAe46F6',
        phoneNumber: '+82 10-1234-5678',
        notes: '관리 데스크에 연합 동기화 완료된 프리미엄 VIP 회원 프로필입니다.',
      },
      {
        id: 'SUB-10492',
        name: '이진아',
        email: 'jina@futua.io',
        planId: '1_MONTH',
        activatedAt: today.toISOString(),
        expiresAt: oneMonthFromNow.toISOString(),
        status: 'ACTIVE',
        walletAddress: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
        phoneNumber: '+82 10-9876-5432',
        notes: 'BSC USDT 1달 자동 결제 스마트 컨트랙트 승인 완료.',
      },
      {
        id: 'SUB-99421',
        name: 'Michael Kim',
        email: 'mikhail@crypto.com',
        planId: '6_MONTHS',
        activatedAt: expiredStartDate.toISOString(),
        expiresAt: expiredDate.toISOString(),
        status: 'EXPIRED',
        walletAddress: '0x9942a782b13098f98ecbe1b2c4e5781a8296a18d',
        phoneNumber: '+1 202-555-0143',
        notes: 'USDT 잔액 부족으로 요금제 부과 스케줄이 실효 만료 처리됨.',
      },
      {
        id: 'SUB-23940',
        name: '최현우',
        email: 'hwchoi@kakao.com',
        planId: '6_MONTHS',
        activatedAt: today.toISOString(),
        expiresAt: sixMonthsFromNow.toISOString(),
        status: 'ACTIVE',
        walletAddress: '0xf781caae46f60db3c9de68d9a2b906be46a78296',
        phoneNumber: '+82 10-3344-5566',
        notes: '선물 시뮬레이터 포터블 완제 가동 등급.',
      },
    ];
  };

  // 5. Subscribers State
  const [subscribers, setSubscribers] = useState<Subscriber[]>(() => {
    const saved = localStorage.getItem('FUTUA_SIMULA_SUBSCRIBERS');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return getSubscribersSeeds();
  });

  // 6. Toast notifications
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    message: string;
  }>({
    show: false,
    type: 'info',
    message: '',
  });

  const [isClaiming, setIsClaiming] = useState(false);
  const [isSimulatingRenewal, setIsSimulatingRenewal] = useState(false);

  // Synchronize state changes with localStorage
  useEffect(() => {
    localStorage.setItem('FUTUA_SIMULA_WALLET', JSON.stringify(wallet));
  }, [wallet]);

  useEffect(() => {
    localStorage.setItem('FUTUA_SIMULA_SUB', JSON.stringify(subscription));
  }, [subscription]);

  useEffect(() => {
    localStorage.setItem('FUTUA_SIMULA_TXS', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('FUTUA_SIMULA_SUBSCRIBERS', JSON.stringify(subscribers));
  }, [subscribers]);

  const triggerToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  const handleConnectWallet = () => {
    const hex = '0123456789abcdef';
    let randAddress = '0x';
    for (let i = 0; i < 40; i++) {
      randAddress += hex.charAt(Math.floor(Math.random() * hex.length));
    }

    setWallet({
      isConnected: true,
      address: randAddress,
      bnbBalance: 0.25,
      usdtBalance: 40.0, // initial test subscription fund
      network: 'BSC_TESTNET',
    });

    // Automatically check if this wallet address belongs to an existing subscriber and synchronize subscription state
    const match = subscribers.find(s => s.walletAddress && s.walletAddress.toLowerCase() === randAddress.toLowerCase());
    if (match && match.status === 'ACTIVE') {
      setSubscription({
        planId: match.planId,
        activatedAt: match.activatedAt,
        expiresAt: match.expiresAt,
        status: 'ACTIVE',
        dbSynced: true,
        lastSyncTime: new Date().toLocaleString()
      });
      triggerToast('success', `가상 BSC 지갑이 연동되었습니다! 동기화된 VIP 구독이 감지되어 라이선스가 적용됩니다.`);
    } else {
      triggerToast('success', '가상 BSC 메타마스크 지갑이 연결되었습니다. (테스트용 자금 40.0 USDT 지급됨)');
    }
  };

  const handleDisconnectWallet = () => {
    setWallet({
      isConnected: false,
      address: null,
      bnbBalance: 0,
      usdtBalance: 0,
      network: 'BSC_MAINNET',
    });
    
    const nextSub: UserSubscription = {
      planId: 'FREE',
      activatedAt: null,
      expiresAt: null,
      status: 'NONE',
      dbSynced: true,
      lastSyncTime: new Date().toLocaleString(),
    };
    setSubscription(nextSub);

    triggerToast('info', '가상 지갑 연결이 취소되었습니다. 구독 상태가 만료 처리됩니다.');
  };

  const handleNetworkSwitch = () => {
    setWallet((prev) => ({
      ...prev,
      network: prev.network === 'BSC_MAINNET' ? 'BSC_TESTNET' : 'BSC_MAINNET',
    }));
    triggerToast('info', '블록체인 네트워크 정합이 변경되었습니다.');
  };

  const handleClaimFaucet = () => {
    if (!wallet.address) return;
    setIsClaiming(true);

    setTimeout(() => {
      setWallet((prev) => ({
        ...prev,
        bnbBalance: prev.bnbBalance + 0.5,
        usdtBalance: prev.usdtBalance + 50.0,
      }));

      const chars = '0123456789abcdef';
      let faucetHash = '0xfc';
      for (let i = 0; i < 62; i++) {
        faucetHash += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const txTime = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
      const newTx: BSCTransaction = {
        hash: faucetHash,
        blockNumber: 38291130,
        timestamp: txTime,
        from: '0x0000000000000000000000000000000000000000',
        to: wallet.address!,
        value: 50.0,
        tokenSymbol: 'USDT',
        gasFee: 0.00025,
        action: 'USDT 충전 수도꼭지 실행 완료',
        status: 'SUCCESS',
      };

      setTransactions((prev) => [newTx, ...prev]);
      setIsClaiming(false);
      triggerToast('success', '테스트 결제용 50.0 USDT와 가스비 0.5 BNB가 충전되었습니다!');
    }, 1000);
  };

  // Synchronised Subscriber Registration on transaction complete
  const handleSubscribe = (
    planId: SubscriptionDuration, 
    txHash: string, 
    userBnbGasSpent: number,
    registrant?: { name: string; email: string; phoneNumber?: string }
  ) => {
    const matchedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!matchedPlan) return;

    const activated = new Date();
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + matchedPlan.durationMonths);

    // Deduct standard pricing
    setWallet((prev) => ({
      ...prev,
      usdtBalance: parseFloat(Math.max(0, prev.usdtBalance - matchedPlan.priceTotal).toFixed(2)),
      bnbBalance: parseFloat(Math.max(0, prev.bnbBalance - userBnbGasSpent).toFixed(4)),
    }));

    const nextSub: UserSubscription = {
      planId,
      activatedAt: activated.toISOString(),
      expiresAt: expiry.toISOString(),
      status: 'ACTIVE',
      dbSynced: true,
      lastSyncTime: new Date().toLocaleString(),
    };

    setSubscription(nextSub);

    // Automatic registration to subscribers list
    const registrantName = registrant?.name || 'Savrina User';
    const registrantEmail = registrant?.email || 'savrina25x@gmail.com';
    const registrantPhone = registrant?.phoneNumber || '';

    setSubscribers((prev) => {
      const existsIndex = prev.findIndex((s) => s.email.toLowerCase() === registrantEmail.toLowerCase() || (s.walletAddress && wallet.address && s.walletAddress.toLowerCase() === wallet.address.toLowerCase()));
      
      const newSubscriber: Subscriber = {
        id: existsIndex !== -1 ? prev[existsIndex].id : `SUB-${Math.floor(Math.random() * 90000) + 10000}`,
        name: registrantName,
        email: registrantEmail,
        planId,
        activatedAt: activated.toISOString(),
        expiresAt: expiry.toISOString(),
        status: 'ACTIVE',
        walletAddress: wallet.address,
        phoneNumber: registrantPhone || prev[existsIndex]?.phoneNumber || '',
        notes: `BSC BEP-20 USDT 결제 완료 신규 승인. TX: ${txHash.substring(0, 10)}...`,
      };

      if (existsIndex !== -1) {
        const next = [...prev];
        next[existsIndex] = newSubscriber;
        return next;
      } else {
        return [newSubscriber, ...prev];
      }
    });

    triggerToast('success', `${matchedPlan.name} 가입이 승인되었습니다. Netlify DB 원장에 기록 완료!`);
  };

  const handleAddTransaction = (hash: string, action: string, amount: number, status: 'SUCCESS' | 'FAILED') => {
    if (!wallet.isConnected) return;

    const txTime = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
    const nextTx: BSCTransaction = {
      hash,
      blockNumber: Math.floor(Math.random() * 600000) + 38200000,
      timestamp: txTime,
      from: wallet.address!,
      to: TREASURY_WALLET,
      value: Math.abs(amount),
      tokenSymbol: 'USDT',
      gasFee: 0.0035,
      action,
      status,
    };

    setTransactions((prev) => [nextTx, ...prev]);
  };

  const handleCancelSubscription = () => {
    const nextSub: UserSubscription = {
      planId: 'FREE',
      activatedAt: null,
      expiresAt: null,
      status: 'NONE',
      dbSynced: true,
      lastSyncTime: new Date().toLocaleString(),
    };
    setSubscription(nextSub);

    // Also update this subscriber record's status in subscriber database!
    setSubscribers((prev) => 
      prev.map((s) => {
        if (s.email === 'savrina25x@gmail.com' || (s.walletAddress && wallet.address && s.walletAddress.toLowerCase() === wallet.address.toLowerCase())) {
          return {
            ...s,
            planId: 'FREE',
            status: 'NONE',
            notes: '유저 본인 직접 포탈 화면에서 VIP 구독 만료/해지 처리.',
          };
        }
        return s;
      })
    );

    triggerToast('info', '구독 라이선스가 취소 처리되었으며 Netlify DB에 정보가 동기화 반영되었습니다.');
  };

  const handleSimulateRenewal = () => {
    if (!wallet.isConnected) return;
    const currentPlan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription.planId);
    if (!currentPlan || currentPlan.id === 'FREE') return;

    setIsSimulatingRenewal(true);

    setTimeout(() => {
      const nextSub: UserSubscription = {
        ...subscription,
        lastSyncTime: new Date().toLocaleString(),
        dbSynced: true,
      };

      setSubscription(nextSub);

      const chars = '0123456789abcdef';
      let renewalHash = '0xdb';
      for (let i = 0; i < 62; i++) {
        renewalHash += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      handleAddTransaction(renewalHash, 'Netlify DB API 호출 (구독 보존상태 확인)', 0, 'SUCCESS');
      setIsSimulatingRenewal(false);
      triggerToast('success', 'Netlify Serverless Database와 결제 검산이 동기화되었습니다.');
    }, 1000);
  };

  const handleSimulatePaymentFailureStatus = () => {
    const nextSub: UserSubscription = {
      planId: 'FREE',
      activatedAt: null,
      expiresAt: null,
      status: 'EXPIRED',
      dbSynced: true,
      lastSyncTime: new Date().toLocaleString(),
    };
    setSubscription(nextSub);

    // Update in subscribers database also!
    setSubscribers((prev) => 
      prev.map((s) => {
        if (s.email === 'savrina25x@gmail.com' || (s.walletAddress && wallet.address && s.walletAddress.toLowerCase() === wallet.address.toLowerCase())) {
          return {
            ...s,
            status: 'EXPIRED',
            notes: '시스템 결제 실패 크론탭 시뮬레이션 영향으로 강제 강등 처리.',
          };
        }
        return s;
      })
    );
  };


  // ==========================================
  // SUBSCRIBERS DB ACTION HANDLERS
  // ==========================================
  const handleAddSubscriber = (newSub: Omit<Subscriber, 'id'>) => {
    const subRecord: Subscriber = {
      id: `SUB-${Math.floor(Math.random() * 90000) + 10000}`,
      ...newSub
    };

    setSubscribers(prev => [subRecord, ...prev]);

    // If matches current user's details, update the global active subscription
    if (newSub.email.toLowerCase() === 'savrina25x@gmail.com' || (wallet.isConnected && newSub.walletAddress && newSub.walletAddress.toLowerCase() === wallet.address?.toLowerCase())) {
      setSubscription({
        planId: newSub.planId,
        activatedAt: newSub.activatedAt,
        expiresAt: newSub.expiresAt,
        status: newSub.status === 'ACTIVE' ? 'ACTIVE' : newSub.status === 'EXPIRED' ? 'EXPIRED' : 'NONE',
        dbSynced: true,
        lastSyncTime: new Date().toLocaleString()
      });
    }
  };

  const handleUpdateSubscriber = (updatedSub: Subscriber) => {
    setSubscribers(prev => prev.map(s => s.id === updatedSub.id ? updatedSub : s));

    // If matches current user's details, update the active subscription
    if (updatedSub.email.toLowerCase() === 'savrina25x@gmail.com' || (wallet.isConnected && updatedSub.walletAddress && updatedSub.walletAddress.toLowerCase() === wallet.address?.toLowerCase())) {
      setSubscription({
        planId: updatedSub.planId,
        activatedAt: updatedSub.activatedAt,
        expiresAt: updatedSub.expiresAt,
        status: updatedSub.status === 'ACTIVE' ? 'ACTIVE' : updatedSub.status === 'EXPIRED' ? 'EXPIRED' : 'NONE',
        dbSynced: true,
        lastSyncTime: new Date().toLocaleString()
      });
    }
  };

  const handleDeleteSubscriber = (id: string) => {
    setSubscribers(prev => prev.filter(s => s.id !== id));
  };

  const handleResetSubscribers = () => {
    if (window.confirm('기존 구독자 데이터베이스를 전부 밀어버리고 초기 시드 팩토리값 대표군들로 완전 재구축하시겠습니까?')) {
      setSubscribers(getSubscribersSeeds());
      
      // Update global active subscription to ACTIVE by referencing first seed if user is matched
      const defaultUserSeed = getSubscribersSeeds().find(s => s.email === 'savrina25x@gmail.com');
      if (defaultUserSeed) {
        setSubscription({
          planId: defaultUserSeed.planId,
          activatedAt: defaultUserSeed.activatedAt,
          expiresAt: defaultUserSeed.expiresAt,
          status: 'ACTIVE',
          dbSynced: true,
          lastSyncTime: new Date().toLocaleString()
        });
      }
      triggerToast('success', '데이터베이스 원장이 최초 테스트용 시드로 다시 점검 정립 완료되었습니다.');
    }
  };


  const activePlan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription.planId) || {
    id: 'FREE' as SubscriptionDuration,
    name: 'Free Trial 기본 모드',
    durationMonths: 0,
    priceTotal: 0,
    pricePerMonth: 0,
    features: ['시뮬레이터 다운로드 가능'],
  };

  // Synchronize Active user subscription state with their Subscriber profile state reactively
  useEffect(() => {
    if (!wallet.isConnected) return;
    
    // Check if wallet is connected and there's a subscriber matched
    setSubscribers((prev) => {
      const matchIndex = prev.findIndex(s => s.email === 'savrina25x@gmail.com' || (s.walletAddress && s.walletAddress.toLowerCase() === wallet.address?.toLowerCase()));
      if (matchIndex !== -1) {
        const matchedSub = prev[matchIndex];
        // If state is out of sync, sync it
        if (matchedSub.status !== subscription.status || matchedSub.planId !== subscription.planId) {
          const next = [...prev];
          next[matchIndex] = {
            ...matchedSub,
            planId: subscription.planId,
            activatedAt: subscription.activatedAt || matchedSub.activatedAt,
            expiresAt: subscription.expiresAt || matchedSub.expiresAt,
            status: subscription.status === 'ACTIVE' ? 'ACTIVE' : subscription.status === 'EXPIRED' ? 'EXPIRED' : 'NONE',
            walletAddress: wallet.address
          };
          return next;
        }
      }
      return prev;
    });
  }, [subscription, wallet.isConnected]);


  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* HEADER SECTION */}
      <header className="border-b border-slate-900 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/15 rounded-xl border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Zap size={20} className="fill-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white tracking-widest uppercase">Futua Simula Port</h1>
                <span className="text-4xs bg-teal-500/15 text-teal-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider border border-teal-500/10">
                  Netlify DB Sync
                </span>
              </div>
              <p className="text-slate-500 text-3xs mt-0.5">간편 구독 정산 결제 & 프로그램 기기 다운로드 클라이언트 데스크</p>
            </div>
          </div>

          {/* Quick Stats overview */}
          <div className="flex items-center gap-4 text-xs font-mono bg-slate-900/50 p-2 px-3 rounded-lg border border-slate-850">
            <div className="text-right">
              <span className="text-slate-500 text-4xs uppercase block font-sans">구독 상태</span>
              <span className="text-emerald-400 font-bold">{activePlan.name}</span>
            </div>
            <div className="h-5 w-px bg-slate-800" />
            <div className="text-right">
              <span className="text-slate-500 text-4xs uppercase block font-sans">보유 USDT</span>
              <span className="text-white font-bold">{wallet.isConnected ? `${wallet.usdtBalance.toFixed(2)} USDT` : '미연결'}</span>
            </div>
          </div>

        </div>
      </header>

      {/* TABS NAVIGATION BAR */}
      <div className="bg-slate-950/40 border-b border-slate-900 sticky top-[77.5px] z-30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 h-12.5 overflow-x-auto">
          <button
            id="tab-nav-dashboard"
            onClick={() => setActiveTab('DASHBOARD')}
            className={`px-4.5 py-2.5 rounded-lg text-xs font-extrabold flex items-center gap-2 cursor-pointer transition ${
              activeTab === 'DASHBOARD'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard size={13} />
            구독 및 스마트 결제 대시보드
          </button>

          <button
            id="tab-nav-subscribers"
            onClick={() => setActiveTab('SUBSCRIBERS')}
            className={`px-4.5 py-2.5 rounded-lg text-xs font-extrabold flex items-center gap-2 cursor-pointer transition ${
              activeTab === 'SUBSCRIBERS'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users size={13} />
            구독자 회원 대시보드 (DB 원장 관리)
          </button>

          <button
            id="tab-nav-games"
            onClick={() => setActiveTab('GAMES')}
            className={`px-4.5 py-2.5 rounded-lg text-xs font-extrabold flex items-center gap-2 cursor-pointer transition ${
              activeTab === 'GAMES'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gamepad2 size={13} />
            프리미엄 미니게임 센터
          </button>
        </div>
      </div>

      {/* CORE FRAME */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full relative z-10">
        
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            {/* Step 1: Wallet connect and credit Faucet */}
            <WalletConnect
              wallet={wallet}
              onConnect={handleConnectWallet}
              onDisconnect={handleDisconnectWallet}
              onNetworkSwitch={handleNetworkSwitch}
              onClaimFaucet={handleClaimFaucet}
              isClaiming={isClaiming}
            />

            {/* Step 2: Active subscription plan verification and Premium Google Drive Download section */}
            <SubscriptionStatus
              subscription={subscription}
              plan={activePlan}
              wallet={wallet}
              onCancelSubscription={handleCancelSubscription}
              onSimulateRenewal={handleSimulateRenewal}
              isSimulatingRenewal={isSimulatingRenewal}
            />

            {/* Step 3: Subscription plans selector */}
            <SubscriptionTiers
              plans={SUBSCRIPTION_PLANS}
              activeSubscription={subscription}
              wallet={wallet}
              onSubscribe={handleSubscribe}
              onAddTransaction={handleAddTransaction}
              onShowConnectToast={() => triggerToast('error', '구독 결제를 완료하기에 앞서 상단의 지갑 연동을 구성해 주십시오.')}
            />

            {/* Step 4: Subscription Expatriation & Payment Failure Alerts Control Cockpit */}
            <NotificationManager
              wallet={wallet}
              subscription={subscription}
              activePlan={activePlan}
              onAddTransaction={handleAddTransaction}
              triggerToast={triggerToast}
              onSimulatePaymentFailureStatus={handleSimulatePaymentFailureStatus}
            />

            {/* Step 5: Netlify database synced ledger console */}
            <TransactionHistory transactions={transactions} />
          </div>
        )}

        {/* TAB 2: SUBSCRIBER MANAGEMENT DATABASE */}
        {activeTab === 'SUBSCRIBERS' && (
          <SubscriberManager
            subscribers={subscribers}
            onAddSubscriber={handleAddSubscriber}
            onUpdateSubscriber={handleUpdateSubscriber}
            onDeleteSubscriber={handleDeleteSubscriber}
            onResetSubscribers={handleResetSubscribers}
            triggerToast={triggerToast}
          />
        )}

        {/* TAB 3: MINIGAMES ZONE */}
        {activeTab === 'GAMES' && (
          <MiniGameZone
            wallet={wallet}
            setWallet={setWallet}
            subscriptionStatus={subscription.status}
            onAddTransaction={handleAddTransaction}
            triggerToast={triggerToast}
          />
        )}

      </main>

      {/* FOOTER SECTION */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950/80 py-8 text-center text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-bold text-slate-400">Futua Simula Integration Node © 2026</p>
          <div className="flex items-center justify-center gap-1 text-slate-600 text-3xs">
            <Database size={11} className="text-indigo-500" />
            <span>Netlify Database Server API active and running in serverless sandbox context</span>
          </div>
        </div>
      </footer>

      {/* TOAST SYSTEM */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-250 min-w-[280px] bg-slate-900 border-slate-800 text-white">
          {toast.type === 'success' && <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />}
          {toast.type === 'error' && <XCircle className="text-red-500 shrink-0" size={18} />}
          {toast.type === 'info' && <ShieldAlert className="text-yellow-500 shrink-0" size={18} />}
          <div className="text-xs font-semibold font-sans">{toast.message}</div>
        </div>
      )}

    </div>
  );
}
