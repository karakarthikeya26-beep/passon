'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Calendar, Clock, X, CheckCircle2 } from 'lucide-react';

interface HandoverModalProps {
  listingId: string;
  interestId: string;
  onClose: () => void;
}

export const HandoverModal: React.FC<HandoverModalProps> = ({ listingId, interestId, onClose }) => {
  const { planHandover } = useApp();

  const [date, setDate] = useState('Tomorrow');
  const [time, setTime] = useState('1:30 PM');
  const [location, setLocation] = useState('Library Entrance');
  const [note, setNote] = useState('Will meet near the main staircase');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    planHandover(listingId, interestId, date, time, location, note);
    onClose();
  };

  const campusLocations = [
    'Library Entrance',
    'Main Canteen / Food Court',
    'Mechanical Workshop Gate',
    'CS Block Foyer (B-Block)',
    'Auditorium Lobby',
    'Sports Complex Quadrangle',
    'Hostel Gate 1',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white border border-stone-200 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-stone-900">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#292524]">Plan Campus Handover</h3>
              <p className="text-xs text-stone-500 font-medium">Arrange date, time, & public VNR location</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-purple-600" /> General Campus Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 focus:outline-none focus:border-purple-500"
            >
              {campusLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-600" /> Day / Date
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g. Tuesday / Tomorrow"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-600" /> Handover Time
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 1:30 PM (Lunch break)"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 focus:outline-none focus:border-purple-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Handover Notes <span className="text-stone-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Will carry a black backpack. Call me when near the gate."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-102"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Handover</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
