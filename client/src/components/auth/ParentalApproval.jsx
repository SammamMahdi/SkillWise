import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Mail, 
  User, 
  Shield, 
  Heart, 
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../common/ThemeToggle';
import bg from './evening-b2g.jpg';
import toast from 'react-hot-toast';

const ParentalApproval = () => {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [parentEmail, setParentEmail] = useState('');
  const [parentName, setParentName] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [error, setError] = useState('');

  // Check if user is 13 or older, redirect to dashboard if they are
  useEffect(() => {
    if (user && user.age >= 13) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Check if user already has a pending parent request or confirmed parent
  useEffect(() => {
    if (user) {
      if (user.parentConfirmed) {
        // Parent already confirmed, go to dashboard
        navigate('/dashboard');
      } else if (user.pendingParentRequests && user.pendingParentRequests.length > 0) {
        // Request already sent
        setRequestSent(true);
      }
    }
  }, [user, navigate]);

  const handleSubmitParentRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/parent/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          parentEmail: parentEmail.trim(),
          parentName: parentName.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setRequestSent(true);
        toast.success('Parent request sent successfully!');
      } else {
        setError(data.error || 'Failed to send parent request');
        toast.error(data.error || 'Failed to send parent request');
      }
    } catch (err) {
      console.error('Error sending parent request:', err);
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  if (requestSent) {
    return (
      <section
        className={`relative min-h-screen overflow-y-auto transition-all duration-500 ${
          theme === 'dark' ? 'auth-bg-dark' : 'auth-bg-light'
        }`}
        style={theme === 'dark' ? {
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        } : {}}
      >
        {/* Theme toggle */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle size="md" />
        </div>

        {/* Overlay */}
        <div className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-black/60 via-slate-900/45 to-blue-950/60'
            : 'bg-gradient-to-br from-white/20 via-white/10 to-transparent'
        }`} />

        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className={`w-full max-w-md rounded-2xl border backdrop-blur-xl shadow-2xl p-6 sm:p-10 transition-all duration-500 text-center ${
            theme === 'dark'
              ? 'border-white/15 bg-white/10 text-white'
              : 'border-slate-200/50 bg-white/90 text-slate-800'
          }`}>
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-blue-500/20 border border-blue-400/30">
                <Clock className="w-12 h-12 text-blue-400" />
              </div>
            </div>

            <h1 className={`text-2xl font-bold mb-4 transition-colors duration-500 ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}>Request Sent!</h1>

            <p className={`mb-6 leading-relaxed transition-colors duration-500 ${
              theme === 'dark' ? 'text-white/80' : 'text-slate-600'
            }`}>
              We've sent a parent approval request to <strong>{parentEmail}</strong>. 
              You'll be able to access SkillWise once a parent approves your account.
            </p>

            <div className={`p-4 rounded-lg border mb-6 transition-all duration-500 ${
              theme === 'dark' 
                ? 'bg-blue-500/10 border-blue-400/30 text-blue-300'
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4" />
                <span className="font-medium">What happens next?</span>
              </div>
              <ul className="text-sm text-left space-y-1">
                <li>• Your parent will receive an email invitation</li>
                <li>• They'll create a parent account on SkillWise</li>
                <li>• Once approved, you'll get full access</li>
              </ul>
            </div>

            <button
              onClick={handleLogout}
              className={`w-full px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                  : 'bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 shadow-md hover:shadow-lg'
              }`}
            >
              Sign Out
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`relative min-h-screen overflow-y-auto transition-all duration-500 ${
        theme === 'dark' ? 'auth-bg-dark' : 'auth-bg-light'
      }`}
      style={theme === 'dark' ? {
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      } : {}}
    >
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle size="md" />
      </div>

      {/* Overlay */}
      <div className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-black/60 via-slate-900/45 to-blue-950/60'
          : 'bg-gradient-to-br from-white/20 via-white/10 to-transparent'
      }`} />

      {/* Content grid */}
      <div className="relative z-10 min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 items-start lg:items-center py-10 sm:py-14">
        {/* LEFT: Branding and explanation */}
        <div className="lg:col-span-4 xl:col-span-5 flex items-start lg:items-center justify-center lg:justify-start text-center lg:text-left">
          <div className="px-8 sm:px-12 lg:pl-16 lg:pr-8">
            <div className="flex justify-center lg:justify-start mb-4">
              <div className="p-4 rounded-full bg-emerald-500/20 border border-emerald-400/30">
                <Shield className="w-12 h-12 text-emerald-400" />
              </div>
            </div>
            
            <h1
              className={`text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg transition-colors duration-500 ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", serif' }}
            >
              Parental Approval
            </h1>
            <p
              className={`mt-3 text-lg leading-relaxed transition-colors duration-500 ${
                theme === 'dark' ? 'text-white/85' : 'text-slate-700'
              }`}
            >
              We keep young learners safe by requiring parental approval for users under 13.
            </p>
            
            <div className={`mt-6 p-4 rounded-lg border transition-all duration-500 ${
              theme === 'dark' 
                ? 'bg-white/5 border-white/10 text-white/80'
                : 'bg-white/70 border-slate-200 text-slate-600'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-pink-400" />
                <span className="font-medium">Why we do this:</span>
              </div>
              <ul className="text-sm space-y-1 text-left">
                <li>• Comply with COPPA regulations</li>
                <li>• Ensure child safety online</li>
                <li>• Give parents control and visibility</li>
                <li>• Create a trusted learning environment</li>
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT: Parent request form */}
        <div className="lg:col-span-7 xl:col-span-6 lg:col-start-7 xl:col-start-8 flex justify-center lg:justify-end px-4 sm:px-8 lg:pl-8 lg:pr-24">
          <div className="w-full pb-8 mx-auto lg:ml-auto max-w-sm sm:max-w-md">
            <form
              onSubmit={handleSubmitParentRequest}
              className={`w-full max-w-sm sm:max-w-md md:max-w-lg min-h-[500px] rounded-2xl border backdrop-blur-xl shadow-2xl p-6 sm:p-10 overflow-hidden transition-all duration-500 ${
                theme === 'dark'
                  ? 'border-white/15 bg-white/10 text-white'
                  : 'border-slate-200/50 bg-white/90 text-slate-800'
              }`}
            >
              <div className="text-center mb-6">
                <Users className={`w-12 h-12 mx-auto mb-4 transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-700'
                }`} />
                <h2 className={`text-2xl font-semibold transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>Add a Parent</h2>
                <p className={`mt-2 text-sm transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white/80' : 'text-slate-600'
                }`}>
                  Hi {user?.name}! Since you're under 13, we need a parent or guardian to approve your SkillWise account.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-500 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-700'
                  }`}>
                    Parent's Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none border transition-all duration-300 ${
                        theme === 'dark'
                          ? 'bg-white/10 border-white/20 focus:border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-violet-300/70'
                          : 'bg-white/80 border-slate-200 focus:border-slate-400 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-violet-500/50'
                      }`}
                      placeholder="Mom, Dad, Guardian..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-500 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-700'
                  }`}>
                    Parent's Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none border transition-all duration-300 ${
                        theme === 'dark'
                          ? 'bg-white/10 border-white/20 focus:border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-violet-300/70'
                          : 'bg-white/80 border-slate-200 focus:border-slate-400 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-violet-500/50'
                      }`}
                      placeholder="parent@example.com"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className={`mt-4 p-3 rounded-lg border transition-all duration-500 ${
                  theme === 'dark'
                    ? 'bg-red-500/10 border-red-400/30 text-red-300'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !parentName.trim() || !parentEmail.trim()}
                className={`mt-6 w-full py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  theme === 'dark'
                    ? 'bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    Send Parent Request
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className={`mt-6 text-xs text-center transition-colors duration-500 ${
                theme === 'dark' ? 'text-white/70' : 'text-slate-500'
              }`}>
                Your parent will receive an email to create their account and approve yours.
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className={`mt-4 w-full py-2 text-sm rounded-lg font-medium transition-all duration-300 ${
                  theme === 'dark'
                    ? 'text-white/70 hover:text-white hover:bg-white/5'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                Sign Out Instead
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ParentalApproval;
