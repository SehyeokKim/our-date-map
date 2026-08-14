"use client";

import React, { useEffect, useRef } from "react";
import { X, Search, MapPin, Loader2, MapPinPlus } from "lucide-react";
import { useAddressSearch, AddressSearchResult } from "@/hooks/useAddressSearch";

interface AddressSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (result: AddressSearchResult) => void;
}

export const AddressSearchModal: React.FC<AddressSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
}) => {
  const { query, updateQuery, results, isSearching, reset } = useAddressSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      reset();
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/40 backdrop-blur-xs transition-all duration-300 pointer-events-auto">
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/60 max-h-[75vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <MapPinPlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">주소로 추가</h2>
              <p className="text-[10px] text-rose-100">주소나 장소 이름으로 검색해 핀을 찍어보세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-gray-100 bg-gray-50/60">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => updateQuery(e.target.value)}
              placeholder="예: 스타벅스 남산점, 목포시 해양대학로 77"
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="p-3 space-y-1.5 overflow-y-auto max-h-[50vh]">
          {isSearching ? (
            <div className="py-8 flex flex-col items-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p className="text-xs font-medium">검색 중...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center space-y-1.5">
              <div className="w-10 h-10 mx-auto rounded-full bg-rose-50 text-rose-300 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-gray-600">
                {query.trim() ? "검색 결과가 없습니다" : "장소나 주소를 입력해 주세요"}
              </p>
              {query.trim() === "" && (
                <p className="text-[11px] text-gray-400">도로명·지번 주소, 가게 이름 모두 검색됩니다</p>
              )}
            </div>
          ) : (
            results.map((result) => (
              <button
                key={result.id}
                onClick={() => onSelectLocation(result)}
                className="w-full flex items-center gap-3 p-2.5 bg-white border border-gray-100 rounded-2xl shadow-xs hover:border-rose-200 hover:bg-rose-50/50 active:scale-[0.98] transition-all cursor-pointer text-left"
              >
                <div className="w-8 h-8 shrink-0 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-gray-800 truncate">{result.name}</h3>
                    {result.category && (
                      <span className="shrink-0 text-[9px] font-bold text-rose-400 bg-rose-50 px-1.5 py-0.5 rounded-full">
                        {result.category}
                      </span>
                    )}
                  </div>
                  {result.address && (
                    <p className="text-[11px] text-gray-500 truncate">{result.address}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
