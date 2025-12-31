

import { FeedExporter } from "./_components/feed-exporter";

export default function ProductFeedsPage() {
    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-semibold">Xuất Dữ liệu Sản phẩm</h1>
                <p className="text-muted-foreground mt-1">
                    Xuất toàn bộ dữ liệu sản phẩm của bạn ra tệp XML hoặc CSV để lưu trữ hoặc sử dụng cho các nền tảng khác.
                </p>
            </div>
            <FeedExporter />
        </div>
    )
}
