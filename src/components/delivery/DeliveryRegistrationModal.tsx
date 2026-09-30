import React, { useState } from 'react';
import { X, Bike, CreditCard, ShieldCheck, MapPin, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { registerDeliveryPartner } from '../../services/dbService';

interface DeliveryRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistered: () => void;
}

export const DeliveryRegistrationModal: React.FC<DeliveryRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegistered,
}) => {
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '+91 ');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [dateOfBirth, setDateOfBirth] = useState('1998-05-15');
  const [address, setAddress] = useState('');
  const [serviceArea, setServiceArea] = useState('Bengaluru South');
  const [vehicleType, setVehicleType] = useState<'Bike' | 'Scooter' | 'Bicycle' | 'Electric Vehicle' | 'Other'>('Bike');
  const [vehicleNumber, setVehicleNumber] = useState('KA-01-AB-1234');
  const [drivingLicenceNumber, setDrivingLicenceNumber] = useState('DL-KA-2020-001234');
  const [idProofNumber, setIdProofNumber] = useState('1234-5678-9012');

  // Bank & UPI
  const [accountHolderName, setAccountHolderName] = useState(user?.displayName || '');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [upiId, setUpiId] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Please sign in first.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await registerDeliveryPartner({
        id: user.uid,
        fullName,
        email,
        phoneNumber,
        photoURL: photoURL || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        dateOfBirth,
        address,
        serviceArea,
        vehicleType,
        vehicleNumber,
        drivingLicenceNumber,
        idProofNumber,
        bankDetails: {
          accountHolderName,
          accountNumber,
          ifsc,
          upiId,
        },
      });

      onRegistered();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-600 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <Bike className="w-6 h-6 text-yellow-200" />
            <div>
              <h2 className="text-base sm:text-lg font-bold">Delivery Partner Registration</h2>
              <p className="text-xs text-amber-100">Earn up to ₹800/day on flexible local deliveries</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Personal Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider">Personal Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Phone Number (WhatsApp) *</label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-amber-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-medium mb-1">Residential Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Complete residential address"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Service Area / Zone *</label>
                <input
                  type="text"
                  required
                  value={serviceArea}
                  onChange={(e) => setServiceArea(e.target.value)}
                  placeholder="e.g. Koramangala & HSR"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Govt ID / Aadhaar Number *</label>
                <input
                  type="text"
                  required
                  value={idProofNumber}
                  onChange={(e) => setIdProofNumber(e.target.value)}
                  placeholder="1234-5678-9012"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-amber-600"
                />
              </div>
            </div>
          </div>

          {/* Vehicle & License */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider">Vehicle & License Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Vehicle Type *</label>
                <select
                  value={vehicleType}
                  onChange={(e: any) => setVehicleType(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-amber-600"
                >
                  <option value="Bike">Motorcycle / Bike</option>
                  <option value="Scooter">Scooter / Scooty</option>
                  <option value="Electric Vehicle">Electric 2-Wheeler (EV)</option>
                  <option value="Bicycle">Bicycle</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Vehicle Number Plate *</label>
                <input
                  type="text"
                  required
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="KA-01-AB-1234"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-amber-600 uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Driving License Number *</label>
                <input
                  type="text"
                  required
                  value={drivingLicenceNumber}
                  onChange={(e) => setDrivingLicenceNumber(e.target.value.toUpperCase())}
                  placeholder="DL-042011001234"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-amber-600 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Bank & Settlement Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-amber-700" />
              <span>Earnings Payout & UPI Details</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  required
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">UPI ID (Fast Payouts) *</label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@okhdfcbank"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Bank Account Number *</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Bank IFSC Code *</label>
                <input
                  type="text"
                  required
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  placeholder="SBIN0001234"
                  className="w-full p-2 border border-slate-300 rounded bg-white outline-none focus:border-amber-600 uppercase"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Your profile will be reviewed and verified by Admin. Once approved, you can turn on "Go Online" mode to receive and complete instant delivery assignments.
            </span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Submitting Application...' : 'Submit Delivery Partner Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
