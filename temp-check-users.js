const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log('Starting DB check...');
    try {
        const users = await prisma.user.findMany({ 
            select: { email: true, id: true }
        });
        console.log('FOUND_USERS:', JSON.stringify(users, null, 2));
    } catch (e) {
        console.error('DB_ERROR:', e.message);
        console.error(e);
    } finally {
        await prisma.$disconnect();
        console.log('Disconnected');
    }
}
main();
