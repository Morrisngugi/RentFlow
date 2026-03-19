import { IsString, IsNotEmpty, IsNumber, IsEmail, MinLength, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PropertyFloorDTO {
  @IsNumber()
  floorNumber!: number;

  @IsNumber()
  unitsPerFloor!: number;

  @IsString()
  description?: string;
}

export class PropertyUnitDTO {
  @IsNumber()
  unitNumber!: number;

  @IsString()
  @IsNotEmpty()
  roomType!: string; // e.g., "Bed-sitter", "1-Bedroom", "2-Bedroom"
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
  @IsNotEmpty()
  monthlyRent!: number;

  @IsNumber()
  depositAmount?: number;

  @IsString()
  description?: string;

  @IsString()
  propertyType?: string; // 'apartment', 'house', 'commercial'

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyFloorDTO)
  floors!: PropertyFloorDTO[];

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
