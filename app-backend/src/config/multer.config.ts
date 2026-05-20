import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const multerConfig = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  storage: diskStorage({
    destination: join(process.cwd(), './uploads'),
    filename: (_req, file, callback) => {
      const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
      callback(null, uniqueName);
    },
  }),
  fileFilter: (req, file, callback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new Error('Tipo de ficheiro não permitido, use jpeg, png, ou webp.'),
        false,
      );
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};
