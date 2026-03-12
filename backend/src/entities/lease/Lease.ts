import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Property } from '../property/Property';
import { User } from '../User';
import { LeaseTerm } from './LeaseTerm';
import { Payment } from '../payment/Payment';
import { LeaseRenewal } from './LeaseRenewal';

@Entity('leases')
export class Lease {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' })
  propertyId!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid' })
  landlordId!: string;

  @Column({ type: 'uuid' })
  leaseTermId!: string;

  @Column({ type: 'numeric' })
  monthlyRent!: number;

  @Column({ type: 'numeric', default: 0 })
  garbageAmount!: number;

  @Column({ type: 'numeric', default: 0 })
  waterUnitCost!: number;

  @Column({ type: 'numeric', default: 0 })
  securityDeposit!: number;

  @Column({ type: 'boolean', default: false })
  depositPaid!: boolean;

  @Column({ type: 'date', nullable: true })
  depositPaidDate!: Date;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  endDate!: Date;

  @Column({
    type: 'enum',
    enum: ['draft', 'active', 'expired', 'terminated'],
    default: 'active',
  })
  status!: string;

  @CreateDateColumn() createdAt!: Date;

  @UpdateDateColumn() updatedAt!: Date;

  // Relations
  @ManyToOne(() => Property, (property) => property.leases)
  property!: Property;

  @ManyToOne(() => User)
  tenant!: User;

  @ManyToOne(() => User)
  landlord!: User;

  @ManyToOne(() => LeaseTerm)
  leaseTerm!: LeaseTerm;

  @OneToMany(() => Payment, (payment) => payment.lease)
  payments!: Payment[];

  @OneToMany(() => LeaseRenewal, (renewal) => renewal.lease)
  renewals!: LeaseRenewal[];
}

