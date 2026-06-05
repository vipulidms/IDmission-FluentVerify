const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

if (process.env.VERCEL === '1') {
  console.log('Vercel environment detected. Setting Prisma provider to postgresql...');
  schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, schema);
} else {
  console.log('Local environment detected. Keeping Prisma provider as sqlite...');
}

try {
  console.log('Running prisma generate...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  if (process.env.VERCEL === '1') {
    console.log('Running prisma db push on Vercel...');
    execSync('npx prisma db push', { stdio: 'inherit' });
  }
} catch (error) {
  console.error('Prisma step failed:', error.message);
  if (process.env.VERCEL === '1') {
    process.exit(1);
  } else {
    console.log('Ignoring error in local environment during postinstall.');
  }
}
