import { Test, TestingModule } from '@nestjs/testing';
import { QualityControlsController } from './quality-controls.controller';
import { QualityControlsService } from './quality-controls.service';

describe('QualityControlsController', () => {
  let controller: QualityControlsController;
  let service: QualityControlsService;

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({ id: '1', moistureRate: 7.5 }),
      create: jest.fn().mockResolvedValue({ id: '1', controlNumber: 'QC-1' }),
      validate: jest.fn().mockResolvedValue({ id: '1', status: 'VALIDATED' }),
      reject: jest.fn().mockResolvedValue({ id: '1', status: 'REJECTED' }),
      getRules: jest.fn().mockResolvedValue([]),
      updateRule: jest.fn().mockResolvedValue({ id: 'rule-1', code: 'HUMIDITE' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QualityControlsController],
      providers: [
        {
          provide: QualityControlsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<QualityControlsController>(QualityControlsController);
    service = module.get<QualityControlsService>(QualityControlsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all quality controls', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([]);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should create a quality control', async () => {
    const dto = {
      purchaseId: 'p-1',
      moistureRate: 7.5,
      impurityRate: 0.5,
      moldyRate: 1.0,
      slatyRate: 1.0,
      insectRate: 0.0,
      brokenRate: 1.0,
      flatRate: 0.5,
      germinatedRate: 0.0,
      grainage: 95,
    };
    const req = { user: { id: 'user-1' } };
    const result = await controller.create(dto, req);
    expect(result).toEqual({ id: '1', controlNumber: 'QC-1' });
    expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
  });
});
