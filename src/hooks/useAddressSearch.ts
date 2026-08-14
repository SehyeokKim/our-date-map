"use client";

import { useCallback, useRef, useState } from "react";

export interface AddressSearchResult {
  id: string;
  name: string;
  address: string;
  category?: string;
  lat: number;
  lng: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- Kakao SDK objects are untyped */

/**
 * Kakao Maps SDK(services 라이브러리) 기반 주소/장소 검색 훅.
 * Geocoder.addressSearch(주소)와 Places.keywordSearch(장소명)를 병렬 실행해 병합하며,
 * 300ms 디바운스와 응답 순서 역전 방지(sequence guard)를 내장한다.
 */
export function useAddressSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const requestSeqRef = useRef(0);

  const runSearch = useCallback(async (q: string): Promise<AddressSearchResult[]> => {
    const kakao = (window as any).kakao;
    if (!q.trim() || !kakao?.maps?.services) return [];

    const geocoder = new kakao.maps.services.Geocoder();
    const places = new kakao.maps.services.Places();

    const addressPromise = new Promise<AddressSearchResult[]>((resolve) => {
      geocoder.addressSearch(q, (result: any[], status: string) => {
        if (status === kakao.maps.services.Status.OK && result.length > 0) {
          resolve(
            result.slice(0, 5).map((r) => ({
              id: `addr_${r.x}_${r.y}`,
              name: r.road_address?.address_name || r.address_name,
              address: r.address?.address_name || r.address_name,
              lat: parseFloat(r.y),
              lng: parseFloat(r.x),
            }))
          );
        } else {
          resolve([]);
        }
      });
    });

    const keywordPromise = new Promise<AddressSearchResult[]>((resolve) => {
      places.keywordSearch(q, (result: any[], status: string) => {
        if (status === kakao.maps.services.Status.OK && result.length > 0) {
          resolve(
            result.slice(0, 10).map((r) => ({
              id: `place_${r.id}`,
              name: r.place_name,
              address: r.road_address_name || r.address_name,
              category: r.category_group_name || undefined,
              lat: parseFloat(r.y),
              lng: parseFloat(r.x),
            }))
          );
        } else {
          resolve([]);
        }
      });
    });

    const [addressResults, keywordResults] = await Promise.all([addressPromise, keywordPromise]);

    const seen = new Set<string>();
    return [...addressResults, ...keywordResults]
      .filter((r) => {
        const key = `${r.lat.toFixed(6)},${r.lng.toFixed(6)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 15);
  }, []);

  const updateQuery = useCallback(
    (q: string) => {
      setQuery(q);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!q.trim()) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      debounceRef.current = setTimeout(async () => {
        const seq = ++requestSeqRef.current;
        const found = await runSearch(q);
        if (seq === requestSeqRef.current) {
          setResults(found);
          setIsSearching(false);
        }
      }, 300);
    },
    [runSearch]
  );

  const reset = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    requestSeqRef.current += 1;
    setQuery("");
    setResults([]);
    setIsSearching(false);
  }, []);

  return { query, updateQuery, results, isSearching, reset };
}
