import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, set, onValue } from 'firebase/database';
import { Doctor } from '../types';
import { Plus, Edit2, Trash2, Save, UserPlus, Search } from 'lucide-react';
import Swal from 'sweetalert2';

interface MasterPageProps {
  userUID: string;
}

export default function MasterPage({ userUID }: MasterPageProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    degree: '',
    dept: '',
    unit: 'Unit-1',
    defRoom: '',
    defTime: ''
  });

  useEffect(() => {
    const doctorsRef = ref(db, `users/${userUID}/masterDoctors`);
    const unsubscribe = onValue(doctorsRef, (snapshot) => {
      setDoctors(snapshot.val() || []);
    });
    return () => unsubscribe();
  }, [userUID]);

  const handleSave = async () => {
    if (!formData.name) {
      Swal.fire({
        icon: 'error',
        text: 'অনুগ্রহ করে ডাক্তারের নাম লিখুন',
        confirmButtonColor: '#004d40'
      });
      return;
    }

    const newDoctor: Doctor = {
      id: editingId || Date.now(),
      ...formData
    };

    let updatedDoctors: Doctor[];
    if (editingId) {
      updatedDoctors = doctors.map(d => d.id === editingId ? newDoctor : d);
    } else {
      updatedDoctors = [...doctors, newDoctor];
    }

    try {
      await set(ref(db, `users/${userUID}/masterDoctors`), updatedDoctors);
      setFormData({
        name: '',
        degree: '',
        dept: '',
        unit: 'Unit-1',
        defRoom: '',
        defTime: ''
      });
      setEditingId(null);
      Swal.fire({
        icon: 'success',
        title: 'সফল',
        text: editingId ? 'ডাক্তারের তথ্য আপডেট হয়েছে' : 'নতুন ডাক্তার যোগ করা হয়েছে',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingId(doctor.id);
    setFormData({
      name: doctor.name,
      degree: doctor.degree,
      dept: doctor.dept,
      unit: doctor.unit,
      defRoom: doctor.defRoom,
      defTime: doctor.defTime
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: 'আপনি কি নিশ্চিত?',
      text: 'এটি ডিলিট করলে আর ফেরত পাওয়া যাবে না!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'হ্যাঁ, ডিলিট করুন',
      cancelButtonText: 'না'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const updatedDoctors = doctors.filter(d => d.id !== id);
        await set(ref(db, `users/${userUID}/masterDoctors`), updatedDoctors);
        Swal.fire('ডিলিট হয়েছে!', 'ডাক্তারের তথ্য মুছে ফেলা হয়েছে', 'success');
      }
    });
  };

  return (
    <div className="bg-white p-4 md:p-8 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <UserPlus className="text-emerald-700" /> 👨‍⚕️ DATABASE & ALL DOCTOR SHEET
        </div>
        <button
          onClick={() => window.print()}
          className="no-print bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2"
        >
          🖨️ Print Database
        </button>
      </h2>
      
      <div className="bg-emerald-50 p-4 md:p-6 rounded-lg mb-8 border border-emerald-200">
        <h3 className="font-bold mb-4 text-emerald-800 text-lg">
          {editingId ? '📝 Edit Doctor Info' : '➕ Add New Doctor'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            placeholder="নাম"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="p-3 border rounded-lg md:col-span-2 outline-none focus:ring-2 ring-emerald-500"
          />
          <input
            type="text"
            placeholder="ডিগ্রি"
            value={formData.degree}
            onChange={e => setFormData({ ...formData, degree: e.target.value })}
            className="p-3 border rounded-lg outline-none focus:ring-2 ring-emerald-500"
          />
          <input
            type="text"
            placeholder="বিভাগ"
            value={formData.dept}
            onChange={e => setFormData({ ...formData, dept: e.target.value })}
            className="p-3 border rounded-lg outline-none focus:ring-2 ring-emerald-500"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="ডিফল্ট রুম"
            value={formData.defRoom}
            onChange={e => setFormData({ ...formData, defRoom: e.target.value })}
            className="p-3 border rounded-lg outline-none focus:ring-2 ring-emerald-500"
          />
          <input
            type="text"
            placeholder="ডিফল্ট সময়"
            value={formData.defTime}
            onChange={e => setFormData({ ...formData, defTime: e.target.value })}
            className="p-3 border rounded-lg outline-none focus:ring-2 ring-emerald-500"
          />
          <select
            value={formData.unit}
            onChange={e => setFormData({ ...formData, unit: e.target.value })}
            className="p-3 border rounded-lg font-bold outline-none focus:ring-2 ring-emerald-500"
          >
            <option value="Unit-1">Unit-1</option>
            <option value="Unit-2">Unit-2</option>
          </select>
          <button
            onClick={handleSave}
            className="bg-[#004d40] text-white p-3 rounded-lg font-bold md:col-span-2 hover:bg-[#003d33] transition flex items-center justify-center gap-2"
          >
            {editingId ? <><Save className="w-5 h-5" /> Update</> : <><Plus className="w-5 h-5" /> Save</>}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 border text-center w-12">নং</th>
              <th className="p-3 border text-left">ডাক্তারের নাম</th>
              <th className="p-3 border text-left">বিভাগ</th>
              <th className="p-3 border text-center">ইউনিট</th>
              <th className="p-3 border text-center">রুম</th>
              <th className="p-3 border text-center">সময়</th>
              <th className="p-3 border text-center w-32 no-print">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {doctors.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-gray-400">কোন ডাটা পাওয়া যায়নি।</td>
              </tr>
            ) : (
              doctors.map((d, index) => (
                <tr key={d.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3 border text-center font-bold text-gray-500">{index + 1}</td>
                  <td className="p-3 border text-left">
                    <span className="font-bold text-lg text-emerald-900 leading-none">{d.name}</span><br />
                    <span className="text-xs text-gray-700 font-semibold">{d.degree || ''}</span>
                  </td>
                  <td className="p-3 border font-bold text-gray-700">{d.dept}</td>
                  <td className="p-3 border text-center">
                    <span className="bg-gray-200 px-2 py-1 rounded text-sm font-bold">{d.unit}</span>
                  </td>
                  <td className="p-3 border text-center font-bold text-emerald-700">{d.defRoom || '-'}</td>
                  <td className="p-3 border text-center font-bold text-emerald-700">{d.defTime || '-'}</td>
                  <td className="p-3 border text-center no-print">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(d)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-full transition">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(d.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-full transition">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
