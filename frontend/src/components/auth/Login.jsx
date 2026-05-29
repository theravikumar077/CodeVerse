import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import { KeyRound, Mail, Terminal, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Logo from '../common/Logo';

const Login = () => {
  const [formData, setFormData] = useState({ usernameOrEmail: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const { loading, error } = useSelector((state) => state.auth);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.usernameOrEmail || !formData.password) return;

    try {
      dispatch(loginStart());
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      if (response.data.success) {
        dispatch(loginSuccess({
          token: response.data.token,
          user: response.data.user,
        }));
        navigate('/');
      }
    } catch (err) {
      dispatch(loginFailure(err.response?.data?.message || 'Login failed. Please check credentials.'));
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-tr from-[#0b0c15] via-[#101224] to-[#1a1c36] font-vscode p-4 select-none relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] rounded-full bg-violet-600/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />

      {/* Glass Container */}
      <div className="w-full max-w-[420px] backdrop-blur-xl bg-[#141526]/60 border border-white/5 rounded-2xl shadow-2xl p-8 flex flex-col gap-6 relative z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo className="w-20 h-20 glow-purple" glow={true} />
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            <span className="text-purple-500">RR</span> CodeVerse
          </h2>
          <p className="text-xs text-gray-400">Log in to launch your premium workspace</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-200 text-xs px-3.5 py-2.5 rounded-lg">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username / Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">Username or Email</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 text-gray-500" size={16} />
              <input
                type="text"
                name="usernameOrEmail"
                value={formData.usernameOrEmail}
                onChange={handleChange}
                placeholder="developer@rr-codeverse.com"
                required
                className="w-full text-xs bg-[#0b0c15]/60 border border-white/5 focus:border-violet-500/80 px-10 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500/30 text-white placeholder-gray-600 transition-all font-sans"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">Password</label>
            </div>
            <div className="relative flex items-center">
              <KeyRound className="absolute left-3 text-gray-500" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full text-xs bg-[#0b0c15]/60 border border-white/5 focus:border-violet-500/80 px-10 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500/30 text-white placeholder-gray-600 transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 text-white font-semibold text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-violet-500/15 hover:shadow-violet-500/25 active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {loading ? 'Booting Environment...' : 'Log In'}
          </button>
        </form>

        {/* Footer link */}
        <div className="text-center text-xs text-gray-400 mt-2">
          New to the editor?{' '}
          <Link to="/register" className="text-violet-400 font-semibold hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
