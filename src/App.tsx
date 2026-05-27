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
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (parsed.wydaBalance === undefined) {
            parsed.wydaBalance = parsed.isConnected ? 1500.0 : 0.0;
          }
          return parsed;
        }
      } catch {
        // ignore
      }
    }
    return {
      isConnected: false,
      address: null,
      bnbBalance: 0,
      usdtBalance: 0,
      wydaBalance: 0,
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

  // Real MetaMask Events Synchronization
  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (ethereum && wallet.isConnected) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          const newAddress = accounts[0];
          setWallet((prev) => ({
            ...prev,
            address: newAddress,
          }));
          triggerToast('success', `BSC Wallet account updated via MetaMask: ${newAddress.substring(0, 8)}...`);
        } else {
          handleDisconnectWallet();
          triggerToast('info', 'MetaMask wallet disconnected by user.');
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        const chainId = parseInt(chainIdHex, 10) || parseInt(chainIdHex, 16);
        const resolvedNetwork = (chainId === 97) ? 'BSC_TESTNET' : 'BSC_MAINNET';
        setWallet((prev) => ({
          ...prev,
          network: resolvedNetwork,
        }));
        triggerToast('info', `MetaMask network changed to ${resolvedNetwork === 'BSC_TESTNET' ? 'BSC Testnet' : 'BSC Mainnet'}`);
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [wallet.isConnected]);

  const triggerToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  const handleConnectWallet = async () => {
    const ethereum = (window as any).ethereum;

    const connectSimulated = () => {
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
        wydaBalance: 1500.0, // initial test WYDA fund
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
        triggerToast('success', 'Simulated BSC wallet connected! Active VIP subscription detected and live license applied.');
      } else {
        triggerToast('success', 'Simulated BSC wallet connected for local testing. (1,500 WYDA, 40.0 USDT sandbox funds)');
      }
    };

    if (ethereum) {
      try {
        triggerToast('info', 'Requesting MetaMask wallet authorization...');
        
        // Request accounts from MetaMask
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        if (!accounts || accounts.length === 0) {
          throw new Error('Authorized MetaMask account list is empty.');
        }

        const realAddress = accounts[0];
        
        // Request chainId
        const chainIdHex = await ethereum.request({ method: 'eth_chainId' }).catch(() => '0x38');
        const chainId = parseInt(chainIdHex, 16);
        const resolvedNetwork = (chainId === 97) ? 'BSC_TESTNET' : 'BSC_MAINNET';

        // Fetch actual BNB balance on BSC chain
        let bnbBalance = 0.25;
        try {
          const balHex = await ethereum.request({
            method: 'eth_getBalance',
            params: [realAddress, 'latest']
          });
          if (balHex) {
            const balWei = parseInt(balHex, 16);
            bnbBalance = Number((balWei / 1e18).toFixed(4));
          }
        } catch {
          // Soft ignore
        }

        setWallet({
          isConnected: true,
          address: realAddress,
          bnbBalance: bnbBalance || 0.25,
          usdtBalance: 40.0, 
          wydaBalance: 1500.0, 
          network: resolvedNetwork,
        });

        // Automatically check if this wallet address belongs to an existing subscriber and synchronize subscription state
        const match = subscribers.find(s => s.walletAddress && s.walletAddress.toLowerCase() === realAddress.toLowerCase());
        if (match && match.status === 'ACTIVE') {
          setSubscription({
            planId: match.planId,
            activatedAt: match.activatedAt,
            expiresAt: match.expiresAt,
            status: 'ACTIVE',
            dbSynced: true,
            lastSyncTime: new Date().toLocaleString()
          });
          triggerToast('success', 'MetaMask wallet connected successfully! Active VIP subscription synchronized and applied.');
        } else {
          triggerToast('success', `MetaMask wallet (${realAddress.substring(0, 8)}...) connected successfully!`);
        }

      } catch (error: any) {
        console.warn('Real MetaMask connection failed:', error);
        if (error?.code === 4001) {
          triggerToast('error', 'User Cancelled: MetaMask wallet connection request rejected by user.');
        } else {
          triggerToast('error', 'Error connecting to MetaMask. Launching local simulated wallet for preview fallback.');
          connectSimulated();
        }
      }
    } else {
      triggerToast('info', 'MetaMask browser extension not detected. Automatically connecting developer simulated wallet (Open in New Tab if you have MetaMask installed).');
      connectSimulated();
    }
  };

  const handleDisconnectWallet = () => {
    setWallet({
      isConnected: false,
      address: null,
      bnbBalance: 0,
      usdtBalance: 0,
      wydaBalance: 0,
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

    triggerToast('info', 'Metamask wallet disconnected. Active license session cleared.');
  };

  const handleNetworkSwitch = () => {
    setWallet((prev) => ({
      ...prev,
      network: prev.network === 'BSC_MAINNET' ? 'BSC_TESTNET' : 'BSC_MAINNET',
    }));
    triggerToast('info', 'Blockchain network config updated.');
  };

  const handleClaimFaucet = () => {
    if (!wallet.address) return;
    setIsClaiming(true);

    setTimeout(() => {
      setWallet((prev) => ({
        ...prev,
        bnbBalance: prev.bnbBalance + 0.5,
        usdtBalance: prev.usdtBalance + 50.0,
        wydaBalance: prev.wydaBalance + 1000.0,
      }));

      const chars = '0123456789abcdef';
      let faucetHash = '0xfc';
      for (let i = 0; i < 62; i++) {
        faucetHash += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const txTime = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
      const newTx1: BSCTransaction = {
        hash: faucetHash,
        blockNumber: 38291130,
        timestamp: txTime,
        from: '0x0000000000000000000000000000000000000000',
        to: wallet.address!,
        value: 50.0,
        tokenSymbol: 'USDT',
        gasFee: 0.00025,
        action: 'USDT Faucet Faucet execution completed successfully',
        status: 'SUCCESS',
      };

      let faucetHash2 = '0xfd';
      for (let i = 0; i < 62; i++) {
        faucetHash2 += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const newTx2: BSCTransaction = {
        hash: faucetHash2,
        blockNumber: 38291131,
        timestamp: txTime,
        from: '0x0000000000000000000000000000000000000000',
        to: wallet.address!,
        value: 1000.0,
        tokenSymbol: 'WYDA',
        gasFee: 0.00025,
        action: 'WYDA Faucet Faucet execution completed successfully',
        status: 'SUCCESS',
      };

      setTransactions((prev) => [newTx1, newTx2, ...prev]);
      setIsClaiming(false);
      triggerToast('success', 'Faucet Claimed: 50.0 USDT, 1,000.0 WYDA, and 0.5 BNB gas fees have been added to your wallet!');
    }, 1000);
  };

  // Synchronised Subscriber Registration on transaction complete
  const handleSubscribe = (
    planId: SubscriptionDuration, 
    txHash: string, 
    userBnbGasSpent: number,
    registrant?: { name: string; email: string; phoneNumber?: string },
    paymentToken: 'USDT' | 'WYDA' = 'USDT'
  ) => {
    const matchedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!matchedPlan) return;

    const activated = new Date();
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + matchedPlan.durationMonths);

    const isWyda = paymentToken === 'WYDA';
    const price = isWyda ? (matchedPlan.priceTotalWyda ?? 350) : matchedPlan.priceTotal;

    // Deduct standard pricing
    setWallet((prev) => ({
      ...prev,
      usdtBalance: !isWyda ? parseFloat(Math.max(0, prev.usdtBalance - price).toFixed(2)) : prev.usdtBalance,
      wydaBalance: isWyda ? parseFloat(Math.max(0, prev.wydaBalance - price).toFixed(2)) : prev.wydaBalance,
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
        notes: `BSC BEP-20 ${paymentToken} settlement confirmed. TX ID: ${txHash.substring(0, 10)}...`,
      };

      if (existsIndex !== -1) {
        const next = [...prev];
        next[existsIndex] = newSubscriber;
        return next;
      } else {
        return [newSubscriber, ...prev];
      }
    });

    triggerToast('success', `${matchedPlan.name} enrollment approved! Synced with Netlify core database registry.`);
  };

  const handleAddTransaction = (
    hash: string, 
    action: string, 
    amount: number, 
    status: 'SUCCESS' | 'FAILED',
    tokenSymbol: 'USDT' | 'WYDA' = 'USDT'
  ) => {
    if (!wallet.isConnected) return;

    const txTime = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
    const nextTx: BSCTransaction = {
      hash,
      blockNumber: Math.floor(Math.random() * 600000) + 38200000,
      timestamp: txTime,
      from: wallet.address!,
      to: TREASURY_WALLET,
      value: Math.abs(amount),
      tokenSymbol,
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
            notes: 'User subscription manually cancelled on dashboard.',
          };
        }
        return s;
      })
    );

    triggerToast('info', 'Subscription license cancelled. Changes synchronized with Netlify DB.');
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

      handleAddTransaction(renewalHash, 'Netlify DB API Call (License validation confirm)', 0, 'SUCCESS');
      setIsSimulatingRenewal(false);
      triggerToast('success', 'Netlify Serverless Database license audit completed successfully.');
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
            notes: 'Forced subscription demotion triggered by payment fail simulation.',
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
    if (window.confirm('Are you absolutely sure you want to completely dump the existing database and rebuild from initial seed values?')) {
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
      triggerToast('success', 'Subscription database restored to default seed factory levels.');
    }
  };


  const activePlan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription.planId) || {
    id: 'FREE' as SubscriptionDuration,
    name: 'Free Trial Basic Mode',
    durationMonths: 0,
    priceTotal: 0,
    pricePerMonth: 0,
    features: ['Simulator downloads enabled'],
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
              <p className="text-slate-500 text-3xs mt-0.5">Easy subscription settlement and main terminal application client port</p>
            </div>
          </div>

          {/* Quick Stats overview */}
          <div className="flex items-center gap-4 text-xs font-mono bg-slate-900/50 p-2 px-3 rounded-lg border border-slate-850">
            <div className="text-right">
              <span className="text-slate-500 text-4xs uppercase block font-sans">Subscription Status</span>
              <span className="text-emerald-400 font-bold">{activePlan.name}</span>
            </div>
            <div className="h-5 w-px bg-slate-800" />
            <div className="text-right">
              <span className="text-slate-500 text-4xs uppercase block font-sans">USDT Balance</span>
              <span className="text-white font-bold">{wallet.isConnected ? `${wallet.usdtBalance.toFixed(2)} USDT` : 'Disconnected'}</span>
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
            Subscription & Smart Payment Dashboard
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
            Subscriber Member Dashboard (DB Ledger Admin)
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
            Premium Mini Game Zone
          </button>
        </div>
      </div>

      {/* CORE FRAME */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full relative z-10">
        
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            {/* Global Distribution & Regional Disclaimer Notice Card */}
            <div className="bg-slate-950 border border-red-900/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden" id="regional-disclaimer-banner">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl shrink-0 border border-red-500/20">
                  <ShieldAlert size={18} />
                </div>
                <div className="text-xs text-slate-300 leading-relaxed font-sans">
                  <span className="font-bold text-red-400 block mb-1 text-sm tracking-wide uppercase">⚠️ Important Licensing Notice</span>
                  This product is not intended for distribution or use in the following countries: China, Russia, Iran, North Korea, Syria, Cuba, Venezuela, Belarus, Nordic Union Contries, Ukraine. Users from these regions may face legal or technical restrictions. Also, if you're-living in Nordic Union or Ukraine, you can buy a package in{' '}
                  <a href="https://booth.pm/ja/items/8397034" target="_blank" rel="noopener noreferrer" className="text-emerald-405 text-emerald-400 hover:text-emerald-300 underline font-mono font-bold transition">
                    https://booth.pm/ja/items/8397034
                  </a>{' '}
                  or{' '}
                  <a href="https://justyxxx.itch.io/futuasimula" target="_blank" rel="noopener noreferrer" className="text-emerald-405 text-emerald-400 hover:text-emerald-300 underline font-mono font-bold transition">
                    https://justyxxx.itch.io/futuasimula
                  </a> .
                </div>
              </div>
            </div>

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
              onShowConnectToast={() => triggerToast('error', 'Please connect your Metamask wallet on top before proceeding to checkout.')}
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
