import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { ref, set, onValue } from 'firebase/database';
import { Doctor, RosterItem } from '../types';
import { Search, Plus, Trash2, ArrowUp, ArrowDown, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import Swal from 'sweetalert2';

interface RosterPageProps {
  userUID: string;
}

const dayNamesBN: { [key: string]: string } = {
  "Saturday": "শনিবার",
  "Sunday": "রবিবার",
  "Monday": "সোমবার",
  "Tuesday": "মঙ্গলবার",
  "Wednesday": "বুধবার",
  "Thursday": "বৃহস্পতিবার",
  "Friday": "শুক্রবার"
};

const days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function RosterPage({ userUID }: RosterPageProps) {
  const [masterDoctors, setMasterDoctors] = useState<Doctor[]>([]);
  const [rosterData, setRosterData] = useState<{ [day: string]: RosterItem[] }>({});
  const [hospitalHeadline, setHospitalHeadline] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDay, setCurrentDay] = useState(format(new Date(), 'EEEE'));
  
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [dutyRoom, setDutyRoom] = useState('');
  const [dutyTime, setDutyTime] = useState('');

  useEffect(() => {
    const userPath = `users/${userUID}`;
    
    onValue(ref(db, `${userPath}/masterDoctors`), (snapshot) => {
      setMasterDoctors(snapshot.val() || []);
    });

    onValue(ref(db, `${userPath}/rosterData`), (snapshot) => {
      setRosterData(snapshot.val() || {});
    });

    onValue(ref(db, `${userPath}/hospitalHeadline`), (snapshot) => {
      setHospitalHeadline(snapshot.val() || "হাসপাতালের নাম");
    });
  }, [userUID]);

  useEffect(() => {
    setCurrentDay(format(selectedDate, 'EEEE'));
  }, [selectedDate]);

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    if (!val) {
      setSuggestions([]);
      return;
    }
    const matches = masterDoctors.filter(d => 
      d.name.toLowerCase().includes(val.toLowerCase()) || 
      d.dept.toLowerCase().includes(val.toLowerCase())
    );
    setSuggestions(matches);
  };

  const selectDoctor = (d: Doctor) => {
    setSelectedDoctor(d);
    setSearchTerm(d.name);
    setDutyRoom(d.defRoom || '');
    setDutyTime(d.defTime || '');
    setSuggestions([]);
  };

  const addToRoster = async () => {
    if (!selectedDoctor) {
      Swal.fire({
        icon: 'error',
        text: 'অনুগ্রহ করে ডাক্তার নির্বাচন করুন',
        confirmButtonColor: '#004d40'
      });
      return;
    }

    const currentRoster = rosterData[currentDay] || [];
    if (currentRoster.some(r => r.docId === selectedDoctor.id)) {
      Swal.fire({
        icon: 'info',
        text: 'এই ডাক্তার ইতিমধ্যে তালিকায় আছেন',
        confirmButtonColor: '#004d40'
      });
      return;
    }

    const newItem: RosterItem = {
      id: Date.now(),
      docId: selectedDoctor.id,
      time: dutyTime || selectedDoctor.defTime || '',
      room: dutyRoom || selectedDoctor.defRoom || '',
      status: 'YES'
    };

    const updatedRoster = [...currentRoster, newItem];
    const updatedData = { ...rosterData, [currentDay]: updatedRoster };
    
    await set(ref(db, `users/${userUID}/rosterData`), updatedData);
    
    setSearchTerm('');
    setSelectedDoctor(null);
    setDutyRoom('');
    setDutyTime('');
  };

  const updateItem = async (id: number, field: keyof RosterItem, value: any) => {
    const updatedRoster = rosterData[currentDay].map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    await set(ref(db, `users/${userUID}/rosterData/${currentDay}`), updatedRoster);
  };

  const cycleStatus = (id: number) => {
    const item = rosterData[currentDay].find(r => r.id === id);
    if (!item) return;
    const nextStatus: RosterItem['status'] = 
      item.status === 'YES' ? 'NO' : 
      item.status === 'NO' ? 'PENDING' : 'YES';
    updateItem(id, 'status', nextStatus);
  };

  const deleteItem = async (id: number) => {
    const updatedRoster = rosterData[currentDay].filter(r => r.id !== id);
    await set(ref(db, `users/${userUID}/rosterData/${currentDay}`), updatedRoster);
  };

  const moveItem = async (index: number, direction: number) => {
    const list = [...rosterData[currentDay]];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < list.length) {
      [list[index], list[newIndex]] = [list[newIndex], list[index]];
      await set(ref(db, `users/${userUID}/rosterData/${currentDay}`), list);
    }
  };

  const rosterList = rosterData[currentDay] || [];
  
  const getPrintStyles = () => {
    const len = rosterList.length;
    
    // Base values optimized to ensure 20 rows fit comfortably on one page
    let fontSize = 1.0;
    let paddingV = 8;
    let paddingH = 5;
    let headlineSize = 2.2;

    if (len > 20) {
      const overflow = len - 20;
      // Shrink more aggressively row-by-row
      fontSize = Math.max(0.4, 1.0 - overflow * 0.02);
      paddingV = Math.max(0.1, 8 - overflow * 0.35);
      paddingH = Math.max(0.1, 5 - overflow * 0.1);
      headlineSize = Math.max(1.0, 2.2 - overflow * 0.04);
    }

    return {
      '--print-font-size': `${fontSize}rem`,
      '--print-padding': `${paddingV}px ${paddingH}px`,
      '--print-headline-size': `${headlineSize}rem`
    } as React.CSSProperties;
  };

  return (
    <div className="space-y-6 print:space-y-0">
      <div className="bg-white p-6 rounded-xl shadow-md no-print border-l-8 border-emerald-600">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700">হাসপাতালের নাম:</label>
            <input
              type="text"
              value={hospitalHeadline}
              onChange={e => {
                setHospitalHeadline(e.target.value);
                set(ref(db, `users/${userUID}/hospitalHeadline`), e.target.value);
              }}
              placeholder="হাসপাতালের নাম লিখুন"
              className="border p-3 rounded-lg text-lg outline-none focus:ring-2 ring-emerald-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700">তারিখ নির্বাচন:</label>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={e => setSelectedDate(new Date(e.target.value))}
              className="border p-3 rounded-lg text-lg outline-none focus:ring-2 ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 md:p-8 print:p-0 print:m-0 print:mb-0 rounded-xl shadow-lg print-area" style={getPrintStyles()}>
        <div className="flex flex-col items-center text-center mb-2 print:mb-0">
          <h1 id="displayHeadline" className="text-4xl md:text-[3.5rem] font-black text-gray-900 uppercase mb-2 print:mb-0 tracking-tight leading-tight" style={{ fontSize: 'var(--print-headline-size, 2.0rem)' }}>
            {hospitalHeadline}
          </h1>
          <div className="date-row print:mb-0">
            <span>তারিখ: {format(selectedDate, 'd MMMM, yyyy', { locale: bn })}</span>
            <span className="mx-4 opacity-30">|</span>
            <span>দিন: {dayNamesBN[currentDay]}</span>
          </div>
        </div>

        <div className="flex justify-center flex-wrap gap-2 mb-4 no-print">
          {days.map(day => (
            <button
              key={day}
              onClick={() => setCurrentDay(day)}
              className={`day-tab-btn ${currentDay === day ? 'active-tab' : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-500'}`}
            >
              {dayNamesBN[day]}
            </button>
          ))}
        </div>

        <div className="bg-blue-50 p-6 rounded-xl mb-4 no-print border border-blue-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ডাক্তারের নাম..."
                  value={searchTerm}
                  onChange={e => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg bg-white outline-none focus:ring-2 ring-blue-500"
                />
              </div>
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 mt-1 max-h-60 overflow-y-auto">
                  {suggestions.map(d => (
                    <div
                      key={d.id}
                      onClick={() => selectDoctor(d)}
                      className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0"
                    >
                      <div className="font-bold text-gray-800">{d.name}</div>
                      <div className="text-xs text-gray-500">{d.dept} | {d.unit}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="রুম নং"
              value={dutyRoom}
              onChange={e => setDutyRoom(e.target.value)}
              className="p-3 border rounded-lg outline-none focus:ring-2 ring-blue-500"
            />
            <input
              type="text"
              placeholder="সময়"
              value={dutyTime}
              onChange={e => setDutyTime(e.target.value)}
              className="p-3 border rounded-lg outline-none focus:ring-2 ring-blue-500"
            />
            <button
              onClick={addToRoster}
              className="bg-blue-700 text-white p-3 rounded-lg font-bold text-lg hover:bg-blue-800 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-6 h-6" /> Add
            </button>
          </div>
        </div>

        <div className="overflow-x-auto print:mb-0 print:pb-0">
          <table className="w-full border-collapse" style={getPrintStyles()}>
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="p-2 col-sl text-center">নং</th>
                <th className="p-2 text-center">ডাক্তারের নাম</th>
                <th className="p-2 col-dept text-center">বিভাগ</th>
                <th className="p-2 col-room text-center">রুম</th>
                <th className="p-2 col-time text-center">সময়</th>
                <th className="p-2 col-status text-center">অবস্থান</th>
                <th className="p-2 col-unit text-center">ইউনিট</th>
                <th className="p-2 w-12 text-center no-print">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {rosterList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-gray-400">তালিকা খালি।</td>
                </tr>
              ) : (
                rosterList.map((r, index) => {
                  const doc = masterDoctors.find(d => d.id === r.docId);
                  if (!doc) return null;
                  return (
                    <tr key={r.id} className="border-b border-gray-400">
                      <td className="p-1 text-center font-bold">
                        <div className="flex flex-col items-center gap-0.5">
                          <button 
                            onClick={() => moveItem(index, -1)} 
                            className="no-print p-0.5 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                            title="Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <span className="leading-none">{index + 1}</span>
                          <button 
                            onClick={() => moveItem(index, 1)} 
                            className="no-print p-0.5 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                            title="Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="p-1 text-left">
                        <div className="font-bold text-lg leading-none">{doc.name}</div>
                        <div className="text-[10px] font-semibold text-gray-700 leading-tight">{doc.degree}</div>
                      </td>
                      <td className="p-1 text-center font-bold text-gray-700">{doc.dept}</td>
                      <td className="p-1 text-center">
                        <input
                          type="text"
                          value={r.room}
                          onChange={e => updateItem(r.id, 'room', e.target.value)}
                          className="editable-input font-bold"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <input
                          type="text"
                          value={r.time}
                          onChange={e => updateItem(r.id, 'time', e.target.value)}
                          className="editable-input font-bold"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <button
                          onClick={() => cycleStatus(r.id)}
                          className={`px-2 py-0.5 rounded font-bold no-print text-sm ${
                            r.status === 'YES' ? 'status-yes' :
                            r.status === 'NO' ? 'status-no' : 'status-pending'
                          }`}
                        >
                          {r.status}
                        </button>
                        <span className="hidden print:block font-bold text-lg">
                          {r.status === 'PENDING' ? '' : r.status}
                        </span>
                      </td>
                      <td className="p-1 text-center font-bold">{doc.unit}</td>
                      <td className="p-1 text-center no-print">
                        <button onClick={() => deleteItem(r.id)} className="text-red-500 p-1 hover:bg-red-50 rounded-full">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <button
          onClick={() => window.print()}
          className="w-full mt-10 bg-blue-600 text-white p-4 rounded-xl font-bold text-xl no-print hover:bg-blue-700 transition shadow-lg"
        >
          🖨️ Print Roster
        </button>
      </div>
    </div>
  );
}
