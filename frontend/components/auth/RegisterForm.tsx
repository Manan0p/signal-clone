'use client';
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/common/Toast';
import { COUNTRY_CODES, SIGNAL_AVATAR_COLORS } from '@/types';

export function RegisterForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { showToast } = useToast();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarColor, setAvatarColor] = useState(SIGNAL_AVATAR_COLORS[0]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image must be less than 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return showToast('Please enter your phone number', 'error');
    setStep(2);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return showToast('Please enter the OTP', 'error');
    setStep(3);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !displayName) return showToast('Please fill out all fields', 'error');
    
    setLoading(true);
    try {
      const fullPhone = `${countryCode}${phone}`;
      const res = await api.post('/api/auth/register', {
        phone_number: fullPhone,
        otp,
        username,
        display_name: displayName,
        avatar_color: avatarColor,
        avatar_url: avatarUrl,
      });
      setAuth(res.data.user, res.data.access_token);
      router.push('/');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div style={{ width: 400, padding: 32, backgroundColor: 'var(--bg-secondary)', borderRadius: 12, boxShadow: 'var(--shadow-md)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>Create Account</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, textAlign: 'center' }}>
          {step === 1 && 'Enter your phone number to get started'}
          {step === 2 && 'Enter the code sent to your phone'}
          {step === 3 && 'Set up your profile'}
        </p>

        {step === 1 && (
          <form onSubmit={handlePhoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                style={{
                  padding: '12px 8px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  width: 120,
                  fontSize: 15
                }}
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.name + c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
              <input
                type="tel"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ flex: 1, padding: '12px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 15 }}
                autoFocus
              />
            </div>
            <button
              type="submit"
              style={{ padding: '12px', backgroundColor: 'var(--accent)', color: '#fff', borderRadius: 8, fontWeight: 500, marginTop: 8 }}
            >
              Continue
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
              Already have an account? <span onClick={() => router.push('/login')} style={{ color: 'var(--accent)', cursor: 'pointer' }}>Log In</span>
            </p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             <input
                type="text"
                placeholder="Enter OTP (123456)"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{ padding: '12px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 15, textAlign: 'center', letterSpacing: 4 }}
                autoFocus
              />
            <button
              type="submit"
              style={{ padding: '12px', backgroundColor: 'var(--accent)', color: '#fff', borderRadius: 8, fontWeight: 500, marginTop: 8 }}
            >
              Verify
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
              <span onClick={() => setStep(1)} style={{ color: 'var(--accent)', cursor: 'pointer' }}>Back to Phone Number</span>
            </p>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange} 
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 600, color: '#fff', cursor: 'pointer', overflow: 'hidden', position: 'relative', marginBottom: 8 }}
                  title="Click to upload an avatar"
                >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : displayName ? (
                      displayName.charAt(0).toUpperCase()
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}>
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    )}
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Click circle to upload photo</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Theme Color</span>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {SIGNAL_AVATAR_COLORS.map(color => (
                      <div 
                          key={color}
                          onClick={() => setAvatarColor(color)}
                          style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: color, cursor: 'pointer', border: avatarColor === color ? '2px solid var(--text-primary)' : '2px solid transparent' }}
                      />
                  ))}
              </div>
            </div>

            <input
              type="text"
              placeholder="Username (e.g. alice)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ padding: '12px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 15 }}
            />
            <input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{ padding: '12px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 15 }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '12px', backgroundColor: 'var(--accent)', color: '#fff', borderRadius: 8, fontWeight: 500, marginTop: 8, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating...' : 'Finish'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
              <span onClick={() => setStep(2)} style={{ color: 'var(--accent)', cursor: 'pointer' }}>Back to OTP</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
