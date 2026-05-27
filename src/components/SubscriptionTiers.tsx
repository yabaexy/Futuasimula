import React, { useState } from 'react';
import { Check, ArrowRight, ShieldCheck, Cpu, Database, Clock, Loader2, RefreshCw } from 'lucide-react';
import { SubscriptionPlan, SubscriptionDuration, WalletState, UserSubscription } from '../types';
import { SUBSCRIPTION_PLANS, TREASURY_WALLET, BSC_USDT_CONTRACT, ISO_COUNTRIES } from '../data';

interface SubscriptionTiersProps {
  plans: SubscriptionPlan[];
  activeSubscription: UserSubscription;
  wallet: WalletState;
  onSubscribe: (planId: SubscriptionDuration, txHash: string, userBnbGasSpent: number, registrant?: { name: string; email: string; phoneNumber?: string }) => void;
  onAddTransaction: (hash: string, action: string, amount: number, status: 'SUCCESS' | 'FAILED') => void;
  onShowConnectToast: () => void;
}

export const SubscriptionTiers: React.FC<SubscriptionTiersProps> = ({
  plans,
  activeSubscription,
  wallet,
  onSubscribe,
  onAddTransaction,
  onShowConnectToast,
}) => {
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'IDLE' | 'NETWORK' | 'APPROVE' | 'EXECUTE' | 'CONFIRMING' | 'SUCCESS'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Registrant information states to match database records
  const [registrantName, setRegistrantName] = useState('Savrina User');
  const [registrantEmail, setRegistrantEmail] = useState('savrina25x@gmail.com');
  const [registrantCountryCode, setRegistrantCountryCode] = useState('+82');
  const [registrantPhoneLocal, setRegistrantPhoneLocal] = useState('10-1234-5678');

  const handleInitiateCheckout = (plan: SubscriptionPlan) => {
    if (!wallet.isConnected) {
      onShowConnectToast();
      return;
    }

    if (activeSubscription.planId === plan.id && activeSubscription.status === 'ACTIVE') {
      alert('이미 해당 라이선스로 선물 터미널 구독이 활성화되어 사용 중입니다.');
      return;
    }

    setCheckoutPlan(plan);
    setCheckoutStep('NETWORK');
    setProgressPercent(15);
  };

  const executeNetworkStep = () => {
    const matchedCountry = ISO_COUNTRIES.find(c => c.code === registrantCountryCode);
    if (matchedCountry?.isBlocked) {
      setErrorMessage(`제재/규제지역(차단국가) 가입 불허: ${matchedCountry.name} 법역은 테러자금 및 자금세탁 방지법에 의거하여 계정 생성이 통제되어 있습니다.`);
      return;
    }
    setCheckoutStep('APPROVE');
    setProgressPercent(40);
  };

  const executeApproveStep = () => {
    const matchedCountry = ISO_COUNTRIES.find(c => c.code === registrantCountryCode);
    if (matchedCountry?.isBlocked) {
      setErrorMessage(`제재/규제지역(차단국가) 가입 불허: ${matchedCountry.name} 법역은 테러자금 및 자금세탁 방지법에 의거하여 계정 생성이 통제되어 있습니다.`);
      return;
    }
    if (wallet.usdtBalance < (checkoutPlan?.priceTotal ?? 0)) {
      setErrorMessage(`지갑 잔액(${wallet.usdtBalance.toFixed(2)} USDT)이 필요 결전 금액인 ${checkoutPlan?.priceTotal} USDT보다 낮습니다. 우측 상단의 'USDT 충전' 수도꼭지를 실행해 주세요!`);
      return;
    }
    setCheckoutStep('EXECUTE');
    setProgressPercent(70);
  };

  const executeTransferStep = () => {
    const matchedCountry = ISO_COUNTRIES.find(c => c.code === registrantCountryCode);
    if (matchedCountry?.isBlocked) {
      setErrorMessage(`제재/규제지역(차단국가) 가입 불허: ${matchedCountry.name} 법역은 테러자금 및 자금세탁 방지법에 의거하여 계정 생성이 통제되어 있습니다.`);
      return;
    }
    if (!registrantPhoneLocal.trim()) {
      setErrorMessage('전화번호 입력을 완료해 주십시오.');
      return;
    }
    
    setCheckoutStep('CONFIRMING');
    setProgressPercent(85);

    let secs = 0;
    const interval = setInterval(() => {
      secs += 1;
      setProgressPercent((prev) => Math.min(prev + 4, 98));
      if (secs >= 3) {
        clearInterval(interval);
        
        // Generate a random BSC transaction hash
        const characters = 'abcdef0123456789';
        let txHash = '0x';
        for (let i = 0; i < 64; i++) {
          txHash += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        const gasSpent = 0.0035; // BNB gas spec

        // Finalize state changes back to App root
        onSubscribe(checkoutPlan!.id, txHash, gasSpent, { 
          name: registrantName, 
          email: registrantEmail,
          phoneNumber: `${registrantCountryCode} ${registrantPhoneLocal}`
        });
        onAddTransaction(txHash, `Futua Simula ${checkoutPlan!.durationMonths}개월 구독 체결`, -checkoutPlan!.priceTotal, 'SUCCESS');
        
        setCheckoutStep('SUCCESS');
        setProgressPercent(100);
      }
    }, 1000);
  };

  const cancelCheckout = () => {
    setCheckoutPlan(null);
    setCheckoutStep('IDLE');
    setErrorMessage('');
    setProgressPercent(0);
  };

  return (
    <div className="mt-8" id="subscription-tiers-section">
      <div className="text-center mb-8 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2">
          <Database size={13} className="animate-pulse" />
          <span>Netlify Serverless Database 자동 연동 구조 적용</span>
        </div>
        <h3 className="text-2xl font-bold text-white tracking-tight">선택 가능한 정기 스마트 결제 요금제</h3>
        <p className="text-slate-400 text-xs mt-1.5 max-w-2xl mx-auto">
          결제 체결 상태는 Netlify 호스팅 서버와 Web3 연합 영수증으로 DB 원장에 영구 보존됩니다. <br />
          요금제 선택 후 가상 이메일 결제 정보가 포함된 트랙킹 메일이 발급됩니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => {
          const isActive = activeSubscription.planId === plan.id && activeSubscription.status === 'ACTIVE';

          return (
            <div
              key={plan.id}
              className={`flex flex-col bg-slate-950/80 border ${
                isActive
                  ? 'border-emerald-500 shadow-xl ring-2 ring-emerald-500/20'
                  : 'border-slate-850 hover:border-slate-750'
              } rounded-2xl p-6 transition-all relative overflow-hidden`}
              id={`plan-card-${plan.id}`}
            >
              {isActive && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-bold text-3xs px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck size={11} />
                  적용 중
                </div>
              )}

              <div className="mb-4">
                <span className="text-slate-500 text-2xs font-semibold uppercase tracking-wider font-mono">
                  {plan.id.replace('_', ' ')} LBN
                </span>
                <h4 className="text-lg font-bold text-white mt-0.5">{plan.name}</h4>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-white font-mono">{plan.priceTotal}</span>
                  <span className="text-emerald-400 font-extrabold font-mono text-sm">USDT</span>
                </div>
                <div className="text-slate-500 text-xs mt-1">
                  총 {plan.durationMonths}개월 계약 (월평균 ~{plan.pricePerMonth.toFixed(2)} USDT)
                </div>
              </div>

              {/* Benefits checklist */}
              <ul className="space-y-2.5 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-snug">
                    <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Purchase Trigger */}
              <button
                id={`btn-purchase-${plan.id}`}
                onClick={() => handleInitiateCheckout(plan)}
                className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 border border-emerald-990/40 text-emerald-400'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/10'
                }`}
              >
                {isActive ? '이미 활성화 완료된 패키지' : `${plan.priceTotal} USDT로 구독 결제 가동`}
                {!isActive && <ArrowRight size={13} />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Web3 MetaMask Check-out Stepper Modal */}
      {checkoutPlan && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-xs" id="web3-checkout-modal">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-950 px-6 py-4.5 border-b border-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 px-2.5 bg-yellow-500/15 text-yellow-500 font-bold font-mono text-xs rounded-full border border-yellow-500/20">
                  BEP-20 결제
                </span>
                <span className="text-sm font-bold text-white">Netlify Live DB 결제 승인 게이트</span>
              </div>
              <button
                id="btn-close-checkout-header"
                onClick={cancelCheckout}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                취소
              </button>
            </div>

            {/* Stepper Status Screen */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h5 className="text-white text-sm font-bold">{checkoutPlan.name} 신규 계약</h5>
                  <span className="text-slate-500 text-3xs font-mono">가상 정산고: {TREASURY_WALLET.substring(0, 12)}...</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-3xs block">청구 비용</span>
                  <div className="text-emerald-400 font-mono text-xl font-bold">
                    {checkoutPlan.priceTotal} USDT
                  </div>
                </div>
              </div>

              {/* Registrant registration form block inside checkout modal */}
              {checkoutStep !== 'SUCCESS' && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 mb-4 space-y-3">
                  <span className="text-slate-400 text-4xs uppercase tracking-wider font-extrabold block font-mono">✍️ 구독 동기화 정보 등록 (DB에 즉시 자동 적재)</span>
                  
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-slate-500 text-5xs uppercase font-extrabold block">구독자 성함</label>
                      <input
                        type="text"
                        id="chk-registrant-name-input"
                        value={registrantName}
                        onChange={(e) => setRegistrantName(e.target.value)}
                        placeholder="이름 입력"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 text-5xs uppercase font-extrabold block">수신 이메일 주소</label>
                      <input
                        type="email"
                        id="chk-registrant-email-input"
                        value={registrantEmail}
                        onChange={(e) => setRegistrantEmail(e.target.value)}
                        placeholder="savrina25x@gmail.com"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone Registrator & Country Compliance check */}
                  <div className="space-y-1 border-t border-slate-900/60 pt-2.5">
                    <label className="text-slate-500 text-5xs uppercase font-extrabold block">전화번호 및 국가 정보 등록 (규제비대상 한정)</label>
                    <div className="flex gap-2">
                      <select
                        id="chk-registrant-country"
                        value={registrantCountryCode}
                        onChange={(e) => {
                          const pickedVal = e.target.value;
                          setRegistrantCountryCode(pickedVal);
                          const countryObj = ISO_COUNTRIES.find(c => c.code === pickedVal);
                          if (countryObj?.isBlocked) {
                            setErrorMessage(`규제/차단지역 가입 불가: ${countryObj.name} 지역은 자금세탁 방지(AML) 국제 조약에 따른 차단 대상 규제지역입니다.`);
                          } else {
                            setErrorMessage('');
                          }
                        }}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                      >
                        {ISO_COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code} className={c.isBlocked ? 'text-red-500 block font-bold' : ''}>
                            {c.flag} {c.code} - {c.name.split(' (')[0]} {c.isBlocked ? ' [차단규제지역]' : ''}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        id="chk-registrant-phone-local"
                        value={registrantPhoneLocal}
                        onChange={(e) => setRegistrantPhoneLocal(e.target.value)}
                        placeholder="010-1234-5678"
                        className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        required
                      />
                    </div>
                    {ISO_COUNTRIES.find(c => c.code === registrantCountryCode)?.isBlocked && (
                      <div className="text-red-400 text-5xs uppercase font-sans animate-pulse mt-1 bg-red-950/30 p-1.5 rounded border border-red-900/20 leading-relaxed font-semibold">
                        🚫 계정 개설 중단: 자사 서비스 약정상 쿠바, 이란, 북한, 시리아, 러시아, 우크라이나 등 타겟 16개 제재규제지역 번호는 보정 및 등록이 불가능합니다.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Progress visual bar */}
              <div className="w-full h-1 bg-slate-900 rounded-full mb-6 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 via-emerald-500 to-green-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Error Box */}
              {errorMessage && (
                <div className="bg-red-950/40 border border-red-900/30 rounded-xl p-3 mb-5 text-red-300 text-xs">
                  {errorMessage}
                </div>
              )}

              {/* Interactive Step Screens */}
              {checkoutStep === 'NETWORK' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex items-start gap-3">
                    <Database size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <h6 className="text-white text-xs font-bold leading-normal">단계 1: 바이낸스 스마트 체인 (BSC) 프로토콜 검증</h6>
                      <p className="text-slate-500 text-3xs mt-1 leading-normal">
                        지갑이 현재 올바른 결제 처리 타겟 체인인 **Binance Smart Chain (Chain ID: 56/97)**에 정위 정렬되어 있는지 검사합니다.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      id="btn-cancel-checkout-network"
                      onClick={cancelCheckout}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl font-medium cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      id="btn-next-network-verify"
                      onClick={executeNetworkStep}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-xl font-bold cursor-pointer flex items-center gap-1"
                    >
                      인증 확인
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )}

              {checkoutStep === 'APPROVE' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex items-start gap-3">
                    <Clock size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h6 className="text-white text-xs font-bold leading-normal">단계 2: BEP-20 USDT 지출 서명 (Approve)</h6>
                      <p className="text-slate-500 text-3xs mt-1 leading-normal">
                        선물 시뮬레이터 플랫폼 스마트 컨트랙트가 본 지갑의 **{checkoutPlan.priceTotal} USDT** 한도를 정산소로 수납할 수 있도록 허가 요청을 발행합니다.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      id="btn-cancel-checkout-approve"
                      onClick={cancelCheckout}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl font-medium"
                    >
                      취소
                    </button>
                    <button
                      id="btn-next-approve"
                      onClick={executeApproveStep}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold cursor-pointer flex items-center gap-1"
                    >
                      USDT 지출 인가
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )}

              {checkoutStep === 'EXECUTE' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex items-start gap-3">
                    <Cpu size={18} className="text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <h6 className="text-white text-xs font-bold leading-normal">단계 3: 영수증 처리 및 Netlify Database 원장 갱신</h6>
                      <p className="text-slate-500 text-3xs mt-1 leading-normal">
                        USDT 지출 한도가 완벽히 확인되었습니다. 영수증 최종 대조 트랜잭션을 전송하며, 실행에 필요한 극밀도의 가스비(약 0.0035 BNB)가 소모되고, 동시에 Netlify Database 서버로의 백업 큐가 자동 할정됩니다.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      id="btn-cancel-checkout-execute"
                      onClick={cancelCheckout}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl font-medium"
                    >
                      취소
                    </button>
                    <button
                      id="btn-execute-send"
                      onClick={executeTransferStep}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl font-bold cursor-pointer flex items-center gap-1"
                    >
                      최종 블록체인 서명 및 수납
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )}

              {checkoutStep === 'CONFIRMING' && (
                <div className="text-center py-6">
                  <Loader2 className="mx-auto h-8 w-8 text-emerald-400 animate-spin" />
                  <h6 className="text-white text-xs font-bold mt-4">BSC 체인 검산 및 Netlify DB 실시간 동기화 중...</h6>
                  <p className="text-slate-500 text-3xs mt-1 leading-normal max-w-xs mx-auto">
                    바이낸스 노드 합의 대기 및 Netlify 데이터베이스에 트랜잭션 수치 락을 저장하고 있습니다. 대략 2초 소요됩니다.
                  </p>
                </div>
              )}

              {checkoutStep === 'SUCCESS' && (
                <div className="text-center py-4 space-y-4">
                  <span className="inline-flex items-center justify-center p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                    <Check size={28} />
                  </span>
                  <div>
                    <h6 className="text-emerald-400 text-base font-bold">블록체인 영수증 서명 및 Netlify DB 동기화 성공!</h6>
                    <p className="text-slate-300 text-xs mt-1 max-w-sm mx-auto leading-normal">
                      Netlify Serverless Database가 새로운 {checkoutPlan.name} 상태를 안전하게 적재 적용하였습니다. 하단 영역에서 시뮬레이터 프로그램 인스톨 패키지를 자유롭게 내려받으십시오!
                    </p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl text-left border border-slate-900 mx-auto max-w-sm">
                    <div className="flex justify-between text-3xs mb-1 font-mono">
                      <span className="text-slate-500">계약 패키지</span>
                      <span className="text-white font-bold">{checkoutPlan.name}</span>
                    </div>
                    <div className="flex justify-between text-3xs mb-1 font-mono">
                      <span className="text-slate-500">총 결제 금액</span>
                      <span className="text-emerald-400 font-bold">{checkoutPlan.priceTotal} USDT</span>
                    </div>
                    <div className="flex justify-between text-3xs font-mono">
                      <span className="text-slate-500">DB 동기화 상태</span>
                      <span className="text-emerald-400 font-bold leading-none">&#10003; Synced (Netlify API)</span>
                    </div>
                  </div>
                  <div>
                    <button
                      id="btn-finalize-checkout"
                      onClick={cancelCheckout}
                      className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      다이얼로그 닫기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
