import { Test, TestingModule } from '@nestjs/testing';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';

describe('PurchasesController', () => {
  let controller: PurchasesController;
  let service: PurchasesService;

  beforeEach(async () => {
    const mockPurchasesService = {
      findAll: jest.fn().mockResolvedValue([]),
      getStats: jest.fn().mockResolvedValue({ totalWeight: 1000, totalAmount: 1500000 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchasesController],
      providers: [
        {
          provide: PurchasesService,
          useValue: mockPurchasesService,
        },
      ],
    }).compile();

    controller = module.get<PurchasesController>(PurchasesController);
    service = module.get<PurchasesService>(PurchasesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all purchases', async () => {
    const result = await controller.findAll({});
    expect(result).toEqual([]);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should return stats', async () => {
    const result = await controller.getStats();
    expect(result).toEqual({ totalWeight: 1000, totalAmount: 1500000 });
    expect(service.getStats).toHaveBeenCalled();
  });
});
