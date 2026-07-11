import { Test, TestingModule } from '@nestjs/testing';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';

describe('CreditsController', () => {
  let controller: CreditsController;
  let service: CreditsService;

  beforeEach(async () => {
    const mockCreditsService = {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({ id: '1', amountGranted: 100 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditsController],
      providers: [
        {
          provide: CreditsService,
          useValue: mockCreditsService,
        },
      ],
    }).compile();

    controller = module.get<CreditsController>(CreditsController);
    service = module.get<CreditsService>(CreditsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all credits', async () => {
    const result = await controller.findAll({});
    expect(result).toEqual([]);
    expect(service.findAll).toHaveBeenCalled();
  });
});
