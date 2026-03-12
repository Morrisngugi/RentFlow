import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../User';
import { Property } from '../property/Property';
import { AgentLandlordAssignment } from '../AgentLandlordAssignment';

@Entity('landlord_profiles')
export class LandlordProfile {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'text' })
  physicalAddress!: string;

  @Column({ type: 'varchar', nullable: true })
  bankName!: string;

  @Column({ type: 'varchar', nullable: true })
  bankAccountNumber!: string;

  @Column({ type: 'varchar', nullable: true })
  bankAccountHolder!: string;

  @Column({ type: 'varchar', nullable: true })
  companyName!: string;

  @Column({ type: 'varchar', nullable: true })
  taxId!: string;

  @Column({ type: 'numeric', default: 5.0 })
  defaultLateFeePercentage!: number;

  @CreateDateColumn() createdAt!: Date;

  @UpdateDateColumn() updatedAt!: Date;

  // Relations
  @OneToOne(() => User, (user) => user.landlordProfile)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(() => Property, (property) => property.landlord)
  properties!: Property[];

  @OneToMany(() => AgentLandlordAssignment, (assignment) => assignment.landlord)
  agentAssignments!: AgentLandlordAssignment[];
}

