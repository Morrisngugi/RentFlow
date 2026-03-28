import { IsString, IsNotEmpty, IsNumber, IsEmail, MinLength, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class PropertyFloorDTO {
  @IsNumber()
  floorNumber!: number;

  @IsNumber()
  unitsPerFloor!: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  roomTypes?: string[]; // Array of room types for each unit

  @IsArray()
  @IsOptional()
  unitNames?: string[]; // Custom names for each unit (e.g., F001, A101)
}

export class PropertyUnitDTO {
  @IsNumber()
  unitNumber!: number;

  @IsString()
  @IsNotEmpty()
  roomType!: string; // e.g., "Bed-sitter", "1-Bedroom", "2-Bedroom"
}

export class RoomTypePricingDTO {
  @IsString()
  @IsNotEmpty()
  roomType!: string; // e.g., "Bed-sitter", "1-Bedroom", "2-Bedroom", "3-Bedroom", "4-Bedroom"

  @IsString()
  @IsOptional()
  billingFrequency?: string; // 'monthly' for rental (default), 'daily'/'weekly' for airbnb

  @IsNumber()
  @IsNotEmpty()
  price!: number; // Rate (monthly/daily/weekly depending on billingFrequency)

  // For Rental properties only - optional additional charges
  @IsNumber()
  @IsOptional()
  garbageAmount?: number; // Garbage fee per month

  @IsNumber()
  @IsOptional()
  waterUnitCost?: number; // Water cost per unit

  // Note: Security deposit is input per tenant, not at property level
}


export class LandlordDTO {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  idNumber!: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password!: string;
}

export class CreatePropertyRequest {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  postalCode?: string;

  @IsString()
  country?: string;

  @IsNumber()
  @IsOptional()
  monthlyRent?: number;

  @IsNumber()
  @IsOptional()
  depositAmount?: number;

  @IsString()
  description?: string;

  @IsString()
  propertyType?: string; // 'apartment', 'house', 'commercial'

  @IsString()
  @IsOptional()
  propertyModel?: string; // 'rental' or 'airbnb' (default: rental)

  @IsNumber()
  @IsOptional()
  securityFee?: number; // Optional monthly fee for security personnel (watchmen/guards). Only for rental properties.

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyFloorDTO)
  floors!: PropertyFloorDTO[];

  @IsString()
  @IsOptional()
  paymentMethod?: string; // 'bank' or 'paybill'

  @IsString()
  @IsOptional()
  bankName?: string; // Bank name for bank transfer method

  @IsString()
  @IsOptional()
  accountNumber?: string; // Account number for bank transfers or paybill reference

  @IsString()
  @IsOptional()
  paybillNumber?: string; // Paybill number for paybill method

  @IsString()
  @IsNotEmpty()
  landlordFirstName!: string;

  @IsString()
  @IsNotEmpty()
  landlordLastName!: string;

  @IsEmail()
  @IsNotEmpty()
  landlordEmail!: string;

  @IsString()
  @IsNotEmpty()
  landlordPhone!: string;

  @IsString()
  @IsNotEmpty()
  landlordIdNumber!: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  landlordPassword!: string;

  // Room type pricing: { "1-Bedroom": 25000, "2-Bedroom": 35000 }
  @IsOptional()
  roomTypePrices?: Record<string, number>;
}

export class UpdatePropertyRequest {
  @IsString()
  name?: string;

  @IsString()
  address?: string;

  @IsString()
  city?: string;

  @IsString()
  postalCode?: string;

  @IsString()
  country?: string;

  @IsNumber()
  monthlyRent?: number;

  @IsNumber()
  depositAmount?: number;

  @IsString()
  description?: string;

  @IsString()
  propertyType?: string;
}
