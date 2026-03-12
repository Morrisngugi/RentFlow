import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../User';

@Entity('tenant_profiles')
export class TenantProfile {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', nullable: true })
  nationality!: string;

  @Column({
    type: 'enum',
    enum: ['single', 'married', 'divorced', 'widowed'],
    nullable: true,
  })
  maritalStatus!: string;

  @Column({ type: 'int', default: 0 })
  numberOfChildren!: number;

  @Column({ type: 'varchar', nullable: true })
  occupation!: string;

  @Column({ type: 'text', nullable: true })
  postalAddress!: string;

  @Column({ type: 'varchar', nullable: true })
  nextOfKinName!: string;

  @Column({ type: 'varchar', nullable: true })
  nextOfKinPhone!: string;

  @Column({ type: 'varchar', nullable: true })
  nextOfKinRelationship!: string;

  @CreateDateColumn() createdAt!: Date;

  @UpdateDateColumn() updatedAt!: Date;

  // Relation
  @OneToOne(() => User, (user) => user.tenantProfile)
  @JoinColumn({ name: 'userId' })
  user!: User;
}

