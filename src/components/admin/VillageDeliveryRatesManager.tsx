import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building,
  Store,
} from 'lucide-react';
import { VillageDeliveryRate, Shop } from '../../types';
import {
  listenToVillageRates,
  saveVillageDeliveryRate,
  deleteVillageDeliveryRate,
} from '../../services/dbService';

interface VillageRateRow {
  id?: string;
  villageName: string;
  deliveryCharge: string;
}

interface VillageDeliveryRatesManagerProps {
  shop?: Shop | null;
  fixedPinCode?: string;
}

export const VillageDeliveryRatesManager: React.FC<VillageDeliveryRatesManagerProps> = ({
  shop,
  fixedPinCode,
}) => {
  const [rates, setRates] = useState<VillageDeliveryRate[]>([]);

  // Automatically determine the single PIN code:
  // Precedence: shop.servicePinCode -> shop.postalCode -> fixedPinCode -> '794114'
  const shopPinCode = (
    shop?.servicePinCode ||
    shop?.postalCode ||
    fixedPinCode ||
    '794114'
  ).trim();

  // Dynamic rows strictly for this single assigned PIN
  const [villageRows, setVillageRows] = useState<VillageRateRow[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Subscribe to real-time village rates
  useEffect(() => {
    const unsub = listenToVillageRates((allRates) => {
      setRates(allRates);
    });
    return unsub;
  }, []);

  // Update villageRows whenever shopPinCode or rates change
  useEffect(() => {
    const currentPinRates = rates.filter((r) => r.pinCode === shopPinCode);

    if (currentPinRates.length > 0) {
      // Load all configured villages for this seller's single PIN
      setVillageRows(
        currentPinRates.map((r) => ({
          id: r.id,
          villageName: r.villageName,
          deliveryCharge: String(r.deliveryCharge),
        }))
      );
    } else {
      // Start with 1 clean empty row
      setVillageRows([
        {
          villageName: '',
          deliveryCharge: '10',
        },
      ]);
    }
  }, [shopPinCode, rates]);

  // Handle row changes
  const handleRowChange = (index: number, field: keyof VillageRateRow, value: string) => {
    const updated = [...villageRows];
    updated[index] = { ...updated[index], [field]: value };
    setVillageRows(updated);
  };

  // Add a new dynamic row
  const handleAddMoreRow = () => {
    const nextCharge =
      villageRows.length > 0
        ? String(Math.max(10, (Number(villageRows[villageRows.length - 1].deliveryCharge) || 10) + 5))
        : '10';

    setVillageRows((prev) => [
      ...prev,
      {
        villageName: '',
        deliveryCharge: nextCharge,
      },
    ]);
  };

  // Delete / Remove row
  const handleRemoveRow = (index: number) => {
    if (villageRows.length <= 1) {
      // Keep at least 1 editable row
      setVillageRows([{ villageName: '', deliveryCharge: '10' }]);
      return;
    }
    setVillageRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Save all configured villages under this single PIN
  const handleSaveAllForPin = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    const validRows = villageRows.filter((r) => r.villageName.trim().length > 0);

    if (validRows.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please enter at least one Village Name before saving.' });
      setIsSaving(false);
      return;
    }

    try {
      // 1. Delete previous rates for this PIN to ensure clean replacement
      const existing = rates.filter((r) => r.pinCode === shopPinCode);
      for (const item of existing) {
        await deleteVillageDeliveryRate(item.id);
      }

      // 2. Insert new dynamic rates for this single PIN
      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        const numCharge = Math.max(0, Number(row.deliveryCharge) || 10);
        const rateId = `vdr_${shopPinCode}_${i + 1}_${Date.now()}`;
        await saveVillageDeliveryRate({
          id: rateId,
          pinCode: shopPinCode,
          villageName: row.villageName.trim(),
          deliveryCharge: numCharge,
        });
      }

      setStatusMessage({
        type: 'success',
        text: `Successfully saved ${validRows.length} village delivery rates for PIN ${shopPinCode} into Supabase!`,
      });
    } catch (err: any) {
      console.error('Error saving village rates:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to save village delivery rates.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Quick preset template for convenience
  const handleLoadSampleTemplate = () => {
    if (shopPinCode === '794114') {
      setVillageRows([
        { villageName: 'Resubelpara Town Center', deliveryCharge: '10' },
        { villageName: 'Babukona Village', deliveryCharge: '15' },
        { villageName: 'Dekachang', deliveryCharge: '20' },
        { villageName: 'Daram Village', deliveryCharge: '25' },
        { villageName: 'Kaldang Village', deliveryCharge: '30' },
        { villageName: 'Mendipathar Bazaar', deliveryCharge: '35' },
        { villageName: 'Songma Village', deliveryCharge: '40' },
        { villageName: 'Damas Village', deliveryCharge: '45' },
        { villageName: 'Nokmakundi Village', deliveryCharge: '50' },
        { villageName: 'Khaldang Outer Hills', deliveryCharge: '60' },
      ]);
    } else {
      setVillageRows([
        { villageName: 'Main Bazaar Ward', deliveryCharge: '10' },
        { villageName: 'Central Sector Colony', deliveryCharge: '15' },
        { villageName: 'East Village Hamlet', deliveryCharge: '20' },
        { villageName: 'West Valley Point', deliveryCharge: '25' },
        { villageName: 'North Stream Area', deliveryCharge: '30' },
        { villageName: 'South Outskirts Block', deliveryCharge: '35' },
        { villageName: 'Forest Border Settlement', deliveryCharge: '40' },
        { villageName: 'Upper Ridge Village', deliveryCharge: '45' },
      ]);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-6">
      {/* Title & Shop Single PIN Lock Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Hyper-Local Village Delivery Rates Manager
              </h3>
              <p className="text-xs text-slate-500">
                Manage all villages and hyper-local delivery fees strictly under your registered shop location.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLoadSampleTemplate}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Load Sample Villages</span>
        </button>
      </div>

      {/* Single Registered PIN Code Card (Strict single-PIN operation) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-900 font-black shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-800 text-xs sm:text-sm">
                {shop?.shopName || 'Registered Shop Location'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                Single-PIN Locked
              </span>
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Operating City / Area: <span className="font-semibold text-slate-700">{shop?.city || 'Local Area'}</span> ({shop?.state || 'Meghalaya'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 self-start sm:self-auto shrink-0">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span className="text-slate-600 text-xs">Shop Operating PIN:</span>
          <span className="font-mono font-black text-sm text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
            {shopPinCode}
          </span>
        </div>
      </div>

      {/* Status Feedback */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Dynamic Village Rows Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Villages and Delivery Charges for PIN <strong className="text-indigo-900 font-mono text-sm">{shopPinCode}</strong>
          </span>
          <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            {villageRows.length} {villageRows.length === 1 ? 'Village' : 'Villages'} listed
          </span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 w-12 text-center">#</th>
                <th className="px-3 py-2.5">Village / Locality Name</th>
                <th className="px-3 py-2.5 w-48">Delivery Charge (₹)</th>
                <th className="px-3 py-2.5 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {villageRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="px-3 py-2 text-center font-bold text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      placeholder="e.g. Babukona Village"
                      value={row.villageName}
                      onChange={(e) => handleRowChange(idx, 'villageName', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-indigo-600 font-medium"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="10"
                        value={row.deliveryCharge}
                        onChange={(e) => handleRowChange(idx, 'deliveryCharge', e.target.value)}
                        className="w-full pl-6 pr-2.5 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-indigo-600 font-bold text-emerald-800"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Delete row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dynamic "+ Add More" Button & Save Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={handleAddMoreRow}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4 text-emerald-700" />
            <span>+ Add More</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAllForPin}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving to Supabase...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Villages for PIN {shopPinCode}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
