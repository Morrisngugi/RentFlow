import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Lease } from '../lease/Lease';

@Entity('rent_schedules')
export class RentSchedule {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' })
  leaseId!: string;

  @Column({ type: 'int' })
  rentDueDay!: number;

  @Column({ type: 'date' })
  dueDate!: Date;

  @CreateDateColumn() createdAt!: Date;

  // Relation
  @ManyToOne(() => Lease)
  lease!: Lease;
}

