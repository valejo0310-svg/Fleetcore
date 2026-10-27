import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from './users/entities/user.entity.js';

import {  Mechanic,  MechanicStatus,} from './mechanics/entities/mechanic.entity.js';

import {  Workshop, WorkshopStatus,} from './workshops/entities/workshop.entity.js';

import {  Vehicle,  VehicleStatus,} from './vehicles/entities/vehicle.entity.js';

import {  Maintenance,  MaintenanceStatus,  MaintenanceType,} from './maintenances/entities/maintenances.entity.js';

async function seed(): Promise<void> {
  const db = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'db',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? 'fleetcore',
    entities: [User, Mechanic, Workshop, Vehicle, Maintenance],
    synchronize: false,
  });

  await db.initialize();

  try {
    await db.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const mechanics = manager.getRepository(Mechanic);
      const workshops = manager.getRepository(Workshop);
      const vehicles = manager.getRepository(Vehicle);
      const maintenances = manager.getRepository(Maintenance);

      const seedPassword = process.env.SEED_PASSWORD;

      if (!seedPassword || seedPassword.length < 8) {
        throw new Error('SEED_PASSWORD must contain at least 8 characters');
      }

      async function ensureUser(
        email: string,
        role: UserRole,
      ): Promise<User> {
        const existing = await users.findOneBy({ email });
        if (existing) return existing;

        return users.save(
          users.create({
            email,
            role,
            passwordHash: await bcrypt.hash(seedPassword!, 10),
          }),
        );
      }

      const admin = await ensureUser(
        'admin@fleetcore.local',
        UserRole.ADMIN,
      );

      const technician1 = await ensureUser(
        'technician1@fleetcore.local',
        UserRole.TECHNICIAN,
      );

      const technician2 = await ensureUser(
        'technician2@fleetcore.local',
        UserRole.TECHNICIAN,
      );

      async function ensureMechanic(
        email: string,
        name: string,
        specialty: string,
        status: MechanicStatus,
        userId: number | null,
      ): Promise<Mechanic> {
        const existing = await mechanics.findOneBy({ email });
        if (existing) return existing;

        return mechanics.save(
          mechanics.create({
            email,
            name,
            specialty,
            status,
            userId,
          }),
        );
      }

      const mechanic1 = await ensureMechanic(
        'mechanic1@fleetcore.local',
        'Carlos Ramirez',
        'Engine maintenance',
        MechanicStatus.ACTIVE,
        technician1.id,
      );

      const mechanic2 = await ensureMechanic(
        'mechanic2@fleetcore.local',
        'Laura Torres',
        'Electrical systems',
        MechanicStatus.ACTIVE,
        technician2.id,
      );

      await ensureMechanic(
        'mechanic3@fleetcore.local',
        'Pedro Gomez',
        'Braking systems',
        MechanicStatus.INACTIVE,
        null,
      );

      async function ensureWorkshop(
        name: string,
        address: string,
        status: WorkshopStatus,
      ): Promise<Workshop> {
        const existing = await workshops.findOneBy({ name });
        if (existing) return existing;

        return workshops.save(
          workshops.create({ name, address, status }),
        );
      }

      const workshop1 = await ensureWorkshop(
        'FleetCore Central Workshop',
        'Main Street 100',
        WorkshopStatus.ACTIVE,
      );

      await ensureWorkshop(
        'FleetCore Secondary Workshop',
        'Second Street 200',
        WorkshopStatus.INACTIVE,
      );

      async function ensureVehicle(
        plate: string,
        brand: string,
        model: string,
        year: number,
        mileage: number,
        status: VehicleStatus,
      ): Promise<Vehicle> {
        const existing = await vehicles.findOneBy({ plate });
        if (existing) return existing;

        return vehicles.save(
          vehicles.create({
            plate,
            brand,
            model,
            year,
            mileage,
            status,
          }),
        );
      }

      await ensureVehicle(
        'FC001',
        'Toyota',
        'Corolla',
        2023,
        15000,
        VehicleStatus.AVAILABLE,
      );

      await ensureVehicle(
        'FC002',
        'Mazda',
        'CX-5',
        2022,
        28000,
        VehicleStatus.AVAILABLE,
      );

      const vehicle3 = await ensureVehicle(
        'FC003',
        'Chevrolet',
        'Onix',
        2021,
        42000,
        VehicleStatus.IN_MAINTENANCE,
      );

      const vehicle4 = await ensureVehicle(
        'FC004',
        'Kia',
        'Rio',
        2020,
        60020,
        VehicleStatus.INACTIVE,
      );

      // Seed an ongoing maintenance only when no active one exists.
      const activeMaintenance = await maintenances.findOne({
        where: [
          {
            vehicleId: vehicle3.id,
            status: MaintenanceStatus.SCHEDULED,
          },
          {
            vehicleId: vehicle3.id,
            status: MaintenanceStatus.IN_PROGRESS,
          },
        ],
      });

      const ongoingMarker =
        'FleetCore seed: preventive maintenance in progress';

      if (
        !activeMaintenance &&
        !(await maintenances.findOneBy({
          vehicleId: vehicle3.id,
          description: ongoingMarker,
        }))
      ) {
        const start = new Date('2026-11-02T08:00:00-05:00');
        const end = new Date('2026-11-02T10:00:00-05:00');

        await maintenances.save(
          maintenances.create({
            type: MaintenanceType.PREVENTIVE,
            description: ongoingMarker,
            mileage: vehicle3.mileage,
            scheduledAt: start,
            scheduledEnd: end,
            status: MaintenanceStatus.IN_PROGRESS,
            vehicleId: vehicle3.id,
            mechanicId: mechanic1.id,
            workshopId: workshop1.id,
          }),
        );
      }

      const completedMarker =
        'FleetCore seed: completed corrective maintenance';

      if (
        !(await maintenances.findOneBy({
          vehicleId: vehicle4.id,
          description: completedMarker,
        }))
      ) {
        await maintenances.save(
          maintenances.create({
            type: MaintenanceType.CORRECTIVE,
            description: completedMarker,
            mileage: 60000,
            scheduledAt: new Date('2026-10-01T08:00:00-05:00'),
            scheduledEnd: new Date('2026-10-01T11:00:00-05:00'),
            status: MaintenanceStatus.COMPLETED,
            workPerformed: 'Brake inspection and replacement',
            finalCost: '280000.00',
            finalMileage: 60020,
            finishedAt: new Date('2026-10-01T11:00:00-05:00'),
            vehicleId: vehicle4.id,
            mechanicId: mechanic2.id,
            workshopId: workshop1.id,
          }),
        );
      }

      console.log('FleetCore seed completed');
      console.log(`Admin user: ${admin.email}`);
      console.log(`Technicians: ${technician1.email}, ${technician2.email}`);
    });
  } finally {
    await db.destroy();
  }
}

seed().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
