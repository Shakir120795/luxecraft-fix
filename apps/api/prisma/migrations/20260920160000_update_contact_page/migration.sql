UPDATE "app_settings"
SET "sitePages" = jsonb_set(
  COALESCE("sitePages", '{}'::jsonb),
  '{contact}',
  '{"slug":"contact","title":"Contact Us","lastUpdated":"September 19, 2026","content":"Contact Us\n\nWe would love to hear from you! Whether you have questions about our handcrafted rugs, need help placing a Custom & Made-to-Order request, or want to track your shipment, our team is here to assist you.\n\nGet in Touch\n\nEmail Customer Care: info@wolhomes.com\n\nCustomer Support Hours: Monday – Friday (9:00 AM – 5:00 PM EST)\n\nResponse Time: We strive to respond to all inquiries within 24 to 48 hours.\n\nFactory & Manufacturing Facility Address\n\nAll our Hand-Tufted and Hand-Knotted rugs are manufactured, quality-checked, and shipped directly from our main factory unit:\n\nWOLHOMES\n\n575/2-C, Devpurwa Road, Mirzapur,\n\nUttar Pradesh, India – 231001\n\nCustom & Trade Inquiries\n\nCustom Rug Orders: Have a specific size, color palette, or design in mind? Send us an email with your specifications or sketches, and our master artisans will bring it to life.\n\nTrade & Wholesale Program: Are you an interior designer, architect, or business owner looking for bulk or trade pricing? Contact us with your business details and resale certificate to join our trade program.\n\nSend Us a Message\n\n(If you are filling out our online contact form, please provide the following details so we can assist you faster)\n\nFull Name:\n\nEmail Address:\n\nOrder ID (if applicable):\n\nSubject: (General Inquiry / Custom Order / Shipping Status / Trade Request)\n\nMessage:"}'::jsonb,
  true
),
"updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'default';
