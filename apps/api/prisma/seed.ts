import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Admin User
  const adminPasswordHash = await bcrypt.hash('LuxeCraft@Admin1!', 10);
  
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@luxecraft.com' },
    update: {},
    create: {
      email: 'admin@luxecraft.com',
      passwordHash: adminPasswordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // 2. Create Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'hand-knotted-rugs' },
      update: {},
      create: {
        name: 'Hand Knotted Rugs',
        slug: 'hand-knotted-rugs',
        description: 'Traditional hand-knotted luxury rugs crafted by master artisans',
        seoTitle: 'Hand Knotted Luxury Rugs | LuxeCraft',
        seoDesc: 'Explore our exquisite collection of hand-knotted rugs',
        status: 'ACTIVE',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'hand-tufted-rugs' },
      update: {},
      create: {
        name: 'Hand Tufted Rugs',
        slug: 'hand-tufted-rugs',
        description: 'Premium hand-tufted rugs with intricate designs',
        seoTitle: 'Hand Tufted Rugs | LuxeCraft',
        seoDesc: 'Beautiful hand-tufted rugs for your home',
        status: 'ACTIVE',
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'flat-weave-rugs' },
      update: {},
      create: {
        name: 'Flat Weave Rugs',
        slug: 'flat-weave-rugs',
        description: 'Elegant flat-weave rugs perfect for modern interiors',
        seoTitle: 'Flat Weave Rugs | LuxeCraft',
        seoDesc: 'Contemporary flat-weave rugs collection',
        status: 'ACTIVE',
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'crafts-statues' },
      update: {},
      create: {
        name: 'Crafts & Statues',
        slug: 'crafts-statues',
        description: 'Handcrafted decorative pieces and luxury statues',
        seoTitle: 'Luxury Crafts & Statues | LuxeCraft',
        seoDesc: 'Premium handcrafted decorative items',
        status: 'ACTIVE',
        sortOrder: 4,
      },
    }),
  ]);
  console.log('✅ Categories created:', categories.length);

  // 3. Create Sample Products
  const product1 = await prisma.product.create({
    data: {
      name: 'Persian Silk Rug - Royal Blue',
      slug: 'persian-silk-rug-royal-blue',
      sku: 'PSR-001',
      description: 'Exquisite hand-knotted Persian silk rug featuring intricate floral patterns',
      shortDescription: 'Hand-knotted Persian silk rug with royal blue floral pattern',
      regularPrice: 8999.99,
      salePrice: 7499.99,
      weightKg: 12.5,
      lengthCm: 300,
      widthCm: 200,
      heightCm: 2,
      isFeatured: true,
      status: 'ACTIVE',
      seoTitle: 'Persian Silk Rug Royal Blue | Hand Knotted',
      seoDesc: 'Premium hand-knotted Persian silk rug',
      categoryId: categories[0].id,
      media: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=800',
            altText: 'Persian Silk Rug Royal Blue',
            type: 'IMAGE',
            sortOrder: 1,
            isMain: true,
          },
        ],
      },
      variants: {
        create: [
          {
            name: 'Small - 200x150cm',
            sku: 'PSR-001-S',
            stockQty: 5,
            lowStockAt: 2,
            regularPrice: 5999.99,
          },
          {
            name: 'Medium - 300x200cm',
            sku: 'PSR-001-M',
            stockQty: 3,
            lowStockAt: 1,
          },
          {
            name: 'Large - 400x300cm',
            sku: 'PSR-001-L',
            stockQty: 2,
            lowStockAt: 1,
            regularPrice: 11999.99,
          },
        ],
      },
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: 'Moroccan Wool Rug - Geometric',
      slug: 'moroccan-wool-rug-geometric',
      sku: 'MWR-002',
      description: 'Contemporary hand-tufted Moroccan rug with bold geometric patterns',
      shortDescription: 'Hand-tufted Moroccan wool rug with geometric design',
      regularPrice: 4999.99,
      weightKg: 8.0,
      lengthCm: 250,
      widthCm: 180,
      heightCm: 1.5,
      isFeatured: true,
      status: 'ACTIVE',
      categoryId: categories[1].id,
      media: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1600166898658-7f8e40ff7c5c?w=800',
            altText: 'Moroccan Wool Rug',
            type: 'IMAGE',
            sortOrder: 1,
            isMain: true,
          },
        ],
      },
      variants: {
        create: [
          {
            name: 'Standard - 250x180cm',
            sku: 'MWR-002-STD',
            stockQty: 8,
            lowStockAt: 3,
          },
        ],
      },
    },
  });

  const product3 = await prisma.product.create({
    data: {
      name: 'Scandinavian Flat Weave - Minimalist',
      slug: 'scandinavian-flat-weave-minimalist',
      sku: 'SFW-003',
      description: 'Elegant Scandinavian-inspired flat-weave rug',
      shortDescription: 'Minimalist flat-weave rug with Nordic design',
      regularPrice: 2999.99,
      salePrice: 2499.99,
      weightKg: 5.5,
      lengthCm: 200,
      widthCm: 140,
      heightCm: 0.8,
      isFeatured: true,
      status: 'ACTIVE',
      categoryId: categories[2].id,
      media: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1600210491893-4b57891fe1c7?w=800',
            altText: 'Scandinavian Flat Weave',
            type: 'IMAGE',
            sortOrder: 1,
            isMain: true,
          },
        ],
      },
      variants: {
        create: [
          {
            name: 'Standard',
            sku: 'SFW-003-STD',
            stockQty: 15,
            lowStockAt: 5,
          },
        ],
      },
    },
  });

  const product4 = await prisma.product.create({
    data: {
      name: 'Brass Buddha Statue - Meditation',
      slug: 'brass-buddha-statue-meditation',
      sku: 'BBS-004',
      description: 'Handcrafted brass Buddha statue in meditation pose',
      shortDescription: 'Handcrafted brass Buddha',
      regularPrice: 1499.99,
      weightKg: 3.2,
      lengthCm: 25,
      widthCm: 18,
      heightCm: 35,
      isFeatured: false,
      status: 'ACTIVE',
      categoryId: categories[3].id,
      media: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1599991917763-fd8df4e868bb?w=800',
            altText: 'Brass Buddha Statue',
            type: 'IMAGE',
            sortOrder: 1,
            isMain: true,
          },
        ],
      },
      variants: {
        create: [
          {
            name: 'Standard',
            sku: 'BBS-004-STD',
            stockQty: 12,
            lowStockAt: 3,
          },
        ],
      },
    },
  });

  const product5 = await prisma.product.create({
    data: {
      name: 'Turkish Kilim Rug - Vintage',
      slug: 'turkish-kilim-rug-vintage',
      sku: 'TKR-005',
      description: 'Authentic vintage Turkish kilim rug with traditional patterns',
      shortDescription: 'Vintage Turkish kilim with patterns',
      regularPrice: 3499.99,
      weightKg: 6.8,
      lengthCm: 280,
      widthCm: 190,
      heightCm: 1.0,
      isFeatured: true,
      status: 'ACTIVE',
      categoryId: categories[2].id,
      media: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1600166898665-ef7d6a79352c?w=800',
            altText: 'Turkish Kilim Rug',
            type: 'IMAGE',
            sortOrder: 1,
            isMain: true,
          },
        ],
      },
      variants: {
        create: [
          {
            name: 'Standard',
            sku: 'TKR-005-STD',
            stockQty: 4,
            lowStockAt: 2,
          },
        ],
      },
    },
  });

  console.log('✅ Products created: 5');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Admin users: 1`);
  console.log(`   - Categories: ${categories.length}`);
  console.log(`   - Products: 5`);
  console.log('\n🔐 Admin Login:');
  console.log(`   Email: admin@luxecraft.com`);
  console.log(`   Password: LuxeCraft@Admin1!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
