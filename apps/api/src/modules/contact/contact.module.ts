import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { AdminNotificationsModule } from '../admin-notifications/admin-notifications.module';
import { AdminContactController } from './admin-contact.controller';

@Module({
  imports: [AdminNotificationsModule],
  controllers: [ContactController, AdminContactController],
  providers: [ContactService],
})
export class ContactModule {}
