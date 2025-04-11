import banner1 from "@/assets/imgs/banner1.png";
import banner2 from "@/assets/imgs/banner2.jpg";
import banner3 from "@/assets/imgs/banner3.png";
import sub from "@/assets/imgs/sub.png";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAccount } from "@/hooks/useAccount";
import ImageCarousel from "@/components/Carousel"; // Import component Carousel

const carouselImages = [
  banner1, // Hình ảnh hiện tại
  banner2, // Thay thế với đường dẫn thực tế
  banner3, // Thay thế với đường dẫn thực tế
];

export default function HomePage() {
  const { data: account } = useAccount();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="grid lg:grid-cols-2 gap-4 items-center lg:mx-7 sm:mx-5 mx-3 flex-1 mt-3">
        <div className="space-y-8 rounded-lg p-14 mt-[40px] mb-[10px]">
          <div className="flex flex-col w-fit">
            <h1 className="text-4xl font-bold">
              NỀN TẢNG QUẢN LÝ <span className="text-primary">ĐIỆN NĂNG</span>
            </h1>
            <img src={sub} alt="placeholder" className="self-end w-60 h-8" />
            <h5 className="text-2xl font-bold">
              TỐI ƯU CHI PHÍ <span className="text-primary">& HIỆU QUẢ VƯỢT TRỘI</span>
            </h5>
          </div>
          <p className="italic text-secondary max-w-xl">
            Nền tảng quản lý điện năng là một hệ thống hiện đại, giúp theo dõi, 
            phân tích và tối ưu hóa mức tiêu thụ điện của các thiết bị trong thời gian thực. 
            Hệ thống này cung cấp dữ liệu chính xác để người dùng dễ dàng kiểm soát và điều chỉnh mức 
            sử dụng điện một cách hợp lý.
          </p>
          <div className="mt-5 flex items-center gap-5">
            <Link to="/dashboardIOT">
              <Button variant="secondary" size="lg">
                Dashboard của tôi
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="link" className="text-secondary">
                Thông tin chi tiết
              </Button>
            </Link>
          </div>
        </div>
        <div>
            <div className="w-full h-full object-cover ml-30 rounded-3xl">
              <ImageCarousel images={carouselImages} className=" w-110 h-110 " />
            </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-16 ">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tại sao chọn <span className="text-primary">POWER HUB</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-4xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#F1F0E8] py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-dark mb-6">
            Bắt đầu kết nối với chúng tôi
          </h2>
          <p className="text-dark-100 mb-8 max-w-2xl mx-auto">
            Nếu bạn đang cần một phương pháp thông minh cho ngôi nhà của bạn
          </p>
          <Link to="/dashboardIOT">
            <Button variant="secondary" size="lg" className="font-semibold">
              Dashboard của tôi
            </Button>
          </Link>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            BLOG XU HƯỚNG
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {specialties.map((specialty, index) => (
              <div
                key={index}
                className="p-4 border rounded-xl text-center hover:border-primary hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  {specialty.icon}
                </div>
                <h6 className="font-semibold">{specialty.name}</h6>
                <p className="text-sm text-gray-600 mt-1">
                  {specialty.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
// Data for features section
const features = [
  {
    icon: (
      <svg
        className="w-6 h-6 text-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    title: "Giám sát và kiểm soát hiệu quả",
    description: "Power Hub cung cấp các công cụ giám sát năng lượng theo thời gian thực, giúp người dùng dễ dàng theo dõi mức tiêu thụ điện năng và điều chỉnh để tối ưu hóa việc sử dụng điện trong các thiết bị",
  },
  {
    icon: (
      <svg
        className="w-6 h-6 text-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    title: "Tiết kiệm chi phí năng lượng",
    description: "Hệ thống giúp phân tích và tối ưu hóa mức tiêu thụ điện, giúp giảm thiểu lãng phí năng lượng và tiết kiệm chi phí trong dài hạn.",
  },
  {
    icon: (
      <svg
        className="w-6 h-6 text-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
    title: "Công nghệ tiên tiến và đáng tin cậy",
    description: "Power Hub áp dụng các công nghệ hiện đại, sử dụng dữ liệu chính xác và có khả năng dự đoán xu hướng tiêu thụ điện, giúp người dùng đưa ra quyết định sử dụng năng lượng hợp lý và hiệu quả.",
  },
];

// Data for stats section
const stats = [
  { value: "4.8/5", label: "Đánh giá hiệu quả" },
  { value: "1,000+", label: "Số thiết bị kết nối" },
  { value: "500+", label: "Số lượng khách hàng sử dụng" },
  { value: "50,000+", label: "Số thông báo được gửi đi" },
];

// Data for specialties section
// Data for specialties section (blog)
const specialties = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 18.75 7.5-7.5 7.5 7.5" />
        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 7.5-7.5 7.5 7.5" />
      </svg>

    ),
    name: "Giải Pháp Giám Sát Tiêu Thụ Điện Đột Phá",
    description: "Khám phá những phương pháp mới nhất giúp theo dõi và quản lý năng lượng hiệu quả",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 18.75 7.5-7.5 7.5 7.5" />
        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 7.5-7.5 7.5 7.5" />
      </svg>

    ),
    name: "Lập Lịch Tự Động Hóa: Tiết Kiệm Năng Lượng Mỗi Ngày",
    description: "Tự động hóa việc sử dụng điện năng giúp tối ưu hóa tiêu thụ và tiết kiệm chi phí",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 18.75 7.5-7.5 7.5 7.5" />
        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 7.5-7.5 7.5 7.5" />
      </svg>

    ),
    name: "Bí Quyết Tiết Kiệm Năng Lượng Hiệu Quả với Power Hub",
    description: "Những mẹo đơn giản nhưng hiệu quả giúp giảm đáng kể chi phí điện hàng tháng",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 18.75 7.5-7.5 7.5 7.5" />
        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 7.5-7.5 7.5 7.5" />
      </svg>

    ),
    name: "Thông Báo Tiết Kiệm Điện: Cảnh Báo Kịp Thời, Tiết Kiệm Tối Đa",
    description: "Hệ thống cảnh báo thông minh giúp phát hiện bất thường và ngăn chặn lãng phí",
  },
];