import { IsEnum, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReviewDecisionType } from '@prisma/client';

export class SubmitReviewDto {
  @ApiProperty({ description: 'Review decision: approved or changes_requested', enum: ReviewDecisionType })
  @IsEnum(ReviewDecisionType)
  @IsNotEmpty()
  decision: ReviewDecisionType;

  @ApiProperty({ description: 'Comment/feedback explaining decision', maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  comment: string;
}
