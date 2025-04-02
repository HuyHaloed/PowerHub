import { FAQ, FAQCategory } from "@/types/faq.types";

// All FAQs in a flat array
export const faqs: FAQ[] = [
  // About Us
  {
    id: "001",
    question: "Power Hub là gì?",
    answer: "Power Hub là một nền tảng quản lý điện năng hiện đại, giúp bạn theo dõi, phân tích và tối ưu hóa mức tiêu thụ điện của các thiết bị trong thời gian thực. Chúng tôi cung cấp các giải pháp thông minh để giảm chi phí điện và góp phần bảo vệ môi trường.",
    category: "about-us"
  },
  {
    id: "002",
    question: "Làm thế nào để tôi quản lý công việc kinh doanh với Power Hub?",
    answer: "Power Hub cung cấp bảng điều khiển trực quan giúp bạn theo dõi mức tiêu thụ điện, thiết lập thông báo khi vượt ngưỡng, và phân tích dữ liệu để tối ưu hóa chi phí. Bạn có thể quản lý từ xa thông qua ứng dụng di động hoặc web, tích hợp với hệ thống quản lý tòa nhà hiện có, và nhận báo cáo chi tiết về hiệu suất sử dụng năng lượng.",
    category: "about-us"
  },
  {
    id: "003",
    question: "Nội dung trên trang web này có sẵn bằng các ngôn ngữ khác không?",
    answer: "Hiện tại, website của chúng tôi hỗ trợ tiếng Việt và tiếng Anh. Chúng tôi đang nỗ lực để bổ sung thêm các ngôn ngữ khác trong tương lai. Để chuyển đổi ngôn ngữ, bạn có thể sử dụng menu ngôn ngữ ở góc trên bên phải của trang web.",
    category: "about-us"
  },
  {
    id: "004",
    question: "Việc trở thành một phần của nền tảng Power Hub có ý nghĩa gì?",
    answer: "Khi tham gia vào hệ sinh thái Power Hub, bạn không chỉ tiết kiệm chi phí năng lượng mà còn đóng góp vào việc giảm thiểu tác động đến môi trường. Bạn sẽ được tiếp cận với công nghệ tiên tiến, nhận hỗ trợ kỹ thuật 24/7, và tham gia vào cộng đồng những người có cùng quan tâm đến việc sử dụng năng lượng hiệu quả.",
    category: "about-us"
  },
  {
    id: "005",
    question: "Tôi có thêm câu hỏi thì sao?",
    answer: "Nếu bạn có thêm câu hỏi, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi qua email support@powerhub.vn hoặc gọi đến số hotline 1900 1234. Chúng tôi luôn sẵn sàng hỗ trợ và phản hồi trong vòng 24 giờ làm việc.",
    category: "about-us"
  },

  // Installation
  {
    id: "101",
    question: "Làm thế nào để cài đặt hệ thống Power Hub?",
    answer: "Quy trình cài đặt Power Hub gồm 3 bước đơn giản: (1) Lắp đặt thiết bị đo điện tại nguồn điện chính; (2) Kết nối thiết bị với mạng Wi-Fi của bạn; (3) Tải và cài đặt ứng dụng Power Hub, sau đó làm theo hướng dẫn để kết nối với thiết bị. Chúng tôi cũng cung cấp dịch vụ cài đặt chuyên nghiệp nếu bạn cần hỗ trợ thêm.",
    category: "installation"
  },
  {
    id: "102",
    question: "Power Hub có tương thích với hệ thống điện hiện có của tôi không?",
    answer: "Power Hub được thiết kế để tương thích với hầu hết các hệ thống điện dân dụng và thương mại. Hệ thống của chúng tôi hoạt động với cả điện một pha và ba pha, có thể tích hợp với các hệ thống điện thông minh hiện có. Trước khi lắp đặt, chúng tôi sẽ tiến hành khảo sát để đảm bảo tính tương thích và đề xuất giải pháp phù hợp nhất.",
    category: "installation"
  },
  {
    id: "103",
    question: "Tôi có cần thợ điện chuyên nghiệp để lắp đặt không?",
    answer: "Mặc dù thiết bị Power Hub được thiết kế để dễ dàng cài đặt, chúng tôi vẫn khuyến nghị sử dụng thợ điện chuyên nghiệp cho quá trình lắp đặt ban đầu, đặc biệt là đối với các hệ thống đo lường tại nguồn điện chính. Điều này đảm bảo hệ thống được cài đặt đúng cách và an toàn. Power Hub cung cấp dịch vụ lắp đặt chuyên nghiệp với chi phí hợp lý.",
    category: "installation"
  },

  // Usage
  {
    id: "201",
    question: "Làm thế nào để xem thông tin tiêu thụ điện của tôi?",
    answer: "Bạn có thể xem thông tin tiêu thụ điện thông qua ứng dụng Power Hub trên điện thoại di động hoặc giao diện web. Đăng nhập vào tài khoản và bạn sẽ thấy bảng điều khiển hiển thị mức tiêu thụ điện theo thời gian thực, lịch sử sử dụng, chi phí ước tính, và các phân tích chi tiết khác. Bạn có thể xem dữ liệu theo ngày, tuần, tháng hoặc năm, và phân tích theo từng thiết bị hoặc khu vực.",
    category: "usage"
  },
  {
    id: "202",
    question: "Tôi có thể theo dõi mức tiêu thụ của từng thiết bị riêng lẻ không?",
    answer: "Có, Power Hub cho phép bạn theo dõi mức tiêu thụ điện của từng thiết bị riêng lẻ thông qua hai cách: (1) Sử dụng các ổ cắm thông minh Power Hub cho các thiết bị cụ thể; (2) Hệ thống AI của chúng tôi có thể phân tích mẫu tiêu thụ điện để nhận dạng các thiết bị chính trong nhà. Điều này giúp bạn xác định chính xác những thiết bị tiêu thụ nhiều điện năng nhất và tối ưu hóa việc sử dụng.",
    category: "usage"
  },
  {
    id: "203",
    question: "Power Hub có thể giúp tôi tiết kiệm bao nhiêu tiền điện?",
    answer: "Khách hàng của Power Hub thường tiết kiệm từ 15-30% chi phí điện hàng tháng. Mức tiết kiệm cụ thể phụ thuộc vào nhiều yếu tố như mức sử dụng hiện tại, loại thiết bị, và việc bạn áp dụng các đề xuất tiết kiệm năng lượng từ hệ thống. Ứng dụng Power Hub sẽ cung cấp các ước tính tiết kiệm dựa trên dữ liệu sử dụng của bạn và theo dõi tiến độ tiết kiệm theo thời gian.",
    category: "usage"
  },

  // Troubleshooting
  {
    id: "301",
    question: "Thiết bị của tôi không kết nối được với ứng dụng, tôi phải làm gì?",
    answer: "Nếu thiết bị không kết nối được, hãy thử các bước sau: (1) Đảm bảo thiết bị được cấp nguồn điện đúng cách và đèn LED hoạt động; (2) Kiểm tra kết nối Wi-Fi của bạn và đảm bảo thiết bị nằm trong phạm vi phủ sóng; (3) Khởi động lại thiết bị bằng cách ngắt và kết nối lại nguồn điện; (4) Gỡ và cài đặt lại ứng dụng; (5) Khôi phục cài đặt gốc cho thiết bị bằng cách nhấn nút reset trong 10 giây. Nếu vẫn gặp vấn đề, vui lòng liên hệ đội ngũ hỗ trợ kỹ thuật của chúng tôi.",
    category: "troubleshooting"
  },
  {
    id: "302",
    question: "Dữ liệu của tôi không chính xác, làm thế nào để hiệu chỉnh?",
    answer: "Nếu bạn nhận thấy dữ liệu không chính xác, hãy thử: (1) Kiểm tra xem thiết bị đo điện có được lắp đặt đúng cách không; (2) Thực hiện quy trình hiệu chuẩn trong ứng dụng (Cài đặt > Thiết bị > Hiệu chuẩn); (3) Cập nhật firmware mới nhất cho thiết bị; (4) Đảm bảo không có thiết bị nào kết nối vào nguồn điện mà không thông qua hệ thống đo lường Power Hub. Nếu vấn đề vẫn tồn tại, vui lòng liên hệ với đội ngũ kỹ thuật để được hỗ trợ chuyên sâu.",
    category: "troubleshooting"
  },
  {
    id: "303",
    question: "Ứng dụng Power Hub gặp lỗi, tôi cần làm gì?",
    answer: "Nếu ứng dụng gặp lỗi, hãy thử các giải pháp sau: (1) Đóng và mở lại ứng dụng; (2) Đảm bảo ứng dụng đã được cập nhật lên phiên bản mới nhất từ App Store hoặc Google Play; (3) Xóa bộ nhớ cache của ứng dụng trong cài đặt điện thoại; (4) Gỡ cài đặt và cài đặt lại ứng dụng; (5) Khởi động lại điện thoại. Nếu vấn đề vẫn tiếp diễn, vui lòng gửi báo cáo lỗi từ trong ứng dụng (Cài đặt > Hỗ trợ > Báo cáo lỗi) hoặc liên hệ với đội ngũ hỗ trợ.",
    category: "troubleshooting"
  },

  // Billing
  {
    id: "401",
    question: "Các gói dịch vụ của Power Hub là gì?",
    answer: "Power Hub cung cấp ba gói dịch vụ chính: (1) Gói Cơ bản: theo dõi mức tiêu thụ điện tổng thể, thông báo cơ bản, và các phân tích đơn giản; (2) Gói Nâng cao: phân tích chi tiết theo thiết bị, đề xuất tiết kiệm năng lượng, và tích hợp với các thiết bị thông minh; (3) Gói Doanh nghiệp: giải pháp tùy chỉnh cho doanh nghiệp với phân tích nâng cao, API tích hợp, và hỗ trợ ưu tiên. Vui lòng truy cập trang Giá cả trên website để biết thông tin chi tiết về tính năng và giá của từng gói.",
    category: "billing"
  },
  {
    id: "402",
    question: "Làm thế nào để thanh toán cho dịch vụ Power Hub?",
    answer: "Power Hub chấp nhận nhiều phương thức thanh toán khác nhau bao gồm thẻ tín dụng/ghi nợ, chuyển khoản ngân hàng, và các ví điện tử phổ biến như Momo, VNPay, và ZaloPay. Bạn có thể lựa chọn thanh toán hàng tháng hoặc hàng năm, với ưu đãi giảm giá khi thanh toán theo năm. Tất cả các giao dịch đều được bảo mật bằng công nghệ mã hóa tiên tiến.",
    category: "billing"
  },
  {
    id: "403",
    question: "Tôi có thể hủy đăng ký bất cứ lúc nào không?",
    answer: "Có, bạn có thể hủy đăng ký dịch vụ Power Hub bất cứ lúc nào. Để hủy, hãy đăng nhập vào tài khoản của bạn, vào phần Cài đặt > Quản lý tài khoản > Hủy đăng ký. Nếu bạn hủy giữa chu kỳ thanh toán, bạn vẫn có thể sử dụng dịch vụ cho đến hết chu kỳ đã thanh toán. Chúng tôi không tính phí hủy dịch vụ, và bạn luôn có thể đăng ký lại bất cứ lúc nào.",
    category: "billing"
  },
];

// FAQs grouped by category
export const faqCategories: FAQCategory[] = [
  {
    id: "about-us",
    name: "Về chúng tôi",
    description: "Thông tin về Power Hub và các dịch vụ của chúng tôi",
    faqs: faqs.filter(faq => faq.category === "about-us")
  },
  {
    id: "installation",
    name: "Cài đặt",
    description: "Hướng dẫn về cách cài đặt và thiết lập hệ thống Power Hub",
    faqs: faqs.filter(faq => faq.category === "installation")
  },
  {
    id: "usage",
    name: "Sử dụng",
    description: "Cách sử dụng hiệu quả các tính năng của Power Hub",
    faqs: faqs.filter(faq => faq.category === "usage")
  },
  {
    id: "troubleshooting",
    name: "Xử lý sự cố",
    description: "Giải pháp cho các vấn đề thường gặp khi sử dụng Power Hub",
    faqs: faqs.filter(faq => faq.category === "troubleshooting")
  },
  {
    id: "billing",
    name: "Thanh toán",
    description: "Thông tin về các gói dịch vụ và phương thức thanh toán",
    faqs: faqs.filter(faq => faq.category === "billing")
  }
];