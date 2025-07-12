"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "What is MUSE and how does it work?",
      answer: "MUSE is the premier platform connecting exceptional makeup artists with visionary creators. Our curated network facilitates professional collaborations for editorial campaigns, brand partnerships, and artistic projects through a seamless booking and communication system."
    },
    {
      question: "How are makeup artists vetted on MUSE?",
      answer: "Every artist undergoes a rigorous vetting process including portfolio review, professional background verification, and artistic skill assessment. We only accept top-tier professionals with proven editorial experience and exceptional artistic capabilities."
    },
    {
      question: "What types of projects can I find artists for?",
      answer: "Our platform supports a wide range of creative projects including fashion editorials, brand campaigns, product launches, music videos, red carpet events, photoshoots, and artistic collaborations. Each artist specializes in different styles and project types."
    },
    {
      question: "How does pricing work on MUSE?",
      answer: "Pricing varies based on project scope, artist experience, and timeline. Artists set their own rates, which typically include consultation, application time, and materials. You'll receive detailed proposals with transparent pricing for your specific project requirements."
    },
    {
      question: "Is there payment protection for collaborations?",
      answer: "Yes, MUSE provides secure payment processing with milestone-based releases. Funds are held in escrow until project milestones are completed, ensuring protection for both creators and artists throughout the collaboration process."
    },
    {
      question: "What happens if I need to reschedule or cancel?",
      answer: "Our flexible booking system allows for reasonable rescheduling with advance notice. Cancellation policies vary by artist and project scope. We work to find mutually beneficial solutions while respecting everyone's time and commitments."
    },
    {
      question: "Can I work with the same artist for multiple projects?",
      answer: "Absolutely. Many of our most successful collaborations develop into ongoing creative partnerships. You can easily rebook artists you've worked with and build lasting professional relationships within our community."
    },
    {
      question: "What support is available during collaborations?",
      answer: "Our dedicated support team provides assistance throughout your collaboration journey, from initial consultation to project completion. We offer 24/7 support for urgent matters and comprehensive resources to ensure successful outcomes."
    }
  ];

  return (
    <section className="relative py-16 sm:py-20 md:py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="max-w-[1000px] mx-auto">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light mb-4 sm:mb-6 tracking-wider text-black">
              FREQUENTLY ASKED{" "}
              <span className="font-bold">
                QUESTIONS
              </span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed font-light max-w-3xl mx-auto">
              Everything you need to know about collaborating with world-class makeup artists through MUSE
            </p>
          </div>

          {/* FAQ List */}
          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="border border-gray-200 rounded-lg sm:rounded-xl overflow-hidden bg-white hover:border-gray-300 transition-all duration-300"
              >
                <button
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 text-left flex items-center justify-between gap-4"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  <span className="text-sm sm:text-base font-medium text-gray-900 pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform flex-shrink-0 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-6 pb-4 text-xs sm:text-sm text-gray-600 font-light">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Support Link */}
          <div className="text-center mt-8 sm:mt-10 md:mt-12">
            <p className="text-xs sm:text-sm text-gray-600">
              Still have questions?{" "}
              <a
                href="mailto:support@muse.com"
                className="text-black hover:text-gray-700 font-medium transition-colors"
              >
                Contact our concierge team
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-12 w-24 h-24 bg-gradient-to-r from-[#1e40af] to-[#6b21a8] rounded-full opacity-[0.03] blur-2xl" />
        <div className="absolute bottom-1/4 -right-12 w-24 h-24 bg-gradient-to-r from-[#6b21a8] to-[#1e40af] rounded-full opacity-[0.03] blur-2xl" />
      </div>
    </section>
  );
} 