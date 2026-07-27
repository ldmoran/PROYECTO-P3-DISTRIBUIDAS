import { Test, TestingModule } from '@nestjs/testing';
import { RevokedTokenService } from './revoked-token.service';
import { ConfigService } from '@nestjs/config';


const redisMock = {
  connect: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
  on: jest.fn(),
};


jest.mock('redis', () => ({
  createClient: jest.fn(() => redisMock),
}));


describe('RevokedTokenService', () => {

  let service: RevokedTokenService;


  beforeEach(async () => {

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevokedTokenService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: string) => defaultValue),
          },
        },
      ],
    }).compile();


    service = module.get<RevokedTokenService>(RevokedTokenService);

    await service.onModuleInit();

  });


  it('debe guardar un token revocado con TTL', async () => {

    await service.revokeToken('abc123', 300);

    expect(redisMock.set).toHaveBeenCalledWith(
      'revoked:abc123',
      'true',
      {
        EX: 300,
      },
    );

  });


  it('debe identificar un token revocado', async () => {

    redisMock.get.mockResolvedValue('true');


    const result = await service.isRevoked('abc123');


    expect(result).toBe(true);

  });

});