import { BadRequestException, Injectable } from '@nestjs/common';
import { mkdirSync, existsSync, unlinkSync} from 'fs';
import { v4 as uuidv4 }from 'uuid';
import { join } from 'path';
import sharp from 'sharp';

@Injectable()
export class AvatarService {      
    private readonly uploadDir = join(process.cwd(), 'uploads', 'avatar');
    private readonly AVATAR_SIZE = 256;
    constructor () {
        if (!existsSync(this.uploadDir))
            mkdirSync(this.uploadDir, {recursive: true});
    }
    
    async processAndSave(file: Express.Multer.File): Promise<string> {
        const filename = `${uuidv4()}.webp`;
        const filepath = join(this.uploadDir, filename);

        try {
            await sharp(file.buffer)
            .resize(this.AVATAR_SIZE, this.AVATAR_SIZE, 
                {
                fit: 'cover',
                position: 'center',
                })
            .webp( {quality: 80})
            .toFile(filepath);
        }
        catch {
            throw new BadRequestException(
                'fail to process avatar'
            );
        }
        return filename;
    }

    deleteOldAvatar (filename: string | null) : void {
        if (!filename) return;
        const filepath = join(this.uploadDir, filename);
        if (existsSync(filepath))
            unlinkSync(filepath);
    }

    extractFilename (avatarPath: string | null) : string | null {
        if (!avatarPath) return null;
        return avatarPath.split('/').pop() ?? null;
    }
}
