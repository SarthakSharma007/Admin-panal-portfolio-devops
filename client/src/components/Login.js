import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { theme } = useContext(ThemeContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const response = await api.post('/auth/login', { email, password });
            
            if (response.data && response.data.success && response.data.token) {
                localStorage.setItem('token', response.data.token);
                navigate('/admin');
            } else {
                setError(response.data.message || 'Access Denied');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Unauthorized Access');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`login-ultimate-wrapper ${theme}`}>
            {/* Simple Animated Dark Background */}
            <div className="pure-dark-bg">
                {/* Floating ambient orbs */}
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={`orb-${i}`}
                        className="ambient-orb"
                        animate={{
                            x: [Math.random() * 100 + "vw", Math.random() * 100 + "vw", Math.random() * 100 + "vw"],
                            y: [Math.random() * 100 + "vh", Math.random() * 100 + "vh", Math.random() * 100 + "vh"],
                            scale: [1, 1.5, 1],
                            opacity: [0.1, 0.3, 0.1]
                        }}
                        transition={{
                            duration: Math.random() * 20 + 20,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />
                ))}
            </div>

            {/* Ultimate Glassmorphic Login Card */}
            <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="login-ultimate-card"
            >
                <div className="card-header">
                    <h2>ADMINISTRATOR LOGIN</h2>
                </div>

                <form onSubmit={handleSubmit} className="ultimate-form">
                    <div className="input-group">
                        <label>Email-ID</label>
                        <input
                            type="email"
                            placeholder="xyz@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="error-msg"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button type="submit" className="ultimate-btn" disabled={loading}>
                        {loading ? (
                            <span className="button-loader">
                                <span className="spinner"></span>
                                Logging in...
                            </span>
                        ) : 'Login'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
