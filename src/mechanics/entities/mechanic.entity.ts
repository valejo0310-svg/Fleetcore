import {  Entity,  PrimaryGeneratedColumn,  Column,  Index,  OneToOne,  JoinColumn,} from 'typeorm';

import { User } from '../../users/entities/user.entity.js';

export enum MechanicStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('mechanics')
export class Mechanic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150 })
  email: string;

  @Column({ type: 'varchar', length: 120 })
  specialty: string;

  @Column({
    type: 'enum',
    enum: MechanicStatus,
    default: MechanicStatus.ACTIVE,
  })
  status: MechanicStatus;

  // A mechanic may be associated with one technician account.
  @Index({ unique: true })
  @Column({
    name: 'user_id',
    type: 'int',
    nullable: true,
  })
  userId: number | null;

  @OneToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;
}
