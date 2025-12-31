

'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { LoaderCircle, PlusCircle, Trash2, Save, Globe } from 'lucide-react';
import type { TaxRate } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { addOrUpdateTaxRate, deleteTaxRate, updateDefaultTaxCountry } from '../../actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { countries } from '../countries';

const taxRateSchema = z.object({
  countryCode: z.string().min(2),
  countryName: z.string().min(1),
  rate: z.coerce.number().min(0, "Tỷ lệ phải là số không âm.").max(1, "Tỷ lệ không được lớn hơn 1 (100%)."),
  isEnabled: z.boolean(),
  id: z.string().optional(),
});

const formSchema = z.object({
  taxRates: z.array(taxRateSchema),
  defaultCountryCode: z.string().min(1, "Vui lòng chọn quốc gia mặc định."),
});

type FormValues = z.infer<typeof formSchema>;

interface TaxSettingsFormProps {
  initialTaxRates: TaxRate[];
  initialDefaultCountry: string;
}

export function TaxSettingsForm({ initialTaxRates, initialDefaultCountry }: TaxSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taxRates: initialTaxRates || [],
      defaultCountryCode: initialDefaultCountry || 'VN',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'taxRates',
  });

  const onSubmit = async (data: FormValues) => {
    startTransition(async () => {
      try {
        await Promise.all([
          ...data.taxRates.map(rate => addOrUpdateTaxRate({
              countryCode: rate.countryCode,
              countryName: rate.countryName,
              rate: rate.rate,
              isEnabled: rate.isEnabled
          }, rate.id)),
          updateDefaultTaxCountry({ tax: { defaultCountryCode: data.defaultCountryCode }})
        ]);
        
        toast({
          title: 'Thành công!',
          description: 'Cài đặt thuế đã được cập nhật.',
        });
        form.reset(data, { keepDirtyValues: true });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Lỗi!',
          description: error.message || 'Đã có lỗi xảy ra khi cập nhật.',
        });
      }
    });
  };

  const handleAddNewRate = () => {
    append({ countryCode: 'US', countryName: 'United States', rate: 0.07, isEnabled: true });
  };
  
  const handleRemoveRate = async (index: number) => {
    const rateToDelete = fields[index];
    if (rateToDelete.id) {
        startTransition(async () => {
            try {
                await deleteTaxRate(rateToDelete.id!);
                remove(index);
                toast({ title: 'Đã xóa quy tắc thuế.' });
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Lỗi!', description: error.message });
            }
        });
    } else {
         remove(index);
    }
  }

  const handleCountryChange = (value: string, index: number) => {
    const country = countries.find(c => c.code === value);
    if (country) {
      form.setValue(`taxRates.${index}.countryName`, country.name, { shouldDirty: true });
      form.setValue(`taxRates.${index}.countryCode`, country.code, { shouldDirty: true });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Quy tắc thuế theo Quốc gia</CardTitle>
            <CardDescription>
              Thêm và quản lý các mức thuế suất cho từng quốc gia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-md bg-secondary/50">
                   <div className="col-span-12 md:col-span-5">
                     <FormField
                        control={form.control}
                        name={`taxRates.${index}.countryCode`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quốc gia</FormLabel>
                                 <Select onValueChange={(value) => handleCountryChange(value, index)} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Chọn quốc gia..." /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {countries.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                        />
                   </div>
                  <div className="col-span-6 md:col-span-3">
                    <FormField
                      control={form.control}
                      name={`taxRates.${index}.rate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tỷ lệ (ví dụ: 0.08)</FormLabel>
                          <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                   <div className="col-span-3 md:col-span-2 flex items-center h-10">
                     <FormField
                        control={form.control}
                        name={`taxRates.${index}.isEnabled`}
                        render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <FormLabel>Bật</FormLabel>
                            </FormItem>
                        )}
                        />
                   </div>
                  <div className="col-span-3 md:col-span-2">
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveRate(index)} disabled={isPending}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddNewRate}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm quy tắc thuế
            </Button>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Cài đặt mặc định</CardTitle>
            </CardHeader>
            <CardContent>
                  <FormField
                    control={form.control}
                    name="defaultCountryCode"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Quốc gia mặc định</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Chọn quốc gia mặc định" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {countries.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormDescription>Thuế sẽ được tính theo quốc gia này nếu không thể xác định được vị trí khách hàng.</FormDescription>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>

        <div className="flex justify-end">
             <Button type="submit" disabled={isPending || !form.formState.isDirty}>
                {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Lưu cài đặt thuế
            </Button>
        </div>
      </form>
    </Form>
  );
}
