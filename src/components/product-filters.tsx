

'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';
import type { Category, ShopFilter } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useProductStore } from '@/store/product';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';

interface ProductFiltersProps {
  categories: Category[];
  brands: string[];
  licenseTypes: string[];
  enabledFilters: ShopFilter[];
}

export function ProductFilters({ categories, brands, licenseTypes, enabledFilters }: ProductFiltersProps) {
  const { 
    selectedCategories, 
    selectedBrands, 
    selectedLicenseTypes,
    toggleCategory,
    toggleBrand,
    toggleLicenseType,
    onSale,
    inStock,
    newArrivals,
    setOnSale,
    setInStock,
    setNewArrivals,
  } = useProductStore();

  const filterGroups = useMemo(() => [
    {
      id: 'categories',
      name: 'Danh mục',
      options: categories.map(c => ({ value: c.slug, label: c.name })),
      selected: selectedCategories,
      toggle: toggleCategory,
      enabled: enabledFilters.find(f => f.id === 'categories')?.enabled,
      isAccordion: true,
    },
    {
      id: 'brands',
      name: 'Thương hiệu',
      options: brands.map(b => ({ value: b, label: b })),
      selected: selectedBrands,
      toggle: toggleBrand,
      enabled: enabledFilters.find(f => f.id === 'brands')?.enabled,
       isAccordion: true,
    },
    {
      id: 'licenseTypes',
      name: 'Loại giấy phép',
      options: licenseTypes.map(l => ({ value: l, label: l === 'Subscription' ? 'Theo tháng/năm' : 'Vĩnh viễn' })),
      selected: selectedLicenseTypes,
      toggle: toggleLicenseType,
      enabled: enabledFilters.find(f => f.id === 'licenseTypes')?.enabled,
       isAccordion: true,
    },
  ], [categories, brands, licenseTypes, selectedCategories, selectedBrands, selectedLicenseTypes, toggleCategory, toggleBrand, toggleLicenseType, enabledFilters]);
  
  const toggleFilters = [
    {
        id: 'onSale',
        name: 'Đang giảm giá',
        enabled: enabledFilters.find(f => f.id === 'onSale')?.enabled,
        checked: onSale,
        toggle: setOnSale,
    },
    {
        id: 'inStock',
        name: 'Có hàng',
        enabled: enabledFilters.find(f => f.id === 'inStock')?.enabled,
        checked: inStock,
        toggle: setInStock,
    },
    {
        id: 'newArrivals',
        name: 'Hàng mới',
        enabled: enabledFilters.find(f => f.id === 'newArrivals')?.enabled,
        checked: newArrivals,
        toggle: setNewArrivals,
    },
  ];

  return (
    <>
      <h2 className="text-lg font-semibold mb-2">Bộ lọc</h2>
      <div className="space-y-4">
        {toggleFilters.filter(f => f.enabled).map((filter) => (
             <div key={filter.id} className="flex items-center justify-between">
                <Label htmlFor={filter.id} className="font-medium cursor-pointer">{filter.name}</Label>
                <Switch 
                    id={filter.id}
                    checked={filter.checked}
                    onCheckedChange={filter.toggle}
                />
            </div>
        ))}
      </div>
       <Separator className="my-4" />
      <Accordion type="multiple" defaultValue={filterGroups.map(g => g.id)} className="w-full">
        {filterGroups.filter(g => g.enabled && g.isAccordion).map((group) => (
          <AccordionItem value={group.id} key={group.id}>
            <AccordionTrigger className="text-base font-medium">{group.name}</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-2">
                {group.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${group.id}-${option.value}`}
                      checked={group.selected.includes(option.value)}
                      onCheckedChange={(checked) => group.toggle(option.value, !!checked)}
                    />
                    <Label
                      htmlFor={`${group.id}-${option.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  );
}
