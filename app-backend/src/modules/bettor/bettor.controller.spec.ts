import { Test, TestingModule } from '@nestjs/testing';
import { BettorController } from './bettor.controller';
import { BettorService } from './bettor.service';

describe('BettorController', () => {
  let controller: BettorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BettorController],
      providers: [BettorService],
    }).compile();

    controller = module.get<BettorController>(BettorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
