import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { User, Building, Users, Bell, Save, Upload, Shield, Mail, Palette, List, Plus, Trash2, Edit2, X, Check, DollarSign } from "lucide-react"
import { Avatar } from "@/src/components/ui/avatar"

import { AddStaffModal, StaffMember } from "@/src/components/settings/add-staff-modal"

import { useSettings, CURRENCY_SYMBOLS } from "@/src/lib/SettingsContext"
import { useAuth } from "@/src/lib/AuthContext"
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = React.useState('profile');
  const [isSaving, setIsSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  
  // Form states for settings
  const [currency, setCurrency] = React.useState(settings.currency);
  const [loanPeriod, setLoanPeriod] = React.useState((settings.loanPeriod || 14).toString());
  const [gracePeriod, setGracePeriod] = React.useState(settings.gracePeriod.toString());
  const [fineRate, setFineRate] = React.useState(settings.fineRate.toString());
  const [maxFine, setMaxFine] = React.useState(settings.maxFine.toString());
  const [theme, setTheme] = React.useState(settings.theme || 'system');
  const [categories, setCategories] = React.useState<string[]>(settings.categories || []);
  const [newCategory, setNewCategory] = React.useState('');
  const [editingCategory, setEditingCategory] = React.useState<string | null>(null);
  const [editCategoryValue, setEditCategoryValue] = React.useState('');
  
  const [libraryName, setLibraryName] = React.useState(settings.libraryName || '');
  const [libraryAddress, setLibraryAddress] = React.useState(settings.libraryAddress || '');
  const [libraryEmail, setLibraryEmail] = React.useState(settings.libraryEmail || '');
  const [libraryPhone, setLibraryPhone] = React.useState(settings.libraryPhone || '');
  const [libraryWebsite, setLibraryWebsite] = React.useState(settings.libraryWebsite || '');

  React.useEffect(() => {
    setCurrency(settings.currency);
    setLoanPeriod((settings.loanPeriod || 14).toString());
    setGracePeriod(settings.gracePeriod.toString());
    setFineRate(settings.fineRate.toString());
    setMaxFine(settings.maxFine.toString());
    setTheme(settings.theme || 'system');
    setCategories(settings.categories || []);
    setLibraryName(settings.libraryName || '');
    setLibraryAddress(settings.libraryAddress || '');
    setLibraryEmail(settings.libraryEmail || '');
    setLibraryPhone(settings.libraryPhone || '');
    setLibraryWebsite(settings.libraryWebsite || '');
  }, [settings]);

  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = React.useState(false);
  const [editingStaff, setEditingStaff] = React.useState<StaffMember | null>(null);
  const [staffList, setStaffList] = React.useState<StaffMember[]>([
    { id: '1', name: 'Jane Doe', username: 'janedoe', email: 'jane.doe@library.com', role: 'Admin', status: 'Active' },
    { id: '2', name: 'Mark Smith', username: 'marksmith', email: 'mark.smith@library.com', role: 'Librarian', status: 'Active' },
    { id: '3', name: 'Emily Chen', username: 'emilychen', email: 'emily.chen@library.com', role: 'Assistant', status: 'Inactive' },
  ]);

  const handleSaveStaff = (staffData: Omit<StaffMember, 'id'>) => {
    if (editingStaff) {
      setStaffList(prev => prev.map(s => s.id === editingStaff.id ? { ...s, ...staffData } : s));
    } else {
      setStaffList(prev => [...prev, { ...staffData, id: Math.random().toString(36).substr(2, 9) }]);
    }
  };

  const handleDeleteStaff = (id: string) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      setStaffList(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleMessageStaff = (email: string) => {
    window.location.href = 'mailto:' + email;
  };
  
  const { user, role } = useAuth();
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [photoURL, setPhotoURL] = React.useState('');

  React.useEffect(() => {
    if (user) {
      const parts = (user.displayName || '').split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setEmail(user.email || '');
      setPhotoURL(user.photoURL || '');
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    
    if (activeTab === 'profile' && user) {
      try {
        const newDisplayName = (firstName + ' ' + lastName).trim();
        await updateProfile(user, {
          displayName: newDisplayName,
          photoURL: photoURL
        });
        await updateDoc(doc(db, 'users', user.uid), {
          displayName: newDisplayName,
          photoURL: photoURL
        });
      } catch (err) {
        console.error("Error updating profile", err);
      }
    } else if (activeTab === 'fines') {
      updateSettings({
        currency,
        currencySymbol: CURRENCY_SYMBOLS[currency] || '$',
        loanPeriod: parseInt(loanPeriod) || 14,
        gracePeriod: parseInt(gracePeriod) || 0,
        fineRate: parseFloat(fineRate) || 0,
        maxFine: parseFloat(maxFine) || 0,
      });
    } else if (activeTab === 'appearance') {
      updateSettings({
        theme: theme as 'light' | 'dark' | 'system',
      });
    } else if (activeTab === 'categories') {
      updateSettings({ categories });
    } else if (activeTab === 'library') {
      updateSettings({
        libraryName,
        libraryAddress,
        libraryEmail,
        libraryPhone,
        libraryWebsite,
      });
    }

    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <AddStaffModal 
        isOpen={isAddStaffModalOpen} 
        onClose={() => {
          setIsAddStaffModalOpen(false);
          setEditingStaff(null);
        }} 
        onSave={handleSaveStaff}
        initialData={editingStaff}
      />
      
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Manage your profile, library preferences, and system configurations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          {[
            { id: 'profile', label: 'Profile Settings', icon: User },
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'library', label: 'Library Information', icon: Building },
            ...(role === 'Admin' ? [{ id: 'staff', label: 'Staff & Roles', icon: Shield }] : []),
            { id: 'categories', label: 'Categories & Genres', icon: List },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            ...(role === 'Admin' ? [
              { id: 'fines', label: 'Circulation & Fines', icon: DollarSign },
              { id: 'templates', label: 'Email Templates', icon: Mail },
            ] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-teal-50 text-[var(--color-primary)]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-[var(--color-primary)]' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details and public profile.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar src={photoURL} fallback={(firstName.charAt(0) + lastName.charAt(0)) || "U"} size="lg" className="h-20 w-20 text-xl" />
                    <div>
                      <div className="flex flex-col gap-2">
                        <Input placeholder="Photo URL" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} className="h-8 text-sm" />
                        <p className="text-xs text-slate-500">Provide an image URL for your avatar.</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">First Name</label>
                      <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Last Name</label>
                      <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Email Address</label>
                      <Input type="email" value={email} disabled className="bg-slate-50" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Role</label>
                      <Input value={role || "Staff"} disabled className="bg-slate-50" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button onClick={handleSave} disabled={isSaving || saved} className={saved ? "bg-green-600 hover:bg-green-700" : ""}>
                      {isSaving ? 'Saving...' : saved ? 'Saved!' : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              
            </div>
          )}

          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the look and feel of the application.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-4">Theme Preference</h4>
                  
                  <div className="flex items-center gap-4">
                    <label className={`flex flex-col items-center justify-center cursor-pointer w-24 h-28 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-[#24B1B1] bg-[#f0fdfa]' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                      <input 
                        type="radio" 
                        name="theme" 
                        value="light" 
                        checked={theme === 'light'} 
                        onChange={() => setTheme('light')} 
                        className="sr-only" 
                      />
                      <div className="w-[60px] h-[44px] bg-white rounded-md shadow-sm border border-slate-200 flex flex-col gap-[3px] p-1.5 mb-3">
                        <div className="h-1.5 bg-slate-200 rounded-sm w-[70%]"></div>
                        <div className="h-1 bg-slate-100 rounded-sm w-[40%]"></div>
                        <div className="h-4 bg-slate-50 rounded-sm w-full mt-auto"></div>
                      </div>
                      <span className="text-sm font-medium text-slate-800">Light</span>
                    </label>

                    <label className={`flex flex-col items-center justify-center cursor-pointer w-24 h-28 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-[#24B1B1] bg-[#f0fdfa]' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                      <input 
                        type="radio" 
                        name="theme" 
                        value="dark" 
                        checked={theme === 'dark'} 
                        onChange={() => setTheme('dark')} 
                        className="sr-only" 
                      />
                      <div className="w-[60px] h-[44px] bg-[#1a202c] rounded-md shadow-sm border border-[#2d3748] flex flex-col gap-[3px] p-1.5 mb-3">
                        <div className="h-1.5 bg-[#2d3748] rounded-sm w-[70%]"></div>
                        <div className="h-1 bg-[#2d3748] rounded-sm w-[40%]"></div>
                        <div className="h-4 bg-[#2d3748] rounded-sm w-full mt-auto"></div>
                      </div>
                      <span className="text-sm font-medium text-slate-800">Dark</span>
                    </label>

                    <label className={`flex flex-col items-center justify-center cursor-pointer w-24 h-28 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-[#24B1B1] bg-[#f0fdfa]' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                      <input 
                        type="radio" 
                        name="theme" 
                        value="system" 
                        checked={theme === 'system'} 
                        onChange={() => setTheme('system')} 
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
                
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button onClick={handleSave} disabled={isSaving || saved} className={saved ? "bg-green-600 hover:bg-green-700" : ""}>
                    {isSaving ? 'Saving...' : saved ? 'Saved!' : <><Save className="mr-2 h-4 w-4" /> Save Preferences</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'library' && (
            <Card>
              <CardHeader>
                <CardTitle>Library Information</CardTitle>
                <CardDescription>Manage your library's public identity and contact details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Library Name</label>
                    <Input value={libraryName} onChange={(e) => setLibraryName(e.target.value)} disabled={role !== 'Admin'} className={role !== 'Admin' ? "bg-slate-50" : ""} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Address</label>
                    <Input value={libraryAddress} onChange={(e) => setLibraryAddress(e.target.value)} disabled={role !== 'Admin'} className={role !== 'Admin' ? "bg-slate-50" : ""} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Contact Email</label>
                    <Input type="email" value={libraryEmail} onChange={(e) => setLibraryEmail(e.target.value)} disabled={role !== 'Admin'} className={role !== 'Admin' ? "bg-slate-50" : ""} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Contact Phone</label>
                    <Input type="tel" value={libraryPhone} onChange={(e) => setLibraryPhone(e.target.value)} disabled={role !== 'Admin'} className={role !== 'Admin' ? "bg-slate-50" : ""} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Website</label>
                    <Input type="url" value={libraryWebsite} onChange={(e) => setLibraryWebsite(e.target.value)} disabled={role !== 'Admin'} className={role !== 'Admin' ? "bg-slate-50" : ""} />
                  </div>
                </div>
                {role === 'Admin' && (
                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button onClick={handleSave} disabled={isSaving || saved} className={saved ? "bg-green-600 hover:bg-green-700" : ""}>
                      {isSaving ? 'Saving...' : saved ? 'Saved!' : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'categories' && (
            <Card>
              <CardHeader>
                <CardTitle>Categories & Genres</CardTitle>
                <CardDescription>Manage the list of book categories available in the library.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-3">
                  <Input 
                    placeholder="New category name (e.g. Graphic Novels)" 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    disabled={role !== 'Admin'}
                    onKeyDown={(e) => {
                      if (role !== 'Admin') return;
                      if (e.key === 'Enter' && newCategory.trim()) {
                        if (!categories.includes(newCategory.trim())) {
                          setCategories(prev => [...prev, newCategory.trim()].sort());
                          setNewCategory('');
                        }
                      }
                    }}
                  />
                  <Button 
                    className="shrink-0"
                    onClick={() => {
                      if (newCategory.trim() && !categories.includes(newCategory.trim())) {
                        setCategories(prev => [...prev, newCategory.trim()].sort());
                        setNewCategory('');
                      }
                    }}
                    disabled={role !== 'Admin' || !newCategory.trim() || categories.includes(newCategory.trim())}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add
                  </Button>
                </div>
                
                {role !== 'Admin' && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                    Only Administrators can add, edit, or delete categories.
                  </p>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white shadow-sm group">
                      {editingCategory === category ? (
                        <div className="flex items-center gap-2 w-full">
                          <Input 
                            value={editCategoryValue}
                            onChange={(e) => setEditCategoryValue(e.target.value)}
                            className="h-8 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && editCategoryValue.trim()) {
                                if (!categories.includes(editCategoryValue.trim()) || editCategoryValue.trim() === category) {
                                  setCategories(prev => prev.map(c => c === category ? editCategoryValue.trim() : c));
                                  setEditingCategory(null);
                                }
                              } else if (e.key === 'Escape') {
                                setEditingCategory(null);
                              }
                            }}
                            autoFocus
                          />
                          <Button 
                            variant="ghost" size="icon" className="h-7 w-7 p-0 text-green-600 hover:bg-green-50 shrink-0"
                            onClick={() => {
                              if (editCategoryValue.trim() && (!categories.includes(editCategoryValue.trim()) || editCategoryValue.trim() === category)) {
                                setCategories(prev => prev.map(c => c === category ? editCategoryValue.trim() : c));
                                setEditingCategory(null);
                              }
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" size="icon" className="h-7 w-7 p-0 text-slate-400 hover:bg-slate-50 shrink-0"
                            onClick={() => setEditingCategory(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-slate-700 truncate pr-2">{category}</span>
                          {role === 'Admin' && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" size="icon" className="h-7 w-7 p-0 text-slate-400 hover:text-[var(--color-primary)] hover:bg-teal-50 shrink-0"
                                onClick={() => {
                                  setEditingCategory(category);
                                  setEditCategoryValue(category);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" size="icon" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                                onClick={() => {
                                  setCategories(prev => prev.filter(c => c !== category));
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
                
                {categories.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-sm text-slate-500">No categories found. Add some above.</p>
                  </div>
                )}
                
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button onClick={handleSave} disabled={isSaving || saved} className={saved ? "bg-green-600 hover:bg-green-700" : ""}>
                    {isSaving ? 'Saving...' : saved ? 'Saved!' : <><Save className="mr-2 h-4 w-4" /> Save Categories</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure how and when the system sends notifications to members and staff.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-900">Member Notifications</h4>
                  
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Overdue Reminders</p>
                      <p className="text-xs text-slate-500">Automatically email members when books are overdue.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Reservation Ready</p>
                      <p className="text-xs text-slate-500">Notify members when their reserved book is available for pickup.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Weekly Newsletter</p>
                      <p className="text-xs text-slate-500">Allow system to send out weekly updates to opted-in members.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                    </label>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h4 className="text-sm font-semibold text-slate-900">Staff Alerts</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Daily Digest Email</p>
                      <p className="text-xs text-slate-500">Receive a daily summary of check-ins, check-outs, and new registrations.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button onClick={handleSave} disabled={isSaving || saved} className={saved ? "bg-green-600 hover:bg-green-700" : ""}>
                    {isSaving ? 'Saving...' : saved ? 'Saved!' : <><Save className="mr-2 h-4 w-4" /> Save Preferences</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'staff' && role === 'Admin' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Staff & Roles</CardTitle>
                  <CardDescription>Manage staff accounts and their access permissions.</CardDescription>
                </div>
                <Button size="sm" onClick={() => { setEditingStaff(null); setIsAddStaffModalOpen(true); }}>Add Staff</Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl ring-1 ring-slate-100">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Username</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staffList.map(staff => (
                        <tr key={staff.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{staff.name}</td>
                          <td className="px-4 py-3 text-slate-500">{staff.username}</td>
                          <td className="px-4 py-3 text-slate-500">{staff.role}</td>
                          <td className="px-4 py-3">
                            <span className={staff.status === 'Active' ? "text-green-600 bg-green-50 px-2 py-1 rounded-full text-[10px] font-bold uppercase" : "text-slate-600 bg-slate-100 px-2 py-1 rounded-full text-[10px] font-bold uppercase"}>
                              {staff.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="text-slate-500 h-8 w-8 hover:text-[var(--color-primary)] hover:bg-teal-50" onClick={() => handleMessageStaff(staff.email)}>
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-slate-500 h-8 hover:text-slate-900" onClick={() => {
                                setEditingStaff(staff);
                                setIsAddStaffModalOpen(true);
                              }}>Edit</Button>
                              <Button variant="ghost" size="icon" className="text-slate-500 h-8 w-8 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteStaff(staff.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'fines' && role === 'Admin' && (
            <Card>
              <CardHeader>
                <CardTitle>Circulation & Fines Configuration</CardTitle>
                <CardDescription>Manage checkout durations, daily fine rates, and limits.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Currency</label>
                    <select 
                      value={currency} 
                      onChange={(e) => setCurrency(e.target.value)} 
                      className="flex h-10 w-full rounded-full bg-slate-100 px-4 py-2 text-sm text-[var(--color-text-main)] outline-none transition-colors border-r-8 border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-teal-200"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Loan Period (Days)</label>
                    <Input type="number" value={loanPeriod} onChange={(e) => setLoanPeriod(e.target.value)} min="1" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Grace Period (Days)</label>
                    <Input type="number" value={gracePeriod} onChange={(e) => setGracePeriod(e.target.value)} min="0" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Daily Fine Rate</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-500 sm:text-sm">{CURRENCY_SYMBOLS[currency] || '$'}</span>
                      </div>
                      <Input type="number" step="0.10" value={fineRate} onChange={(e) => setFineRate(e.target.value)} min="0" className="pl-7" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Maximum Fine Amount</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-500 sm:text-sm">{CURRENCY_SYMBOLS[currency] || '$'}</span>
                      </div>
                      <Input type="number" step="1.00" value={maxFine} onChange={(e) => setMaxFine(e.target.value)} min="0" className="pl-7" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mt-6">
                  <div className="flex gap-3">
                    <DollarSign className="h-5 w-5 text-teal-600 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-teal-800">Fine Automation</h4>
                      <p className="text-xs text-teal-600 mt-1">
                        Currently, fines are automatically calculated overnight for all overdue items based on the daily rate specified above, up to the maximum cap.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button onClick={handleSave} disabled={isSaving || saved} className={saved ? "bg-green-600 hover:bg-green-700" : ""}>
                    {isSaving ? 'Saving...' : saved ? 'Saved!' : <><Save className="mr-2 h-4 w-4" /> Save Settings</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'templates' && role === 'Admin' && (
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>Customize the emails sent automatically to members.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Overdue Book Alert Subject</label>
                    <Input defaultValue={`Notice: You have an overdue item from ${libraryName || 'the Library'}`} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Overdue Book Alert Body</label>
                    <textarea 
                      className="w-full min-h-[150px] rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                      defaultValue={`Dear {{member_name}},\n\nThis is a friendly reminder that the following item(s) you checked out are now overdue:\n\n{{book_title}} (Due: {{due_date}})\n\nPlease check in the items as soon as possible to avoid accumulating further fines. Your current estimated fine is {{fine_amount}}.\n\nThank you,\n${libraryName || 'The Library'}`}
                    ></textarea>
                    <p className="text-xs text-slate-500">
                      Available variables: <code>{`{{member_name}}`}</code>, <code>{`{{book_title}}`}</code>, <code>{`{{due_date}}`}</code>, <code>{`{{fine_amount}}`}</code>
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button onClick={handleSave} disabled={isSaving || saved} className={saved ? "bg-green-600 hover:bg-green-700" : ""}>
                    {isSaving ? 'Saving...' : saved ? 'Saved!' : <><Save className="mr-2 h-4 w-4" /> Save Templates</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
