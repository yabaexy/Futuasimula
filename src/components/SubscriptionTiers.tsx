import React, { useState } from 'react';
import { Check, ArrowRight, ShieldCheck, Cpu, Database, Clock, Loader2, RefreshCw } from 'lucide-react';
import { SubscriptionPlan, SubscriptionDuration, WalletState, UserSubscription } from '../types';
import { SUBSCRIPTION_PLANS, TREASURY_WALLET, BSC_USDT_CONTRACT, ISO_COUNTRIES } from '../data';

interface SubscriptionTiersProps {
  plans: SubscriptionPlan[];
  activeSubscription: UserSubscription;
  wallet: WalletState;
  onSubscribe: (
    planId: SubscriptionDuration, 
    txHash: string, 
    userBnbGasSpent: number, 
    registrant?: { name: string; email: string; phoneNumber?: string },
    paymentToken?: 'USDT' | 'WYDA',
    sellerWallet?: string
  ) => void;
  onAddTransaction: (
    hash: string, 
    action: string, 
    amount: number, 
    status: 'SUCCESS' | 'FAILED',
    tokenSymbol?: 'USDT' | 'WYDA',
    recipientAddress?: string
  ) => void;
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
  const [paymentToken, setPaymentToken] = useState<'USDT' | 'WYDA'>('USDT');
  const [errorMessage, setErrorMessage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Registrant information states to match database records
  const [registrantName, setRegistrantName] = useState('Savrina User');
  const [registrantEmail, setRegistrantEmail] = useState('savrina25x@gmail.com');
  const [registrantCountryCode, setRegistrantCountryCode] = useState('+82');
  const [registrantPhoneLocal, setRegistrantPhoneLocal] = useState('10-1234-5678');
  const [selectedSellerWallet, setSelectedSellerWallet] = useState<string>('');

  const handleInitiateCheckout = (plan: SubscriptionPlan) => {
    if (!wallet.isConnected) {
      onShowConnectToast();
      return;
    }

    if (activeSubscription.planId === plan.id && activeSubscription.status === 'ACTIVE') {
      alert('You already have an active subscription for this license.');
      return;
    }

    const sellers = [
      '0x7A4C0fd9708798a1D7e1Bd27A6C902C9Ba033a75',
      '0xc60fde84af6f6084518c542348dd56c2a9887b28',
      '0x9899a1ef2638b14fc7fd935e1af4c51987832c09'
    ];
    const chosenSeller = sellers[Math.floor(Math.random() * sellers.length)];
    setSelectedSellerWallet(chosenSeller);

    setCheckoutPlan(plan);
    setCheckoutStep('NETWORK');
    setProgressPercent(15);
  };

  const executeNetworkStep = () => {
    const matchedCountry = ISO_COUNTRIES.find(c => c.code === registrantCountryCode);
    if (matchedCountry?.isBlocked) {
      setErrorMessage(`Restricted/Sanctioned Region: Sign-up is blocked for ${matchedCountry.name} in compliance with international AML regulations.`);
      return;
    }

    if (paymentToken === 'WYDA') {
      if (!registrantPhoneLocal.trim()) {
        setErrorMessage('WYDA payment requires registering a phone number.');
        return;
      }
      if (registrantCountryCode === '+82') {
        setErrorMessage('WYDA payment is only available for non-Korean registrants with registered phone numbers.');
        return;
      }
    }

    setCheckoutStep('APPROVE');
    setProgressPercent(40);
  };

  const executeApproveStep = () => {
    const matchedCountry = ISO_COUNTRIES.find(c => c.code === registrantCountryCode);
    if (matchedCountry?.isBlocked) {
      setErrorMessage(`Restricted/Sanctioned Region: Sign-up is blocked for ${matchedCountry.name} in compliance with international AML regulations.`);
      return;
    }

    const isWyda = paymentToken === 'WYDA';
    if (isWyda) {
      if (!registrantPhoneLocal.trim()) {
        setErrorMessage('WYDA payment requires registering a phone number.');
        return;
      }
      if (registrantCountryCode === '+82') {
        setErrorMessage('WYDA payment is only available for non-Korean registrants with registered phone numbers.');
        return;
      }
    }

    const requiredPrice = isWyda ? (checkoutPlan?.priceTotalWyda ?? 350) : (checkoutPlan?.priceTotal ?? 0);
    const balance = isWyda ? wallet.wydaBalance : wallet.usdtBalance;
    const symbol = isWyda ? 'WYDA' : 'USDT';

    if (balance < requiredPrice) {
      setErrorMessage(`Your wallet balance (${balance.toFixed(2)} ${symbol}) is lower than the required price of ${requiredPrice} ${symbol}. Please use the top-right "Refill Tokens" faucet first!`);
      return;
    }
    
    setCheckoutStep('EXECUTE');
    setProgressPercent(70);
  };

  const executeTransferStep = () => {
    const matchedCountry = ISO_COUNTRIES.find(c => c.code === registrantCountryCode);
    if (matchedCountry?.isBlocked) {
      setErrorMessage(`Restricted/Sanctioned Region: Sign-up is blocked for ${matchedCountry.name} in compliance with international AML regulations.`);
      return;
    }
    if (!registrantPhoneLocal.trim()) {
      setErrorMessage('Please enter your phone number.');
      return;
    }

    const isWyda = paymentToken === 'WYDA';
    if (isWyda) {
      if (registrantCountryCode === '+82') {
        setErrorMessage('WYDA payment is only available for non-Korean registrants with registered phone numbers.');
        return;
      }
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
        const requiredPrice = isWyda ? (checkoutPlan?.priceTotalWyda ?? 350) : (checkoutPlan?.priceTotal ?? 0);

        // Finalize state changes back to App root
        onSubscribe(checkoutPlan!.id, txHash, gasSpent, { 
          name: registrantName, 
          email: registrantEmail,
          phoneNumber: `${registrantCountryCode} ${registrantPhoneLocal}`
        }, paymentToken, selectedSellerWallet);
        const desc = (checkoutPlan!.id === 'LIFETIME' || checkoutPlan!.id === 'CENSORED_LIFETIME') ? 'Permanent Lifetime License' : `${checkoutPlan!.durationMonths} Month Subscription`;
        onAddTransaction(txHash, `Futua Simula ${desc} (${paymentToken})`, -requiredPrice, 'SUCCESS', paymentToken, selectedSellerWallet);
        
        setCheckoutStep('SUCCESS');
        setProgressPercent(100);
      }
    }, 1000);
  };

  const cancelCheckout = () => {
    setCheckoutPlan(null);
    setCheckoutStep('IDLE');
    setPaymentToken('USDT');
    setErrorMessage('');
    setProgressPercent(0);
  };

  return (
    <div className="mt-8" id="subscription-tiers-section">
      <div className="text-center mb-8 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2">
          <Database size={13} className="animate-pulse" />
          <span>Netlify Serverless Database Integration Active</span>
        </div>
        <h3 className="text-2xl font-bold text-white tracking-tight">Flexible Smart Subscription Plans</h3>
        <p className="text-slate-400 text-xs mt-1.5 max-w-2xl mx-auto">
          Transaction records are securely synced with the Netlify hosting server and stored on the ledger database. <br />
          A simulated receipt email tracking notification is generated upon selecting a subscription.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
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
                  Active
                </div>
              )}

              <div className="mb-4">
                <span className="text-slate-500 text-2xs font-semibold uppercase tracking-wider font-mono">
                  {plan.id.replace('_', ' ')} LBN
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5 min-h-[40px] flex items-center">{plan.name}</h4>
              </div>

              <div className="mb-5 bg-slate-900/30 p-3 rounded-xl border border-slate-900/80 space-y-2">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white font-mono">{plan.priceTotal}</span>
                    <span className="text-emerald-400 font-extrabold font-mono text-2xs uppercase">USDT</span>
                  </div>
                  <span className="text-slate-600 text-4xs font-mono">OR</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-purple-400 font-mono">{plan.priceTotalWyda ?? 350}</span>
                    <span className="text-purple-400 font-extrabold font-mono text-4xs uppercase">WYDA</span>
                  </div>
                </div>
                <div className="text-slate-400 text-4xs text-center border-t border-slate-900/50 pt-1 leading-relaxed">
                  {(plan.id === 'LIFETIME' || plan.id === 'CENSORED_LIFETIME') ? (
                    <>
                      Contract Duration: Permanent (Lifetime) <br />
                      One-time payment, no recurring charges
                    </>
                  ) : (
                    <>
                      Contract Duration: {plan.durationMonths} Month(s) <br />
                      (~{plan.pricePerMonth.toFixed(2)} USDT / ~{Math.round((plan.priceTotalWyda ?? 350) / plan.durationMonths)} WYDA per month)
                    </>
                  )}
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
                {isActive ? 'Currently Active License' : 'Subscribe Now'}
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
                <span className={`p-1 px-2.5 ${paymentToken === 'WYDA' ? 'bg-purple-500/15 text-purple-400 border-purple-500/20' : 'bg-yellow-500/15 text-yellow-500 border-yellow-500/20'} font-bold font-mono text-xs rounded-full border`}>
                  BEP-20 {paymentToken} Payment
                </span>
                <span className="text-sm font-bold text-white">Netlify DB Live Payment Gateway</span>
              </div>
              <button
                id="btn-close-checkout-header"
                onClick={cancelCheckout}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Stepper Status Screen */}
            <div className="p-6 font-sans">
              {/* Currency Selector */}
              {checkoutStep !== 'SUCCESS' && (
                <div className="mb-4 bg-slate-950 p-2.5 rounded-xl border border-slate-900/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400 text-3xs font-extrabold uppercase tracking-wide">💳 Select Payment Currency</span>
                    <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 shrink-0">
                      <button
                        id="choose-usdt-payment"
                        type="button"
                        onClick={() => {
                          setPaymentToken('USDT');
                          setErrorMessage('');
                        }}
                        className={`px-3 py-1.5 text-4xs font-bold rounded-md transition cursor-pointer ${
                          paymentToken === 'USDT'
                            ? 'bg-emerald-500 text-black shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        USDT (BEP-20)
                      </button>
                      <button
                        id="choose-wyda-payment"
                        type="button"
                        onClick={() => {
                          if (registrantCountryCode === '+82') {
                            setErrorMessage('WYDA payment is not supported for Korean users.');
                            return;
                          }
                          if (!registrantPhoneLocal.trim()) {
                            setErrorMessage('Phone registration is required to pay with WYDA.');
                            return;
                          }
                          setPaymentToken('WYDA');
                          setErrorMessage('');
                        }}
                        className={`px-3 py-1.5 text-4xs font-bold rounded-md transition cursor-pointer ${
                          paymentToken === 'WYDA'
                            ? 'bg-purple-500 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        WYDA (Utility)
                      </button>
                    </div>
                  </div>
                  <span className="text-4xs text-slate-500 font-mono text-right block leading-normal">
                    * WYDA is restricted to registered, non-Korean phone numbers only.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h5 className="text-white text-sm font-bold">{checkoutPlan.name} checkout</h5>
                  <span className="text-slate-500 text-3xs font-mono">
                    Recipient (Seller): {selectedSellerWallet ? `${selectedSellerWallet.substring(0, 12)}...` : `${TREASURY_WALLET.substring(0, 12)}...`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-3xs block">Checkout Cost</span>
                  <div className={`${paymentToken === 'WYDA' ? 'text-purple-400' : 'text-emerald-400'} font-mono text-xl font-bold`}>
                    {paymentToken === 'WYDA' 
                      ? `${checkoutPlan.priceTotalWyda ?? 350} WYDA` 
                      : `${checkoutPlan.priceTotal} USDT`}
                  </div>
                </div>
              </div>

              {/* Registrant registration form block inside checkout modal */}
              {checkoutStep !== 'SUCCESS' && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 mb-4 space-y-3">
                  <span className="text-slate-400 text-4xs uppercase tracking-wider font-extrabold block font-mono">✍️ Sync Information (Stored on DB records)</span>
                  
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-slate-500 text-5xs uppercase font-extrabold block">Subscriber Name</label>
                      <input
                        type="text"
                        id="chk-registrant-name-input"
                        value={registrantName}
                        onChange={(e) => setRegistrantName(e.target.value)}
                        placeholder="Name"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 text-5xs uppercase font-extrabold block">Billing Email</label>
                      <input
                        type="email"
                        id="chk-registrant-email-input"
                        value={registrantEmail}
                        onChange={(e) => setRegistrantEmail(e.target.value)}
                        placeholder="mail@domain.com"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone Registrator & Country Compliance check */}
                  <div className="space-y-1 border-t border-slate-900/60 pt-2.5">
                    <label className="text-slate-500 text-5xs uppercase font-extrabold block">Phone & Country Code (AML Compliant Regions Only)</label>
                    <div className="flex gap-2">
                      <select
                        id="chk-registrant-country"
                        value={registrantCountryCode}
                        onChange={(e) => {
                          const pickedVal = e.target.value;
                          setRegistrantCountryCode(pickedVal);
                          if (pickedVal === '+82' && paymentToken === 'WYDA') {
                            setPaymentToken('USDT');
                            setErrorMessage('WYDA payment is not supported for Korean users. Switched to USDT.');
                            return;
                          }
                          const countryObj = ISO_COUNTRIES.find(c => c.code === pickedVal);
                          if (countryObj?.isBlocked) {
                            setErrorMessage(`Registration Suspended: ${countryObj.name} is blocked due to international compliance policies.`);
                          } else {
                            setErrorMessage('');
                          }
                        }}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                      >
                        {ISO_COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code} className={c.isBlocked ? 'text-red-500 block font-bold' : ''}>
                            {c.flag} {c.code} - {c.name} {c.isBlocked ? ' [Blocked]' : ''}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        id="chk-registrant-phone-local"
                        value={registrantPhoneLocal}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRegistrantPhoneLocal(val);
                          if (!val.trim() && paymentToken === 'WYDA') {
                            setPaymentToken('USDT');
                            setErrorMessage('WYDA payment requires a valid registered phone number. Switched to USDT.');
                          }
                        }}
                        placeholder="010-1234-5678"
                        className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        required
                      />
                    </div>
                    {ISO_COUNTRIES.find(c => c.code === registrantCountryCode)?.isBlocked && (
                      <div className="text-red-400 text-5xs uppercase font-sans animate-pulse mt-1 bg-red-950/30 p-1.5 rounded border border-red-900/20 leading-relaxed font-semibold">
                        🚫 Operation Prohibited: Cuba, Iran, North Korea, Syria, Russia, Belarus, and other restricted territories are prohibited from registering.
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
                <div className="bg-red-950/40 border border-red-900/30 rounded-xl p-3 mb-5 text-red-300 text-xs shadow-inner">
                  {errorMessage}
                </div>
              )}

              {/* Interactive Step Screens */}
              {checkoutStep === 'NETWORK' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex items-start gap-3">
                    <Database size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <h6 className="text-white text-xs font-bold leading-normal">Step 1: Verify BSC Network Connection</h6>
                      <p className="text-slate-500 text-3xs mt-1 leading-normal">
                        Verifies if your Web3 wallet matches the target subscription processor network <strong>BSC Smart Chain (Chain ID: 56/97)</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      id="btn-cancel-checkout-network"
                      onClick={cancelCheckout}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-next-network-verify"
                      onClick={executeNetworkStep}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-xl font-bold cursor-pointer flex items-center gap-1"
                    >
                      Verify Connection
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )}

              {checkoutStep === 'APPROVE' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex items-start gap-3">
                    <Clock size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h6 className="text-white text-xs font-bold leading-normal">Step 2: BEP-20 {paymentToken} Allowance Approval</h6>
                      <p className="text-slate-500 text-3xs mt-1 leading-normal">
                        Authorizes the smart contract to process **{paymentToken === 'WYDA' ? `${checkoutPlan.priceTotalWyda ?? 350} WYDA` : `${checkoutPlan.priceTotal} USDT`}** from your wallet.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      id="btn-cancel-checkout-approve"
                      onClick={cancelCheckout}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-next-approve"
                      onClick={executeApproveStep}
                      className={`px-4 py-2 ${paymentToken === 'WYDA' ? 'bg-purple-500 hover:bg-purple-400' : 'bg-emerald-500 hover:bg-emerald-400'} text-slate-950 rounded-xl font-bold cursor-pointer flex items-center gap-1`}
                    >
                      Authorize {paymentToken}
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
                      <h6 className="text-white text-xs font-bold leading-normal">Step 3: Process Contract Receipt & Sync Netlify DB</h6>
                      <p className="text-slate-500 text-3xs mt-1 leading-normal">
                        {paymentToken} checking limits confirmed. Submits the contract invocation transaction onto the network with an estimated gas fee of 0.0035 BNB, instantly queueing sync tasks with Netlify Serverless DB.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      id="btn-cancel-checkout-execute"
                      onClick={cancelCheckout}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-execute-send"
                      onClick={executeTransferStep}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl font-bold cursor-pointer flex items-center gap-1"
                    >
                      Sign & Submit Transaction
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )}

              {checkoutStep === 'CONFIRMING' && (
                <div className="text-center py-6">
                  <Loader2 className="mx-auto h-8 w-8 text-emerald-400 animate-spin" />
                  <h6 className="text-white text-xs font-bold mt-4">Confirming settlement & Syncing with Netlify DB...</h6>
                  <p className="text-slate-500 text-3xs mt-1 leading-normal max-w-xs mx-auto">
                    Awaiting Binance node consensus consensus tasks and processing synchronization keys. Takes roughly 2-3 seconds.
                  </p>
                </div>
              )}

              {checkoutStep === 'SUCCESS' && (
                <div className="text-center py-4 space-y-4 font-sans">
                  <span className="inline-flex items-center justify-center p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                    <Check size={28} />
                  </span>
                  <div>
                    <h6 className="text-emerald-400 text-base font-bold">Consensus Verified & Netlify DB Synced Successfully!</h6>
                    <p className="text-slate-300 text-xs mt-1 max-w-sm mx-auto leading-normal">
                      Netlify Serverless Database has written and activated your new {checkoutPlan.name} license successfully. Portable installation downloads are now unlocked!
                    </p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl text-left border border-slate-900 mx-auto max-w-sm">
                    <div className="flex justify-between text-3xs mb-1 font-mono">
                      <span className="text-slate-550">Package Licensed</span>
                      <span className="text-white font-bold">{checkoutPlan.name}</span>
                    </div>
                    <div className="flex justify-between text-3xs mb-1 font-mono">
                      <span className="text-slate-550">Settled Amount</span>
                      <span className={`${paymentToken === 'WYDA' ? 'text-purple-400' : 'text-emerald-400'} font-bold`}>
                        {paymentToken === 'WYDA' 
                          ? `${checkoutPlan.priceTotalWyda ?? 350} WYDA` 
                          : `${checkoutPlan.priceTotal} USDT`}
                      </span>
                    </div>
                    <div className="flex justify-between text-3xs font-mono">
                      <span className="text-slate-550">Netlify Sync Status</span>
                      <span className="text-emerald-400 font-bold leading-none">&#10003; Synced (Netlify API)</span>
                    </div>

                    {activeSubscription.serialKey && (
                      <div className="flex flex-col mt-2 pt-2 border-t border-slate-900 font-mono text-3xs text-center space-y-1">
                        <span className="text-indigo-400 font-bold uppercase tracking-wider">
                          발급된 {activeSubscription.serialKey.length}자리 시리얼 라이선스 번호
                        </span>
                        <div className="bg-slate-900 p-2 rounded border border-slate-800 flex items-center justify-center">
                          <span className="text-white font-black tracking-widest text-sm select-all">{activeSubscription.serialKey}</span>
                        </div>
                        <span className="text-slate-500 scale-95 leading-normal">
                          위 시리얼 번호를 나중에도 복사하여 라이선스 연동 탭(Subscription Status)에 등록해 정식 등급을 복제 활성화하실 수 있습니다.
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <button
                      id="btn-finalize-checkout"
                      onClick={cancelCheckout}
                      className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Close Dialog
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
