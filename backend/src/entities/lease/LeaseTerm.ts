import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('lease_terms')
export class LeaseTerm {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'int', nullable: true })
  durationMonths!: number;

  @Column({ type: 'boolean', default: false })
  autoRenewal!: boolean;

  @Column({ type: 'int', default: 30 })
  noticePeriodDays!: number;
}

