'use strict';

const fs = require('fs');
const git = require('nodegit');
const path = require('path');

exports.develop = function develop() {
  // Read in mr.developer.json.
  const raw = fs.readFileSync('mr.developer.json');
  const pkgs = JSON.parse(raw);
  // Check for download directory; create if needed.
  const repoDir = './src/develop';
  if (!fs.existsSync(repoDir)){
    console.log(`Creating repoDir ${repoDir}`);
    fs.mkdirSync(repoDir);
  }
  //TODO: remove.
  else {
    console.log(`repoDir ${repoDir} already exists`);
  }
  // Clone the repos.
  for (let k in pkgs) {
    console.log(`Cloning ${k} from ${pkgs[k]}...`);
    git.Clone(pkgs[k], path.join(repoDir,k))
      .then(function (repo) {
        console.log(`...cloned ${k} at ${repo.path}`);
      })
      .catch(function (err) { console.log(err); });
  }
  return pkgs;
};
