import { Test, TestingModule } from '@nestjs/testing';
import { StocksController } from './stocks.controller';
import { StocksService } from './stocks.service';

describe('StocksController', () => {
  let controller: StocksController;
  let service: StocksService;

  const mockService = {
    createLot: jest.fn().mockResolvedValue({ id: 'lot1', numeroLot: 'LOT-2026-07-001' }),
    findAllLots: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    findLotById: jest.fn().mockResolvedValue({ id: 'lot1', numeroLot: 'LOT-2026-07-001' }),
    reserveLot: jest.fn().mockResolvedValue({ id: 'res1', quantite: 1000 }),
    cancelReservation: jest.fn().mockResolvedValue({ id: 'res1', statut: 'ANNULEE' }),
    createMovement: jest.fn().mockResolvedValue({ id: 'mvt1', type: 'TRANSFERT' }),
    getStats: jest.fn().mockResolvedValue({ totalLots: 4, totalWeightKg: 11900 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StocksController],
      providers: [{ provide: StocksService, useValue: mockService }],
    }).compile();

    controller = module.get<StocksController>(StocksController);
    service = module.get<StocksService>(StocksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a lot', async () => {
    const dto = { campagne: '2025/2026', qualite: 'GRADE_1', poidsInitial: 1000, nombreSacs: 15, valeurAchat: 1500000, emplacementId: 'loc1' };
    const result = await controller.createLot(dto);
    expect(result.numeroLot).toBe('LOT-2026-07-001');
    expect(mockService.createLot).toHaveBeenCalledWith(dto);
  });

  it('should find all lots', async () => {
    const result = await controller.findAllLots({});
    expect(result).toBeDefined();
    expect(mockService.findAllLots).toHaveBeenCalledWith({});
  });

  it('should find a lot by id', async () => {
    const result = await controller.findLotById('lot1');
    expect(result.numeroLot).toBe('LOT-2026-07-001');
    expect(mockService.findLotById).toHaveBeenCalledWith('lot1');
  });

  it('should reserve a lot', async () => {
    const dto = { lotId: 'lot1', quantite: 1000, motif: 'Export' };
    const req = { user: { id: 'user1' } };
    const result = await controller.reserveLot(dto, req);
    expect(result.quantite).toBe(1000);
    expect(mockService.reserveLot).toHaveBeenCalledWith(dto, 'user1');
  });

  it('should cancel a reservation', async () => {
    const result = await controller.cancelReservation('res1');
    expect(result.statut).toBe('ANNULEE');
    expect(mockService.cancelReservation).toHaveBeenCalledWith('res1');
  });

  it('should create a movement', async () => {
    const dto = { type: 'TRANSFERT', motif: 'AJUSTEMENT', quantite: 500, nombreSacs: 8, lotId: 'lot1', emplacementDestId: 'loc2' };
    const req = { user: { id: 'user1' } };
    const result = await controller.createMovement(dto, req);
    expect(result.type).toBe('TRANSFERT');
    expect(mockService.createMovement).toHaveBeenCalledWith(dto, 'user1');
  });

  it('should get stats', async () => {
    const result = await controller.getStats();
    expect(result.totalLots).toBe(4);
    expect(mockService.getStats).toHaveBeenCalled();
  });
});
