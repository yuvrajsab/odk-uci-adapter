import { Test, TestingModule } from '@nestjs/testing';
import { UciService } from './uci.service';

describe('UciService', () => {
  let service: UciService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UciService],
    }).compile();

    service = module.get<UciService>(UciService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
