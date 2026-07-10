import { DataSource } from 'typeorm';
import { Role } from '../shared/enums/roles.enum';
import { User } from '../modules/user/entities/user.entity';
import * as bcrypt from 'bcrypt'

export async function adminSeed(dataSource: DataSource) {
    const repo = dataSource.getRepository(User);
    const adminPwd = process.env.ADMIN_PWD;
    if (!adminPwd) {
        throw new Error('Environment variable ADMIN_PWD is not set');
    }
    const exists = await repo.findOneBy({email: 'admin@dev.com'});
    if (!exists){
        const admin = {
            email:  'admin@dev.com',
            password: await bcrypt.hash(adminPwd, 10),
            role: Role.ADMIN,
            state: true,
        };
        await repo.save(repo.create(admin));
    }
    console.log('Admin seed Ok\n');
}