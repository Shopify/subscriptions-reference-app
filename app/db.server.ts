import {PrismaClient} from '@prisma/client';
import {env} from '../config';

const prisma = (global.prisma as PrismaClient) || new PrismaClient();

if (env.isProduction && global.prisma === undefined) {
  global.prisma = new PrismaClient();
}

export default prisma;
