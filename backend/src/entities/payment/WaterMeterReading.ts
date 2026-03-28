import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Lease } from '../lease/Lease';

@Entity('water_meter_readings')
export class WaterMeterReading {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' })
  leaseId!: string;

  @Column({ type: 'date' })
  readingDate!: Date;

  @Column({ type: 'numeric' })
  unitsUsed!: number; // Water units consumed in this period (e.g., cubic meters)

  @Column({ type: 'numeric', nullable: true })
  meterReadingStart!: number; // Opening meter reading

  @Column({ type: 'numeric', nullable: true })
  meterReadingEnd!: number; // Closing meter reading

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @CreateDateColumn() createdAt!: Date;

  @UpdateDateColumn() updatedAt!: Date;

  // Relations
  @ManyToOne(() => Lease)
  lease!: Lease;
}
