
import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { VehiclesService } from './vehicles.service.js';
import { VehiclesDao } from './dao/vehicles.dao.js';

describe('VehiclesService', () => {
  let service: VehiclesService;

  const vehiclesDaoMock = {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByPlate: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: VehiclesDao,
          useValue: vehiclesDaoMock,
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all vehicles', async () => {
    vehiclesDaoMock.findAll.mockResolvedValue([]);

    await expect(service.findAll()).resolves.toEqual([]);
    expect(vehiclesDaoMock.findAll).toHaveBeenCalledOnce();
  });

  it('should throw 404 when the vehicle does not exist', async () => {
    vehiclesDaoMock.findById.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
