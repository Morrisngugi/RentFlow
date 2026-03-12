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
import { AgentLandlordAssignment } from '../AgentLandlordAssignment';

@Entity('agent_profiles')
export class AgentProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar' })
  officeName: string;

  @Column({ type: 'varchar' })
  officeLocation: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.agentProfile)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => AgentLandlordAssignment, (assignment) => assignment.agent)
  landlordAssignments: AgentLandlordAssignment[];
}
