
import { Test, type TestingModule } from '@nestjs/testing';

import { VehiclesController } from './vehicles.controller.js';
import { VehiclesService } from './vehicles.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

describe('VehiclesController', () => {
  let controller: VehiclesController;

  const vehiclesServiceMock = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    findByPlate: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        {
          provide: VehiclesService,
          useValue: vehiclesServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VehiclesController>(VehiclesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list vehicles', async () => {
    vehiclesServiceMock.findAll.mockResolvedValue([]);

    await expect(controller.findAll()).resolves.toEqual([]);
    expect(vehiclesServiceMock.findAll).toHaveBeenCalledOnce();
  });
});
