import { IsOptional, Length, IsString, IsInt } from "class-validator";
import { Model } from "./model";
export class UpdateCatDto extends Model {
    @IsOptional()
    @Length(1, 32)
    @IsString()
    name?: string;
    @IsOptional()
    @IsInt()
    age?: number;
}
export class CreateCatDto extends Model {
    @Length(1, 32)
    @IsString()
    name: string;
    @IsInt()
    age: number;
}
export class Cat extends Model {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    age: number;
}