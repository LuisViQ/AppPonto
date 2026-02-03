const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const password = process.argv[2];
if (!password) {
  console.log('Uso: node scripts/hashPassword.js "SENHA_NOVA"');
  process.exit(1);
}

const pepper = process.env.PASSWORD_PEPPER || '';
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

bcrypt
  .hash(`${password}${pepper}`, saltRounds)
  .then((hash) => {
    console.log(hash);
  })
  .catch((error) => {
    console.error('Erro ao gerar hash:', error);
    process.exit(1);
  });
