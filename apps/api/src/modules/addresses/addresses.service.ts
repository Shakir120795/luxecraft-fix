import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Address } from '@prisma/client';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAddressDto, userId: string): Promise<Address> {
    // If isDefault=true, unset other default addresses of same type
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, type: dto.type ?? 'SHIPPING', isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        userId,
        type: dto.type ?? 'SHIPPING',
        firstName: dto.firstName,
        lastName: dto.lastName,
        company: dto.company,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        stateProvince: dto.stateProvince,
        postalCode: dto.postalCode,
        country: dto.country,
        phone: dto.phone,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async update(id: string, dto: UpdateAddressDto, userId: string): Promise<Address> {
    const existing = await this.findOneOrFail(id, userId);

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, type: existing.type, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id },
      data: {
        ...(dto.type && { type: dto.type }),
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.company !== undefined && { company: dto.company }),
        ...(dto.addressLine1 && { addressLine1: dto.addressLine1 }),
        ...(dto.addressLine2 !== undefined && { addressLine2: dto.addressLine2 }),
        ...(dto.city && { city: dto.city }),
        ...(dto.stateProvince !== undefined && { stateProvince: dto.stateProvince }),
        ...(dto.postalCode && { postalCode: dto.postalCode }),
        ...(dto.country && { country: dto.country }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findOneOrFail(id, userId);
    await this.prisma.address.delete({ where: { id } });
  }

  async findAll(userId: string): Promise<Address[]> {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string, userId: string): Promise<Address> {
    return this.findOneOrFail(id, userId);
  }

  async getDefaultAddress(userId: string, type: 'SHIPPING' | 'BILLING'): Promise<Address | null> {
    return this.prisma.address.findFirst({
      where: { userId, type, isDefault: true },
    });
  }

  private async findOneOrFail(id: string, userId: string): Promise<Address> {
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!address) throw new NotFoundException(`Address ${id} not found.`);
    return address;
  }
}
