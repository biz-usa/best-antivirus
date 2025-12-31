'use client';

import { CategoryForm } from './category-form';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export function AddCategoryForm() {
    return (
         <Card>
            <CardHeader>
                <CardTitle>Thêm danh mục mới</CardTitle>
                <CardDescription>
                    Điền thông tin danh mục bạn muốn thêm.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <CategoryForm />
            </CardContent>
        </Card>
    );
}
