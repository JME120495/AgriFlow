import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Parser } from 'json2csv';

@Injectable()
export class ExportsService {
  constructor(private prisma: PrismaService) {}

  async exportPlantersToCsv(): Promise<string> {
    const planters = await this.prisma.planter.findMany({
      include: { plantation: true },
    });
    
    if (!planters.length) {
      throw new BadRequestException('Aucun planteur à exporter.');
    }

    const data = planters.map(p => ({
      ID: p.id,
      Nom: p.lastName,
      Prenom: p.firstName,
      Telephone: p.phone || '',
      Cooperative: p.plantation?.name || 'N/A',
      Secteur: p.plantation?.location || 'N/A',
      Statut: p.status,
    }));

    const json2csv = new Parser({ fields: Object.keys(data[0]) });
    return json2csv.parse(data);
  }

  async exportSubBuyersToCsv(): Promise<string> {
    const subBuyers = await this.prisma.subBuyerProfile.findMany({
      include: { user: true },
    });

    if (!subBuyers.length) {
      throw new BadRequestException('Aucun sous-acheteur à exporter.');
    }

    const data = subBuyers.map(sb => ({
      ID: sb.id,
      Nom: sb.user.lastName,
      Prenom: sb.user.firstName,
      Telephone: sb.user.phone || '',
      Zone: sb.purchaseZone,
      Statut: sb.user.status,
    }));

    const json2csv = new Parser({ fields: Object.keys(data[0]) });
    return json2csv.parse(data);
  }
}
