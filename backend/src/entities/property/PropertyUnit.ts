import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../User';
import { PropertyFloor } from './PropertyFloor';

@Entity('property_units')
export class PropertyUnit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  floorId!: string;

  @Column({ type: 'int' })
  unitNumber!: number;

  @Column({ type: 'varchar', nullable: true })
  unitName!: string; // e.g., "A001", "B101" - custom unit identifier

  @Column({ type: 'varchar' })
  roomType!: string; // e.g., "Bed-sitter", "1-Bedroom", "2-Bedroom", "3-Bedroom"

  @Column({
    type: 'enum',
    enum: ['vacant', 'occupied', 'maintenance'],
    default: 'vacant',
  })
  status!: string;

  @Column({ type: 'uuid', nullable: true })
  currentTenantId!: string; // null if vacant

  @Column({ type: 'text', nullable: true })
  description!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => PropertyFloor, (floor) => floor.units, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'floorId' })
  floor!: PropertyFloor;

  @ManyToOne(() => User, {
    nullable: true,
    eager: false,
  })
  @JoinColumn({ name: 'currentTenantId' })
  tenant!: User | null;
}
