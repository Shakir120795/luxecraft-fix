import { Body, Controller, Post, Req } from '@nestjs/common';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Post()
  create(@Body() body: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }, @Req() req: any) {
    return this.contact.create({
      ...body,
      userId: req.user?.id,
    });
  }
}
