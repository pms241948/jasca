import { Module } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { PoliciesController } from './policies.controller';
import { PolicyEngineService } from './policy-engine.service';

@Module({
    controllers: [PoliciesController],
    providers: [PoliciesService, PolicyEngineService],
    exports: [PoliciesService, PolicyEngineService],
})
export class PoliciesModule { }
