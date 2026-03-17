import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { TenantProfile } from './profile/TenantProfile';
import { AgentProfile } from './profile/AgentProfile';
import { LandlordProfile } from './profile/LandlordProfile';
import { Notification } from './notification/Notification';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  email!: string;

  @Column({ type: 'varchar' })
  phoneNumber!: string;

  @Column({ type: 'varchar' })
  firstName!: string;

  @Column({ type: 'varchar' })
  lastName!: string;

  @Column({ type: 'varchar' })
  idNumber!: string;

  @Column({ type: 'varchar', nullable: true })
  profilePictureUrl!: string;

  @Column({ type: 'varchar', select: false })
  passwordHash!: string;

  @Column({ 
    type: 'enum', 
    enum: ['admin', 'agent', 'landlord', 'tenant'],
    default: 'tenant'
  })
  role!: 'admin' | 'agent' | 'landlord' | 'tenant';

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn() createdAt!: Date;

  @UpdateDateColumn() updatedAt!: Date;

  // Relations
  @OneToOne(() => TenantProfile, (profile) => profile.user, {
    nullable: true,
    cascade: true,
  })
  tenantProfile!: TenantProfile;

  @OneToOne(() => AgentProfile, (profile) => profile.user, {
    nullable: true,
    cascade: true,
  })
  agentProfile!: AgentProfile;

  @OneToOne(() => LandlordProfile, (profile) => profile.user, {
    nullable: true,
    cascade: true,
  })
  landlordProfile!: LandlordProfile;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications!: Notification[];
}

