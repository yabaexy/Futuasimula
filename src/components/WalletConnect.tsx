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
          <h2 className="text-2xl font-bold text-white tracking-tight">Wallet Connection for Subscription</h2>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Integrate BEP-20 USDT/WYDA payments for the Futua Simula platform subscription. <br />
            Provides a free test faucet and mock payment tracking capabilities.
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
                Disconnect
              </button>
            </>
          ) : (
            <button
              id="btn-connect-wallet"
              onClick={onConnect}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold rounded-xl shadow-lg shadow-yellow-500/20 transition transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
            >
              <Wallet size={18} />
              Connect MetaMask Wallet (BSC)
            </button>
          )}
        </div>
      </div>
 
      {wallet.isConnected && (
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-xs font-semibold">Wallet Address</span>
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
            <span className="text-slate-500 text-xs font-semibold">Gas Balance (BNB)</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-white font-mono text-lg font-bold">
                {wallet.bnbBalance.toFixed(4)} BNB
              </span>
              <span className="text-slate-500 text-xs">Gas Tracker</span>
            </div>
          </div>
 
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 relative group">
            <span className="text-slate-500 text-xs font-semibold">Payment Balance (USDT BEP-20)</span>
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
                {isClaiming ? 'Claiming...' : 'Refill Tokens'}
              </button>
            </div>
            {showFaucetTip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 p-2 bg-slate-850 border border-slate-750 text-slate-300 text-2xs rounded-lg shadow-xl z-20 pointer-events-none text-center">
                Get 0.5 BNB, 50.0 USDT, and 1,000.0 WYDA immediately for testing purposes (BSC Testnet).
              </div>
            )}
          </div>
 
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 relative">
            <span className="text-slate-500 text-xs font-semibold">Payment Balance (WYDA BEP-20)</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-purple-400 font-mono text-lg font-bold">
                {wallet.wydaBalance?.toFixed(1) ?? '0.0'} WYDA
              </span>
              <span className="text-purple-400 text-4xs bg-purple-950/40 border border-purple-800 px-1.5 py-0.5 rounded font-mono">
                Utility Token
              </span>
            </div>
          </div>
        </div>
      )}
 
      {!wallet.isConnected && (
        <div className="mt-4 flex items-center gap-2 bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-3">
          <AlertTriangle size={16} className="text-yellow-500 shrink-0" />
          <span className="text-slate-400 text-xs">
            No wallet connected. To verify the blockchain subscription process, please click the <strong>Connect MetaMask Wallet</strong> button on the right to start.
          </span>
        </div>
      )}
    </div>
  );
};
