import {
  plainToInstance,
  Transform,
  TransformFnParams,
} from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsString,
  IsUrl,
  Matches,
  Min,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

enum SameSite {
  Lax = 'lax',
  Strict = 'strict',
  None = 'none',
}

enum AttachmentStorage {
  Local = 'local',
  Cloudinary = 'cloudinary',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsInt()
  @Min(1)
  @Transform(({ value }: TransformFnParams) => Number(value))
  PORT: number = 3000;

  @IsUrl({ require_tld: false })
  FRONTEND_URL!: string;

  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @Matches(/^\d+[smhd]$/)
  JWT_ACCESS_EXPIRES_IN = '15m';

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @Matches(/^\d+[smhd]$/)
  JWT_REFRESH_EXPIRES_IN = '7d';

  @IsBoolean()
  @Transform(
    ({ value }: TransformFnParams) => value === true || value === 'true',
  )
  COOKIE_SECURE: boolean = false;

  @IsEnum(SameSite)
  COOKIE_SAME_SITE: SameSite = SameSite.Lax;

  @IsEnum(AttachmentStorage)
  ATTACHMENT_STORAGE: AttachmentStorage = AttachmentStorage.Local;

  @ValidateIf(
    (environment: EnvironmentVariables) =>
      environment.ATTACHMENT_STORAGE === AttachmentStorage.Cloudinary,
  )
  @IsString()
  @MinLength(1)
  CLOUDINARY_CLOUD_NAME?: string;

  @ValidateIf(
    (environment: EnvironmentVariables) =>
      environment.ATTACHMENT_STORAGE === AttachmentStorage.Cloudinary,
  )
  @IsString()
  @MinLength(1)
  CLOUDINARY_API_KEY?: string;

  @ValidateIf(
    (environment: EnvironmentVariables) =>
      environment.ATTACHMENT_STORAGE === AttachmentStorage.Cloudinary,
  )
  @IsString()
  @MinLength(1)
  CLOUDINARY_API_SECRET?: string;

  @ValidateIf(
    (environment: EnvironmentVariables) =>
      environment.ATTACHMENT_STORAGE === AttachmentStorage.Cloudinary,
  )
  @IsString()
  @Matches(/^[A-Za-z0-9/_-]+$/, {
    message: 'CLOUDINARY_FOLDER contains unsupported characters',
  })
  CLOUDINARY_FOLDER: string = 'helpdesk';

  @IsBoolean()
  @Transform(
    ({ value }: TransformFnParams) => value === true || value === 'true',
  )
  SMTP_ENABLED: boolean = false;

  @ValidateIf((environment: EnvironmentVariables) => environment.SMTP_ENABLED)
  @IsString()
  @MinLength(1)
  SMTP_HOST?: string;

  @ValidateIf((environment: EnvironmentVariables) => environment.SMTP_ENABLED)
  @IsInt()
  @Min(1)
  @Transform(({ value }: TransformFnParams) => Number(value))
  SMTP_PORT?: number;

  @ValidateIf((environment: EnvironmentVariables) => environment.SMTP_ENABLED)
  @IsBoolean()
  @Transform(
    ({ value }: TransformFnParams) => value === true || value === 'true',
  )
  SMTP_SECURE?: boolean;

  @ValidateIf((environment: EnvironmentVariables) => environment.SMTP_ENABLED)
  @IsString()
  @MinLength(1)
  SMTP_USER?: string;

  @ValidateIf((environment: EnvironmentVariables) => environment.SMTP_ENABLED)
  @IsString()
  @MinLength(1)
  SMTP_PASSWORD?: string;

  @ValidateIf((environment: EnvironmentVariables) => environment.SMTP_ENABLED)
  @IsEmail()
  MAIL_FROM?: string;

  @ValidateIf((environment: EnvironmentVariables) => environment.SMTP_ENABLED)
  @IsUrl({ require_tld: false })
  RESET_PASSWORD_URL?: string;

  @ValidateIf((environment: EnvironmentVariables) =>
    Boolean(environment.GEMINI_API_KEY),
  )
  @IsString()
  @MinLength(1)
  GEMINI_API_KEY?: string;

  @IsString()
  @MinLength(1)
  GEMINI_MODEL: string = 'gemini-2.5-flash';
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config);
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validated;
}
