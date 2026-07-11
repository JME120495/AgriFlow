import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { BadRequestException } from '@nestjs/common';

describe('FilesController', () => {
  let controller: FilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
    }).compile();

    controller = module.get<FilesController>(FilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should throw an error if no file is provided', () => {
    expect(() => controller.uploadFile(undefined)).toThrow(BadRequestException);
  });

  it('should return file metadata on success', () => {
    const mockFile = {
      fieldname: 'file',
      originalname: 'test.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: 1024,
      destination: './uploads',
      filename: 'file-12345.png',
      path: 'uploads/file-12345.png',
    } as Express.Multer.File;

    const result = controller.uploadFile(mockFile);
    expect(result).toEqual({
      message: 'Fichier uploadé avec succès',
      filename: 'file-12345.png',
      path: '/uploads/file-12345.png',
    });
  });
});
