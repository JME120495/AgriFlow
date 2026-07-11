import { Test, TestingModule } from '@nestjs/testing';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';

describe('WarehousesController', () => {
  let controller: WarehousesController;
  let service: WarehousesService;

  const mockService = {
    findAllStores: jest.fn().mockResolvedValue([
      { id: '1', name: 'Magasin Central', metrics: { currentWeightKg: 5000 } },
    ]),
    findStoreById: jest.fn().mockResolvedValue({
      id: '1', name: 'Magasin Central', metrics: { currentWeightKg: 5000 },
    }),
    getWarehouseStats: jest.fn().mockResolvedValue({
      totalStores: 3, totalWarehouses: 6, totalCurrentKg: 50000, globalOccupancy: 68.2,
    }),
    createWarehouse: jest.fn().mockResolvedValue({ id: 'wh1', name: 'Entrepôt 1' }),
    createStorageZone: jest.fn().mockResolvedValue({ id: 'z1', name: 'Zone A' }),
    createStorageLocation: jest.fn().mockResolvedValue({ id: 'l1', code: 'LOC-01' }),
    createStockMovement: jest.fn().mockResolvedValue({ id: 'm1', type: 'IN_PURCHASE', weightKg: 650 }),
    findStockMovements: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    createInventory: jest.fn().mockResolvedValue({ id: 'inv1', inventoryNumber: 'INV-202607-0001' }),
    findAllInventories: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    findInventoryById: jest.fn().mockResolvedValue({ id: 'inv1', inventoryNumber: 'INV-202607-0001' }),
    submitInventoryItems: jest.fn().mockResolvedValue({ id: 'inv1', status: 'COUNTING' }),
    completeInventory: jest.fn().mockResolvedValue({ id: 'inv1', status: 'PENDING_APPROVAL' }),
    approveInventory: jest.fn().mockResolvedValue({ id: 'inv1', status: 'APPROVED' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WarehousesController],
      providers: [{ provide: WarehousesService, useValue: mockService }],
    }).compile();

    controller = module.get<WarehousesController>(WarehousesController);
    service = module.get<WarehousesService>(WarehousesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should fetch all stores', async () => {
    const result = await controller.findAllStores({});
    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(mockService.findAllStores).toHaveBeenCalledWith({});
  });

  it('should fetch a store by id', async () => {
    const result = await controller.findStoreById('1');
    expect(result.name).toBe('Magasin Central');
    expect(mockService.findStoreById).toHaveBeenCalledWith('1');
  });

  it('should fetch warehouse stats', async () => {
    const result = await controller.getStats();
    expect(result.totalStores).toBe(3);
    expect(result.globalOccupancy).toBe(68.2);
  });

  it('should create a warehouse', async () => {
    const dto = { storeId: '1', name: 'Entrepôt 1', capacityTonnes: 50 };
    const result = await controller.createWarehouse(dto);
    expect(result.name).toBe('Entrepôt 1');
    expect(mockService.createWarehouse).toHaveBeenCalledWith(dto);
  });

  it('should create a stock movement', async () => {
    const dto = { type: 'IN_PURCHASE', weightKg: 650, bagCount: 10, storeId: '1', destLocationId: 'l1' };
    const req = { user: { id: 'user1' } };
    const result = await controller.createStockMovement(dto as any, req);
    expect(result.type).toBe('IN_PURCHASE');
    expect(mockService.createStockMovement).toHaveBeenCalledWith(dto, 'user1');
  });

  it('should create an inventory', async () => {
    const dto = { storeId: '1' };
    const req = { user: { id: 'user1' } };
    const result = await controller.createInventory(dto, req);
    expect(result.inventoryNumber).toBe('INV-202607-0001');
  });

  it('should approve an inventory', async () => {
    const req = { user: { id: 'user1' } };
    const result = await controller.approveInventory('inv1', req);
    expect(result.status).toBe('APPROVED');
    expect(mockService.approveInventory).toHaveBeenCalledWith('inv1', 'user1');
  });
});
