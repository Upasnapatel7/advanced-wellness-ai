import React, { useState } from 'react';
import { registerUser } from '../../services/auth';

const Register = ({ onRegister, switchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Removed unused 't' variable

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    const result = await registerUser(formData.email, formData.password, {
      name: formData.name,
      createdAt: new Date(),
      streak: 0,
      totalPoints: 0,
      preferredLanguage: 'en'
    });
    
    if (result.success) {
      onRegister(result.user);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div style={styles.authContainer}>
      <h2>Create Account</h2>
      <p>Join your wellness journey</p>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Full Name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          style={styles.input}
          required
        />
        <input
          type="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Password (min. 6 characters)"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
          style={styles.input}
          required
        />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      
      {error && <p style={styles.error}>{error}</p>}
      
      <p style={styles.switchText}>
        Already have an account? 
        <button onClick={switchToLogin} style={styles.switchButton}>
          Sign In
        </button>
      </p>
    </div>
  );
};

const styles = {
  authContainer: {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '30px',
    background: 'white',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginTop: '20px'
  },
  input: {
    padding: '15px',
    border: '2px solid #e9ecef',
    borderRadius: '10px',
    fontSize: '16px',
    outline: 'none'
  },
  button: {
    padding: '15px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  error: {
    color: '#e74c3c',
    margin: '15px 0',
    padding: '10px',
    background: '#ffeaea',
    borderRadius: '5px'
  },
  switchText: {
    marginTop: '20px',
    color: '#666'
  },
  switchButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    cursor: 'pointer',
    textDecoration: 'underline',
    marginLeft: '5px'
  }
};

export default Register;