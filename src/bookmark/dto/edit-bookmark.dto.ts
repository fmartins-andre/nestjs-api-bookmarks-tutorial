import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class EditBookmarkDto {
  @IsString()
  @IsNotEmpty()
  @ValidateIf((_, value) => value !== undefined)
  title?: string;

  @IsString()
  @ValidateIf((_, value) => value !== undefined)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((_, value) => value !== undefined)
  link?: string;
}
