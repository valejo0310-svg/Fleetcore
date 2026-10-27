import {  Entity,  PrimaryGeneratedColumn,  Column,  Index,  Check,  ManyToOne,  JoinColumn,} from 'typeorm';

import { Vehicle } from '../../vehicles/entities/vehicle.entity.js';
import { Mechanic } from '../../mechanics/entities/mechanic.entity.js';
import { Workshop } from '../../workshops/entities/workshop.entity.js';

export enum MaintenanceType {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
}

export enum MaintenanceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('maintenances')
@Check('"mileage" >= 0')
@Check('"scheduled_end" > "scheduled_at"')
export class Maintenance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: MaintenanceType })
  type: MaintenanceType;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  mileage: number;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt: Date;

  // Defines the interval used to detect schedule overlaps.
  @Column({ name: 'scheduled_end', type: 'timestamptz' })
  scheduledEnd: Date;

  @Index()
  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.SCHEDULED,
  })
  status: MaintenanceStatus;

  @Column({ name: 'work_performed', type: 'text', nullable: true })
  workPerformed: string | null;

  @Column({
    name: 'final_cost',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  finalCost: string | null;

  @Column({
    name: 'finished_at',
    type: 'timestamptz',
    nullable: true,
  })
  finishedAt: Date | null;

  @Column({ name: 'final_mileage', type: 'int', nullable: true })
  finalMileage: number | null;

  @Index()
  @Column({ name: 'vehicle_id', type: 'int' })
  vehicleId: number;

  @ManyToOne(() => Vehicle, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Index()
  @Column({ name: 'mechanic_id', type: 'int' })
  mechanicId: number;

  @ManyToOne(() => Mechanic, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'mechanic_id' })
  mechanic: Mechanic;

  @Index()
  @Column({ name: 'workshop_id', type: 'int' })
  workshopId: number;

  @ManyToOne(() => Workshop, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'workshop_id' })
  workshop: Workshop;
}
