
import { FAQItemProps } from '@/types/faq.types';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQItem = ({ faq }: FAQItemProps) => {
  return (
    <AccordionItem value={faq.id.toString()} className="border-b border-gray-200">
      <AccordionTrigger className="text-lg font-medium py-4 hover:text-[var(--primary-ground)] transition-colors text-left">
        {faq.question}
      </AccordionTrigger>
      <AccordionContent className="text-gray-600 pb-4">
        {faq.answer}
      </AccordionContent>
    </AccordionItem>
  );
};

export default FAQItem;