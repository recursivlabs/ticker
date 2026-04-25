'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type AgentDef = {
  key: string;
  name: string;
  description: string;
};

type Trigger = 'manual' | 'schedule' | 'event';
type Approval = 'review' | 'auto';
type ScheduleFreq = 'daily' | 'weekdays' | 'weekly' | 'monthly';
type EventType =
  | 'peer-8k'
  | 'analyst-change'
  | 'earnings-t7'
  | 'earnings-t1'
  | 'price-move-5pct';

type RoutineConfig = {
  trigger: Trigger;
  scheduleFreq: ScheduleFreq;
  scheduleTime: string;
  events: EventType[];
  outputs: string[];
  approval: Approval;
  notify: string[];
};

const DEFAULT: RoutineConfig = {
  trigger: 'manual',
  scheduleFreq: 'weekly',
  scheduleTime: 'Mon 6:00am',
  events: [],
  outputs: [],
  approval: 'review',
  notify: ['inapp'],
};

const SCHEDULE_OPTIONS: { value: ScheduleFreq; label: string }[] = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const EVENT_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'peer-8k', label: 'Peer files an 8-K' },
  { value: 'analyst-change', label: 'Analyst issues a rating or estimate change' },
  { value: 'earnings-t7', label: '7 days before our earnings' },
  { value: 'earnings-t1', label: '1 day before our earnings' },
  { value: 'price-move-5pct', label: 'Stock moves 5%+ intraday' },
];

const OUTPUT_OPTIONS: { value: string; label: string; needsConnection: string }[] = [
  { value: 'onedrive', label: 'OneDrive Excel (ThinkCell)', needsConnection: 'OneDrive' },
  { value: 'sharepoint', label: 'SharePoint Excel', needsConnection: 'SharePoint' },
  { value: 'gdocs', label: 'Google Docs', needsConnection: 'Google Drive' },
  { value: 'gsheets', label: 'Google Sheets', needsConnection: 'Google Sheets' },
  { value: 'outlook', label: 'Email via Outlook', needsConnection: 'Outlook' },
  { value: 'slack', label: 'Slack channel', needsConnection: 'Slack' },
  { value: 'teams', label: 'Microsoft Teams', needsConnection: 'Microsoft Teams' },
];

const NOTIFY_OPTIONS = [
  { value: 'inapp', label: 'In-app inbox' },
  { value: 'email', label: 'Email' },
  { value: 'slack', label: 'Slack DM' },
  { value: 'sms', label: 'SMS' },
];

