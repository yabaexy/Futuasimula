import React, { useState } from 'react';
import { Wallet, Coins, RefreshCw, Layers, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { WalletState } from '../types';

interface WalletConnectProps {
  wallet: WalletState;
  onConnect: () => void;
  onDisconnect: () => void;
  onNetworkSwitch: () => void;
  onClaimFaucet: () => void;
  isClaiming: boolean;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  wallet,
  onConnect,
  onDisconnect,
  onNetworkSwitch,
  onClaimFaucet,
  isClaiming,
}) => {
  const [showFaucetTip, setShowFaucetTip] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden" id="wallet-connect-card">
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg">
              <Layers size={18} />
            </span>
            <span className="text-xs font-semibold tracking-wider text-yellow-500 uppercase">Binance Smart Chain</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">수수료 절감형 구독 월렛 연결</h2>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Futua Simula 시뮬레이터 플랫폼 구독을 위해 BEP-20 USDT 결제를 연동합니다. <br />
            테스트를 위한 무료 수도꼭지(Faucet) 및 모의 결제 트랙킹 기능을 제공합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {wallet.isConnected ? (
            <>
              <button
                id="btn-network-switch"
                onClick={onNetworkSwitch}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} className="animate-spin-slow" />
                {wallet.network === 'BSC_MAINNET' ? 'BSC Mainnet (Chain 56)' : 'BSC Testnet (Chain 97)'}
              </button>
              
              <button
                id="btn-disconnect"
                onClick={onDisconnect}
                className="px-4 py-2 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/30 text-sm font-semibold rounded-xl transition cursor-pointer"
              >
                연동 해제
              </button>
            </>
          ) : (
            <button
              id="btn-connect-wallet"
              onClick={onConnect}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold rounded-xl shadow-lg shadow-yellow-500/20 transition transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
            >
              <Wallet size={18} />
              MetaMask 월렛 연결 (BSC)
            </button>
          )}
        </div>
      </div>

      {wallet.isConnected && (
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-xs font-semibold">지갑 주소</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-amber-400 font-mono text-sm font-medium tracking-wide">
                {wallet.address?.substring(0, 8)}...{wallet.address?.substring(34)}
              </span>
              <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20 font-medium">
                BSC Connected
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-xs font-semibold">가스비 잔액 (BNB)</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-white font-mono text-lg font-bold">
                {wallet.bnbBalance.toFixed(4)} BNB
              </span>
              <span className="text-slate-500 text-xs">Gas Tracker</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 relative group">
            <span className="text-slate-500 text-xs font-semibold">결제 수단 잔액 (USDT BEP-20)</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-emerald-400 font-mono text-lg font-bold">
                {wallet.usdtBalance.toFixed(2)} USDT
              </span>
              <button
                id="btn-claim-faucet"
                onClick={onClaimFaucet}
                disabled={isClaiming}
                onMouseEnter={() => setShowFaucetTip(true)}
                onMouseLeave={() => setShowFaucetTip(false)}
                className="text-xs bg-emerald-500 hover:bg-emerald-600 text-black px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Coins size={12} />
                {isClaiming ? '클레임 중...' : 'USDT 충전'}
              </button>
            </div>
            {showFaucetTip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 p-2 bg-slate-850 border border-slate-750 text-slate-300 text-2xs rounded-lg shadow-xl z-20 pointer-events-none text-center">
                시뮬레이션 가스비 충전을 위한 0.5 BNB와 결제용 50.0 USDT를 무료로 지급합니다 (BSC Testnet).
              </div>
            )}
          </div>
        </div>
      )}

      {!wallet.isConnected && (
        <div className="mt-4 flex items-center gap-2 bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-3">
          <AlertTriangle size={16} className="text-yellow-500 shrink-0" />
          <span className="text-slate-400 text-xs">
            현재 지갑이 연결되어 있지 않습니다. 모의 결제 프로세스를 검증하기 위해 우측의 <strong>월렛 연결</strong> 버튼을 눌러 테스트용 BSC 가상 월렛을 생성해 주세요.
          </span>
        </div>
      )}
    </div>
  );
};
