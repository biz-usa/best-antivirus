
'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useProductStore } from '@/store/product';
import { useDebouncedCallback } from 'use-debounce';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';

export function SearchBar() {
  const { searchTerm, setSearchTerm } = useProductStore();
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  const debouncedSetSearchTerm = useDebouncedCallback((value) => {
    setSearchTerm(value);
  }, 300);

  useEffect(() => {
    // Sync local state with store state if it changes from outside
    // This happens when clicking a popular search term or when filters clear the term.
    if (searchTerm !== localSearchTerm) {
      setLocalSearchTerm(searchTerm);
    }
  }, [searchTerm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setLocalSearchTerm(value);
    debouncedSetSearchTerm(value);
  }

  const handleSearchClick = () => {
    setSearchTerm(localSearchTerm);
  }

  return (
    <div className="flex w-full items-center space-x-2">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Tìm kiếm sản phẩm..."
          className="w-full pl-10"
          onChange={handleChange}
          value={localSearchTerm}
        />
      </div>
       <Button type="button" size="icon" onClick={handleSearchClick}>
          <Search className="h-5 w-5" />
          <span className="sr-only">Tìm kiếm</span>
        </Button>
    </div>
  );
}
