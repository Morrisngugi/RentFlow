import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Lease } from './Lease';

@Entity('lease_renewals')
export class LeaseRenewal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  leaseId: string;

  @Column({ type: 'date' })
  oldEndDate: Date;

  @Column({ type: 'date' })
  newEndDate: Date;

  @Column({ type: 'numeric', nullable: true })
  newMonthlyRent: number;

  @CreateDateColumn()
  renewalDate: Date;

  // Relation
  @ManyToOne(() => Lease, (lease) => lease.renewals)
  lease: Lease;
}
