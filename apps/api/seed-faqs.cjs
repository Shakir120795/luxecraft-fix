const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const faqs = [
  { category: "Orders & Shipping", question: "How long does shipping take?", answer: "Standard shipping typically takes 7-10 business days. Express shipping is available and takes 3-5 business days. Custom orders may require additional time based on complexity.", sortOrder: 1 },
  { category: "Orders & Shipping", question: "Do you ship internationally?", answer: "Yes, we ship worldwide. International shipping times vary by destination, typically 10-21 business days. Additional customs fees may apply based on your country's regulations.", sortOrder: 2 },
  { category: "Orders & Shipping", question: "How can I track my order?", answer: "Once your order ships, you'll receive a tracking number via email. You can also track your order status from your account dashboard under \"My Orders\".", sortOrder: 3 },
  { category: "Orders & Shipping", question: "Can I change or cancel my order?", answer: "Orders can be modified or cancelled within 24 hours of placement. After this period, orders enter production and cannot be changed. Please contact us immediately if you need assistance.", sortOrder: 4 },
  { category: "Products & Quality", question: "What materials do you use?", answer: "We use premium, sustainably sourced hardwoods including walnut, oak, and maple. All metals are solid brass or stainless steel. Upholstery fabrics are carefully selected for durability and luxury.", sortOrder: 5 },
  { category: "Products & Quality", question: "Are your products handmade?", answer: "Yes, every piece is handcrafted by skilled artisans in our workshops. We combine traditional woodworking techniques with modern precision tools to ensure the highest quality.", sortOrder: 6 },
  { category: "Products & Quality", question: "Do you offer warranties?", answer: "All products come with a 5-year warranty covering manufacturing defects. Custom pieces include a lifetime structural warranty. Normal wear and tear is not covered.", sortOrder: 7 },
  { category: "Products & Quality", question: "How do I care for my furniture?", answer: "Care instructions are provided with each piece. Generally, dust regularly with a soft cloth, avoid direct sunlight and excessive moisture, and use coasters for drinks. Professional cleaning is recommended for upholstered items.", sortOrder: 8 },
  { category: "Custom Design", question: "How does the custom design process work?", answer: "Submit your design request through our custom design form. Our team will review and contact you within 2-3 business days. We'll discuss your vision, provide sketches, and create a detailed quote. Once approved, production begins.", sortOrder: 9 },
  { category: "Custom Design", question: "How long do custom orders take?", answer: "Custom orders typically take 8-12 weeks from design approval to delivery, depending on complexity. We'll provide a detailed timeline with your quote and keep you updated throughout the process.", sortOrder: 10 },
  { category: "Custom Design", question: "Can I make changes to a custom order?", answer: "Design changes can be made during the approval phase at no cost. Once production begins, significant changes may incur additional fees and extend the timeline.", sortOrder: 11 },
  { category: "Custom Design", question: "What is the minimum order for custom pieces?", answer: "We accept custom orders starting at $2,000. This ensures we can dedicate the proper time and resources to create a truly exceptional piece for you.", sortOrder: 12 },
  { category: "Returns & Refunds", question: "What is your return policy?", answer: "We offer 30-day returns on all standard products in original condition. Custom orders are non-refundable unless there's a manufacturing defect. Return shipping is the customer's responsibility.", sortOrder: 13 },
  { category: "Returns & Refunds", question: "How do I initiate a return?", answer: "Contact our customer service team to request a return authorization. Once approved, carefully pack the item and ship it back using a tracked service. Refunds are processed within 7-10 business days of receiving the return.", sortOrder: 14 },
  { category: "Returns & Refunds", question: "What if my item arrives damaged?", answer: "While rare, damage can occur during shipping. Contact us immediately with photos of the damage and packaging. We'll arrange a replacement or full refund at no cost to you.", sortOrder: 15 },
  { category: "Payment & Pricing", question: "What payment methods do you accept?", answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for large orders. Payment is processed securely through our encrypted system.", sortOrder: 16 },
  { category: "Payment & Pricing", question: "Do you offer financing?", answer: "Yes, we offer financing options for purchases over $1,000 through our partner Affirm. Choose financing at checkout to see available payment plans with 0% APR options.", sortOrder: 17 },
  { category: "Payment & Pricing", question: "Are prices negotiable?", answer: "Our pricing reflects the quality of materials and craftsmanship. For large orders or trade customers, please contact our sales team to discuss volume discounts.", sortOrder: 18 }
];

(async () => {
  const result = await prisma.$transaction(async (tx) => {
    await tx.faqItem.deleteMany({});
    return Promise.all(faqs.map((faq) => tx.faqItem.create({ data: faq })));
  });
  console.log(`Seeded ${result.length} FAQ records.`);
})()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
