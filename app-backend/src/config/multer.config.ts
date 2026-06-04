import { BadRequestException } from "@nestjs/common";
import { memoryStorage } from "multer";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOW_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const avatarUploadConfig = {
  storage: memoryStorage(),
  limits: {
    fileSize: MAX_SIZE,
  },
  fileFilter: (_req: any, file:Express.Multer.File, cb: Function) => {
    if (!ALLOW_TYPES.includes(file.mimetype)) {
      return cb (
        new BadRequestException (
          `Tipo invalido, envie:' ${ALLOW_TYPES.join(',')}`,
        ),
        false,
      );
    }
    cb (null, true);
  },
};