import React, { useState } from 'react';
import { Mail, Bell, Settings, Play, Database, FileText, CheckCircle, RefreshCw, Trash2, ArrowRight, Eye, ShieldAlert, Cpu } from 'lucide-react';
import { NotificationSetting, NotificationLog, NotificationType, SubscriptionPlan, WalletState, UserSubscription } from '../types';
import { DEFAULT_TEMPLATES } from '../data';

interface NotificationManagerProps {
  wallet: WalletState;
  subscription: UserSubscription;
  activePlan: SubscriptionPlan;
  onAddTransaction: (hash: string, action: string, amount: number, status: 'SUCCESS' | 'FAILED') => void;
  triggerToast: (type: 'success' | 'error' | 'info', message: string) => void;
  onSimulatePaymentFailureStatus: () => void;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  wallet,
  subscription,
  activePlan,
  onAddTransaction,
  triggerToast,
  onSimulatePaymentFailureStatus,
}) => {
  // 1. Notification setting states
  const [setting, setSetting] = useState<NotificationSetting>({
    enableEmail: true,
    enablePush: true,
    targetEmail: 'savrina25x@gmail.com', // Pre-populated from user metadata details safely!
    daysBeforeExpiry: 3,
  });

  // 2. Mutable Templates State
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [selectedTemplateTab, setSelectedTemplateTab] = useState<NotificationType>('EXPIRY_WARNING');

  // Input bindings for template editor
  const [editSubject, setEditSubject] = useState(templates.EXPIRY_WARNING.subject);
  const [editEmailBody, setEditEmailBody] = useState(templates.EXPIRY_WARNING.emailBody);
  const [editPushBody, setEditPushBody] = useState(templates.EXPIRY_WARNING.pushBody);

  // 3. Notification Ledger (Simulated Netlify DB synced)
  const [logs, setLogs] = useState<NotificationLog[]>(() => {
    const saved = localStorage.getItem('FUTUA_SIMULA_NOTIFS');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    // Seed initial logs
    return [
      {
        id: 'NOTIF-101',
        timestamp: new Date(Date.now() - 3600000 * 2).toLocaleString(),
        type: 'ACTIVATION_SUCCESS',
        channel: 'EMAIL',
        recipient: 'savrina25x@gmail.com',
        subject: '[✓ 구독 완료] Futua Simula 프리미엄 라이선스 활성화 성공',
        content: '안녕하세요, Futua Simula 구독자님. 성공적으로 블록체인 스마트 결제 서명이 수락되어, 프리미엄 거래 터미널 구독 라이선스가 활성화되었습니다.',
        status: 'SENT',
        dbSynced: true,
      },
    ];
  });

  // 4. Visualizing active simulator sending indicators
  const [isSendingSim, setIsSendingSim] = useState(false);
  const [selectedLogDetail, setSelectedLogDetail] = useState<NotificationLog | null>(null);

  // Active push alert overlay state (to simulate local browser notification)
  const [activePushAlert, setActivePushAlert] = useState<{
    show: boolean;
    title: string;
    body: string;
  }>({
    show: false,
    title: '',
    body: '',
  });

  const saveLogs = (updatedLogs: NotificationLog[]) => {
    setLogs(updatedLogs);
    localStorage.setItem('FUTUA_SIMULA_NOTIFS', JSON.stringify(updatedLogs));
  };

  // Sync edited template to main state
  const handleSaveTemplate = () => {
    const updated = {
      ...templates,
      [selectedTemplateTab]: {
        subject: editSubject,
        emailBody: editEmailBody,
        pushBody: editPushBody,
      },
    };
    setTemplates(updated);
    triggerToast('success', '알림 이메일/푸시 템플릿이 성공적으로 저장 및 무트가드에 반영되었습니다.');
  };

  // Change active editing tab
  const handleTabChange = (tab: NotificationType) => {
    setSelectedTemplateTab(tab);
    setEditSubject(templates[tab].subject);
    setEditEmailBody(templates[tab].emailBody);
    setEditPushBody(templates[tab].pushBody);
  };

  // Trigger Local Web Push notification toast simulation
  const showPushToast = (title: string, body: string) => {
    if (!setting.enablePush) return;
    setActivePushAlert({ show: true, title, body });
    // Auto collapse push alert bubble
    setTimeout(() => {
      setActivePushAlert((prev) => ({ ...prev, show: false }));
    }, 5500);
  };

  // Generate unique log ID
  const generateNotifId = () => `NOTIF-${Math.floor(Math.random() * 90000) + 10000}`;

  // Helper parser for dynamic variable injections
  const parseTemplateVariables = (text: string, customTx?: string) => {
    const sampleTx = customTx || '0xba29ff10d68d3a2fbcecb26a1b2c4e5781a8296a84';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    const dateFormatted = tomorrow.toLocaleString();

    return text
      .replace(/{PRICE}/g, activePlan.id === 'FREE' ? '2' : activePlan.priceTotal.toString())
      .replace(/{PLAN_NAME}/g, activePlan.id === 'FREE' ? 'Futua Simula 1개월 구독권' : activePlan.name)
      .replace(/{TX_HASH}/g, sampleTx)
      .replace(/{EXPIRY_DATE}/g, dateFormatted);
  };

  // Simulation 1: Simulate "Subscription Expiring Soon" (만료 예정 알림)
  const simulateExpiryWarning = () => {
    setIsSendingSim(true);
    triggerToast('info', '구독 만료 예정(3일 전) 자동 알림 배치 크론탭을 가동합니다...');

    setTimeout(() => {
      const parsedSubject = parseTemplateVariables(templates.EXPIRY_WARNING.subject);
      const parsedEmail = parseTemplateVariables(templates.EXPIRY_WARNING.emailBody);
      const parsedPush = parseTemplateVariables(templates.EXPIRY_WARNING.pushBody);

      const nextLogs: NotificationLog[] = [];

      // 1. Email Channel
      if (setting.enableEmail) {
        nextLogs.push({
          id: generateNotifId(),
          timestamp: new Date().toLocaleString(),
          type: 'EXPIRY_WARNING',
          channel: 'EMAIL',
          recipient: setting.targetEmail,
          subject: parsedSubject,
          content: parsedEmail,
          status: 'SENT',
          dbSynced: true,
        });
      }

      // 2. Push Channel
      if (setting.enablePush) {
        nextLogs.push({
          id: generateNotifId(),
          timestamp: new Date().toLocaleString(),
          type: 'EXPIRY_WARNING',
          channel: 'PUSH',
          recipient: wallet.address || '0x0000...0000',
          subject: '[푸시 알림 수신]',
          content: parsedPush,
          status: 'SENT',
          dbSynced: true,
        });
        showPushToast('⚠️ [Futua Simula] 구독 만료 임박', parsedPush);
      }

      saveLogs([...nextLogs, ...logs]);
      setIsSendingSim(false);
      triggerToast('success', '만료 대기 예정 알림이 Netlify DB 및 해당 구독자 수신 채널로 안전 발송 완료되었습니다.');
    }, 1200);
  };

  // Simulation 2: Simulate "Payment Failed Alert" (결제 실패 알림)
  const simulatePaymentFailure = () => {
    setIsSendingSim(true);
    triggerToast('info', '스마트 컨트랙트 자동 결제 검사 중...');

    setTimeout(() => {
      // For failure, we populate transactions as failed in ledger too!
      const failedTxHash = '0xfc41498de1d8cf' + Math.floor(Math.random() * 10000000000).toString(16) + 'eff12';
      
      // Calculate missing funds or failed details
      onAddTransaction(failedTxHash, 'USDT 자동 결제 갱신 차감 실패', -activePlan.priceTotal, 'FAILED');
      
      // Update parent subscription to expired/none to trigger real system state change
      onSimulatePaymentFailureStatus();

      const parsedSubject = parseTemplateVariables(templates.PAYMENT_FAILED.subject);
      const parsedEmail = parseTemplateVariables(templates.PAYMENT_FAILED.emailBody);
      const parsedPush = parseTemplateVariables(templates.PAYMENT_FAILED.pushBody);

      const nextLogs: NotificationLog[] = [];

      if (setting.enableEmail) {
        nextLogs.push({
          id: generateNotifId(),
          timestamp: new Date().toLocaleString(),
          type: 'PAYMENT_FAILED',
          channel: 'EMAIL',
          recipient: setting.targetEmail,
          subject: parsedSubject,
          content: parsedEmail,
          status: 'SENT',
          dbSynced: true,
        });
      }

      if (setting.enablePush) {
        nextLogs.push({
          id: generateNotifId(),
          timestamp: new Date().toLocaleString(),
          type: 'PAYMENT_FAILED',
          channel: 'PUSH',
          recipient: wallet.address || '0x0000...0000',
          subject: '[푸시 알림 수신]',
          content: parsedPush,
          status: 'SENT',
          dbSynced: true,
        });
        showPushToast('🚫 [Futua Simula] 갱신 결제 실패 경고', parsedPush);
      }

      saveLogs([...nextLogs, ...logs]);
      setIsSendingSim(false);
      triggerToast('error', '결제 한도 예외로 인한 구독 실패 경고 알림이 Netlify DB에 동기화 발송되었습니다.');
    }, 1500);
  };

  // Clear log
  const handleClearLogs = () => {
    saveLogs([]);
    triggerToast('info', '알림 수발신 전송 기록 원장이 초기화되었습니다.');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden mt-6" id="payment-notification-manager">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Title & Introduction */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="p-1 text-indigo-400 bg-indigo-500/10 rounded-lg animate-pulse">
              <Bell size={16} />
            </span>
            <span className="text-xs font-semibold uppercase text-indigo-400 font-mono">Netlify Alerts Engine</span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">구독 만료 및 정산 실패 자동 알림 조종 패널</h3>
          <p className="text-slate-400 text-xs mt-1">
            BSC 기저 결제 상태에 맞추어 **구독 만료 예정자** 및 **잔고 부족 결제 실패자**에게 이메일/푸쉬 알림을 실시간 자동 발송하는 백엔드 디스패치 모사 콘솔입니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xs bg-slate-950 text-indigo-300 font-mono px-2 py-1 rounded border border-slate-800 flex items-center gap-1">
            <Database size={11} />
            <span>Netlify Sync: Active</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Alerts Settings & Simulators */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Settings Section */}
          <div className="bg-slate-950/70 p-4.5 rounded-xl border border-slate-850 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Settings size={13} className="text-slate-400" />
              <span>알림 수발신 연결 구성</span>
            </h4>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-slate-500 text-4xs uppercase tracking-wider font-bold">수신 이메일 주소</label>
              <div className="relative">
                <input
                  type="email"
                  id="target-email-input"
                  value={setting.targetEmail}
                  onChange={(e) => setSetting({ ...setting, targetEmail: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 pl-8 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <Mail size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
              </div>
              <p className="text-slate-500 text-4xs leading-normal">
                블록체인 모의 계약 갱신 예정/실패 시 이메일 영수증이 해당 주소로 모사 발송됩니다.
              </p>
            </div>

            {/* Notification Channels Toggle */}
            <div className="space-y-3.5 pt-2 border-t border-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Mail size={14} className="text-indigo-400" />
                  <span className="text-xs text-slate-300">이메일(E-mail) 발송 허용</span>
                </div>
                <input
                  type="checkbox"
                  id="chk-enable-email"
                  checked={setting.enableEmail}
                  onChange={(e) => setSetting({ ...setting, enableEmail: e.target.checked })}
                  className="w-4 h-4 text-indigo-500 bg-slate-900 border-slate-800 rounded focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Bell size={14} className="text-teal-400" />
                  <span className="text-xs text-slate-300">푸시(Push Overlay) 알림 허용</span>
                </div>
                <input
                  type="checkbox"
                  id="chk-enable-push"
                  checked={setting.enablePush}
                  onChange={(e) => setSetting({ ...setting, enablePush: e.target.checked })}
                  className="w-4 h-4 text-indigo-500 bg-slate-900 border-slate-800 rounded focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Days Trigger Option */}
            <div className="space-y-1.5 pt-2 border-t border-slate-900">
              <label className="text-slate-500 text-4xs uppercase tracking-wider font-bold">만료 안내 람다 배치 스케줄</label>
              <select
                id="select-expiry-days"
                value={setting.daysBeforeExpiry}
                onChange={(e) => setSetting({ ...setting, daysBeforeExpiry: parseInt(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value={3}>구독 라이선스 만료 3일 전 (권장)</option>
                <option value={7}>구독 라이선스 만료 7일 전</option>
                <option value={1}>구독 라이선스 만료 1일 전 (긴급)</option>
              </select>
            </div>
          </div>

          {/* Trigger/Simulation Station */}
          <div className="bg-slate-950/70 p-4.5 rounded-xl border border-slate-850 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Play size={13} className="text-yellow-500" />
              <span>자동 알림 배치 수동 트리거</span>
            </h4>

            <p className="text-slate-400 text-3xs leading-relaxed">
              블록체인 가상 유인 만료 블록 및 스마트 정산 결제 실패 케이스를 가상 즉시 발생시켜 알림 엔진의 메일/푸시 자동 서명을 유도합니다.
            </p>

            <div className="space-y-2.5">
              <button
                id="btn-trigger-expiry-warn"
                onClick={simulateExpiryWarning}
                disabled={isSendingSim}
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer text-white disabled:opacity-50"
              >
                <RefreshCw size={13} className={isSendingSim ? 'animate-spin' : ''} />
                만료 임박 알림 수동 배치 실행 (만료 {setting.daysBeforeExpiry}일 전)
              </button>

              <button
                id="btn-trigger-pay-failed"
                onClick={simulatePaymentFailure}
                disabled={isSendingSim}
                className="w-full py-2.5 bg-red-950/55 hover:bg-red-900/40 font-bold text-xs text-red-400 border border-red-900/40 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ShieldAlert size={13} />
                결제 갱신 실패 강제 상황 재현 (경고 발송)
              </button>
            </div>
          </div>

        </div>

        {/* Center Column: Live Template Customization Editor */}
        <div className="lg:col-span-8 flex flex-col bg-slate-950/50 rounded-xl border border-slate-850 overflow-hidden">
          
          {/* Template Tabs */}
          <div className="bg-slate-950 px-4 pt-3 border-b border-slate-900 flex flex-wrap gap-1">
            <button
              id="tab-edit-expiry"
              onClick={() => handleTabChange('EXPIRY_WARNING')}
              className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-all cursor-pointer flex items-center gap-1 ${
                selectedTemplateTab === 'EXPIRY_WARNING'
                  ? 'bg-slate-900 text-white border-t-2 border-indigo-500'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span>만료 예정 안내</span>
              <span className="text-4xs bg-indigo-500/10 text-indigo-400 px-1 py-0.2 rounded font-mono">Auto</span>
            </button>

            <button
              id="tab-edit-failed"
              onClick={() => handleTabChange('PAYMENT_FAILED')}
              className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-all cursor-pointer flex items-center gap-1 ${
                selectedTemplateTab === 'PAYMENT_FAILED'
                  ? 'bg-slate-900 text-white border-t-2 border-indigo-500'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span>결제 실패 경고</span>
              <span className="text-4xs bg-red-500/10 text-red-400 px-1 py-0.2 rounded font-mono">Alert</span>
            </button>

            <button
              id="tab-edit-success"
              onClick={() => handleTabChange('ACTIVATION_SUCCESS')}
              className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-all cursor-pointer flex items-center gap-1 ${
                selectedTemplateTab === 'ACTIVATION_SUCCESS'
                  ? 'bg-slate-900 text-white border-t-2 border-indigo-500'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span>구독 체결 확인</span>
              <span className="text-4xs bg-emerald-500/10 text-emerald-400 px-1 py-0.2 rounded font-mono">Receipt</span>
            </button>
          </div>

          {/* Template Editor Workspace */}
          <div className="p-5 space-y-4 flex-grow">
            <div className="flex items-center justify-between">
              <span className="text-3xs text-slate-500 font-mono flex items-center gap-1">
                <FileText size={11} />
                <span>선택된 템플릿 실시간 치환 에디터</span>
              </span>
              <span className="text-4xs text-slate-500 font-mono">사용 가능 변수: {'{PRICE}'}, {'{PLAN_NAME}'}, {'{TX_HASH}'}, {'{EXPIRY_DATE}'}</span>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="text-slate-500 text-4xs uppercase font-extrabold tracking-wide block">알림/이메일 제목</label>
              <input
                type="text"
                id="template-subject-input"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
              />
            </div>

            {/* Email Body */}
            <div className="space-y-1">
              <label className="text-slate-500 text-4xs uppercase font-extrabold tracking-wide block">이메일 본문 내용 (HTML/마크다운)</label>
              <textarea
                id="template-emailbody-textarea"
                rows={5}
                value={editEmailBody}
                onChange={(e) => setEditEmailBody(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
              />
            </div>

            {/* Push Message Body */}
            <div className="space-y-1">
              <label className="text-slate-500 text-4xs uppercase font-extrabold tracking-wide block">화면 실시간 푸쉬 문구 (짧고 간결하게)</label>
              <input
                type="text"
                id="template-pushbody-input"
                value={editPushBody}
                onChange={(e) => setEditPushBody(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Control buttons */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-900">
              <span className="text-4xs text-slate-500">※ 변경 사항은 현 브라우저의 모의 호스팅 가상 원장에 저장 보존됩니다.</span>
              <button
                id="btn-save-template"
                onClick={handleSaveTemplate}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer transition flex items-center gap-1"
              >
                <CheckCircle size={12} />
                저장 및 자동 알림 업데이트
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Database Dispatch Logs Table */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 mb-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Database size={13} className="text-indigo-400" />
              <span>알림 비동기 자동 발송 로그 (Netlify Database Record)</span>
            </h4>
            <p className="text-slate-500 text-3xs mt-0.5">
              스마트 결제 갱신 크론이 백엔드 전송 서버와 동기화 발송을 마친 누적 데이터 히스토리 내역입니다.
            </p>
          </div>
          {logs.length > 0 && (
            <button
              id="btn-clear-notif-logs"
              onClick={handleClearLogs}
              className="px-3 py-1 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white rounded border border-slate-850 text-3xs font-semibold cursor-pointer transition flex items-center gap-1"
            >
              <Trash2 size={11} />
              로그 전체 초기화
            </button>
          )}
        </div>

        {/* Logs Table Output */}
        <div className="overflow-x-auto">
          {logs.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              발송된 알림 데이터베이스 내역이 비어 있습니다. 왼쪽 트리거 버튼을 눌러 시뮬레이션을 수행해 주십시오.
            </div>
          ) : (
            <table className="w-full text-left font-mono text-2xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500 text-4xs uppercase">
                  <th className="pb-2.5 pl-2">ID</th>
                  <th className="pb-2.5">시간</th>
                  <th className="pb-2.5">수신 타겟</th>
                  <th className="pb-2.5">종류</th>
                  <th className="pb-2.5">발송 채널</th>
                  <th className="pb-2.5">내용 요약</th>
                  <th className="pb-2.5">상태</th>
                  <th className="pb-2.5 pr-2 text-right">조회</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-900 hover:bg-slate-950/60 transition-colors">
                    <td className="py-2.5 pl-2 font-bold text-slate-400">{log.id}</td>
                    <td className="text-slate-500 py-2.5">{log.timestamp}</td>
                    <td className="text-slate-300 py-2.5 max-w-[120px] truncate">{log.recipient}</td>
                    <td className="py-2.5">
                      <span className={`inline-block px-1.5 py-0.2 rounded-sm text-3xs font-bold uppercase leading-none ${
                        log.type === 'EXPIRY_WARNING' ? 'bg-amber-500/10 text-amber-400' :
                        log.type === 'PAYMENT_FAILED' ? 'bg-red-500/10 text-red-400 font-extrabold' :
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {log.type === 'EXPIRY_WARNING' ? '만료 경고' :
                         log.type === 'PAYMENT_FAILED' ? '결제 실패' : '수납 확인'}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className="flex items-center gap-1 text-slate-400">
                        {log.channel === 'EMAIL' ? <Mail size={10} className="text-indigo-400" /> : <Bell size={10} className="text-teal-400" />}
                        {log.channel}
                      </span>
                    </td>
                    <td className="text-slate-400 py-2.5 max-w-[200px] truncate">{log.subject || log.content}</td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1 font-sans text-3xs text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded font-bold">
                        <CheckCircle size={8} />
                        {log.status}
                      </span>
                    </td>
                    <td className="text-right py-2.5 pr-2">
                      <button
                        id={`btn-open-log-${log.id}`}
                        onClick={() => setSelectedLogDetail(log)}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer text-3xs"
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Individual Dispatch Log Viewer Modal Card */}
      {selectedLogDetail && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm" id="notification-modal">
          <div className="bg-[#0e1626] border border-indigo-500/25 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="bg-slate-950 px-6 py-4.5 border-b border-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedLogDetail.channel === 'EMAIL' ? <Mail size={16} className="text-indigo-400" /> : <Bell size={16} className="text-teal-400" />}
                <span className="text-xs font-black tracking-wide text-white uppercase font-sans">
                  데이터베이스 전산 원장 상세 대조 ({selectedLogDetail.id})
                </span>
              </div>
              <button
                id="btn-close-notif-modal"
                onClick={() => setSelectedLogDetail(null)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                닫기
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-2xs font-mono pb-2 border-b border-slate-900 text-slate-500">
                <span>발송 일시: {selectedLogDetail.timestamp}</span>
                <span className="text-emerald-400 font-bold">&#10003; Netlify DB Sync Verified</span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex text-2xs font-mono">
                  <span className="text-slate-500 w-20">수신 대상자:</span>
                  <span className="text-amber-400 truncate">{selectedLogDetail.recipient}</span>
                </div>
                <div className="flex text-2xs font-mono">
                  <span className="text-slate-500 w-20">요금제 대상:</span>
                  <span className="text-slate-200">{activePlan.name}</span>
                </div>
                {selectedLogDetail.channel === 'EMAIL' && (
                  <div className="flex text-2xs font-mono">
                    <span className="text-slate-500 w-20">메일 제목:</span>
                    <span className="text-white font-bold">{selectedLogDetail.subject}</span>
                  </div>
                )}
              </div>

              {/* Box container presenting rendered mock format */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 max-h-[220px] overflow-y-auto">
                <span className="text-3xs text-slate-500 block uppercase font-mono mb-2">[수신 디바이스 뷰어 화면]</span>
                {selectedLogDetail.channel === 'EMAIL' ? (
                  <div className="text-xs text-slate-300 whitespace-pre-wrap font-sans font-normal leading-relaxed">
                    {selectedLogDetail.content}
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg flex items-start gap-2.5">
                    <Bell className="text-teal-400 shrink-0 animate-bounce" size={16} />
                    <div>
                      <div className="text-3xs font-extrabold text-white">FUTUA SIMULA PUSH DISPATCH</div>
                      <div className="text-2xs text-slate-300 mt-0.5 leading-normal">{selectedLogDetail.content}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  id="btn-close-notif-dialog"
                  onClick={() => setSelectedLogDetail(null)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  확인 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay Web Push Notification Bar (Flying bubble for high-fidelity response) */}
      {activePushAlert.show && (
        <div className="fixed top-20 right-6 z-50 max-w-sm w-full bg-slate-900 border-2 border-teal-500/40 rounded-xl p-4 shadow-2xl animate-in slide-in-from-top-6 duration-300" id="flying-push-notification-bubble">
          <div className="flex items-start gap-3">
            <span className="p-1 px-1.5 bg-teal-500/10 text-teal-400 rounded-lg border border-teal-500/20 animate-bounce">
              <Bell size={18} />
            </span>
            <div className="flex-grow space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-3xs font-black tracking-wide text-teal-400 uppercase font-mono">가상 푸시 수신 (Netlify Sync)</span>
                <span className="text-4xs text-slate-500">Just now</span>
              </div>
              <h5 className="text-xs font-bold text-white leading-snug">{activePushAlert.title}</h5>
              <p className="text-slate-300 text-2xs leading-normal">{activePushAlert.body}</p>
            </div>
            <button
              id="btn-close-flying-push"
              onClick={() => setActivePushAlert((prev) => ({ ...prev, show: false }))}
              className="text-slate-500 hover:text-slate-200 text-xs font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
