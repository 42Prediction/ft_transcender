import { DataSource } from 'typeorm';
import { Role } from '../shared/enums/roles.enum';
import { User } from '../modules/user/entities/user.entity';
import { Bettor } from '../modules/bettor/entities/bettor.entity';
import { BettorService } from '../modules/bettor/bettor.service';
import * as bcrypt from 'bcrypt'

export async function adminSeed(dataSource: DataSource, bettorService: BettorService) {
    const userRepo = dataSource.getRepository(User);
    const bettorRepo = dataSource.getRepository(Bettor);
    const adminPwd = process.env.ADMIN_PWD;
    if (!adminPwd) {
        throw new Error('Environment variable ADMIN_PWD is not set');
    }
    let admin = await userRepo.findOneBy({email: 'admin@dev.com'});
    if (!admin){
        admin = await userRepo.save(userRepo.create({
            email:  'admin@dev.com',
            password: await bcrypt.hash(adminPwd, 10),
            role: Role.ADMIN,
            state: true,
        }));
    }

    const bettorExists = await bettorRepo.findOneBy({ user: { id: admin.id } });
    if (!bettorExists) {
        await bettorService.create(admin);
    }

    console.log('Admin seed Ok\n');
}