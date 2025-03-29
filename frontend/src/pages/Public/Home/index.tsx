import banner from "@/assets/imgs/banner.png";
import sub from "@/assets/imgs/sub.png";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAccount } from "@/hooks/useAccount";
import Footer from "@/components/Footer";

export default function HomePage() {
  const { data: account } = useAccount();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="grid lg:grid-cols-2 gap-4 items-center lg:mx-7 sm:mx-5 mx-3 flex-1 mt-3">
        <div className="space-y-5">
          <div className="flex flex-col w-fit">
            <h1 className="text-4xl font-bold">
              Find a <span className="text-primary">Doctor &</span>
            </h1>
            <img src={sub} alt="placeholder" className="self-end" />
            <h2 className="text-3xl font-bold">
              Book and <span className="text-primary">Appointment</span>
            </h2>
          </div>
          <p className="italic text-secondary max-w-xl">
            Easily search for qualified doctors based on specialty, location,
            availability, and patient reviews. View detailed doctor profiles,
            including credentials, experience, and consultation fees.
          </p>
          <div className="mt-5 flex items-center gap-5">
            <Link to="/search">
              <Button variant="secondary" size="lg">
                Tìm kiếm ngay
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="link" className="text-secondary">
                Thông tin chi tiết
              </Button>
            </Link>
          </div>
        </div>
        <div>
          <img src={banner} alt="placeholder" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-16 mt-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tại sao chọn <span className="text-primary">Doctor Care</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
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
                <div className="text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Bắt đầu tìm kiếm bác sĩ ngay hôm nay
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Đặt lịch khám với các bác sĩ hàng đầu, được đánh giá cao và tin tưởng bởi hàng nghìn bệnh nhân
          </p>
          <Link to="/search">
            <Button variant="secondary" size="lg" className="font-semibold">
              Tìm kiếm bác sĩ
            </Button>
          </Link>
        </div>
      </div>

      {/* Specialties Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Chuyên khoa phổ biến
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {specialties.map((specialty, index) => (
              <div
                key={index}
                className="p-4 border rounded-xl text-center hover:border-primary hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  {specialty.icon}
                </div>
                <h3 className="font-semibold">{specialty.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{specialty.count} bác sĩ</p>
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
    icon: <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>,
    title: "Bác sĩ chất lượng",
    description: "Đội ngũ bác sĩ giàu kinh nghiệm, được đánh giá cao"
  },
  {
    icon: <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>,
    title: "Đặt lịch dễ dàng",
    description: "Đặt lịch khám nhanh chóng, theo dõi lịch hẹn thuận tiện"
  },
  {
    icon: <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>,
    title: "Nhiều địa điểm",
    description: "Mạng lưới bệnh viện và phòng khám rộng khắp"
  }
];

// Data for stats section
const stats = [
  { value: "1,000+", label: "Bác sĩ" },
  { value: "50+", label: "Chuyên khoa" },
  { value: "100,000+", label: "Bệnh nhân" },
  { value: "4.8", label: "Đánh giá trung bình" }
];

// Data for specialties section
const specialties = [
  {
    icon: <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>,
    name: "Tim mạch",
    count: 48
  },
  {
    icon: <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>,
    name: "Mắt",
    count: 36
  },
  {
    icon: <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>,
    name: "Da liễu",
    count: 42
  },
  {
    icon: <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>,
    name: "Nhi khoa",
    count: 38
  }
];
