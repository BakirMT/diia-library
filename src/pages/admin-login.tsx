import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Shield, Eye, EyeOff, Lock, User } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export default function AdminLogin() {
  const [username, setUsername] = useState('admindiia2014');
  const [password, setPassword] = useState('Admin@diia2014');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (
        (username !== 'admindiia2014' && username !== 'admindiialibrary@2014' && username !== 'admindiialibrary@2014.com') ||
        password !== 'Admin@diia2014'
      ) {
        throw new Error("Invalid main authority credentials.");
      }
      const loginEmail = 'admindiia2014@super.local';
      const memberName = 'Super Admin';
      let firebasePassword = password; // Admin@diia2014
      
      let user;
      try {
        const result = await signInWithEmailAndPassword(auth, loginEmail, firebasePassword);
        user = result.user;
      } catch (signInError: any) {
        if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential' || signInError.code === 'auth/wrong-password') {
          const result = await createUserWithEmailAndPassword(auth, loginEmail, firebasePassword);
          user = result.user;
        } else {
          throw signInError;
        }
      }

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: memberName,
          username: username,
          email: loginEmail,
          role: 'SuperAdmin',
          createdAt: new Date().toISOString()
        });
      } else {
        await setDoc(userRef, {
          name: memberName,
          username: username,
          role: 'SuperAdmin'
        }, { merge: true });
      }

      navigate('/superadmin');
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000&auto=format&fit=crop')" }}>
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="mx-auto w-16 h-16 bg-[var(--color-primary)] rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30 mb-6">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
          Main Authority Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-300">
          Restricted access for system administrators
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/60 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-slate-700">
          <form className="space-y-6" onSubmit={handleLogin}>
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm text-center">
                {errorMsg}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Authority Username
              </label>
              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 w-full rounded-xl bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-teal-500 pl-10"
                  placeholder="Enter admin username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">
                Master Password
              </label>
              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-xl bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-teal-500 pl-10 pr-12"
                  placeholder="Enter master password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-md rounded-xl bg-[var(--color-primary)] hover:bg-teal-700 text-white font-bold transition-all shadow-lg"
            >
              {isLoading ? 'Authenticating...' : 'Secure Login'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
