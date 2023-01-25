import { Test, TestingModule } from '@nestjs/testing';
import { UciService } from './uci.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

describe('UciService', () => {
  let service: UciService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule],
      providers: [UciService],
    }).compile();

    service = module.get<UciService>(UciService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
