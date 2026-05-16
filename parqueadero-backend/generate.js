const bcrypt = require('bcrypt');

bcrypt.hash('Admin2025*', 10).then(hash => {
  console.log(hash);
});