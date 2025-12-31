
'use client';

import { 
    ChartContainer, 
    ChartTooltip, 
    ChartTooltipContent 
} from "@/components/ui/chart";
import type { DailyRevenue } from "@/lib/types";
import { 
    Bar, 
    BarChart, 
    ResponsiveContainer,
    XAxis,
    YAxis
} from "recharts";

interface RevenueChartProps {
    data: DailyRevenue[];
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
}).format(amount);

const chartConfig = {
    revenue: {
      label: "Doanh thu",
      color: "hsl(var(--primary))",
    },
};

export function RevenueChart({ data }: RevenueChartProps) {

    return (
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart accessibilityLayer data={data}>
                    <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("vi-VN", { day: "numeric", month: "short" });
                    }}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value / 1000000}Tr`}
                />
                <ChartTooltip 
                        cursor={false}
                    content={<ChartTooltipContent
                        labelFormatter={(label) => new Date(label).toLocaleDateString("vi-VN", {day: "numeric", month: "long", year:"numeric"})}
                        formatter={(value) => formatCurrency(value as number)}
                        indicator="dot"
                        />} 
                />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            </BarChart>
        </ChartContainer>
    );
}
