"use client";

import React from "react";
import { ClaimItemDTO } from "@/types/receipt";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ClipboardList,
  Lightbulb,
  X,
  Check,
  ShoppingBag,
} from "lucide-react";

interface EditableReceiptItemsProps {
  items: ClaimItemDTO[];
  receiptTotal: number;
  onItemsChange: (items: ClaimItemDTO[]) => void;
}

export function EditableReceiptItems({
  items,
  receiptTotal,
  onItemsChange,
}: EditableReceiptItemsProps) {
  // Toggle claim checkbox for an item
  const handleToggleClaim = (index: number) => {
    const next = [...items];
    next[index] = { ...next[index], isClaimed: !next[index].isClaimed };
    onItemsChange(next);
  };

  // Inline field edit
  const handleFieldChange = (
    index: number,
    field: keyof ClaimItemDTO,
    value: string | number
  ) => {
    const next = [...items];
    const current = { ...next[index] };

    if (field === "name") {
      current.name = String(value);
    } else if (field === "quantity") {
      const q = Math.max(1, parseInt(String(value), 10) || 1);
      current.quantity = q;
      current.totalPrice = Number((q * current.unitPrice).toFixed(2));
    } else if (field === "unitPrice") {
      const p = Math.max(0, parseFloat(String(value)) || 0);
      current.unitPrice = p;
      current.totalPrice = Number((current.quantity * p).toFixed(2));
    } else if (field === "totalPrice") {
      current.totalPrice = Math.max(0, parseFloat(String(value)) || 0);
    }

    next[index] = current;
    onItemsChange(next);
  };

  // Add empty row
  const handleAddRow = () => {
    onItemsChange([
      ...items,
      {
        id: `manual-${Date.now()}`,
        name: "รายการเพิ่มเติม",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        isClaimed: true,
      },
    ]);
  };

  // Delete row
  const handleDeleteRow = (index: number) => {
    if (items.length <= 1) return;
    onItemsChange(items.filter((_, i) => i !== index));
  };

  // Check if VAT item exists in the list
  const hasVatItem = items.some((it) => /ภาษีมูลค่าเพิ่ม|vat/i.test(it.name));

  // Add VAT 7% row
  const handleAddVatRow = () => {
    const diff =
      receiptTotal > allItemsSum
        ? Number((receiptTotal - allItemsSum).toFixed(2))
        : Number((allItemsSum * 0.07).toFixed(2));

    onItemsChange([
      ...items,
      {
        id: `vat-${Date.now()}`,
        name: "ภาษีมูลค่าเพิ่ม 7% (VAT 7%)",
        quantity: 1,
        unitPrice: diff,
        totalPrice: diff,
        isClaimed: true,
      },
    ]);
  };

  // Calculations
  const allItemsSum = items.reduce((acc, it) => acc + (it.totalPrice || 0), 0);
  const claimableAmount = items
    .filter((it) => it.isClaimed)
    .reduce((acc, it) => acc + (it.totalPrice || 0), 0);
  const personalAmount = items
    .filter((it) => !it.isClaimed)
    .reduce((acc, it) => acc + (it.totalPrice || 0), 0);

  // Discrepancy warning check: compare total of all items with OCR receiptTotal
  const hasDiscrepancy =
    receiptTotal > 0 && Math.abs(allItemsSum - receiptTotal) > 0.05;

  return (
    <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-[0_4px_20px_-3px_rgba(15,23,42,0.06)] space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              รายการสินค้าที่ AI ตรวจพบ ({items.length} รายการ)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              แก้ไขได้
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            แตะเลือกของส่วนตัวออก เพื่อไม่นำไปคิดรวมในยอดเบิกเงินค่าย
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!hasVatItem && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddVatRow}
              className="gap-1.5 text-xs text-indigo-700 bg-indigo-50/70 border-indigo-200 hover:bg-indigo-100 shadow-sm"
              title="เพิ่มรายการภาษีมูลค่าเพิ่ม 7%"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>เพิ่ม VAT 7%</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            className="gap-1.5 text-xs shadow-sm hover:shadow"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            เพิ่มรายการ
          </Button>
        </div>
      </div>

      {/* Discrepancy Warning Badge */}
      {hasDiscrepancy ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-amber-50 text-amber-900 text-xs shadow-sm border border-amber-200/60">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">
                ผลรวมรายการไม่ตรงกับยอดท้ายบิล (Discrepancy):
              </span>
              <span className="text-amber-800 text-[11px] sm:text-xs">
                ผลรวมสินค้า ({formatCurrency(allItemsSum)}) ไม่ตรงกับยอดท้ายบิลกระดาษ ({formatCurrency(receiptTotal)})
                {receiptTotal > allItemsSum && ` ขาดอยู่ ${formatCurrency(receiptTotal - allItemsSum)} (อาจเป็นภาษีมูลค่าเพิ่ม VAT หรือค่าบริการ)`}
              </span>
            </div>
          </div>

          {receiptTotal > allItemsSum && !hasVatItem && (
            <button
              type="button"
              onClick={handleAddVatRow}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ เพิ่ม VAT {formatCurrency(receiptTotal - allItemsSum)} ลงในรายการ</span>
            </button>
          )}
        </div>
      ) : receiptTotal > 0 ? (
        <div className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-[11px] sm:text-xs">
            ผลรวมรายการสินค้าในบิลตรงกับยอดท้ายบิล ({formatCurrency(receiptTotal)}) ครบถ้วน
          </span>
        </div>
      ) : null}

      {/* 1. MOBILE PHONE CARDS VIEW (Visible only on mobile sm:hidden) */}
      <div className="sm:hidden space-y-3">
        {items.map((item, index) => {
          const isClaimed = item.isClaimed;

          return (
            <div
              key={item.id || index}
              className={`p-3.5 rounded-2xl transition-all shadow-sm ${
                isClaimed
                  ? "bg-slate-50 border border-blue-100"
                  : "bg-red-50/50 border border-red-100 opacity-80"
              }`}
            >
              {/* Item Status Toggle & Delete */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60">
                <button
                  type="button"
                  onClick={() => handleToggleClaim(index)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    isClaimed
                      ? "bg-blue-600 text-white shadow-blue-500/20"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {isClaimed ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>เบิกงบค่าย</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>ของส่วนตัว (ตัดออก)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteRow(index)}
                  disabled={items.length <= 1}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-20"
                  title="ลบรายการ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Item Name Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    ชื่อสินค้า / รายการ
                  </label>
                  {/ภาษีมูลค่าเพิ่ม|vat/i.test(item.name) && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded">
                      VAT 7%
                    </span>
                  )}
                </div>
                <Input
                  type="text"
                  value={item.name}
                  onChange={(e) =>
                    handleFieldChange(index, "name", e.target.value)
                  }
                  className="h-9 text-xs bg-white font-medium"
                  placeholder="ชื่อสินค้า"
                />
              </div>

              {/* Quantity, Unit Price, and Total */}
              <div className="grid grid-cols-3 gap-2 mt-2 pt-1 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">
                    จำนวน
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      handleFieldChange(index, "quantity", e.target.value)
                    }
                    className="h-8 text-xs text-center bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">
                    ราคา/หน่วย
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) =>
                      handleFieldChange(index, "unitPrice", e.target.value)
                    }
                    className="h-8 text-xs text-right bg-white"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-slate-400 block">
                    รวมเงิน
                  </label>
                  <div className="h-8 flex items-center justify-end font-black text-slate-900 text-xs">
                    {formatCurrency(item.totalPrice)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Mobile Add Item Button */}
        <button
          type="button"
          onClick={handleAddRow}
          className="w-full py-2.5 rounded-2xl border-2 border-dashed border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4 text-blue-600" />
          <span>เพิ่มรายการสินค้า</span>
        </button>
      </div>

      {/* 2. DESKTOP TABLE VIEW (Visible only on sm: and up) */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl bg-slate-50/60 p-2 shadow-inner">
        <table className="w-full text-left text-xs">
          <thead className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-3 w-12 text-center">เบิกค่าย</th>
              <th className="p-3">ชื่อรายการสินค้า (Item Description)</th>
              <th className="p-3 w-20 text-center">จำนวน</th>
              <th className="p-3 w-28 text-right">ราคาต่อหน่วย</th>
              <th className="p-3 w-28 text-right">รวมเงิน</th>
              <th className="p-3 w-10 text-center">ลบ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => {
              const isExcluded = !item.isClaimed;

              return (
                <tr
                  key={item.id || index}
                  className={`transition-colors rounded-xl ${
                    isExcluded
                      ? "bg-red-50/50 text-slate-400"
                      : "hover:bg-white text-slate-800"
                  }`}
                >
                  {/* Checkbox */}
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={item.isClaimed}
                      onChange={() => handleToggleClaim(index)}
                      className="w-4 h-4 rounded text-blue-600 border-none bg-white shadow-sm focus:ring-blue-500 cursor-pointer"
                      title={item.isClaimed ? "ติ๊กเพื่อไม่เบิกรายการนี้ (ของส่วนตัว)" : "ติ๊กเพื่อเบิกรายการนี้"}
                    />
                  </td>

                  {/* Name Input */}
                  <td className="p-2">
                    <div className="relative">
                      <Input
                        type="text"
                        value={item.name}
                        onChange={(e) =>
                          handleFieldChange(index, "name", e.target.value)
                        }
                        className={`h-8 text-xs font-medium ${
                          isExcluded ? "text-slate-400 bg-slate-100/50" : "text-slate-900 bg-white"
                        }`}
                        placeholder="ชื่อรายการสินค้า"
                      />
                      {isExcluded && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-red-600 font-semibold">
                          <X className="w-3 h-3" /> ของส่วนตัว (ไม่นำไปเบิกค่าย)
                        </span>
                      )}
                      {!isExcluded && /ภาษีมูลค่าเพิ่ม|vat/i.test(item.name) && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">
                          ภาษีมูลค่าเพิ่ม (VAT 7%)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="p-2">
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        handleFieldChange(index, "quantity", e.target.value)
                      }
                      className="h-8 text-xs text-center bg-white"
                    />
                  </td>

                  {/* Unit Price */}
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleFieldChange(index, "unitPrice", e.target.value)
                      }
                      className="h-8 text-xs text-right bg-white"
                    />
                  </td>

                  {/* Total Price */}
                  <td className="p-3 text-right font-black text-slate-900 whitespace-nowrap">
                    {formatCurrency(item.totalPrice)}
                  </td>

                  {/* Delete Button */}
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(index)}
                      disabled={items.length <= 1}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 disabled:opacity-20 transition"
                      title="ลบแถวนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Real-time Summary Footer */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-500 space-y-1">
          {personalAmount > 0 && (
            <div className="flex items-center gap-1.5 text-red-600 font-semibold text-[11px] sm:text-xs">
              <X className="w-3.5 h-3.5" />
              <span>ตัดของส่วนตัวออก:</span>
              <span className="font-bold">-{formatCurrency(personalAmount)}</span>
            </div>
          )}
          <div className="text-slate-400 text-[11px] sm:text-xs">
            ยอดรวมในบิลทั้งหมด: <span className="font-bold text-slate-700">{formatCurrency(allItemsSum)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
          <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
            ยอดขอเบิกสุทธิ:
          </span>
          <span className="text-xl sm:text-2xl font-black text-blue-600 tracking-tight">
            {formatCurrency(claimableAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}
