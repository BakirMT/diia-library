import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { useSettings } from "@/src/lib/SettingsContext"
import { useAuth } from "@/src/lib/AuthContext"
import { db } from "@/src/lib/firebase"
import { collection, getDocs, doc, getDoc, setDoc, updateDoc } from "firebase/firestore"

export default function StudentSettings() {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  
  const [memberInfo, setMemberInfo] = React.useState<any>(null);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [studentClass, setStudentClass] = React.useState('');
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [msg, setMsg] = React.useState({ type: '', text: '' });

  React.useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        
        const membersSnap = await getDocs(collection(db, 'members'));
        let matchedMember = null;

        const isEmailMatch = (email1: string, email2: string) => {
          if (!email1 || !email2) return false;
          const clean = (e: string) => e.toLowerCase().trim().replace('@gmai.com', '@gmail.com');
          return clean(email1) === clean(email2);
        };

        membersSnap.forEach(d => {
          const data = d.data();
          const safeId = d.id.replace(/[^a-zA-Z0-9]/g, '');
          const internalEmail = `${safeId}@v2.member.libsys.local`;
          if (
            (userData?.username && data.username?.toLowerCase() === userData.username.toLowerCase()) ||
            (userData?.email && isEmailMatch(data.email, userData.email)) ||
            (user.email && isEmailMatch(data.email, user.email)) ||
            user.email === internalEmail
          ) {
            matchedMember = { id: d.id, ...data };
          }
        });
        
        if (matchedMember) {
           setMemberInfo(matchedMember);
           setName((matchedMember as any).name || '');
           setEmail((matchedMember as any).email || '');
           setPhone((matchedMember as any).phone || '');
           setStudentClass((matchedMember as any).studentClass || '');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberInfo) return;
    setIsSaving(true);
    setMsg({ type: '', text: '' });
    
    try {
      const memberRef = doc(db, 'members', memberInfo.id);
      await updateDoc(memberRef, {
        name,
        email,
        phone,
        studentClass
      });
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMsg({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
      return (
          <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h2>
          <p className="text-sm text-slate-500">Manage your student account preferences.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              {msg.text && (
                <div className={`p-3 rounded-md text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {msg.text}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Student ID</label>
                <Input value={memberInfo?.id || ''} disabled className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <Input value={email} type="email" onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Phone Number</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Class / Cohort</label>
                <Input value={studentClass} onChange={e => setStudentClass(e.target.value)} />
              </div>
              <Button type="submit" disabled={isSaving} className="w-full bg-[var(--color-primary)] hover:bg-orange-600">
                 {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-slate-900">Email Notifications</h4>
                <p className="text-xs text-slate-500">Receive emails about due dates and reservations.</p>
              </div>
              <input type="checkbox" defaultChecked className="h-5 w-5 accent-[var(--color-primary)]" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-slate-900">SMS Alerts</h4>
                <p className="text-xs text-slate-500">Get text messages for overdue books.</p>
              </div>
              <input type="checkbox" className="h-5 w-5 accent-[var(--color-primary)]" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-slate-900">Weekly Digest</h4>
                <p className="text-xs text-slate-500">A weekly summary of your library activity.</p>
              </div>
              <input type="checkbox" defaultChecked className="h-5 w-5 accent-[var(--color-primary)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Appearance Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Theme Preference</h4>
              
              <div className="flex items-center gap-4 flex-wrap">
                <label className={`flex flex-col items-center justify-center cursor-pointer w-24 h-28 rounded-xl border-2 transition-all ${settings.theme === 'light' ? 'border-[#f97316] bg-[#fff8f1]' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                  <input 
                    type="radio" 
                    name="student-theme" 
                    value="light" 
                    checked={settings.theme === 'light'} 
                    onChange={() => updateSettings({ theme: 'light' })}
                    className="sr-only" 
                  />
                  <div className="w-[60px] h-[44px] bg-white rounded-md shadow-sm border border-slate-200 flex flex-col gap-[3px] p-1.5 mb-3">
                    <div className="h-1.5 bg-slate-200 rounded-sm w-[70%]"></div>
                    <div className="h-1 bg-slate-100 rounded-sm w-[40%]"></div>
                    <div className="h-4 bg-slate-50 rounded-sm w-full mt-auto"></div>
                  </div>
                  <span className="text-sm font-medium text-slate-800">Light</span>
                </label>

                <label className={`flex flex-col items-center justify-center cursor-pointer w-24 h-28 rounded-xl border-2 transition-all ${settings.theme === 'dark' ? 'border-[#f97316] bg-[#fff8f1]' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                  <input 
                    type="radio" 
                    name="student-theme" 
                    value="dark" 
                    checked={settings.theme === 'dark'} 
                    onChange={() => updateSettings({ theme: 'dark' })}
                    className="sr-only" 
                  />
                  <div className="w-[60px] h-[44px] bg-[#1a202c] rounded-md shadow-sm border border-[#2d3748] flex flex-col gap-[3px] p-1.5 mb-3">
                    <div className="h-1.5 bg-[#2d3748] rounded-sm w-[70%]"></div>
                    <div className="h-1 bg-[#2d3748] rounded-sm w-[40%]"></div>
                    <div className="h-4 bg-[#2d3748] rounded-sm w-full mt-auto"></div>
                  </div>
                  <span className="text-sm font-medium text-slate-800">Dark</span>
                </label>

                <label className={`flex flex-col items-center justify-center cursor-pointer w-24 h-28 rounded-xl border-2 transition-all ${settings.theme === 'system' ? 'border-[#f97316] bg-[#fff8f1]' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                  <input 
                    type="radio" 
                    name="student-theme" 
                    value="system" 
                    checked={settings.theme === 'system'} 
                    onChange={() => updateSettings({ theme: 'system' })}
                    className="sr-only" 
                  />
                  <div className="w-[60px] h-[44px] bg-gradient-to-b from-white to-[#1a202c] rounded-md shadow-sm border border-slate-300 flex flex-col gap-[3px] p-1.5 mb-3 overflow-hidden relative">
                    <div className="h-1.5 bg-slate-300 rounded-sm w-[70%]"></div>
                    <div className="h-1 bg-slate-300 rounded-sm w-[40%]"></div>
                    <div className="h-4 bg-slate-300/50 rounded-sm w-full mt-auto mix-blend-overlay"></div>
                  </div>
                  <span className="text-sm font-medium text-slate-800">System</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
