import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { SeoService } from './seo.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class SeoController {
  constructor(private readonly svc: SeoService) {}

  @Get('sitemap.xml')
  @Public()
  async sitemap(@Res() res: Response): Promise<void> {
    const xml = await this.svc.generateSitemap();
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  }

  @Get('robots.txt')
  @Public()
  robots(@Res() res: Response): void {
    const txt = this.svc.getRobotsText();
    res.header('Content-Type', 'text/plain');
    res.send(txt);
  }
}
