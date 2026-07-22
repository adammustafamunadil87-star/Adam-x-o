import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, LogOut, User, Sparkles, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';
import { playClickSound } from '../utils/audio';
import { auth, googleProvider } from '../utils/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

interface GoogleLoginProps {
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
}

export default function GoogleLogin({ profile, onProfileChange }: GoogleLoginProps) {
  const [showSimulatedLogin, setShowSimulatedLogin] = useState(false);
  const [customName, setCustomName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('https://lh3.googleusercontent.com/a/default-user=s96-c');

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const newProfile: UserProfile = {
          name: user.displayName || 'مستحدم جوجل',
          email: user.email || undefined,
          picture: user.photoURL || 'https://lh3.googleusercontent.com/a/default-user=s96-c',
          isLoggedIn: true,
        };
        onProfileChange(newProfile);
        localStorage.setItem('xo_user_profile', JSON.stringify(newProfile));
      } else {
        // Only reset if we were logged in via Google
        const savedUser = localStorage.getItem('xo_user_profile');
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed.isLoggedIn && parsed.email) {
              // It was a Google account, so log them out locally too
              onProfileChange({ name: 'لاعب زائر', isLoggedIn: false });
              localStorage.removeItem('xo_user_profile');
            }
          } catch (e) {
            // ignore
          }
        }
      }
    });

    // Check if user is saved in localStorage (e.g. for simulated login)
    const savedUser = localStorage.getItem('xo_user_profile');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        onProfileChange(parsed);
      } catch (e) {
        // ignore
      }
    }

    return () => unsubscribe();
  }, [onProfileChange]);

  const handleGoogleLoginClick = async () => {
    playClickSound();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const newProfile: UserProfile = {
          name: result.user.displayName || 'مستخدم جوجل',
          email: result.user.email || undefined,
          picture: result.user.photoURL || 'https://lh3.googleusercontent.com/a/default-user=s96-c',
          isLoggedIn: true,
        };
        onProfileChange(newProfile);
        localStorage.setItem('xo_user_profile', JSON.stringify(newProfile));
      }
    } catch (err) {
      console.error("Firebase Sign-In Error:", err);
      // Fallback to simulated login if popup gets blocked or fails
      setShowSimulatedLogin(true);
    }
  };

  const handleSimulatedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    
    const finalName = customName.trim() || 'آدم مصطفى';
    const newProfile: UserProfile = {
      name: finalName,
      email: `${finalName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      picture: selectedAvatar,
      isLoggedIn: true,
    };
    
    onProfileChange(newProfile);
    localStorage.setItem('xo_user_profile', JSON.stringify(newProfile));
    setShowSimulatedLogin(false);
  };

  const handleLogout = async () => {
    playClickSound();
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase Sign-Out Error:", err);
    }
    const guestProfile: UserProfile = {
      name: 'لاعب زائر',
      isLoggedIn: false,
    };
    onProfileChange(guestProfile);
    localStorage.removeItem('xo_user_profile');
  };

  const avatars = [
    'https://api.dicebear.com/7.x/bottts/svg?seed=adam',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=sarah',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=play',
  ];

  return (
    <div className="w-full">
      {profile.isLoggedIn ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-between bg-emerald-600/10 border border-emerald-500/20 p-4 rounded-2xl shadow-sm animate-fade-in"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={profile.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c'} 
                alt={profile.name} 
                className="w-12 h-12 rounded-full border border-emerald-500/30 object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-sm font-bold text-white">{profile.name}</h3>
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              </div>
              <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                متصل عبر جوجل
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/30 text-xs text-gray-400 hover:text-rose-400 rounded-xl transition duration-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل خروج</span>
          </button>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col items-center text-center space-y-4"
        >
          <div className="p-3 bg-violet-600/10 text-violet-400 rounded-2xl border border-violet-500/10">
            <LogIn className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">سجّل دخولك لحفظ هويتك واللعب أونلاين</h3>
            <p className="text-xs text-gray-400">العب مع الأصدقاء عن بعد، وشارك الآخرين اللعب بهويتك المفضلة</p>
          </div>
          
          <button
            type="button"
            onClick={handleGoogleLoginClick}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-slate-900 font-bold py-3 px-4 rounded-xl shadow-lg transition duration-200 transform active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.28 1.845 15.548 1 12.24 1 5.48 1 0 6.37 0 13s5.48 12 12.24 12c7.054 0 11.75-4.83 11.75-11.64 0-.785-.087-1.39-.193-2.075H12.24z"/>
            </svg>
            <span>تسجيل الدخول عبر جوجل</span>
          </button>
        </motion.div>
      )}

      {/* Simulated Login Modal */}
      <AnimatePresence>
        {showSimulatedLogin && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5"
              dir="rtl"
            >
              <div className="text-center space-y-1">
                <div className="inline-flex p-3 bg-violet-600/15 text-violet-400 rounded-full mb-2">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">تسجيل دخول سريع (محاكي جوجل)</h3>
                <p className="text-xs text-gray-400">سجّل دخولك باسمك الخاص وصورتك المفضلة لبدء اللعب عن بعد</p>
              </div>

              <form onSubmit={handleSimulatedSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">اسم اللاعب</label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="مثال: آدم مصطفى"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300 block">اختر الصورة الرمزية</label>
                  <div className="grid grid-cols-4 gap-3">
                    {avatars.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setSelectedAvatar(url);
                        }}
                        className={`aspect-square rounded-xl overflow-hidden border-2 p-1 transition-all ${
                          selectedAvatar === url 
                            ? 'border-violet-500 bg-violet-600/10' 
                            : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                        }`}
                      >
                        <img src={url} alt="avatar" className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-xl text-sm transition"
                  >
                    تأكيد الدخول
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setShowSimulatedLogin(false);
                    }}
                    className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-sm text-gray-400 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