export function RoutinesPanel({
  symbol,
  agents,
}: {
  symbol: string;
  agents: AgentDef[];
}) {
  const [configs, setConfigs] = useState<Record<string, RoutineConfig>>({});
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`ticker:routines:${symbol}`);
      if (raw) setConfigs(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, [symbol]);

  function update(agentKey: string, patch: Partial<RoutineConfig>) {
    setConfigs((prev) => {
      const next = { ...prev, [agentKey]: { ...DEFAULT, ...prev[agentKey], ...patch } };
      try {
        localStorage.setItem(`ticker:routines:${symbol}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
      <div className="divide-y divide-[var(--border)]">
        {agents.map((agent) => {
          const config = configs[agent.key] ?? DEFAULT;
          const isOpen = open === agent.key;
          return (
            <div key={agent.key}>
              <button
                onClick={() => setOpen(isOpen ? null : agent.key)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-[var(--border-soft)]/40 transition-colors text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[var(--fg)]">{agent.name}</div>
                  <div className="text-xs text-[var(--muted)] truncate">{agent.description}</div>
                </div>
                <ModeBadge config={config} />
                <span className="text-[var(--muted-soft)] text-xs">{isOpen ? '▴' : '▾'}</span>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 bg-[var(--border-soft)]/30 space-y-4">
                  {/* Trigger */}
                  <Field label="Trigger">
                    <div className="grid grid-cols-3 gap-2">
                      <TriggerOption
                        value="manual"
                        active={config.trigger === 'manual'}
                        onClick={() => update(agent.key, { trigger: 'manual' })}
                        title="Manual"
                        body="You run it on demand"
                      />
                      <TriggerOption
                        value="schedule"
                        active={config.trigger === 'schedule'}
                        onClick={() => update(agent.key, { trigger: 'schedule' })}
                        title="Schedule"
                        body="Runs on a cadence"
                      />
                      <TriggerOption
                        value="event"
                        active={config.trigger === 'event'}
                        onClick={() => update(agent.key, { trigger: 'event' })}
                        title="Event"
                        body="Runs when something happens"
                      />
                    </div>
                  </Field>

                  {config.trigger === 'schedule' && (
                    <Field label="Schedule">
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={config.scheduleFreq}
                          onChange={(e) =>
                            update(agent.key, { scheduleFreq: e.target.value as ScheduleFreq })
                          }
                          className="rounded-lg border border-[var(--border)] bg-white px-3 h-10 text-sm"
                        >
                          {SCHEDULE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={config.scheduleTime}
                          onChange={(e) => update(agent.key, { scheduleTime: e.target.value })}
                          placeholder="Mon 6:00am"
                          className="rounded-lg border border-[var(--border)] bg-white px-3 h-10 text-sm"
                        />
                      </div>
                    </Field>
                  )}

                  {config.trigger === 'event' && (
                    <Field label="Trigger events">
                      <div className="space-y-1.5">
                        {EVENT_OPTIONS.map((o) => (
                          <CheckRow
                            key={o.value}
                            label={o.label}
                            checked={config.events.includes(o.value)}
                            onChange={(checked) =>
                              update(agent.key, {
                                events: checked
                                  ? [...config.events, o.value]
                                  : config.events.filter((e) => e !== o.value),
                              })
                            }
                          />
                        ))}
                      </div>
                    </Field>
                  )}

                  {/* Output destinations */}
                  <Field label="Send results to">
                    <div className="grid sm:grid-cols-2 gap-1.5">
                      {OUTPUT_OPTIONS.map((o) => (
                        <CheckRow
                          key={o.value}
                          label={o.label}
                          subtle={`requires ${o.needsConnection}`}
                          checked={config.outputs.includes(o.value)}
                          onChange={(checked) =>
                            update(agent.key, {
                              outputs: checked
                                ? [...config.outputs, o.value]
                                : config.outputs.filter((x) => x !== o.value),
                            })
                          }
                        />
                      ))}
                    </div>
                  </Field>

                  {/* Approval */}
                  <Field label="When the agent finishes">
                    <div className="grid grid-cols-2 gap-2">
                      <ApprovalOption
                        active={config.approval === 'review'}
                        onClick={() => update(agent.key, { approval: 'review' })}
                        title="Queue for my review"
                        body="Result lands in my inbox first"
                      />
                      <ApprovalOption
                        active={config.approval === 'auto'}
                        onClick={() => update(agent.key, { approval: 'auto' })}
                        title="Auto-publish"
                        body="Send straight to destinations"
                      />
                    </div>
                  </Field>

                  {/* Notify */}
                  <Field label="Notify me via">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {NOTIFY_OPTIONS.map((o) => (
                        <CheckRow
                          key={o.value}
                          label={o.label}
                          checked={config.notify.includes(o.value)}
                          onChange={(checked) =>
                            update(agent.key, {
                              notify: checked
                                ? [...config.notify, o.value]
                                : config.notify.filter((x) => x !== o.value),
                            })
                          }
                        />
                      ))}
                    </div>
                  </Field>

                  <div className="text-[10px] text-[var(--muted-soft)] mono">
                    Saved locally on this device · cloud sync activates with sign-in
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModeBadge({ config }: { config: RoutineConfig }) {
  const tone =
    config.trigger === 'manual'
      ? 'bg-[var(--border-soft)] text-[var(--muted)]'
      : config.trigger === 'schedule'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-amber-100 text-amber-700';
  const label =
    config.trigger === 'manual'
      ? 'Manual'
      : config.trigger === 'schedule'
        ? 'Scheduled'
        : 'Event-triggered';
  return (
    <span className={cn('text-[10px] mono uppercase tracking-wider rounded-full px-2 py-0.5 shrink-0', tone)}>
      {label}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-soft)] mb-2">
        {label}
      </div>
      {children}
    </div>
  );
}

function TriggerOption({
  active,
  onClick,
  title,
  body,
}: {
  value: Trigger;
  active: boolean;
  onClick: () => void;
  title: string;
  body: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg border px-3 py-3 text-left transition-colors',
        active
          ? 'border-[var(--accent-ink)] bg-[var(--accent-soft)]'
          : 'border-[var(--border)] bg-white hover:border-[var(--muted-soft)]'
      )}
    >
      <div className={cn('text-sm font-medium', active ? 'text-[var(--accent-ink)]' : 'text-[var(--fg)]')}>
        {title}
      </div>
      <div className="text-[11px] text-[var(--muted)] mt-0.5">{body}</div>
    </button>
  );
}

function ApprovalOption({
  active,
  onClick,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  body: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg border px-3 py-3 text-left transition-colors',
        active
          ? 'border-[var(--accent-ink)] bg-[var(--accent-soft)]'
          : 'border-[var(--border)] bg-white hover:border-[var(--muted-soft)]'
      )}
    >
      <div className={cn('text-sm font-medium', active ? 'text-[var(--accent-ink)]' : 'text-[var(--fg)]')}>
        {title}
      </div>
      <div className="text-[11px] text-[var(--muted)] mt-0.5">{body}</div>
    </button>
  );
}

function CheckRow({
  label,
  subtle,
  checked,
  onChange,
}: {
  label: string;
  subtle?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors',
        checked
          ? 'border-[var(--accent-ink)] bg-[var(--accent-soft)]'
          : 'border-[var(--border)] bg-white hover:border-[var(--muted-soft)]'
      )}
    >
      <div
        className={cn(
          'h-4 w-4 shrink-0 rounded border flex items-center justify-center',
          checked ? 'border-accent bg-accent text-white' : 'border-[var(--border)]'
        )}
      >
        {checked && (
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
          </svg>
        )}
      </div>
      <div className="min-w-0">
        <div className={cn('text-xs', checked ? 'text-[var(--accent-ink)]' : 'text-[var(--fg-soft)]')}>
          {label}
        </div>
        {subtle && <div className="text-[10px] text-[var(--muted-soft)]">{subtle}</div>}
      </div>
    </button>
  );
}
