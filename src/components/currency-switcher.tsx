
'use client';

import { useCurrencyStore } from '@/store/currency';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function CurrencySwitcher() {
  const { selectedCurrency, setCurrency } = useCurrencyStore();

  return (
    <Select value={selectedCurrency} onValueChange={setCurrency}>
      <SelectTrigger className="w-24 border-0 bg-transparent shadow-none focus:ring-0">
        <SelectValue placeholder="Chọn tiền tệ" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="VND">VND</SelectItem>
        <SelectItem value="USD">USD</SelectItem>
        <SelectItem value="EUR">EUR</SelectItem>
      </SelectContent>
    </Select>
  );
}
