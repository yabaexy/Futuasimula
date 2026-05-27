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
        subject: '[✓ Subscription Complete] Futua Simula Premium License Successfully Activated',
        content: 'Hello, Futua Simula subscriber. Your blockchain payment authorization has been accepted, and your premium subscription license has been successfully activated.',
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
    triggerToast('success', 'Notification templates successfully saved and updated.');
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

  // Simulation 1: Simulate "Subscription Expiring Soon" (Expiry Reminder Notification)
  const simulateExpiryWarning = () => {
    setIsSendingSim(true);
    triggerToast('info', 'Executing automatic reminder dispatch batch cron (3 days out)...');

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
          subject: '[Push Received]',
          content: parsedPush,
          status: 'SENT',
          dbSynced: true,
        });
        showPushToast('⚠️ [Futua Simula] Expiry Warning Alert', parsedPush);
      }

      saveLogs([...nextLogs, ...logs]);
      setIsSendingSim(false);
      triggerToast('success', 'Expiry warnings successfully dispatched to Netlify DB and subscriber channels.');
    }, 1200);
  };

  // Simulation 2: Simulate "Payment Failed Alert"
  const simulatePaymentFailure = () => {
    setIsSendingSim(true);
    triggerToast('info', 'Verifying smart contract automated payment status...');

    setTimeout(() => {
      // For failure, we populate transactions as failed in ledger too!
      const failedTxHash = '0xfc41498de1d8cf' + Math.floor(Math.random() * 10000000000).toString(16) + 'eff12';
      
      // Calculate missing funds or failed details
      onAddTransaction(failedTxHash, 'Automated USDT Subscription Renewal Failed', -activePlan.priceTotal, 'FAILED');
      
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
          subject: '[Push Received]',
          content: parsedPush,
          status: 'SENT',
          dbSynced: true,
        });
        showPushToast('🚫 [Futua Simula] Automated Renewal Failed', parsedPush);
      }

      saveLogs([...nextLogs, ...logs]);
      setIsSendingSim(false);
      triggerToast('error', 'Renewal payment failed alert successfully synchronised and logged in major ledger.');
    }, 1500);
  };

  // Clear log
  const handleClearLogs = () => {
    saveLogs([]);
    triggerToast('info', 'Notification log history successfully cleared.');
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
          <h3 className="text-xl font-bold text-white mt-1">Subscription Expiry & Renewal Alerts Control Panel</h3>
          <p className="text-slate-400 text-xs mt-1">
            Real-time simulated backend console to automatically dispatch email and push notifications to subscribers upon expiry warnings and failed renewals.
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
              <span>Notification Destination Config</span>
            </h4>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-slate-500 text-4xs uppercase tracking-wider font-bold">Target E-mail Recipient</label>
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
                Email receipts will be dispatched to this address upon simulated subscription renewal or checkout failures.
              </p>
            </div>

            {/* Notification Channels Toggle */}
            <div className="space-y-3.5 pt-2 border-t border-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Mail size={14} className="text-indigo-400" />
                  <span className="text-xs text-slate-300">Enable E-mail Notifications</span>
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
                  <span className="text-xs text-slate-300">Enable Screen Push Notifications</span>
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
              <label className="text-slate-500 text-4xs uppercase tracking-wider font-bold">Renewal Reminder Lambda Batch Schedule</label>
              <select
                id="select-expiry-days"
                value={setting.daysBeforeExpiry}
                onChange={(e) => setSetting({ ...setting, daysBeforeExpiry: parseInt(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value={3}>3 days before license expiry (Recommended)</option>
                <option value={7}>7 days before license expiry</option>
                <option value={1}>1 day before license expiry (Urgent)</option>
              </select>
            </div>
          </div>

          {/* Trigger/Simulation Station */}
          <div className="bg-slate-950/70 p-4.5 rounded-xl border border-slate-850 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Play size={13} className="text-yellow-500" />
              <span>Automated Reminder Manual Triggers</span>
            </h4>

            <p className="text-slate-400 text-3xs leading-relaxed">
              Simulate low balance renewal failures or block expiry times to trigger automated warning dispatches immediately.
            </p>

            <div className="space-y-2.5">
              <button
                id="btn-trigger-expiry-warn"
                onClick={simulateExpiryWarning}
                disabled={isSendingSim}
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer text-white disabled:opacity-50"
              >
                <RefreshCw size={13} className={isSendingSim ? 'animate-spin' : ''} />
                Trigger Expiry Warning ({setting.daysBeforeExpiry} days before)
              </button>

              <button
                id="btn-trigger-pay-failed"
                onClick={simulatePaymentFailure}
                disabled={isSendingSim}
                className="w-full py-2.5 bg-red-950/55 hover:bg-red-900/40 font-bold text-xs text-red-400 border border-red-900/40 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ShieldAlert size={13} />
                Force Failed Renewal Simulation (Send Warnings)
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
              <span>Expiry Reminder</span>
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
              <span>Payment Failed Alert</span>
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
              <span>Receipt Confirmation</span>
              <span className="text-4xs bg-emerald-500/10 text-emerald-400 px-1 py-0.2 rounded font-mono">Receipt</span>
            </button>
          </div>

          {/* Template Editor Workspace */}
          <div className="p-5 space-y-4 flex-grow">
            <div className="flex items-center justify-between">
              <span className="text-3xs text-slate-500 font-mono flex items-center gap-1">
                <FileText size={11} />
                <span>Selected Template Live Variable Substitution Editor</span>
              </span>
              <span className="text-4xs text-slate-500 font-mono">Available tags: {'{PRICE}'}, {'{PLAN_NAME}'}, {'{TX_HASH}'}, {'{EXPIRY_DATE}'}</span>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="text-slate-500 text-4xs uppercase font-extrabold tracking-wide block">Subject Title</label>
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
              <label className="text-slate-500 text-4xs uppercase font-extrabold tracking-wide block">Email Content Body (HTML/Markdown)</label>
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
              <label className="text-slate-500 text-4xs uppercase font-extrabold tracking-wide block">Screen Push Message (Short & Concise)</label>
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
              <span className="text-4xs text-slate-500">* Changes are stored and persisted securely in your local browser sandbox ledger.</span>
              <button
                id="btn-save-template"
                onClick={handleSaveTemplate}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer transition flex items-center gap-1"
              >
                <CheckCircle size={12} />
                Save Template Changes
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
              <span>Asynchronous Dispatch Ledger (Netlify Database Record)</span>
            </h4>
            <p className="text-slate-500 text-3xs mt-0.5">
              Historical dispatch records synchronized by the automated payment cron with the serverless backend.
            </p>
          </div>
          {logs.length > 0 && (
            <button
              id="btn-clear-notif-logs"
              onClick={handleClearLogs}
              className="px-3 py-1 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white rounded border border-slate-850 text-3xs font-semibold cursor-pointer transition flex items-center gap-1"
            >
              <Trash2 size={11} />
              Clear Dispatched Logs
            </button>
          )}
        </div>

        {/* Logs Table Output */}
        <div className="overflow-x-auto">
          {logs.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              Historical notification log is empty. Try triggering simulated dispatches from the sidebar command desk.
            </div>
          ) : (
            <table className="w-full text-left font-mono text-2xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500 text-4xs uppercase">
                  <th className="pb-2.5 pl-2">ID</th>
                  <th className="pb-2.5">Time</th>
                  <th className="pb-2.5">Recipient</th>
                  <th className="pb-2.5">Type</th>
                  <th className="pb-2.5">Channel</th>
                  <th className="pb-2.5">Subject Summary</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 pr-2 text-right">Action</th>
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
                        {log.type === 'EXPIRY_WARNING' ? 'Expiry Warning' :
                         log.type === 'PAYMENT_FAILED' ? 'Failed Payment' : 'Receipt Paid'}
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
                        Details
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
          <div className="bg-[#0e1626] border border-indigo-500/25 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 font-sans">
            <div className="bg-slate-950 px-6 py-4.5 border-b border-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedLogDetail.channel === 'EMAIL' ? <Mail size={16} className="text-indigo-400" /> : <Bell size={16} className="text-teal-400" />}
                <span className="text-xs font-black tracking-wide text-white uppercase font-sans">
                  Database Ledger Reconciliation ({selectedLogDetail.id})
                </span>
              </div>
              <button
                id="btn-close-notif-modal"
                onClick={() => setSelectedLogDetail(null)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-2xs font-mono pb-2 border-b border-slate-900 text-slate-500">
                <span>Dispatched Time: {selectedLogDetail.timestamp}</span>
                <span className="text-emerald-400 font-bold">&#10003; Netlify DB Sync Verified</span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex text-2xs font-mono">
                  <span className="text-slate-500 w-20">Recipient:</span>
                  <span className="text-amber-400 truncate">{selectedLogDetail.recipient}</span>
                </div>
                <div className="flex text-2xs font-mono">
                  <span className="text-slate-500 w-20">Plan Tier:</span>
                  <span className="text-slate-200">{activePlan.name}</span>
                </div>
                {selectedLogDetail.channel === 'EMAIL' && (
                  <div className="flex text-2xs font-mono">
                    <span className="text-slate-500 w-20">E-mail Subject:</span>
                    <span className="text-white font-bold">{selectedLogDetail.subject}</span>
                  </div>
                )}
              </div>

              {/* Box container presenting rendered mock format */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 max-h-[220px] overflow-y-auto">
                <span className="text-3xs text-slate-500 block uppercase font-mono mb-2">[Sandbox Recipient Device Viewport]</span>
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
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Close Dialog
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
                <span className="text-3xs font-black tracking-wide text-teal-400 uppercase font-mono">Simulated Push Alert (Netlify Synced)</span>
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
