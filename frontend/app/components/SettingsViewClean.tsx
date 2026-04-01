'use client';

import React, { useState } from 'react';

/* ═══════════════════════════════════════════════════
   SETTINGS VIEW — Configuration Panels
═══════════════════════════════════════════════════ */

const TABS = [
  { id: 'general', icon: '⚙', label: 'General' },
  { id: 'notifications', icon: '🔔', label: 'Notifications' },
  { id: 'security', icon: '🛡', label: 'Security' },
  { id: 'database', icon: '🗄', label: 'Database' },
  { id: 'network', icon: '🌐', label: 'Network' },
];

const PANELS: Record<string, { inputs?: [string, string, string][]; toggles?: [string, boolean][] }> = {
  general: {
    inputs: [
      ['Cluster Name', 'AgentCloud-Production', 'text'],
      ['Region', 'us-east-1', 'text'],
      ['Max Concurrent Agents', '256', 'number'],
      ['Default Task Timeout (s)', '300', 'number'],
    ],
    toggles: [
      ['Auto-scaling', true],
      ['Debug Mode', false],
      ['Telemetry Collection', true],
    ],
  },
  notifications: {
    toggles: [
      ['Critical Alerts', true],
      ['Warning Alerts', true],
      ['Task Completion', true],
      ['Agent Status Changes', false],
      ['System Updates', false],
      ['Performance Reports', false],
    ],
  },
  security: {
    inputs: [
      ['TLS Version', '1.3', 'text'],
      ['Authentication', 'mTLS + JWT', 'text'],
      ['Key Rotation Interval', '24h', 'text'],
      ['Audit Log Retention', '90 days', 'text'],
    ],
  },
  database: {
    inputs: [
      ['Host', 'postgres://localhost:5432', 'text'],
      ['Pool Size', '20', 'text'],
      ['Connection Timeout (ms)', '5000', 'text'],
      ['Max Retries', '3', 'text'],
    ],
  },
  network: {
    inputs: [
      ['API Base URL', 'http://localhost:8000', 'text'],
      ['WebSocket URL', 'ws://localhost:8000', 'text'],
      ['Request Timeout (ms)', '30000', 'text'],
      ['Rate Limit (req/min)', '1000', 'text'],
    ],
  },
};

export default function SettingsViewClean() {
  const [tab, setTab] = useState('general');
  const panel = PANELS[tab];

  return (
    <div className="view-enter">
      <div style={{ marginBottom: 24 }}>
        <h1 className="pg-title">Settings</h1>
        <div className="pg-sub">Configure your AgentCloud environment</div>
      </div>

      <div className="settings-layout">
        {/* Nav */}
        <div className="settings-nav">
          {TABS.map(t => (
            <div
              key={t.id}
              className={`settings-nav-item ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon} {t.label}
            </div>
          ))}

          {/* System info box */}
          <div style={{
            marginTop: 16, padding: 12, borderRadius: 8,
            background: 'rgba(0,180,240,0.04)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div className="sys-dot" />
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)' }}>SYS_CORE: NOMINAL</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>v2.4.1-stable</div>
          </div>
        </div>

        {/* Panel */}
        <div className="settings-panel">
          <div className="settings-pane-hd">
            <div style={{ fontSize: 14, fontWeight: 800 }}>
              {TABS.find(t => t.id === tab)?.label?.toUpperCase()} SETTINGS
            </div>
            <button className="btn btn-primary btn-sm">💾 Save Changes</button>
          </div>
          <div className="settings-body">
            {/* Input fields */}
            {panel?.inputs && (
              <div className="field-group">
                <div className="field-label">
                  {tab === 'general' ? 'Cluster Configuration' :
                   tab === 'security' ? 'Security Settings' :
                   tab === 'database' ? 'Database Configuration' :
                   'Network Settings'}
                </div>
                {panel.inputs.map(([label, value, type]) => (
                  <div key={label} className="field-row">
                    <div><div className="field-name">{label}</div></div>
                    <input className="field-input" type={type} defaultValue={value} />
                  </div>
                ))}
              </div>
            )}

            {/* Toggle fields */}
            {panel?.toggles && (
              <div className="field-group">
                <div className="field-label">
                  {tab === 'general' ? 'System Options' : 'Notification Preferences'}
                </div>
                {panel.toggles.map(([label, checked]) => (
                  <div key={label} className="field-row">
                    <div className="field-name">{label}</div>
                    <label className="toggle">
                      <input type="checkbox" defaultChecked={checked} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
