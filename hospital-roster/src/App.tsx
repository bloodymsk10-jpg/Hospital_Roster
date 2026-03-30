import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue, set } from 'firebase/database';
import Auth from './components/Auth';
import RosterPage from './components/RosterPage';
import MasterPage from './components/MasterPage';
import { LogOut, Calendar, Database, FileUp, FileDown, Hospital, Printer } from 'lucide-react';
import Swal from 'sweetalert2';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState<'roster' | 'master'>('roster');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleExport = async () => {
    if (!user) return;
    const snapshot = await new Promise<any>((resolve) => {
      onValue(ref(db, `users/${user.uid}`), (s) => resolve(s.val()), { onlyOnce: true });
    });
    
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hospital_roster_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const result = await Swal.fire({
          title: 'আপনি কি নিশ্চিত?',
          text: 'বর্তমান সব ডাটা রিপ্লেস হবে!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'হ্যাঁ, ইমপোর্ট করুন',
          cancelButtonText: 'না',
          confirmButtonColor: '#d33'
        });

        if (result.isConfirmed) {
          await set(ref(db, `users/${user.uid}`), data);
          Swal.fire('সফল', 'ডাটা আপডেট হয়েছে', 'success');
        }
      } catch (err) {
        Swal.fire('ত্রুটি', 'ভুল ফাইল ফরম্যাট!', 'error');
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#004d40]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-12 print:pb-0 print:m-0 print:p-0 print:bg-white">
      <nav className="max-w-7xl mx-auto bg-[#004d40] text-white p-4 rounded-b-xl shadow-lg mb-6 flex flex-wrap justify-between items-center no-print gap-4 sticky top-0 z-[100]">
        <div className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Hospital className="w-8 h-8" />
          <span className="hidden sm:inline">Roster Manager</span>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setActivePage('roster')}
            className={`flex items-center gap-2 px-4 py-2 rounded font-bold transition ${
              activePage === 'roster' ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Calendar className="w-5 h-5" /> 📅 ডিউটি রোস্টার
          </button>
          <button
            onClick={() => setActivePage('master')}
            className={`flex items-center gap-2 px-4 py-2 rounded font-bold transition ${
              activePage === 'master' ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Database className="w-5 h-5" /> 👨‍⚕️ DATABASE
          </button>
          
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold transition"
          >
            <Printer className="w-5 h-5" /> Print
          </button>
          
          <div className="hidden md:block w-px h-8 bg-white/20 mx-2"></div>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded font-bold transition"
          >
            <FileDown className="w-5 h-5" /> Export
          </button>
          
          <label className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-bold transition cursor-pointer">
            <FileUp className="w-5 h-5" /> Import
            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
          </label>
          
          <div className="hidden md:block w-px h-8 bg-white/20 mx-2"></div>
          
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold transition"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 print:px-0 print:py-0 print:m-0 print:max-w-full">
        {activePage === 'roster' ? (
          <RosterPage userUID={user.uid} />
        ) : (
          <MasterPage userUID={user.uid} />
        )}
      </main>
    </div>
  );
}
