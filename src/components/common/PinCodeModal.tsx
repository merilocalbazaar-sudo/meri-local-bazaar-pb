import React, { useState } from 'react';
import { X, MapPin, CheckCircle2, AlertCircle, Building, Store, Sparkles } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';

export const PinCodeModal: React.FC = () => {
  const { buyerPinCode, setBuyerPinCode, isPinModalOpen, setIsPinModalOpen } = useLocation();
  const [inputPin, setInputPin] = useState(buyerPinCode);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isPinModalOpen) return null;

  const handleApplyPin = async (pinToApply: string) => {
    const cleanPin = pinToApply.trim();
    if (!cleanPin || !/^\d{6}$/.test(cleanPin)) {
      setErrorMsg('Please enter a valid 6-digit PIN code (e.g. 123456).');
      return;
    }

    setErrorMsg(null);
    await setBuyerPinCode(cleanPin);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsPinModalOpen(false);
    }, 600);
  };

  const demoLocations = [
    {
      pin: '794114',
      label: 'Resubelpara Center',
      desc: 'Dada shop & Sangma marak',
      tag: 'Local Active Hub',
    },
    {
      pin: '794001',
      label: 'Tura Bazaar Zone',
      desc: 'Marak store',
      tag: 'West Garo Hills',
    },
    {
      pin: '560100',
      label: 'Outer Zone',
      desc: 'Non-local zone verification',
      tag: 'Testing Outside Area',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 bg-[#2874f0] text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-yellow-300" />
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Select Delivery PIN Code</h3>
              <p className="text-[11px] text-blue-100">Local Buyer-to-Seller Matching System</p>
            </div>
          </div>
          <button
            onClick={() => setIsPinModalOpen(false)}
            className="p-1 rounded-full hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed">
            <span className="font-bold flex items-center gap-1 text-blue-950 mb-1">
              <Store className="w-4 h-4 text-[#2874f0]" />
              Local Area Purchasing Rule:
            </span>
            You can purchase products <strong>only from sellers whose service PIN matches your delivery PIN</strong>. Products outside your PIN will show:
            <div className="mt-1 font-semibold italic text-amber-900 bg-amber-50 p-1.5 rounded border border-amber-200">
              "Sorry, this product is currently available only in your local area."
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-1.5 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-lg flex items-center gap-1.5 border border-emerald-200 font-bold animate-pulse">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Delivery PIN code updated! Recalculating local sellers...</span>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleApplyPin(inputPin);
            }}
            className="space-y-2"
          >
            <label className="block text-xs font-bold text-slate-700">Enter Your 6-Digit Delivery PIN</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  maxLength={6}
                  value={inputPin}
                  onChange={(e) => {
                    setInputPin(e.target.value.replace(/\D/g, ''));
                    setErrorMsg(null);
                  }}
                  placeholder="e.g. 794114"
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base font-bold border border-slate-300 rounded-xl outline-none focus:border-[#2874f0] focus:ring-2 focus:ring-blue-100 transition min-h-[44px]"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#2874f0] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition min-h-[44px] cursor-pointer touch-manipulation active:scale-95 flex items-center justify-center"
              >
                Apply
              </button>
            </div>
          </form>

          {/* Quick Select for Testing */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Quick Test Hubs</span>
              <span className="text-yellow-600 flex items-center gap-0.5 text-[10px]">
                <Sparkles className="w-3 h-3" /> 1-Click Switch
              </span>
            </div>

            <div className="space-y-2">
              {demoLocations.map((loc) => {
                const isActive = buyerPinCode === loc.pin;
                return (
                  <button
                    key={loc.pin}
                    type="button"
                    onClick={() => {
                      setInputPin(loc.pin);
                      handleApplyPin(loc.pin);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-blue-50/80 border-[#2874f0] ring-1 ring-[#2874f0]'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">PIN {loc.pin}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">
                          {loc.tag}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{loc.desc}</div>
                    </div>
                    <span className="text-xs font-semibold text-[#2874f0]">Select</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={() => setIsPinModalOpen(false)}
            className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
