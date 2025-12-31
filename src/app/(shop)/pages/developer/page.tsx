
'use client';

import { BrainCircuit, Code, Rocket, Blocks, ShieldCheck, Zap } from 'lucide-react';

const services = [
    {
        icon: <Rocket className="h-8 w-8 text-primary" />,
        title: "Phát triển Ứng dụng Web & Di động",
        description: "Chúng tôi xây dựng các ứng dụng tùy chỉnh, hiệu suất cao và có khả năng mở rộng trên nền tảng web và di động, đáp ứng chính xác nhu cầu kinh doanh của bạn."
    },
    {
        icon: <BrainCircuit className="h-8 w-8 text-primary" />,
        title: "Tích hợp Trí tuệ Nhân tạo (AI)",
        description: "Khai thác sức mạnh của AI để tự động hóa quy trình, phân tích dữ liệu và tạo ra các trải nghiệm người dùng thông minh. Chúng tôi chuyên về các giải pháp GenAI, học máy và xử lý ngôn ngữ tự nhiên."
    },
    {
        icon: <Blocks className="h-8 w-8 text-primary" />,
        title: "Tư vấn & Thiết kế Kiến trúc Hệ thống",
        description: "Đội ngũ kiến trúc sư của chúng tôi sẽ giúp bạn thiết kế một nền tảng công nghệ vững chắc, an toàn và sẵn sàng cho tương lai, từ microservices đến các giải pháp đám mây."
    },
     {
        icon: <Zap className="h-8 w-8 text-primary" />,
        title: "Tối ưu hóa Hiệu suất & Tự động hóa",
        description: "Phân tích và cải thiện hiệu suất của các hệ thống hiện có, đồng thời triển khai các giải pháp tự động hóa (automation) để giảm chi phí vận hành và tăng hiệu quả."
    },
];

const processSteps = [
    { number: "01", title: "Khám phá & Phân tích", description: "Chúng tôi bắt đầu bằng việc lắng nghe và phân tích sâu sắc các yêu cầu, mục tiêu và thách thức của bạn." },
    { number: "02", title: "Thiết kế & Lập kế hoạch", description: "Xây dựng một lộ trình chi tiết, thiết kế kiến trúc và giao diện người dùng tối ưu." },
    { number: "03", title: "Phát triển & Thử nghiệm", description: "Triển khai quá trình phát triển linh hoạt (Agile), đảm bảo chất lượng và tiến độ qua từng giai đoạn." },
    { number: "04", title: "Triển khai & Hỗ trợ", description: "Đưa giải pháp vào hoạt động và tiếp tục đồng hành, hỗ trợ, bảo trì để đảm bảo hệ thống vận hành ổn định." },
];

export default function DeveloperPage() {
    return (
        <div className="space-y-16 md:space-y-24">
            {/* Hero Section */}
            <section className="text-center pt-8 md:pt-16">
                <div className="container max-w-4xl">
                     <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-foreground">
                        Giải pháp Công nghệ & Lập trình
                    </h1>
                    <p className="mt-6 text-lg md:text-xl text-muted-foreground">
                        Chúng tôi biến những ý tưởng phức tạp thành các giải pháp công nghệ mạnh mẽ, hiệu quả và có khả năng mở rộng cho các doanh nghiệp và tập đoàn hàng đầu.
                    </p>
                </div>
            </section>

            {/* Services Section */}
            <section className="container">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Dịch vụ của chúng tôi</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Từ tư vấn chiến lược đến triển khai kỹ thuật, chúng tôi cung cấp một bộ giải pháp toàn diện.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                    {services.map((service, index) => (
                        <div key={index} className="p-6 border rounded-lg bg-card flex flex-col items-start gap-4 transition-all hover:shadow-lg hover:-translate-y-1">
                            {service.icon}
                            <h3 className="text-xl font-semibold">{service.title}</h3>
                            <p className="text-muted-foreground">{service.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Process Section */}
             <section className="container">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Quy trình làm việc của chúng tôi</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Một quy trình minh bạch và hiệu quả, được thiết kế để đảm bảo thành công cho dự án của bạn.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {processSteps.map((step) => (
                        <div key={step.number} className="p-6 border-l-4 border-primary bg-card space-y-3">
                            <span className="text-3xl font-bold text-primary">{step.number}</span>
                            <h3 className="text-xl font-semibold pt-2">{step.title}</h3>
                            <p className="text-muted-foreground">{step.description}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
