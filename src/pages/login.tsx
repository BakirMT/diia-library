import * as React from "react"

import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { auth, db } from "@/src/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

import { useNavigate } from "react-router-dom"
import { BookOpen, User, Shield, GraduationCap, ArrowRight, Mail, Lock } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"

type Role = 'Member' | 'Librarian' | 'Admin'

export default function Login() {
  const [activeRole, setActiveRole] = React.useState<Role>('Member');
  const [usernameOrEmail, setUsernameOrEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    if (activeRole === 'Member') {
      setUsernameOrEmail('bakirmannarkkad170@gmail.com'); // or member@example.com
      setPassword('123');
    } else if (activeRole === 'Librarian') {
      setUsernameOrEmail('librarian'); // or librarian@example.com
      setPassword('password123');
    } else if (activeRole === 'Admin') {
      setUsernameOrEmail('admindiia2014');
      setPassword('Admin@diia2014');
    }
  }, [activeRole]);


  const handleRoleRouting = (role: Role) => {
    if (role === 'Member') {
      navigate('/student'); // Assuming /student is the member route based on previous code
    } else {
      navigate('/');
    }
  };

  
  
  
  
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      let loginEmail = usernameOrEmail;
      let memberName = 'Member';
      let username = usernameOrEmail.includes('@') ? usernameOrEmail.split('@')[0] : usernameOrEmail;
      
      let memberCustomPassword = null;
      if (activeRole === 'Member') {
        const membersRef = collection(db, 'members');
        const querySnapshot = await getDocs(membersRef);
        
        const searchValue = usernameOrEmail.toLowerCase().trim();
        let matchedDoc = null;
        let matchedId = null;
        
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (
            (data.username && data.username.toLowerCase().trim() === searchValue) || 
            (data.email && data.email.toLowerCase().trim() === searchValue) ||
            (data.email && data.email.toLowerCase().trim().replace('@gmai.com', '@gmail.com') === searchValue)
          ) {
            matchedDoc = data;
            matchedId = doc.id;
          }
        });
        
        if (!matchedDoc) {
          throw new Error("Account not found in members list. Please contact the administrator.");
        }
        
        const memberDoc = matchedDoc;
        if (memberDoc.status === 'Suspended') {
          throw new Error("Your account has been suspended. Please contact the administrator.");
        }
        memberName = memberDoc.name || memberName;
        username = memberDoc.username || username;

        // Generate a fake internal email to avoid conflicts with real Google accounts
        const safeUsername = matchedId.replace(/[^a-zA-Z0-9]/g, '');
        loginEmail = `${safeUsername}@v2.member.libsys.local`;

        memberCustomPassword = memberDoc.password; // from admin settings
        if (memberCustomPassword) {
          if (password !== memberCustomPassword) {
            throw new Error("Invalid password.");
          }
        } else {
          throw new Error("Your account has not been set up with a password. Please contact the administrator.");
        }
      } else if (activeRole === 'Admin') {
        if (
          (usernameOrEmail !== 'admindiia2014' && usernameOrEmail !== 'admindiialibrary@2014' && usernameOrEmail !== 'admindiialibrary@2014.com') ||
          password !== 'Admin@diia2014'
        ) {
          throw new Error("Invalid admin credentials.");
        }
        loginEmail = 'admindiialibrary@2014.com';
        memberName = 'Admin';
      } else {
        // For Librarian
        if (!usernameOrEmail.includes('@')) {
          if (usernameOrEmail === 'librarian') loginEmail = 'librarian@example.com';
          else {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', usernameOrEmail), where('role', '==', activeRole));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              loginEmail = querySnapshot.docs[0].data().email;
            } else {
              loginEmail = `${usernameOrEmail}@example.com`;
            }
          }
        }
      }
      
      let user;
      try {
        let firebasePassword = password;
        if (activeRole === 'Member') {
           firebasePassword = loginEmail + "_secret";
        } else {
           firebasePassword = password.length < 6 ? password.padEnd(6, '_') : password;
        }

        const result = await signInWithEmailAndPassword(auth, loginEmail, firebasePassword);
        user = result.user;
      } catch (signInError: any) {
        if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential' || signInError.code === 'auth/wrong-password') {
          let firebasePassword = password;
          if (activeRole === 'Member') {
             firebasePassword = loginEmail + "_secret";
          } else {
             firebasePassword = password.length < 6 ? password.padEnd(6, '_') : password;
          }
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
          name: memberName || user.displayName || 'Member',
          username: username,
          email: user.email || loginEmail,
          role: activeRole,
          createdAt: new Date().toISOString()
        });
      } else {
        await setDoc(userRef, {
          name: memberName || user.displayName || 'Member',
          username: username,
          role: activeRole
        }, { merge: true });
      }

      if (user && memberName && user.displayName !== memberName) { await updateProfile(user, { displayName: memberName }); }
      handleRoleRouting(activeRole);
    } catch (error: any) {
      if (error.code === "auth/operation-not-allowed") { setErrorMsg("Email/Password authentication is not enabled in your Firebase project."); } else { setErrorMsg(error.message); }
    } finally {
      setIsLoading(false);
    }
  };


  const roles = [
    { id: 'Member', icon: GraduationCap, label: 'Member', desc: 'Browse & Reserve' },
    { id: 'Librarian', icon: User, label: 'Librarian', desc: 'Manage & Assist' },
    { id: 'Admin', icon: Shield, label: 'Admin', desc: 'System Control' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl ring-1 ring-slate-100 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left branding section */}
        <div className="w-full md:w-5/12 bg-[var(--color-primary)] p-8 sm:p-12 text-white flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">LibSys</h1>
            </div>
            
            <h2 className="text-3xl font-bold leading-tight mb-4">
              Welcome back to your library.
            </h2>
            <p className="text-white/80 leading-relaxed text-sm">
              Access millions of resources, manage your reading lists, and discover your next great adventure.
            </p>
          </div>
          
          <div className="hidden md:block">
            <div className="h-px bg-white/20 w-full mb-6"></div>
            <p className="text-xs text-white/70">
              © {new Date().getFullYear()} LibSys Platform. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right login section */}
        <div className="w-full md:w-7/12 p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Sign in to account</h3>
            <p className="text-sm text-slate-500 mb-8">Select your role to continue</p>

            {/* Role selector */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {roles.map((role) => {
                const Icon = role.icon;
                const isActive = activeRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => setActiveRole(role.id as Role)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                      isActive 
                        ? 'border-[var(--color-primary)] bg-orange-50/50' 
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`h-6 w-6 mb-2 ${isActive ? 'text-[var(--color-primary)]' : 'text-slate-400'}`} />
                    <span className={`text-xs font-bold ${isActive ? 'text-[var(--color-primary)]' : 'text-slate-600'}`}>
                      {role.label}
                    </span>
                  </button>
                )
              })}
            </div>

                        
            
            <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                      type="text"
                      placeholder="Enter your username"
                      value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input 
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-bold"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
              {errorMsg && <div className="mt-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm">{errorMsg}</div>}
            </form>

  

            

            <p className="text-center text-sm text-slate-500 mt-8">
              Don't have an account? <a href="#" className="font-semibold text-[var(--color-primary)] hover:underline">Contact library admin</a>
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
