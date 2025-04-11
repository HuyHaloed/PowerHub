import { FAQListProps } from '@/types/faq.types';
import FAQItem from '../FAQItem';
import { Accordion } from "@/components/ui/accordion";

const FAQList = ({ faqs, category }: FAQListProps) => {
  if (!faqs || faqs.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500">Không tìm thấy câu hỏi nào{category ? ` trong mục ${category}` : ''}.</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq) => (
        <FAQItem key={faq.id} faq={faq} />
      ))}
    </Accordion>
  );
};

export default FAQList;