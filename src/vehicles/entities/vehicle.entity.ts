import { Entity, PrimaryGeneratedColumn, Column, Index, Check,} from 'typeorm';

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  IN_MAINTENANCE = 'IN_MAINTENANCE',
  INACTIVE = 'INACTIVE',
}

/**
 * Represents a vehicle belonging to the FleetCore fleet.
 */
@Entity('vehicles')
@Check('"mileage" >= 0')
@Check('"year" BETWEEN 1900 AND 2100')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  // Ensures each vehicle has a unique plate.
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 10 })
  plate: string;

  @Column({ type: 'varchar', length: 80 })
  brand: string;

  @Column({ type: 'varchar', length: 80 })
  model: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int', default: 0 })
  mileage: number;

  // Defines the current operational status.
  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.AVAILABLE,
  })
  status: VehicleStatus;
}