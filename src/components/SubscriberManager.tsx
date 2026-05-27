import React, { useState } from 'react';
import { Search, Plus, Filter, Edit2, Trash2, CheckCircle2, XCircle, Mail, Key, User, Calendar, Save, RotateCcw, ShieldCheck, Database, Award, DollarSign, Phone } from 'lucide-react';
import { Subscriber, SubscriptionDuration } from '../types';
import { SUBSCRIPTION_PLANS, ISO_COUNTRIES } from '../data';

interface SubscriberManagerProps {
  subscribers: Subscriber[];
  onAddSubscriber: (newSub: Omit<Subscriber, 'id'>) => void;
  onUpdateSubscriber: (updatedSub: Subscriber) => void;
  onDeleteSubscriber: (id: string) => void;
  onResetSubscribers: () => void;
  triggerToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const SubscriberManager: React.FC<SubscriberManagerProps> = ({
  subscribers,
  onAddSubscriber,
  onUpdateSubscriber,
  onDeleteSubscriber,
  onResetSubscribers,
  triggerToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'NONE'>('ALL');
  
  // Modals/Forms State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscriber | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPlan, setFormPlan] = useState<SubscriptionDuration>('1_MONTH');
  const [formStart, setFormStart] = useState('');
  const [formExpiry, setFormExpiry] = useState('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'EXPIRED' | 'NONE'>('ACTIVE');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formCountryCode, setFormCountryCode] = useState('+82');
  const [formPhoneLocal, setFormPhoneLocal] = useState('');

  // Handle plan change to auto calculate expiry date (e.g. +months from start code)
  const handlePlanChange = (planId: SubscriptionDuration, startDateStr: string) => {
    setFormPlan(planId);
    if (!startDateStr) return;
    
    const start = new Date(startDateStr);
    if (isNaN(start.getTime())) return;

    const matchedPlan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    const months = matchedPlan ? matchedPlan.durationMonths : 0;
    
    const expiry = new Date(start);
    expiry.setMonth(expiry.getMonth() + months);
    setFormExpiry(expiry.toISOString().split('T')[0]);
  };

  const handleStartDateChange = (startDateStr: string) => {
    setFormStart(startDateStr);
    if (!startDateStr) return;
    
    const start = new Date(startDateStr);
    if (isNaN(start.getTime())) return;

    const matchedPlan = SUBSCRIPTION_PLANS.find(p => p.id === formPlan);
    const months = matchedPlan ? matchedPlan.durationMonths : 0;
    
    const expiry = new Date(start);
    expiry.setMonth(expiry.getMonth() + months);
    setFormExpiry(expiry.toISOString().split('T')[0]);
  };

  const openAddModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormName('');
    setFormEmail('');
    setFormPlan('1_MONTH');
    setFormStart(today);
    
    // Auto calculate expiry
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    setFormExpiry(expiry.toISOString().split('T')[0]);
    
    setFormStatus('ACTIVE');
    setFormAddress('');
    setFormNotes('');
    setFormCountryCode('+82');
    setFormPhoneLocal('');
    setIsAddOpen(true);
  };

  const openEditModal = (sub: Subscriber) => {
    setEditingSub(sub);
    setFormName(sub.name);
    setFormEmail(sub.email);
    setFormPlan(sub.planId);
    setFormStart(sub.activatedAt ? sub.activatedAt.split('T')[0] : '');
    setFormExpiry(sub.expiresAt ? sub.expiresAt.split('T')[0] : '');
    setFormStatus(sub.status);
    setFormAddress(sub.walletAddress || '');
    setFormNotes(sub.notes || '');

    // Parse phone number
    let code = '+82';
    let local = '';
    if (sub.phoneNumber) {
      const parts = sub.phoneNumber.trim().split(' ');
      if (parts.length >= 2) {
        code = parts[0];
        local = parts.slice(1).join(' ');
      } else {
        const matchedCountry = ISO_COUNTRIES.find(c => sub.phoneNumber!.startsWith(c.code));
        if (matchedCountry) {
          code = matchedCountry.code;
          local = sub.phoneNumber.substring(matchedCountry.code.length).trim();
        } else {
          local = sub.phoneNumber;
        }
      }
    }
    setFormCountryCode(code);
    setFormPhoneLocal(local);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      triggerToast('error', '이름과 이메일 주소는 필수 기재 사항입니다.');
      return;
    }

    const matchedCountry = ISO_COUNTRIES.find(c => c.code === formCountryCode);
    if (matchedCountry?.isBlocked) {
      triggerToast('error', `차단 대상 법역 가입 불가: ${matchedCountry.name} 국가 번호는 국제 규제 및 당사 규정에 의해 회원 영구 원장에 등록될 수 없습니다.`);
      return;
    }

    onAddSubscriber({
      name: formName,
      email: formEmail,
      planId: formPlan,
      activatedAt: new Date(formStart).toISOString(),
      expiresAt: new Date(formExpiry).toISOString(),
      status: formStatus,
      walletAddress: formAddress.trim() || null,
      phoneNumber: formPhoneLocal.trim() ? `${formCountryCode} ${formPhoneLocal.trim()}` : undefined,
      notes: formNotes
    });

    setIsAddOpen(false);
    triggerToast('success', `${formName} 구독자 정보가 데이터베이스에 원장 기록되었습니다.`);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    if (!formName.trim() || !formEmail.trim()) {
      triggerToast('error', '이름과 이메일 주소는 필수 기재 사항입니다.');
      return;
    }

    const matchedCountry = ISO_COUNTRIES.find(c => c.code === formCountryCode);
    if (matchedCountry?.isBlocked) {
      triggerToast('error', `차단 대상 법역 가입 불가: ${matchedCountry.name} 국가 번호는 국제 규제 및 당사 규정에 의해 회원 영구 원장에 등록될 수 없습니다.`);
      return;
    }

    onUpdateSubscriber({
      id: editingSub.id,
      name: formName,
      email: formEmail,
      planId: formPlan,
      activatedAt: new Date(formStart).toISOString(),
      expiresAt: new Date(formExpiry).toISOString(),
      status: formStatus,
      walletAddress: formAddress.trim() || null,
      phoneNumber: formPhoneLocal.trim() ? `${formCountryCode} ${formPhoneLocal.trim()}` : undefined,
      notes: formNotes
    });

    setEditingSub(null);
    triggerToast('success', `${formName} 구독자의 데이터베이스 연동 정보가 업데이트되었습니다.`);
  };

  // Filter subscribers list
  const filteredSubscribers = subscribers.filter(sub => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      sub.name.toLowerCase().includes(term) ||
      sub.email.toLowerCase().includes(term) ||
      sub.id.toLowerCase().includes(term) ||
      (sub.walletAddress && sub.walletAddress.toLowerCase().includes(term));
    
    const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate quick stats
  const totalCount = subscribers.length;
  const activeCount = subscribers.filter(s => s.status === 'ACTIVE').length;
  const expiredCount = subscribers.filter(s => s.status === 'EXPIRED').length;
  
  // Calculate simulated monthly revenue based on subscription prices
  const simulatedRevenue = subscribers.reduce((acc, sub) => {
    if (sub.status !== 'ACTIVE') return acc;
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === sub.planId);
    return acc + (plan ? plan.pricePerMonth : 0);
  }, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden" id="subscriber-management-panel">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* 2. Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
        <div>
          <div className="flex items-center gap-1.5 animate-pulse">
            <span className="p-1 text-emerald-400 bg-emerald-500/10 rounded-lg">
              <Database size={16} />
            </span>
            <span className="text-xs font-semibold uppercase text-emerald-400 font-mono tracking-wider">Futua Simula Core Vault</span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">Futua Simula 구독자 영구 원장 데이터베이스</h3>
          <p className="text-slate-400 text-xs mt-1">
            BSC 기저 스마트 컨트랙트 결제와 실시간 동기화되는 구독자 데이터베이스(DB) 및 회원 관리 환경입니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-add-subscriber"
            onClick={openAddModal}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            <Plus size={14} />
            신규 구독자 추가
          </button>
          <button
            id="btn-reset-subscribers-db"
            onClick={onResetSubscribers}
            className="px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="기록 초기화 후 시드 데이터 로드"
          >
            <RotateCcw size={12} />
            DB 시드 재설정
          </button>
        </div>
      </div>

      {/* 4. Stats bento-grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-4xs uppercase tracking-wider font-bold font-mono">가입 계정 수</span>
            <span className="block text-2xl font-black text-white mt-0.5">{totalCount} accounts</span>
          </div>
          <User className="text-blue-500 shrink-0" size={24} />
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex items-center justify-between bg-gradient-to-r from-emerald-950/5 via-slate-950 to-slate-950/5 border-emerald-900/10">
          <div>
            <span className="text-slate-500 text-4xs uppercase tracking-wider font-bold font-mono">활성화 원장</span>
            <span className="block text-2xl font-black text-emerald-400 mt-0.5">{activeCount} active</span>
          </div>
          <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-4xs uppercase tracking-wider font-bold font-mono">만료 환원 원장</span>
            <span className="block text-2xl font-black text-red-400 mt-0.5">{expiredCount} expired</span>
          </div>
          <XCircle className="text-red-500 shrink-0" size={24} />
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex items-center justify-between bg-gradient-to-r from-teal-950/5 via-slate-950 to-slate-950/5 border-teal-900/10">
          <div>
            <span className="text-slate-500 text-4xs uppercase tracking-wider font-bold font-mono">시뮬레이션 월예상매출</span>
            <span className="block text-2xl font-extrabold text-teal-400 font-mono mt-0.5">${simulatedRevenue.toFixed(1)} <span className="text-xs text-slate-500 font-sans font-medium">USDT</span></span>
          </div>
          <DollarSign className="text-teal-400 shrink-0" size={24} />
        </div>
      </div>

      {/* 5. Filters and Search inputs */}
      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            id="search-subscribers-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="이름, 이메일, 구독자 ID 검색..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 pl-9 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
        </div>

        {/* Filters Select */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-slate-500 text-xs flex items-center gap-1 shrink-0">
            <Filter size={12} />
            필터링:
          </span>
          <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 w-full md:w-auto overflow-hidden">
            {(['ALL', 'ACTIVE', 'EXPIRED', 'NONE'] as const).map((filter) => (
              <button
                key={filter}
                id={`status-filter-${filter}`}
                onClick={() => setStatusFilter(filter)}
                className={`flex-grow md:flex-grow-0 px-3 py-1 rounded text-2xs font-extrabold cursor-pointer uppercase transition-all ${
                  statusFilter === filter
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {filter === 'ALL' ? '전체' : filter === 'ACTIVE' ? '활성' : filter === 'EXPIRED' ? '만료' : '없음'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Subscribers Main Grid / Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-950/20">
        <table className="w-full text-left border-collapse" id="subscribers-core-table">
          <thead>
            <tr className="border-b border-slate-850 bg-slate-950/60 text-slate-400 text-4xs uppercase tracking-wider font-mono">
              <th className="py-3 pl-4">구독자 ID</th>
              <th className="py-3">이름 / 이메일</th>
              <th className="py-3 text-slate-400">전화번호</th>
              <th className="py-3">이용 서비스</th>
              <th className="py-3 font-sans">구독 시작일</th>
              <th className="py-3 font-sans">구독 만료일</th>
              <th className="py-3">USDT 결제 주소</th>
              <th className="py-3">상태</th>
              <th className="py-3 pr-4 text-right">조종</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscribers.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-500 text-xs leading-relaxed font-sans">
                  일치하는 원장 구독자 검색 레코드가 존재하지 않습니다. <br />
                  <span className="text-3xs text-slate-600 font-mono mt-1 inline-block">Query term: "{searchTerm || 'None'}" | Filter: {statusFilter}</span>
                </td>
              </tr>
            ) : (
              filteredSubscribers.map((sub) => {
                const planDetails = SUBSCRIPTION_PLANS.find(p => p.id === sub.planId);
                const isActivated = sub.status === 'ACTIVE';
                const isUserSeed = sub.id.startsWith('MEMBER-') || sub.email === 'savrina25x@gmail.com';

                return (
                  <tr 
                    key={sub.id} 
                    className={`border-b border-slate-900/45 hover:bg-slate-950/50 transition-colors font-mono text-2xs ${
                      isUserSeed ? 'bg-indigo-950/10 border-l-2 border-l-indigo-500/60' : ''
                    }`}
                  >
                    <td className="py-3.5 pl-4 font-bold text-slate-400 flex items-center gap-1 sm:gap-1.5">
                      {isUserSeed && (
                        <span className="p-0.5 bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 rounded text-4xs uppercase tracking-widest font-black shrink-0">
                          ME
                        </span>
                      )}
                      <span>{sub.id}</span>
                    </td>
                    
                    <td className="py-3.5">
                      <div className="flex flex-col">
                        <span className="text-white font-bold font-sans">{sub.name}</span>
                        <span className="text-slate-500 text-3xs flex items-center gap-0.5 mt-0.5">
                          <Mail size={10} className="text-slate-600" />
                          {sub.email}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5">
                      {sub.phoneNumber ? (
                        <div className="flex items-center gap-1 select-all cursor-pointer" title="클릭시 원천 선택 가능">
                          {(() => {
                            const codePart = sub.phoneNumber.split(' ')[0] || '';
                            const localPart = sub.phoneNumber.split(' ').slice(1).join(' ') || '';
                            const matchedCountry = ISO_COUNTRIES.find(c => c.code === codePart);
                            return (
                              <>
                                <span className="p-0.5 bg-slate-900 text-slate-300 rounded text-4xs border border-slate-805 tracking-normal px-1 font-mono shrink-0">
                                  {matchedCountry?.flag || '📞'} {codePart}
                                </span>
                                <span className="text-slate-400 text-3xs font-mono truncate">{localPart}</span>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <span className="text-slate-600 font-sans text-3xs italic">미구비</span>
                      )}
                    </td>

                    <td className="py-3.5">
                      <span className="text-slate-300 font-bold">
                        {planDetails ? planDetails.name.split(' ')[2] || planDetails.name : '무료 체험 모드'}
                      </span>
                    </td>

                    <td className="py-3.5 text-slate-400 font-sans">
                      {sub.activatedAt ? sub.activatedAt.substring(0, 10) : '-'}
                    </td>

                    <td className="py-3.5 font-sans">
                      <span className={isActivated ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {sub.expiresAt ? sub.expiresAt.substring(0, 10) : '-'}
                      </span>
                    </td>

                    <td className="py-3.5 text-slate-550 max-w-[120px] truncate" title={sub.walletAddress || ''}>
                      {sub.walletAddress ? (
                        <span className="text-slate-400 bg-slate-950 px-1 py-0.5 rounded border border-slate-900">
                          {sub.walletAddress.substring(0, 6)}...{sub.walletAddress.substring(34)}
                        </span>
                      ) : (
                        <span className="text-slate-600">— Off-chain</span>
                      )}
                    </td>

                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1 font-sans text-3xs font-extrabold px-2 py-0.5 rounded-full ${
                        sub.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        sub.status === 'EXPIRED' ? 'bg-red-500/10 text-red-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        <span className={`h-1 w-1 rounded-full ${sub.status === 'ACTIVE' ? 'bg-emerald-400 animate-ping' : sub.status === 'EXPIRED' ? 'bg-red-400' : 'bg-slate-400'}`} />
                        {sub.status === 'ACTIVE' ? '활성' : sub.status === 'EXPIRED' ? '만료됨' : '없음'}
                      </span>
                    </td>

                    <td className="py-3.5 pr-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          id={`btn-edit-sub-${sub.id}`}
                          onClick={() => openEditModal(sub)}
                          className="p-1 hover:bg-slate-900 text-slate-400 hover:text-white rounded transition cursor-pointer"
                          title="수정"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          id={`btn-delete-sub-${sub.id}`}
                          onClick={() => {
                            if (window.confirm(`${sub.name} 구독정보를 원장 데이터베이스에서 영구 히스토리 삭제하시겠습니까?`)) {
                              onDeleteSubscriber(sub.id);
                              triggerToast('info', '구독자 정보가 데이터베이스에서 제거 완료되었습니다.');
                            }
                          }}
                          className="p-1 hover:bg-red-950 hover:text-red-400 text-slate-600 rounded transition cursor-pointer"
                          title="영구 삭제"
                          disabled={sub.email === 'savrina25x@gmail.com'} // Protect user profile
                        >
                          <Trash2 size={12} className={sub.email === 'savrina25x@gmail.com' ? 'opacity-20 cursor-not-allowed' : ''} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 7. Manual Creation / Modification Modal dialog overlay */}
      {(isAddOpen || editingSub) && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-xs" id="subscribers-editor-modal">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-900 flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Database size={15} className="text-emerald-400" />
                <span>{editingSub ? `구독자 원장 수정 (${editingSub.id})` : '신규 구독지 지갑/회원 등록'}</span>
              </h4>
              <button
                id="btn-close-subscribers-modal"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingSub(null);
                }}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                취소
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={editingSub ? handleEditSubmit : handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1 col-span-1">
                  <label className="text-slate-500 text-4xs uppercase tracking-wider font-extrabold block">이름</label>
                  <div className="relative">
                    <input
                      type="text"
                      id="subform-name-input"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="홍길동"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 pl-8 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                    <User size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1 col-span-1">
                  <label className="text-slate-500 text-4xs uppercase tracking-wider font-extrabold block">이메일 주소</label>
                  <div className="relative">
                    <input
                      type="email"
                      id="subform-email-input"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 pl-8 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                    <Mail size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Plan */}
                <div className="space-y-1 col-span-1">
                  <label className="text-slate-500 text-4xs uppercase tracking-wider font-extrabold block">구독 요금 플랜</label>
                  <select
                    id="subform-plan-select"
                    value={formPlan}
                    onChange={(e) => handlePlanChange(e.target.value as SubscriptionDuration, formStart)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="FREE">Free Trial 기본 모드</option>
                    {SUBSCRIPTION_PLANS.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1 col-span-1">
                  <label className="text-slate-500 text-4xs uppercase tracking-wider font-extrabold block">구독 원장 상태</label>
                  <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 overflow-hidden h-7.5 items-center">
                    {(['ACTIVE', 'EXPIRED', 'NONE'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        id={`subform-status-${status}`}
                        onClick={() => setFormStatus(status)}
                        className={`flex-grow px-2 py-1 h-full rounded text-4xs font-black uppercase transition-all whitespace-nowrap cursor-pointer ${
                          formStatus === status
                            ? status === 'ACTIVE' ? 'bg-emerald-500 text-slate-950 font-black' :
                              status === 'EXPIRED' ? 'bg-red-500 text-white font-black' :
                              'bg-slate-700 text-white font-black'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {status === 'ACTIVE' ? '활성' : status === 'EXPIRED' ? '만료' : '없음'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Start Date */}
                <div className="space-y-1 col-span-1">
                  <label className="text-slate-500 text-4xs uppercase tracking-wider font-extrabold block">구독 시작 설정일</label>
                  <div className="relative">
                    <input
                      type="date"
                      id="subform-start-input"
                      value={formStart}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 pl-8 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                    />
                    <Calendar size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="space-y-1 col-span-1">
                  <label className="text-slate-500 text-4xs uppercase tracking-wider font-extrabold block">구독 만기 예정일</label>
                  <div className="relative">
                    <input
                      type="date"
                      id="subform-expiry-input"
                      value={formExpiry}
                      onChange={(e) => setFormExpiry(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 pl-8 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                    />
                    <Calendar size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
                  </div>
                </div>
              </div>

              {/* Wallet Address */}
              <div className="space-y-1">
                <label className="text-slate-500 text-4xs uppercase tracking-wider font-extrabold block">결제 BSC 지갑 주소 (BEP-20) - 선택</label>
                <div className="relative">
                  <input
                    type="text"
                    id="subform-wallet-input"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 pl-8 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <Key size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
                </div>
              </div>

              {/* Phone Registrator & Country Compliance check */}
              <div className="space-y-1">
                <label className="text-slate-500 text-4xs uppercase tracking-wider font-extrabold block">전화번호 및 국가 정보 (규제 비대상지역)</label>
                <div className="flex gap-2">
                  <select
                    id="subform-country"
                    value={formCountryCode}
                    onChange={(e) => setFormCountryCode(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                  >
                    {ISO_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code} className={c.isBlocked ? 'text-red-500 font-bold' : ''}>
                        {c.flag} {c.code} - {c.name.split(' (')[0]} {c.isBlocked ? ' [차단규제지역]' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      id="subform-phone-local-input"
                      value={formPhoneLocal}
                      onChange={(e) => setFormPhoneLocal(e.target.value)}
                      placeholder="010-1234-5678"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 pl-8 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <Phone size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
                  </div>
                </div>
                {ISO_COUNTRIES.find(c => c.code === formCountryCode)?.isBlocked && (
                  <div className="text-red-400 text-5xs uppercase font-sans animate-pulse mt-1 bg-red-950/30 p-1.5 rounded border border-red-900/20 leading-relaxed font-semibold">
                    🚫 저장 불가: {ISO_COUNTRIES.find(c => c.code === formCountryCode)?.name}은 국제 조약 차단 대상 규제역(16개 국가 중 하나)으로 약정상 등록 불가 처분됩니다.
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-slate-500 text-4xs uppercase tracking-wider font-extrabold block">특이사항 (Notes)</label>
                <textarea
                  id="subform-notes-textarea"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="예: VIP 오프체인 계약 갱신 요청"
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 leading-normal"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 text-xs pt-4 border-t border-slate-900">
                <button
                  type="button"
                  id="btn-subform-cancel"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingSub(null);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  id="btn-subform-submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={13} />
                  {editingSub ? '변경 원장 갱신' : '신규 지갑 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
