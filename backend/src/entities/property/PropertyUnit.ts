import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('property_units')
export class PropertyUnit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  floorId!: string;

  @Column({ type: 'int' })
  unitNumber!: number;

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
  @ManyToOne('PropertyFloor', (floor: any) => floor.units, {
    onDelete: 'CASCADE',
  })
  floor!: any;
}
