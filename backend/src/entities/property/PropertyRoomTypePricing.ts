import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Property } from './Property';

@Entity('property_room_type_pricing')
@Unique(['propertyId', 'roomType'])
export class PropertyRoomTypePricing {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' })
  propertyId!: string;

  @Column({ type: 'varchar' })
  roomType!: string; // e.g., "Bed-sitter", "1-Bedroom", "2-Bedroom", "3-Bedroom", "4-Bedroom"

  @Column({
    type: 'enum',
    enum: ['monthly', 'daily', 'weekly'],
    default: 'monthly',
  })
  billingFrequency!: string; // 'monthly' for rental, 'daily'/'weekly' for airbnb

  @Column({ type: 'numeric' })
  price!: number; // Main price (rent for monthly, per day for daily, per week for weekly)

  // For Rental properties only
  @Column({ type: 'numeric', nullable: true, default: null })
  garbageAmount!: number;

  @Column({ type: 'numeric', nullable: true, default: null })
  waterUnitCost!: number;

  // For AirBnB: these fields are NULL/not used
  // Deposit is input manually during tenant addition

  @CreateDateColumn() createdAt!: Date;

  @UpdateDateColumn() updatedAt!: Date;

  // Relations
  @ManyToOne(() => Property, (property) => property.roomTypePricing, {
    onDelete: 'CASCADE',
  })
  property!: Property;
}


