import { Module } from '@nestjs/common';
import { ScansService } from './scans.service';
import { ScansController } from './scans.controller';
import { TrivyParserService } from './services/trivy-parser.service';

@Module({
    controllers: [ScansController],
    providers: [ScansService, TrivyParserService],
    exports: [ScansService],
})
export class ScansModule { }
