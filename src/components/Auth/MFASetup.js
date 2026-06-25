import React, { useState, useEffect } from 'react';
import { setupMFA, verifyMFA } from '../../services/auth';
import { useLanguage } from '../../contexts/LanguageContext';

const MFASetup = ({ user, onComplete, onSkip }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('input'); // 'input', 'verify', 'success'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    // Initialize reCAPTCHA
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });
  }, []);

  const handleSetupMFA = async () => {
    setLoading(true);
    setError('');
    
    const result = await setupMFA(user, phoneNumber);
    
    if (result.success) {
      setStep('verify');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleVerifyMFA = async () => {
    setLoading(true);
    setError('');
    
    const result = await verifyMFA(user, verificationCode);
    
    if (result.success) {
      setStep('success');
      setTimeout(() => onComplete(), 2000);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div style={styles.mfaContainer}>
      <h3>🔒 Enable Two-Factor Authentication</h3>
      <p>Add an extra layer of security to your account</p>

      {step === 'input' && (
        <div style={styles.stepContainer}>
          <input
            type="tel"
            placeholder="+1 234 567 8900"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            style={styles.input}
          />
          <button 
            onClick={handleSetupMFA} 
            disabled={loading || !phoneNumber}
            style={styles.button}
          >
            {loading ? 'Sending code...' : 'Send Verification Code'}
          </button>
          <button onClick={onSkip} style={styles.skipButton}>
            Skip for now
          </button>
        </div>
      )}

      {step === 'verify' && (
        <div style={styles.stepContainer}>
          <p>Enter the 6-digit code sent to {phoneNumber}</p>
          <input
            type="text"
            placeholder="123456"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            style={styles.input}
            maxLength={6}
          />
          <button 
            onClick={handleVerifyMFA} 
            disabled={loading || verificationCode.length !== 6}
            style={styles.button}
          >
            {loading ? 'Verifying...' : 'Verify & Enable MFA'}
          </button>
        </div>
      )}

      {step === 'success' && (
        <div style={styles.successContainer}>
          <div style={styles.successIcon}>✅</div>
          <h4>Two-Factor Authentication Enabled!</h4>
          <p>Your account is now more secure</p>
        </div>
      )}

      {error && <p style={styles.error}>{error}</p>}
      
      {/* reCAPTCHA container */}
      <div id="recaptcha-container"></div>
    </div>
  );
};

const styles = {
  mfaContainer: {
    background: 'white',
    padding: '30px',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: '400px',
    margin: '20px auto'
  },
  stepContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  input: {
    padding: '15px',
    border: '2px solid #e9ecef',
    borderRadius: '10px',
    fontSize: '16px',
    textAlign: 'center'
  },
  button: {
    padding: '15px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    cursor: 'pointer'
  },
  skipButton: {
    background: 'none',
    border: 'none',
    color: '#6c757d',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  successContainer: {
    textAlign: 'center',
    padding: '20px'
  },
  successIcon: {
    fontSize: '3em',
    marginBottom: '15px'
  },
  error: {
    color: 'red',
    marginTop: '15px'
  }
};

export default MFASetup;