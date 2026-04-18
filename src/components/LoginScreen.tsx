import { useState, useMemo, useLayoutEffect } from 'react';
import type { UserRole, UserProfile } from '@/types';
import { Shield, Briefcase, Code, Users, ArrowLeft, Loader, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { peekResumeRoleSnapshot, consumeResumeRoleFlag, saveDemoGateEmail } from '@/lib/loginSession';

interface Props {
  onLogin: (user: UserProfile) => void;
}

const roleCards: { role: UserRole; label: string; labelJa: string; desc: string; icon: typeof Shield; color: string }[] = [
  { role: 'administrator', label: 'Administrator', labelJa: '管理者', desc: 'Monitor all projects across every PM. Global dashboard and full access.', icon: Shield, color: 'from-red-600 to-red-800' },
  { role: 'pm', label: 'Project Manager', labelJa: 'プロジェクトマネージャー', desc: 'Manage your own projects, create tasks, assign developers to work.', icon: Briefcase, color: 'from-brand-600 to-brand-800' },
  { role: 'developer', label: 'Developer', labelJa: '開発者', desc: 'Access tech stack, screen list, function list, and assigned tasks.', icon: Code, color: 'from-emerald-600 to-emerald-800' },
  { role: 'client', label: 'Client / Guest', labelJa: 'クライアント / ゲスト', desc: 'View all sheets, comment on task remarks only.', icon: Users, color: 'from-amber-600 to-amber-800' },
];

type Flow = 'signin' | 'signup' | 'team_role';

export function LoginScreen({ onLogin }: Props) {
  const [flow, setFlow] = useState<Flow>('signin');
  const [gateUser, setGateUser] = useState<UserProfile | null>(null);
  const [loginEmail, setLoginEmail] = useState(() => {
    const snap = peekResumeRoleSnapshot();
    return snap.goRole && snap.email ? snap.email : '';
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');

  useLayoutEffect(() => {
    const snap = peekResumeRoleSnapshot();
    if (snap.goRole && snap.email) {
      setTimeout(() => {
        setFlow('team_role');
        setLoginEmail(snap.email || '');
      }, 0);
    } else {
      consumeResumeRoleFlag();
    }
  }, []);

  const resetToSignin = () => {
    consumeResumeRoleFlag();
    setFlow('signin');
    setGateUser(null);
    setLoginEmail('');
    setLoginPassword('');
    setAuthError('');
  };

  const handleRoleSelect = (role: UserRole) => {
    if (!gateUser) return;
    consumeResumeRoleFlag();
    onLogin({ ...gateUser, role, accountKind: 'team' });
  };

  /** Real Supabase Authentication: Sign In */
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) return;
    setAuthenticating(true);
    setAuthError('');

    try {
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (authError || !user) {
        setAuthError(authError?.message || 'Failed to sign in.');
        setAuthenticating(false);
        return;
      }

      // Fetch Profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        setAuthError('Profile not found in database.');
        setAuthenticating(false);
        return;
      }

      setAuthenticating(false);
      saveDemoGateEmail(loginEmail);
      
      const profileData = profile as UserProfile;
      setGateUser(profileData);
      setFlow('team_role');
    } catch {
      setAuthError('An unexpected error occurred.');
      setAuthenticating(false);
    }
  };

  /** Real Supabase Authentication: Sign Up */
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (signupPassword !== signupConfirm) {
      setAuthError('Passwords do not match.');
      return;
    }
    setAuthenticating(true);

    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            full_name: signupName,
          }
        }
      });

      if (signUpError || !user) {
        setAuthError(signUpError?.message || 'Failed to create account.');
        setAuthenticating(false);
        return;
      }

      setAuthenticating(false);
      setAuthError('Account created! You can now sign in.');
      setFlow('signin');
    } catch {
      setAuthError('An unexpected error occurred during signup.');
      setAuthenticating(false);
    }
  };

  const availableRoles = useMemo(() => {
    if (flow !== 'team_role') return [];
    return roleCards;
  }, [flow]);

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">CyberConnect Platform</h1>
          </div>
          <p className="text-gray-400 text-lg">Bilingual Requirements & Task Management</p>
          <p className="text-gray-500 mt-1">バイリンガル要件・タスク管理プラットフォーム</p>
        </div>

        {flow === 'signin' && (
          <div className="animate-fade-in max-w-md mx-auto">
            <div className="bg-surface-900 border border-surface-700 rounded-3xl p-8 shadow-xl shadow-black/10">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-semibold text-white">Sign in</h2>
                <p className="text-gray-400 mt-2 text-sm">Welcome back to CyberConnect</p>
              </div>
              <form onSubmit={handleSignInSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    className="w-full bg-surface-800 border border-surface-700 rounded-2xl px-4 py-3 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full bg-surface-800 border border-surface-700 rounded-2xl px-4 py-3 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authenticating || !loginEmail.trim() || !loginPassword.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-white font-medium transition hover:bg-brand-500 disabled:opacity-50"
                >
                  {authenticating ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>
              {authError ? (
                <p className="text-center text-rose-400 text-sm mt-4">{authError}</p>
              ) : (
                <p className="text-center text-gray-600 text-xs mt-6 leading-relaxed">
                  Use your registered email and password to sign in.
                </p>
              )}
              <div className="mt-8 pt-6 border-t border-surface-800 text-center">
                <p className="text-sm text-gray-500">
                  New to the platform?{' '}
                  <button type="button" className="text-brand-400 hover:text-brand-300 font-medium" onClick={() => { setAuthError(''); setFlow('signup'); }}>
                    Create account
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {flow === 'signup' && (
          <div className="animate-fade-in max-w-md mx-auto">
            <div className="bg-surface-900 border border-surface-700 rounded-3xl p-8 shadow-xl shadow-black/10">
              <button type="button" onClick={() => { setAuthError(''); setFlow('signin'); }} className="text-gray-500 hover:text-white text-sm mb-6 flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </button>
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-semibold text-white">Create account</h2>
                <p className="text-gray-400 mt-2 text-sm">Join the platform to manage bilingual requirements.</p>
              </div>
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Display name</label>
                  <input
                    value={signupName}
                    onChange={e => setSignupName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm password</label>
                  <input
                    type="password"
                    value={signupConfirm}
                    onChange={e => setSignupConfirm(e.target.value)}
                    className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authenticating || !signupName.trim() || !signupEmail.trim() || !signupPassword}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-white font-medium transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  {authenticating ? <Loader className="w-4 h-4 animate-spin" /> : 'Register'}
                </button>
              </form>
              {authError && <p className="text-center text-rose-400 text-sm mt-4">{authError}</p>}
            </div>
          </div>
        )}

        {flow === 'team_role' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-400">
                {gateUser ? `Signed in as ${gateUser.name}. Choose a role for this session.` : 'Select a role to explore the platform'}
              </p>
              <button type="button" onClick={resetToSignin} className="flex items-center gap-2 px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-gray-300 hover:text-white hover:border-surface-200 text-sm font-medium transition-all">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {availableRoles.map(({ role, label, labelJa, desc, icon: Icon, color }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className="group relative bg-surface-900 border border-surface-700 rounded-2xl p-6 text-left hover:border-brand-500/50 hover:bg-surface-850 transition-all duration-200 cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-lg">{label}</h3>
                  <p className="text-gray-500 text-sm mb-2">{labelJa}</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                  <div className="absolute inset-0 rounded-2xl ring-2 ring-brand-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-gray-600 text-xs mt-8">
          CyberConnect &copy; 2026 &mdash; All data shown is for demonstration purposes
        </p>
      </div>
    </div>
  );
}
