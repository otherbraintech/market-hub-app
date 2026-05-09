const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
    try {
        const users = await prisma.user.findMany({ 
            select: { email: true, name: true }
        });
        fs.writeFileSync('db-users.json', JSON.stringify(users, null, 2));
        console.log('Success');
    } catch (e) {
        fs.writeFileSync('db-error.txt', e.stack);
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
