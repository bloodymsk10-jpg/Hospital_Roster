import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { Hospital, Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      Swal.fire({
        icon: 'warning',
        title: 'অসম্পূর্ণ তথ্য',
        text: 'অনুগ্রহ করে ইমেল এবং পাসওয়ার্ড দিন',
        confirmButtonColor: '#004d40'
      });
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        await set(ref(db, `users/${uid}`), {
          masterDoctors: [],
          rosterData: {},
          hospitalHeadline: "হাসপাতালের নাম"
        });
        Swal.fire({
          icon: 'success',
          title: 'সফল',
          text: 'অ্যাকাউন্ট তৈরি হয়েছে!',
          confirmButtonColor: '#004d40'
        });
      }
    } catch (error: any) {
      let message = "ভুল ইমেল বা পাসওয়ার্ড!";
      if (error.code === 'auth/email-already-in-use') {
        message = "এই ইমেলে অলরেডি অ্যাকাউন্ট আছে!";
      } else if (error.code === 'auth/weak-password') {
        message = "পাসওয়ার্ড অন্তত ৬ অক্ষরের দিন।";
      }
      Swal.fire({
        icon: 'error',
        title: 'ত্রুটি',
        text: message,
        confirmButtonColor: '#004d40'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#004d40] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-emerald-100 p-4 rounded-full">
            <Hospital className="w-12 h-12 text-emerald-700" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-6 text-emerald-900">
          {isLogin ? '🏥 Roster Login' : '🏥 Create Account'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg outline-none focus:ring-2 ring-emerald-500"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg outline-none focus:ring-2 ring-emerald-500"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 text-white p-3 rounded-lg font-bold text-lg hover:bg-emerald-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? <><LogIn className="w-5 h-5" /> Login</> : <><UserPlus className="w-5 h-5" /> Register Now</>}
          </button>
        </form>
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-gray-600">
            {isLogin ? 'নতুন অ্যাকাউন্ট খুলতে চান?' : 'আগের অ্যাকাউন্ট আছে?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-emerald-700 font-bold hover:underline ml-2"
            >
              {isLogin ? 'Register Now' : 'Login করুন'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
