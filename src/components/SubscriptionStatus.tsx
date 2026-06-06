import React, { useState } from 'react';
import { ShieldCheck, Calendar, RefreshCw, XCircle, AlertTriangle, Download, Database, CheckCircle2, CloudLightning } from 'lucide-react';
import { UserSubscription, SubscriptionPlan, WalletState } from '../types';
import { FUTUA_SIMULA_DOWNLOAD_URL } from '../data';

interface SubscriptionStatusProps {
  subscription: UserSubscription;
  plan: SubscriptionPlan;
  wallet: WalletState;
  onCancelSubscription: () => void;
  onSimulateRenewal: () => void;
  isSimulatingRenewal: boolean;
  onActivateSerial: (key: string) => boolean;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  subscription,
  plan,
  wallet,
  onCancelSubscription,
  onSimulateRenewal,
  isSimulatingRenewal,
  onActivateSerial,
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [serialInput, setSerialInput] = useState('');

  const handleActivateBtn = () => {
    const success = onActivateSerial(serialInput);
    if (success) {
      setSerialInput('');
    }
  };

  const daysRemaining = subscription.expiresAt
    ? Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = () => {
    onCancelSubscription();
    setShowCancelConfirm(false);
  };

  return (
    <div className="space-y-6" id="subscription-status-section">
      {/* 1. Main Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden" id="subscription-status-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4 flex-grow">
            <div className="flex items-center gap-2">
              <span className="p-1 text-emerald-400 bg-emerald-500/10 rounded-lg">
                <ShieldCheck size={20} />
              </span>
              <span className="text-sm font-bold text-slate-300">현재 보존된 구독 라이선스 상태</span>
            </div>

            <div>
              <div className="flex flex-wrap items-baseline gap-2">
                <h3 className="text-2xl font-black text-white tracking-tight">{plan.name}</h3>
                {subscription.status === 'ACTIVE' ? (
                  <span className="text-3xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
                    실시간 사용 가능 라이선스
                  </span>
                ) : (
                  <span className="text-3xs bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-1 rounded-full font-bold">
                    무료 체험 기본 모드
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs mt-1">
                {plan.id === 'FREE'
                  ? '무료 체험 모드 상태에서는 가벼운 시뮬레이션 둘러보기 및 인스톨 다운로드 테스트를 지원합니다.'
                  : '스마트 컨트랙트 검증을 통과하여 정상적으로 발급된 유효 계약입니다.'}
              </p>
            </div>

            {subscription.status === 'ACTIVE' && (
              <div className="flex flex-wrap gap-3 text-xs text-slate-300 font-mono">
                <div className="flex items-center gap-1.5 py-1 px-3 bg-slate-950 rounded-lg border border-slate-850">
                  <Calendar size={13} className="text-slate-500" />
                  <span className="text-slate-500">라이선스 만료일:</span>
                  <span className="text-white font-bold">
                    {plan.id === 'LIFETIME' ? '영구 사용 (무제한 / Permanent)' : subscription.expiresAt?.split('T')[0]}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 py-1 px-3 bg-slate-950 rounded-lg border border-slate-850">
                  <span className="text-slate-500">남은 잔여 일수:</span>
                  <span className="text-emerald-400 font-bold">
                    {plan.id === 'LIFETIME' ? '무제한 (No Expiry)' : `${daysRemaining}일 남음`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Netlify DB Real-time State Panel */}
          <div className="flex flex-col gap-3.5 min-w-[280px] bg-slate-950/70 p-5 rounded-xl border border-slate-850">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Database size={13} className="text-indigo-400" />
                <span>Netlify DB 원장 상태</span>
              </h4>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>데이터 동기화 방식</span>
                <span className="text-white font-mono text-xs">REST / JSON Serverless</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>동기화 상태</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {subscription.dbSynced ? '✓ CONNECTED' : 'Sync Waiting'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>최종 동기화 시각</span>
                <span className="text-slate-200 font-mono text-3xs">
                  {subscription.lastSyncTime || '초기 연결 상태'}
                </span>
              </div>
            </div>

            {plan.id !== 'FREE' && (
              <div className="pt-2.5 border-t border-slate-900 flex flex-col gap-2">
                <button
                  id="btn-simulate-renew"
                  onClick={onSimulateRenewal}
                  disabled={isSimulatingRenewal || !wallet.isConnected}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-3xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={11} className={isSimulatingRenewal ? 'animate-spin' : ''} />
                  {isSimulatingRenewal ? 'Netlify DB 요금 재동기화 중...' : 'Netlify DB 동기화 강제 수동 갱신'}
                </button>
                
                <button
                  id="btn-cancel-subscription"
                  onClick={handleCancelClick}
                  className="w-full py-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/10 text-3xs font-semibold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  구독 라이선스 해지 (Free 모드로 환원)
                </button>
              </div>
            )}
          </div>
        </div>

        {showCancelConfirm && (
          <div className="mt-4 p-4 bg-red-950/30 border border-red-900/30 rounded-xl flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-grow">
              <h4 className="text-white text-xs font-bold">구독 라이선스를 무효화 하시겠습니까?</h4>
              <p className="text-slate-400 text-2xs mt-1 leading-normal">
                해제 즉시 Netlify 데이터베이스 원장의 활성화 정보가 업데이트되며 무료 모드로 등급이 전환됩니다. 소모된 가스 수수료는 복원되지 않습니다.
              </p>
              <div className="mt-3 flex justify-end gap-2 text-2xs">
                <button
                  id="btn-cancel-abort"
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg cursor-pointer"
                >
                  구독 유지하기
                </button>
                <button
                  id="btn-confirm-cancel-exec"
                  onClick={handleConfirmCancel}
                  className="px-3 py-1 bg-red-650 hover:bg-red-600 text-white font-bold rounded-lg cursor-pointer"
                >
                  라이선스 무효화 처리 수행
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 1.5 Serial Key Activation Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden" id="serial-key-activation-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-grow space-y-2">
            <h4 className="text-sm font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
              <span className="p-1 bg-indigo-500/15 text-indigo-400 rounded-lg">
                <CheckCircle2 size={16} />
              </span>
              <span>라이선스 시리얼 인증 연동 (Activate Numeric License Serial)</span>
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xl">
              성공적으로 획득한 후 부여되는 **11자리(검열판) 또는 15자리(일반 요금제) 시리얼 인증 번호**를 입력하여 즉시 터미널 정식 기능을 연동/활성화하십시오. 기한이 만료된 단기 시리얼 키는 자동으로 말소 처리됩니다.
            </p>
            {subscription.serialKey && (
              <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-mono font-bold">
                <span>현재 연동 시리얼:</span>
                <span className="text-white tracking-wider font-extrabold">{subscription.serialKey}</span>
              </div>
            )}
          </div>

          <div className="w-full md:w-80 shrink-0 space-y-3">
            <div className="flex gap-2">
              <input
                id="input-serial-key"
                type="text"
                maxLength={15}
                placeholder="시리얼 번호 입력"
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value.replace(/\D/g, '').substring(0, 15))}
                className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white tracking-widest placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-center font-bold"
              />
              <button
                id="btn-activate-serial"
                onClick={handleActivateBtn}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl cursor-pointer transition uppercase"
              >
                등록
              </button>
            </div>
            
            {/* Quick-Testing Helper Box */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 space-y-1.5">
              <span className="text-slate-500 text-4xs uppercase font-extrabold block">테스트용 시리얼 키 (클록 시 자동 입력)</span>
              <div className="grid grid-cols-2 gap-1.5 overflow-hidden">
                {[
                  { key: '888800002222002', label: '2개월' },
                  { key: '888800006666006', label: '6개월' },
                  { key: '888800001212012', label: '12개월' },
                  { key: '888800009999999', label: '영구사용' },
                  { key: '77770000777', label: '검열영구(11)' }
                ].map((tc) => (
                  <button
                    key={tc.key}
                    onClick={() => setSerialInput(tc.key)}
                    className="py-1 px-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-850 hover:border-slate-700 text-4xs font-mono text-center cursor-pointer transition flex flex-col items-center justify-center"
                  >
                    <span className="font-bold text-white leading-none scale-100">{tc.label}</span>
                    <span className="text-slate-500 scale-90 leading-none mt-0.5">{tc.key}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Futua Simula Download Card */}
      <div className="bg-gradient-to-r from-teal-950/20 via-slate-900 to-indigo-950/20 border border-teal-500/20 rounded-2xl p-6 relative overflow-hidden" id="futua-simula-download-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-4xs uppercase tracking-widest font-bold rounded leading-none">
                Verified File
              </span>
              <span className="text-slate-400 text-xs font-mono">Google Drive Secure Storage</span>
            </div>
            
            <h4 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Futua Simula 설치 실행 패키지 다운로드</span>
              <CloudLightning size={16} className="text-teal-400 animate-bounce" />
            </h4>
            
            <p className="text-slate-400 text-xs leading-relaxed">
              성공적인 거래 테스트를 보장하는 **Futua Simula 정식 데스크톱 실행 바이너리**입니다. <br />
              구독 상태가 활성인 경우 Netlify DB 연동 가상 세션 키를 내포하여 완전한 프리미엄 기능이 자동으로 잠금 해제됩니다. <br />
              <span className="text-slate-500 text-3xs font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900 mt-1 inline-block">
                MD5 checksum: 3f8f9027b3197955f775485246999027 | Size: 14.8 MB
              </span>
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <a
              id="lnk-download-drive"
              href={FUTUA_SIMULA_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl shadow-lg shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 text-xs w-full sm:w-auto"
            >
              <Download size={16} />
              Futua Simula 포터블 설치 (.zip)
            </a>
            
            <span className="text-3xs text-slate-500 text-center">
              Google Drive 외장 보안 링크 연결
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
