import { Test, TestingModule } from '@nestjs/testing';
import { CdacService } from './cdac.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

describe('CdacService', () => {
  let service: CdacService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule],
      providers: [CdacService],
    }).compile();

    service = module.get<CdacService>(CdacService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
