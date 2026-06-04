import { Test, TestingModule } from '@nestjs/testing';
import { BettorService } from './bettor.service';

describe('BettorService', () => {
  let service: BettorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BettorService],
    }).compile();

    service = module.get<BettorService>(BettorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
