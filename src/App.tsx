import React, { useState, useEffect } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { SubscriptionTiers } from './components/SubscriptionTiers';
import { SubscriptionStatus } from './components/SubscriptionStatus';
import { TransactionHistory } from './components/TransactionHistory';
import { NotificationManager } from './components/NotificationManager';
import { MiniGamesSuite } from './components/MiniGamesSuite';
import { WalletState, UserSubscription, BSCTransaction, SubscriptionDuration } from './types';
import { SUBSCRIPTION_PLANS, TREASURY_WALLET } from './data';
import { ShieldAlert, CheckCircle2, XCircle, Zap, Database } from 'lucide-react';

export default function App() {
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

  // 4. Toast notifications
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

  // Synchronize state changes with persistent memory
  useEffect(() => {
    localStorage.setItem('FUTUA_SIMULA_WALLET', JSON.stringify(wallet));
  }, [wallet]);

  useEffect(() => {
    localStorage.setItem('FUTUA_SIMULA_SUB', JSON.stringify(subscription));
  }, [subscription]);

  useEffect(() => {
    localStorage.setItem('FUTUA_SIMULA_TXS', JSON.stringify(transactions));
  }, [transactions]);

  const triggerToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
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

    triggerToast('success', '가상 BSC 메타마스크 지갑이 연결되었습니다. (테스트용 자금 40.0 USDT 지급됨)');
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

  const handleSubscribe = (planId: SubscriptionDuration, txHash: string, userBnbGasSpent: number) => {
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

      handleAddTransaction(renewalHash, `Netlify DB API 호출 (구독 보존상태 확인)`, 0, 'SUCCESS');
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
  };

  const handleDeductUsdt = (amount: number) => {
    setWallet((prev) => ({
      ...prev,
      usdtBalance: parseFloat(Math.max(0, prev.usdtBalance - amount).toFixed(2)),
    }));
  };

  const handleAddUsdt = (amount: number) => {
    setWallet((prev) => ({
      ...prev,
      usdtBalance: parseFloat((prev.usdtBalance + amount).toFixed(2)),
    }));
  };


  const activePlan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription.planId) || {
    id: 'FREE' as SubscriptionDuration,
    name: 'Free Trial 기본 모드',
    durationMonths: 0,
    priceTotal: 0,
    pricePerMonth: 0,
    features: ['시뮬레이터 다운로드 가능'],
  };

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

      {/* CORE FRAME */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6 relative z-10">
        
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

        {/* Step 4.5: Blockable Multi-arcade and Game Swap Suite */}
        <MiniGamesSuite
          onAddTransaction={handleAddTransaction}
          usdtBalance={wallet.usdtBalance}
          onDeductUsdt={handleDeductUsdt}
          onAddUsdt={handleAddUsdt}
          triggerToast={triggerToast}
        />

        {/* Step 5: Netlify database synced ledger console */}
        <TransactionHistory transactions={transactions} />

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
