const fs = require('fs');

exports.develop = function develop() {
  const raw = fs.readFileSync('mr.developer.json');
  const pkgs = JSON.parse(raw);
  return pkgs;
};
