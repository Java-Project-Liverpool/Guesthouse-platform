import { useSyncExternalStore } from 'react';

import type { Stay } from '@/data/stays';

export const MAX_COMPARE_STAYS = 3;

export type CompareToggleResult = 'added' | 'removed' | 'full';

let selected: Stay[] = [];
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(next: Stay[]) {
  selected = next;
  listeners.forEach((listener) => listener());
}

export function toggleCompareStay(stay: Stay): CompareToggleResult {
  if (selected.some((item) => item.id === stay.id)) {
    emit(selected.filter((item) => item.id !== stay.id));
    return 'removed';
  }
  if (selected.length >= MAX_COMPARE_STAYS) return 'full';
  emit([...selected, stay]);
  return 'added';
}

export function useComparison() {
  const stays = useSyncExternalStore(subscribe, () => selected, () => selected);
  return {
    stays,
    isFull: stays.length >= MAX_COMPARE_STAYS,
    has: (id: string) => stays.some((stay) => stay.id === id),
    toggle: toggleCompareStay,
    remove: (id: string) => emit(selected.filter((stay) => stay.id !== id)),
    clear: () => emit([]),
  };
}
