'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/common/Toast';
import { COUNTRY_CODES } from '@/types';

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { showToast } = useToast();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return showToast('Please enter your phone number', 'error');
    setStep(2);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return showToast('Please enter the OTP', 'error');
    setLoading(true);
    try {
      const fullPhone = `${countryCode}${phone}`;
      const res = await api.post('/api/auth/login', {
        phone_number: fullPhone,
        otp,
      });
      setAuth(res.data.user, res.data.access_token);
      router.push('/');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div style={{ width: 400, padding: 32, backgroundColor: 'var(--bg-secondary)', borderRadius: 12, boxShadow: 'var(--shadow-md)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>Welcome to Signal</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, textAlign: 'center' }}>
          {step === 1 ? 'Enter your phone number to get started' : 'Enter the code sent to your phone'}
        </p>

        {step === 1 ? (
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
              Don't have an account? <span onClick={() => router.push('/register')} style={{ color: 'var(--accent)', cursor: 'pointer' }}>Register</span>
            </p>
          </form>
        ) : (
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
              disabled={loading}
              style={{ padding: '12px', backgroundColor: 'var(--accent)', color: '#fff', borderRadius: 8, fontWeight: 500, marginTop: 8, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
              <span onClick={() => setStep(1)} style={{ color: 'var(--accent)', cursor: 'pointer' }}>Back to Phone Number</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
