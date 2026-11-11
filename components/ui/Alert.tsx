import type { ReactNode } from 'react';
import { Icon } from './Icon';

type AlertTone = 'info' | 'warning' | 'danger' | 'success';

const TONES: Record<AlertTone, { box: string; icon: 'info' | 'alert' | 'check' }> = {
  info: { box: 'bg-accent-soft text-accent', icon: 'info' },
  warning: { box: 'bg-warning-soft text-warning', icon: 'alert' },
  danger: { box: 'bg-danger-soft text-danger', icon: 'alert' },
  success: { box: 'bg-success-soft text-success', icon: 'check' },
};

export function Alert({ tone = 'info', children, className = '' }: { tone?: AlertTone; children: ReactNode; className?: string }) {
  const t = TONES[tone];
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-[13px] ${t.box} ${className}`}>
      <Icon name={t.icon} size={16} className="mt-px" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default Alert;
