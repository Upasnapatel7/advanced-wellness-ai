import React, { useState } from 'react';
import { loginUser } from '../../services/auth';


const Login = ({ onLogin, switchToRegister }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await loginUser(formData.email, formData.password);
    
    if (result.success) {
      onLogin(result.user);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div style={styles.authContainer}>
      <h2>Welcome Back</h2>
      <p>Sign in to continue your wellness journey</p>
      
      <form onSubmit={handleSubmit} style={styles.form}>
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
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          style={styles.input}
          required
        />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      
      {error && <p style={styles.error}>{error}</p>}
      
      <p style={styles.switchText}>
        Don't have an account? 
        <button onClick={switchToRegister} style={styles.switchButton}>
          Create Account
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

export default Login;