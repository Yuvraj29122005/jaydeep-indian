import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const { agencySettings, agencySettingsMeta, updateAgencySettings, resetAgencySettings, currentUser } = useApp();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'contact' | 'bank' | 'invoice' | 'preview'
  const [formData, setFormData] = useState({ ...agencySettings });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [previewType, setPreviewType] = useState('Standard'); // 'Standard' | 'Empty Bottle'
  const [copiedSql, setCopiedSql] = useState(false);

  const canEdit = currentUser?.role === 'admin' || currentUser?.permissions?.settings === 'edit' || currentUser?.permissions?.settings === 'full';

  // Keep form data synced when agencySettings changes from context
  useEffect(() => {
    if (agencySettings) {
      setFormData(prev => ({ ...agencySettings, ...prev }));
    }
  }, [agencySettings]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!canEdit) return;

    setIsSaving(true);
    setSaveMessage('');
    try {
      const res = await updateAgencySettings(formData);
      setIsSaving(false);
      setSaveSuccess(true);
      if (res.syncedWithSupabase) {
        setSaveMessage('Saved successfully and synced with Supabase database!');
      } else {
        setSaveMessage('Saved locally in browser! (To sync with cloud across all devices, run the database setup SQL in Supabase).');
      }
      setTimeout(() => {
        setSaveSuccess(false);
      }, 5000);
    } catch (err) {
      setIsSaving(false);
      alert('Error saving settings: ' + (err.message || 'Unknown error'));
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      const res = await resetAgencySettings();
      setFormData({ ...res.settings });
      setShowResetModal(false);
      setIsSaving(false);
      setSaveSuccess(true);
      setSaveMessage('Settings successfully reset to default agency profile.');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setIsSaving(false);
      alert('Error resetting settings: ' + err.message);
    }
  };

  const sqlSetupScript = `-- 5. AGENCY SETTINGS & INVOICE CONFIG TABLE
CREATE TABLE IF NOT EXISTS public.agency_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_name TEXT NOT NULL DEFAULT 'Jaydeep Indian Gas Agency',
  company_name TEXT NOT NULL DEFAULT 'Jaydeep Indian Gas Agency',
  tagline TEXT DEFAULT 'Authorized Indane LPG Distributor',
  gstin TEXT DEFAULT '24ABCDE1234F1Z5',
  pan_number TEXT DEFAULT 'ABCDE1234F',
  phone TEXT DEFAULT '9876543210',
  alternate_phone TEXT DEFAULT '9876543211',
  email TEXT DEFAULT 'jaydeepindian01@gmail.com',
  website TEXT DEFAULT '',
  address TEXT DEFAULT 'Plot No. 12, GIDC Industrial Estate, Sachin',
  city TEXT DEFAULT 'Surat',
  state TEXT DEFAULT 'Gujarat',
  pincode TEXT DEFAULT '394230',
  bank_name TEXT DEFAULT 'State Bank of India',
  account_holder TEXT DEFAULT 'Jaydeep Indian Gas Agency',
  account_number TEXT DEFAULT '123456789012',
  ifsc_code TEXT DEFAULT 'SBIN0001234',
  branch TEXT DEFAULT 'Sachin GIDC Branch',
  upi_id TEXT DEFAULT 'jaydeepgas@upi',
  invoice_prefix TEXT DEFAULT 'JIG',
  empty_bottle_prefix TEXT DEFAULT 'EB',
  invoice_terms TEXT DEFAULT '1. Goods once sold will not be taken back.
2. Gas cylinders must be stored upright in a well-ventilated area away from heat sources.
3. Check cylinder seal and weight at the time of delivery.
4. Subject to Surat jurisdiction only.',
  invoice_footer_note TEXT DEFAULT 'Thank you for your business! For emergency leak support, contact helpline immediately.',
  signatory_title TEXT DEFAULT 'Authorized Signatory',
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT DEFAULT 'Admin'
);

ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to agency_settings" ON public.agency_settings;
CREATE POLICY "Allow all access to agency_settings" ON public.agency_settings
  FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.agency_settings (
  agency_name, company_name, tagline, gstin, pan_number, phone, alternate_phone,
  email, address, city, state, pincode, bank_name, account_holder, account_number,
  ifsc_code, branch, upi_id, invoice_prefix, empty_bottle_prefix,
  invoice_terms, invoice_footer_note, signatory_title, updated_by
)
SELECT
  'Jaydeep Indian Gas Agency',
  'Jaydeep Indian Gas Agency',
  'Authorized Indane LPG Distributor',
  '24ABCDE1234F1Z5',
  'ABCDE1234F',
  '9876543210',
  '9876543211',
  'jaydeepindian01@gmail.com',
  'Plot No. 12, GIDC Industrial Estate, Sachin',
  'Surat',
  'Gujarat',
  '394230',
  'State Bank of India',
  'Jaydeep Indian Gas Agency',
  '123456789012',
  'SBIN0001234',
  'Sachin GIDC Branch',
  'jaydeepgas@upi',
  'JIG',
  'EB',
  '1. Goods once sold will not be taken back.' || E'\\n' || '2. Gas cylinders must be stored upright in a well-ventilated area away from heat sources.' || E'\\n' || '3. Check cylinder seal and weight at the time of delivery.' || E'\\n' || '4. Subject to Surat jurisdiction only.',
  'Thank you for your business! For emergency leak support, contact helpline immediately.',
  'Authorized Signatory',
  'Admin'
WHERE NOT EXISTS (SELECT 1 FROM public.agency_settings);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSetupScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="page">
      {/* Header Banner */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title">⚙️ Agency & Invoice Settings</h1>
            {agencySettingsMeta?.syncedWithSupabase ? (
              <span className="badge badge-success" title="Settings are synced to Supabase database">
                🟢 Database Connected
              </span>
            ) : (
              <span className="badge badge-warning" title="Saved locally in browser. Sync with Supabase available via SQL script.">
                💾 Browser Storage Mode
              </span>
            )}
          </div>
          <p className="page-subtitle">
            Configure your Agency Name, Company details, GST numbers, contact addresses, bank info, and bill formats. All changes reflect live in invoices, customer bills, and exports.
          </p>
        </div>

        <div className="btn-group">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowSqlModal(true)}
            title="View or copy Supabase SQL script"
          >
            📋 Database SQL
          </button>
          {canEdit && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowResetModal(true)}
            >
              ↺ Reset Defaults
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={isSaving}
              onClick={handleSave}
            >
              {isSaving ? '⏳ Saving...' : '💾 Save Settings'}
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccess && (
        <div style={{
          padding: '12px 18px',
          background: 'var(--success-bg)',
          color: '#14532d',
          border: '1px solid #86efac',
          borderRadius: 10,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.88rem',
          fontWeight: 600,
          animation: 'fadeIn 0.3s ease'
        }}>
          <span>✅ {saveMessage || 'Agency settings updated successfully!'}</span>
          <button
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#14532d' }}
            onClick={() => setSaveSuccess(false)}
          >
            ×
          </button>
        </div>
      )}

      {!canEdit && (
        <div style={{
          padding: '12px 18px',
          background: 'rgba(234, 88, 12, 0.08)',
          border: '1px solid rgba(234, 88, 12, 0.25)',
          borderRadius: 10,
          marginBottom: 20,
          fontSize: '0.85rem',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <span>🔒</span>
          <span>You have view-only access to Agency Settings. Only administrators can save modifications.</span>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid var(--border)',
        marginBottom: 24,
        overflowX: 'auto',
        paddingBottom: 2
      }}>
        {[
          { id: 'profile', icon: '🏢', label: 'Agency & GST Profile' },
          { id: 'contact', icon: '📍', label: 'Contact & Location' },
          { id: 'bank', icon: '🏦', label: 'Bank & UPI Accounts' },
          { id: 'invoice', icon: '🧾', label: 'Bills & Invoice Rules' },
          { id: 'preview', icon: '👁️', label: 'Live Bill Preview' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: activeTab === tab.id ? 'var(--accent-light)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              borderRadius: '8px 8px 0 0',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.88rem',
              transition: 'var(--transition)'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Agency & GST Profile */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">🏢 Agency Identity</span>
            </div>
            <div className="card-body">
              <div className="form-group mb-16">
                <label className="form-label">Agency Name (Trading / Display Name) *</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!canEdit}
                  value={formData.agencyName || ''}
                  onChange={e => handleChange('agencyName', e.target.value)}
                  placeholder="e.g. Jaydeep Indian Gas Agency"
                />
                <small className="text-muted" style={{ display: 'block', marginTop: 4, fontSize: '0.75rem' }}>
                  Shown prominently in header of invoices, receipts, and website dashboard.
                </small>
              </div>

              <div className="form-group mb-16">
                <label className="form-label">Company Legal / Entity Name</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!canEdit}
                  value={formData.companyName || ''}
                  onChange={e => handleChange('companyName', e.target.value)}
                  placeholder="e.g. Jaydeep Indian Gas Agency Pvt Ltd"
                />
                <small className="text-muted" style={{ display: 'block', marginTop: 4, fontSize: '0.75rem' }}>
                  Your registered parent firm or legal company name for official GST filings.
                </small>
              </div>

              <div className="form-group mb-16">
                <label className="form-label">Tagline / Distributor Subtitle</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!canEdit}
                  value={formData.tagline || ''}
                  onChange={e => handleChange('tagline', e.target.value)}
                  placeholder="e.g. Authorized Indane LPG Distributor"
                />
                <small className="text-muted" style={{ display: 'block', marginTop: 4, fontSize: '0.75rem' }}>
                  Sub-header displayed below the agency title on all bills.
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Authorized Signatory Designation</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!canEdit}
                  value={formData.signatoryTitle || ''}
                  onChange={e => handleChange('signatoryTitle', e.target.value)}
                  placeholder="e.g. Authorized Signatory / Manager"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">📜 Tax & Statutory Numbers</span>
            </div>
            <div className="card-body">
              <div className="form-group mb-16">
                <label className="form-label">GSTIN / GST Number *</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!canEdit}
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}
                  value={formData.gstin || ''}
                  onChange={e => handleChange('gstin', e.target.value.toUpperCase())}
                  placeholder="e.g. 24ABCDE1234F1Z5"
                  maxLength={15}
                />
                <small className="text-muted" style={{ display: 'block', marginTop: 4, fontSize: '0.75rem' }}>
                  15-digit GST Identification Number mandatory for tax invoices.
                </small>
              </div>

              <div className="form-group mb-16">
                <label className="form-label">PAN Number</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!canEdit}
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}
                  value={formData.panNumber || ''}
                  onChange={e => handleChange('panNumber', e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE1234F"
                  maxLength={10}
                />
                <small className="text-muted" style={{ display: 'block', marginTop: 4, fontSize: '0.75rem' }}>
                  10-character Permanent Account Number.
                </small>
              </div>

              <div style={{
                background: 'var(--bg-primary)',
                padding: 16,
                borderRadius: 10,
                border: '1px solid var(--border)',
                marginTop: 20
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  💡 Live Preview in Bills:
                </div>
                <div style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
                  <div><strong>Trade Name:</strong> {formData.agencyName || '—'}</div>
                  <div><strong>Legal Entity:</strong> {formData.companyName || '—'}</div>
                  <div><strong>GSTIN:</strong> <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{formData.gstin || '—'}</span></div>
                  <div><strong>PAN:</strong> {formData.panNumber || '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Contact & Location */}
      {activeTab === 'contact' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">📞 Telecommunications & Web</span>
            </div>
            <div className="card-body">
              <div className="form-group mb-16">
                <label className="form-label">Primary Contact Number *</label>
                <input
                  type="tel"
                  className="form-control"
                  disabled={!canEdit}
                  value={formData.phone || ''}
                  onChange={e => handleChange('phone', e.target.value)}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div className="form-group mb-16">
                <label className="form-label">Secondary / Helpline Number</label>
                <input
                  type="tel"
                  className="form-control"
                  disabled={!canEdit}
                  value={formData.alternatePhone || ''}
                  onChange={e => handleChange('alternatePhone', e.target.value)}
                  placeholder="e.g. 9876543211 or 1800-2333-555"
                />
              </div>

              <div className="form-group mb-16">
                <label className="form-label">Official Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  disabled={!canEdit}
                  value={formData.email || ''}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="e.g. jaydeepindian01@gmail.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Website URL (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!canEdit}
                  value={formData.website || ''}
                  onChange={e => handleChange('website', e.target.value)}
                  placeholder="e.g. https://jaydeepindiangas.com"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">📍 Agency Physical Address</span>
            </div>
            <div className="card-body">
              <div className="form-group mb-16">
                <label className="form-label">Street / Premises Address</label>
                <textarea
                  className="form-control"
                  rows={2}
                  disabled={!canEdit}
                  value={formData.address || ''}
                  onChange={e => handleChange('address', e.target.value)}
                  placeholder="e.g. Plot No. 12, GIDC Industrial Estate, Sachin"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="mb-16">
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    className="form-control"
                    disabled={!canEdit}
                    value={formData.city || ''}
                    onChange={e => handleChange('city', e.target.value)}
                    placeholder="e.g. Surat"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State *</label>
                  <input
                    type="text"
                    className="form-control"
                    disabled={!canEdit}
                    value={formData.state || ''}
                    onChange={e => handleChange('state', e.target.value)}
                    placeholder="e.g. Gujarat"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">PIN / Postal Code</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!canEdit}
                  value={formData.pincode || ''}
                  onChange={e => handleChange('pincode', e.target.value)}
                  placeholder="e.g. 394230"
                  maxLength={6}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Bank & UPI Accounts */}
      {activeTab === 'bank' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">🏦 Bank Settlement Account</span>
            </div>
            <div className="card-body">
              <div className="form-group mb-16">
                <label className="form-label">Bank Name</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!canEdit}
                  value={formData.bankName || ''}
                  onChange={e => handleChange('bankName', e.target.value)}
                  placeholder="e.g. State Bank of India"
                />
              </div>

              <div className="form-group mb-16">
                <label className="form-label">Account Holder Name</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!canEdit}
                  value={formData.accountHolder || ''}
                  onChange={e => handleChange('accountHolder', e.target.value)}
                  placeholder="e.g. Jaydeep Indian Gas Agency"
                />
              </div>

              <div className="form-group mb-16">
                <label className="form-label">Bank Account Number</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!canEdit}
                  style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}
                  value={formData.accountNumber || ''}
                  onChange={e => handleChange('accountNumber', e.target.value)}
                  placeholder="e.g. 123456789012"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">IFSC Code</label>
                  <input
                    type="text"
                    className="form-control"
                    disabled={!canEdit}
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                    value={formData.ifscCode || ''}
                    onChange={e => handleChange('ifscCode', e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Branch Name</label>
                  <input
                    type="text"
                    className="form-control"
                    disabled={!canEdit}
                    value={formData.branch || ''}
                    onChange={e => handleChange('branch', e.target.value)}
                    placeholder="e.g. Sachin GIDC"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">📱 UPI Payment Details</span>
            </div>
            <div className="card-body">
              <div className="form-group mb-16">
                <label className="form-label">UPI ID / VPA</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!canEdit}
                  style={{ fontFamily: 'monospace', fontWeight: 600 }}
                  value={formData.upiId || ''}
                  onChange={e => handleChange('upiId', e.target.value.toLowerCase())}
                  placeholder="e.g. jaydeepgas@upi or jaydeep@okhdfcbank"
                />
                <small className="text-muted" style={{ display: 'block', marginTop: 4, fontSize: '0.75rem' }}>
                  Printed on bills so commercial customers and delivery staff can easily collect payments via GPay, PhonePe, or Paytm.
                </small>
              </div>

              <div style={{
                background: 'var(--bg-primary)',
                padding: 16,
                borderRadius: 10,
                border: '1px solid var(--border)',
                marginTop: 24
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  💳 Bill Footer Payment Box Sample:
                </div>
                <div style={{ fontSize: '0.8rem', background: '#fff', padding: 12, borderRadius: 8, border: '1px dashed var(--border)' }}>
                  <div><strong>Bank:</strong> {formData.bankName || 'State Bank of India'}</div>
                  <div><strong>A/C:</strong> {formData.accountNumber || '123456789012'}</div>
                  <div><strong>IFSC:</strong> {formData.ifscCode || 'SBIN0001234'}</div>
                  <div style={{ marginTop: 6, color: 'var(--accent)', fontWeight: 700 }}>
                    ⚡ UPI: {formData.upiId || 'jaydeepgas@upi'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Bills & Invoice Rules */}
      {activeTab === 'invoice' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">🔢 Invoice Numbering & Prefixes</span>
            </div>
            <div className="card-body">
              <div className="form-group mb-16">
                <label className="form-label">Refill Tax Invoice Prefix</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!canEdit}
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}
                  value={formData.invoicePrefix || ''}
                  onChange={e => handleChange('invoicePrefix', e.target.value.toUpperCase())}
                  placeholder="e.g. JIG"
                  maxLength={8}
                />
                <small className="text-muted" style={{ display: 'block', marginTop: 4, fontSize: '0.75rem' }}>
                  Generated sequence format: <strong>{formData.invoicePrefix || 'JIG'}-{new Date().getFullYear()}-001</strong>
                </small>
              </div>

              <div className="form-group mb-16">
                <label className="form-label">Empty Bottle Receipt Prefix</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!canEdit}
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}
                  value={formData.emptyBottlePrefix || ''}
                  onChange={e => handleChange('emptyBottlePrefix', e.target.value.toUpperCase())}
                  placeholder="e.g. EB"
                  maxLength={8}
                />
                <small className="text-muted" style={{ display: 'block', marginTop: 4, fontSize: '0.75rem' }}>
                  Generated sequence format: <strong>{formData.emptyBottlePrefix || 'EB'}-{new Date().getFullYear()}-001</strong>
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Invoice Footer Thank You Note</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!canEdit}
                  value={formData.invoiceFooterNote || ''}
                  onChange={e => handleChange('invoiceFooterNote', e.target.value)}
                  placeholder="e.g. Thank you for your business! For safety guidelines call emergency helpline."
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">⚖️ Terms & Conditions on Bills</span>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Terms & Conditions (Printed on PDF and Bills)</label>
                <textarea
                  className="form-control"
                  rows={8}
                  disabled={!canEdit}
                  style={{ fontSize: '0.82rem', lineHeight: 1.5 }}
                  value={formData.invoiceTerms || ''}
                  onChange={e => handleChange('invoiceTerms', e.target.value)}
                  placeholder="Enter invoice terms line by line..."
                />
                <small className="text-muted" style={{ display: 'block', marginTop: 4, fontSize: '0.75rem' }}>
                  Each line appears formatted in the footer of customer statements and PDF invoices.
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Live Bill Preview */}
      {activeTab === 'preview' && (
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              📄 Interactive Bill / Invoice Preview
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className={`btn btn-sm ${previewType === 'Standard' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPreviewType('Standard')}
              >
                Standard Tax Invoice
              </button>
              <button
                type="button"
                className={`btn btn-sm ${previewType === 'Empty Bottle' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPreviewType('Empty Bottle')}
              >
                Empty Bottle Receipt
              </button>
            </div>
          </div>

          {/* Actual Bill Mockup */}
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            padding: 30,
            color: '#0f172a',
            fontFamily: 'Inter, sans-serif'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '2px solid #e2e8f0',
              paddingBottom: 20,
              marginBottom: 20
            }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ea580c', letterSpacing: '-0.5px' }}>
                  🔥 {(formData.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()}
                </div>
                {formData.companyName && formData.companyName !== formData.agencyName && (
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginTop: 2 }}>
                    {formData.companyName}
                  </div>
                )}
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 2 }}>
                  {formData.tagline || 'Authorized Indane LPG Distributor'} | {formData.city || 'Surat'}, {formData.state || 'Gujarat'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 4 }}>
                  <span>📞 Phone: {formData.phone || '9876543210'}</span>
                  {formData.alternatePhone && <span> / {formData.alternatePhone}</span>}
                  {formData.email && <span> | ✉️ {formData.email}</span>}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                  <span>GSTIN: <span style={{ color: '#ea580c' }}>{formData.gstin || '24ABCDE1234F1Z5'}</span></span>
                  {formData.panNumber && <span> | PAN: {formData.panNumber}</span>}
                </div>
                {formData.address && (
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                    📍 {formData.address}, {formData.city} - {formData.pincode}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{
                  display: 'inline-block',
                  background: previewType === 'Empty Bottle' ? '#3b82f6' : '#ea580c',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: 6,
                  letterSpacing: '0.5px',
                  marginBottom: 8
                }}>
                  {previewType === 'Empty Bottle' ? 'EMPTY BOTTLE RECEIPT' : 'TAX INVOICE'}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  {previewType === 'Empty Bottle' ? `${formData.emptyBottlePrefix || 'EB'}-2026-042` : `${formData.invoicePrefix || 'JIG'}-2026-108`}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                  📅 Date: {new Date().toISOString().slice(0, 10)}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  💳 Mode: Cash / UPI
                </div>
              </div>
            </div>

            {/* Bill To Info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 20,
              padding: 14,
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              marginBottom: 20,
              fontSize: '0.82rem'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#475569', marginBottom: 4 }}>👤 Bill To (Customer):</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>HOTEL KRISHNA PLAZA</div>
                <div style={{ color: '#475569' }}>Phone: +91 98251 12345</div>
                <div style={{ color: '#64748b' }}>Ring Road, Surat, Gujarat</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#475569', marginBottom: 4 }}>📦 Delivery & Order Details:</div>
                <div>Status: <span style={{ color: '#16a34a', fontWeight: 700 }}>✅ Delivered</span></div>
                <div>Payment: <span style={{ color: '#16a34a', fontWeight: 700 }}>💰 Paid</span></div>
              </div>
            </div>

            {/* Items Table Mockup */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', borderRadius: '6px 0 0 0' }}>Cylinder Type</th>
                  <th style={{ padding: '8px 12px' }}>{previewType === 'Empty Bottle' ? 'Empty Collected' : 'Quantity'}</th>
                  <th style={{ padding: '8px 12px' }}>Unit Rate (₹)</th>
                  <th style={{ padding: '8px 12px' }}>Total (₹)</th>
                  <th style={{ padding: '8px 12px', borderRadius: '0 6px 0 0' }}>Bottle Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>19kg Commercial</td>
                  <td style={{ padding: '10px 12px' }}>{previewType === 'Empty Bottle' ? '5 bottles' : '5'}</td>
                  <td style={{ padding: '10px 12px' }}>{previewType === 'Empty Bottle' ? '₹0' : '₹1,000'}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#ea580c' }}>
                    {previewType === 'Empty Bottle' ? '₹0' : '₹5,000'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ background: '#dcfce7', color: '#16a34a', padding: '3px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                      ✅ 5 Empty Collected
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Totals & Bank block */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Bank details card */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: 12,
                fontSize: '0.78rem'
              }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  🏦 Bank & Payment Transfer Details:
                </div>
                <div><strong>Bank Name:</strong> {formData.bankName || 'State Bank of India'}</div>
                <div><strong>A/C No:</strong> {formData.accountNumber || '123456789012'}</div>
                <div><strong>IFSC:</strong> {formData.ifscCode || 'SBIN0001234'} ({formData.branch || 'Main Branch'})</div>
                <div style={{ marginTop: 4, color: '#ea580c', fontWeight: 700 }}>
                  ⚡ UPI ID: {formData.upiId || 'jaydeepgas@upi'}
                </div>
              </div>

              {/* Totals Box */}
              <div style={{
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: 8,
                padding: 14,
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>Total Amount:</span>
                  <strong style={{ fontSize: '1rem', color: '#ea580c' }}>
                    {previewType === 'Empty Bottle' ? '₹0' : '₹5,000'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', marginBottom: 6 }}>
                  <span>Amount Paid:</span>
                  <strong>{previewType === 'Empty Bottle' ? '₹0' : '₹5,000'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #fed7aa', paddingTop: 6 }}>
                  <span>Balance Due:</span>
                  <strong>₹0</strong>
                </div>
              </div>
            </div>

            {/* Terms & Signature */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr',
              gap: 20,
              borderTop: '1px dashed #cbd5e1',
              paddingTop: 16,
              alignItems: 'end'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', marginBottom: 4 }}>
                  TERMS & CONDITIONS:
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                  {formData.invoiceTerms || '1. Goods once sold will not be taken back.\n2. Handle cylinders with proper safety.'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#ea580c', fontStyle: 'italic', marginTop: 8 }}>
                  💬 {formData.invoiceFooterNote || 'Thank you for your business!'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                  For {(formData.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()}
                </div>
                <div style={{ marginTop: 35, borderTop: '1px solid #94a3b8', display: 'inline-block', width: 170, paddingTop: 4, fontSize: '0.75rem', color: '#64748b' }}>
                  {formData.signatoryTitle || 'Authorized Signatory'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button Floating bar if not on preview tab */}
      {activeTab !== 'preview' && canEdit && (
        <div style={{
          marginTop: 24,
          padding: '16px 20px',
          background: 'var(--bg-card)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow)'
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Ready to save your configurations?</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Updates apply instantly to all newly printed bills, invoices, and PDF/Excel downloads.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setActiveTab('preview')}
            >
              👁️ Preview Bill First
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isSaving}
              onClick={handleSave}
            >
              {isSaving ? '⏳ Saving...' : '💾 Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Database SQL Setup Modal */}
      {showSqlModal && (
        <div className="modal-overlay" onClick={() => setShowSqlModal(false)}>
          <div className="modal" style={{ maxWidth: 650 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">📋 Supabase Database SQL Setup</span>
              <button className="modal-close" onClick={() => setShowSqlModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                Run this SQL query in your <strong>Supabase Dashboard → SQL Editor</strong> to create the <code>agency_settings</code> table and ensure your settings sync across all staff devices in real time.
              </p>
              <div style={{ position: 'relative' }}>
                <pre style={{
                  background: '#0f172a',
                  color: '#e2e8f0',
                  padding: '14px',
                  borderRadius: 8,
                  fontSize: '0.75rem',
                  maxHeight: 280,
                  overflowY: 'auto',
                  lineHeight: 1.4
                }}>
                  {sqlSetupScript}
                </pre>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ position: 'absolute', top: 10, right: 10 }}
                  onClick={copySql}
                >
                  {copiedSql ? '✓ Copied!' : '📋 Copy SQL'}
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSqlModal(false)}>Close</button>
              <button className="btn btn-primary" onClick={copySql}>
                {copiedSql ? '✓ Copied to Clipboard' : '📋 Copy Entire Script'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">↺ Reset to Default Agency Settings</span>
              <button className="modal-close" onClick={() => setShowResetModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to restore all agency details, bank accounts, and GST numbers to default values?</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                Any customized trade names, prefixes, or phone numbers will be replaced with standard presets.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowResetModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReset}>Yes, Reset to Defaults</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
