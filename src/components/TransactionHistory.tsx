import React, { useState } from 'react';
import { Layers, ArrowUpRight, Search, FileCode2, Clock, CheckCircle, ExternalLink, X } from 'lucide-react';
import { BSCTransaction } from '../types';
import { BSC_USDT_CONTRACT, TREASURY_WALLET } from '../data';

interface TransactionHistoryProps {
  transactions: BSCTransaction[];
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const [selectedTx, setSelectedTx] = useState<BSCTransaction | null>(null);

  return (
    <div className="mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden" id="transaction-history-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="p-1 text-yellow-500 bg-yellow-500/10 rounded-lg">
              <Layers size={16} />
            </span>
            <span className="text-xs font-semibold uppercase text-yellow-500 font-mono">BSC-Scan Ledger</span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">지갑 거래 및 결제 이력 (BscScan 모사)</h3>
        </div>
        
        <div className="text-slate-500 text-xs">
          총 {transactions.length}개의 확인된 체인 로그 발견
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            기록된 거래 기록이 아직 존재하지 않습니다. Faucet Claim 혹은 구독 모의 결제를 진행해 보십시오.
          </div>
        ) : (
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-850 text-slate-500 text-2xs uppercase">
                <th className="pb-3 pl-2">액션</th>
                <th className="pb-3 text-center">트랜잭션 해시</th>
                <th className="pb-3 text-right">금액</th>
                <th className="pb-3 text-right">가스 사용량 (BNB)</th>
                <th className="pb-3 text-center">시간</th>
                <th className="pb-3 text-center">상태</th>
                <th className="pb-3 text-center pr-2">조회</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.hash} className="border-b border-slate-900 hover:bg-slate-950/40">
                  <td className="py-3.5 pl-2">
                    <span className="text-white font-semibold font-sans">{tx.action}</span>
                  </td>
                  <td className="text-center text-amber-500 py-3.5">
                    <button
                      id={`btn-open-tx-${tx.hash.substring(0, 8)}`}
                      onClick={() => setSelectedTx(tx)}
                      className="hover:underline font-bold transition cursor-pointer"
                    >
                      {tx.hash.substring(0, 10)}...{tx.hash.substring(54)}
                    </button>
                  </td>
                  <td className="text-right py-3.5">
                    <span className={tx.value > 0 ? 'text-green-400 font-extrabold' : 'text-slate-300'}>
                      {tx.value > 0 ? `+${tx.value}` : tx.value} {tx.tokenSymbol}
                    </span>
                  </td>
                  <td className="text-right text-slate-500 py-3.5">{tx.gasFee.toFixed(6)} BNB</td>
                  <td className="text-center text-slate-400 py-3.5">{tx.timestamp}</td>
                  <td className="text-center py-3.5">
                    <span className="inline-flex items-center gap-1 text-3xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-sans leading-none">
                      <CheckCircle size={10} />
                      {tx.status}
                    </span>
                  </td>
                  <td className="text-center py-3.5 pr-2">
                    <button
                      id={`btn-open-scan-explorer-${tx.hash.substring(0, 8)}`}
                      onClick={() => setSelectedTx(tx)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer"
                    >
                      <ArrowUpRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Simulated BscScan Detail Modal Dialog Sheet */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm" id="bscscan-modal">
          <div className="bg-[#111827] border border-amber-500/25 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in duration-200">
            {/* Explorer Style Top Banner Header */}
            <div className="bg-[#1e1b4b] px-6 py-4 border-b border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode2 className="text-yellow-500 animate-spin-slow" size={20} />
                <span className="text-xs font-black tracking-wide text-white uppercase font-sans">
                  BSC-Explorer (BscScan 시뮬레이션 인터페이스)
                </span>
              </div>
              <button
                id="btn-close-bscscan"
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-slate-200 text-sm font-bold flex items-center gap-2 font-sans">
                  트랜잭션 상세 조회 데이터
                  <span className="text-4xs bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-mono font-medium leading-none">
                    Status: Verified
                  </span>
                </h4>
                <div className="text-3xs text-slate-500">
                  Block confirmed: #{selectedTx.blockNumber}
                </div>
              </div>

              <div className="bg-slate-950 rounded-xl p-4 border border-slate-900 space-y-3.5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 py-2 border-b border-slate-900">
                  <span className="text-slate-500">Transaction Hash</span>
                  <span className="md:col-span-2 text-amber-500 font-bold select-all break-all">{selectedTx.hash}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 py-2 border-b border-slate-900">
                  <span className="text-slate-500">Status</span>
                  <span className="md:col-span-2 text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle size={12} />
                    {selectedTx.status} (Confirmed in block {selectedTx.blockNumber})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 py-2 border-b border-slate-900">
                  <span className="text-slate-500">From (지갑 소유자)</span>
                  <span className="md:col-span-2 text-slate-300 break-all">{selectedTx.from}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 py-2 border-b border-slate-900">
                  <span className="text-slate-500">To (스마트 컨트랙트)</span>
                  <span className="md:col-span-2 text-slate-300 break-all">
                    {selectedTx.to === TREASURY_WALLET 
                      ? `${TREASURY_WALLET} (Futua Simula Subscription Treasury)`
                      : selectedTx.to}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 py-2 border-b border-slate-900">
                  <span className="text-slate-500">Value (전송 금액)</span>
                  <span className="md:col-span-2 text-white font-bold">
                    {selectedTx.value} {selectedTx.tokenSymbol}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 py-2 border-b border-slate-900">
                  <span className="text-slate-500">Methane Gas Details</span>
                  <span className="md:col-span-2 text-slate-400">
                    <span className="text-white font-bold">{selectedTx.gasFee.toFixed(6)} BNB</span> (Gas limit: 120,535 | Gas Price: 3 Gwei)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 py-2">
                  <span className="text-slate-500">BEP-20 Contract</span>
                  <span className="md:col-span-2 text-slate-400">
                    <span className="text-slate-200">USDT Token Smart Contract:</span> <span className="text-amber-500 break-all">{BSC_USDT_CONTRACT}</span>
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-3xs text-slate-500 font-sans">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  Timestamp: {selectedTx.timestamp} (GMT+9)
                </span>
                <span className="flex items-center gap-1 hover:text-white transition">
                  BscScan 외부 노드와 자동 연동됨 
                  <ExternalLink size={10} />
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  id="btn-close-bscscan-footer"
                  onClick={() => setSelectedTx(null)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition"
                >
                  확인 후 모의 브라우저 닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
