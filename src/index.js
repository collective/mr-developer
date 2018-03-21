'use strict';

const fs = require('fs');
const git = require('nodegit');
const path = require('path');

const cloneRepository = function (name, path, url) {
  console.log(`Cloning ${name} from ${url}...`);
  const cloneOptions = {};
  cloneOptions.fetchOpts = {
    callbacks: {
      certificateCheck: function() { return 1; },
      credentials: function(repoUrl, userName) {
        return git.Cred.sshKeyFromAgent(userName);
      },
      transferProgress: function(stats) {
        const progress = Math.round(100 * stats.receivedObjects() / stats.totalObjects());
        return console.log(`Loading ${name} ${progress}%...`);
      }
    }
  };
  return git.Clone(url, path, cloneOptions)
  .then(function (repo) {
    console.log(`...cloned ${name} at ${path}`);
    return repo;
  })
  .catch(function (err) { console.log(`Cannot clone ${url}`, err); });;
};

const openRepository = function (name, path) {
  return git.Repository.open(path)
  .then(function(repo) {
    console.log(`Found ${name} at ${path}`);
    return repo;
  })
  .catch(function (err) { console.log(`Cannot open ${path}`, err); });
};

const createBranch = function (repository, branchname) {
  return repository.getHeadCommit()
  .then(function(commit) {
    return repository.createBranch(
      branchname,
      commit,
      0,
      repository.defaultSignature(),
      'Created new-branch on HEAD')
    .then(function() {
      return repository.getBranch(branchname);
    });
  });
};

const updateRepository = function (name, repository, branchname) {
  var branch;
  console.log(`Updating ${name}`);
  const fetchOpts = {
    callbacks: {
      certificateCheck: function() { return 1; },
      credentials: function(repoUrl, userName) {
        return git.Cred.sshKeyFromAgent(userName);
      }
    }
  };
  repository.fetch('origin', fetchOpts)
  .then(function() {
    return repository.getBranch(branchname)
    .then(function(reference) {
      branch = reference;
    })
    .catch(function() {
      // branch does not exist yet, we have to create it
      return createBranch(repository, branchname).then(function(b) {
        branch = b;
      });
    });
  })
  .then(function() {
    console.log(`...update ${name} ${branchname}`);
    return repository.mergeBranches(branch, 'refs/remotes/origin/' + branchname)
    .catch(function (err) { console.log(`Cannot merge origin/${branchname}`, err); });
  })
  .then(function() {
    repository.checkoutRef(branch);
  })
  .catch(function (err) { console.log(`Cannot update ${settings.url} origin/${branchname}`, err); });
};

const checkoutRepository = function(name, root, settings) {
  const pathToRepo = path.join(root, name);
  const branchname = settings.branch || 'master';
  var promise;

  if (!fs.existsSync(pathToRepo)) {
    promise = cloneRepository(name, pathToRepo, settings.url);
  } else {
    promise = openRepository(name, pathToRepo);
  }

  promise.then(function(repository) {
    return updateRepository(name, repository, branchname);
  })
  .catch(function(err) { console.log(err); });
};

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
    console.log(`Using ${repoDir}`);
  }
  // Checkout the repos.
  for (let k in pkgs) {
    checkoutRepository(k, repoDir, pkgs[k])
  }
  return pkgs;
};
