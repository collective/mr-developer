'use strict';

const fs = require('fs');
const git = require('nodegit');
const path = require('path');

const DEVELOP_DIRECTORY = 'develop';

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
  .catch(function (err) { console.error(`Cannot clone ${url}`, err); });;
};

const openRepository = function (name, path) {
  return git.Repository.open(path)
  .then(function(repo) {
    console.log(`Found ${name} at ${path}`);
    return repo;
  })
  .catch(function (err) { console.error(`Cannot open ${path}`, err); });
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

const getBranch = function (name, repository, branchname) {
  return repository.getBranch(branchname)
  .catch(function() {
    // branch does not exist yet, we have to create it
    return createBranch(repository, branchname);
  });
};

const updateBranch = function (name, repository, branchname) {
  return getBranch(name, repository, branchname)
  .then(function(branch) {
    console.log(`...update ${name} ${branchname}`);
    return repository.mergeBranches(branch, 'refs/remotes/origin/' + branchname).then(function() {
      return branch;
    })
    .catch(function (err) { console.error(`Cannot merge origin/${branchname}`, err); });
  })
  .then(function(branch) {
    repository.checkoutRef(branch);
  });
};

const updateRepository = function (name, repository, branchname) {
  console.log(`Updating ${name}`);
  const fetchOpts = {
    callbacks: {
      certificateCheck: function() { return 1; },
      credentials: function(repoUrl, userName) {
        return git.Cred.sshKeyFromAgent(userName);
      }
    }
  };
  return repository.fetch('origin', fetchOpts)
  .then(function() {
    return updateBranch(name, repository, branchname);
  })
  .catch(function (err) { console.error(`Cannot fetch ${settings.url} origin/${branchname}`, err); });
};

const checkoutRepository = function(name, root, settings, noFetch) {
  const pathToRepo = path.join(root, name);
  const branchname = settings.branch || 'master';
  var promise;

  if (!fs.existsSync(pathToRepo)) {
    promise = cloneRepository(name, pathToRepo, settings.url);
  } else {
    promise = openRepository(name, pathToRepo);
  }

  promise.then(function(repository) {
    if (noFetch) {
      return updateBranch(name, repository, branchname);
    } else {
      return updateRepository(name, repository, branchname);
    }
  })
  .catch(function(err) { console.log(err); });
};

exports.develop = function develop(options) {
  // Read in mr.developer.json.
  const raw = fs.readFileSync('mr.developer.json');
  const pkgs = JSON.parse(raw);
  // Check for download directory; create if needed.
  const repoDir = path.join('src', DEVELOP_DIRECTORY);
  if (!fs.existsSync(repoDir)){
    console.log(`Creating repoDir ${repoDir}`);
    fs.mkdirSync(repoDir);
  }
  //TODO: remove.
  else {
    console.log(`Using ${repoDir}`);
  }
  const paths = {};
  // Checkout the repos.
  for (let name in pkgs) {
    const settings = pkgs[name];
    checkoutRepository(name, repoDir, settings, options.noFetch);
    const packageId = settings.package || name;
    let packagePath = path.join('.', DEVELOP_DIRECTORY, name);
    if (settings.path) {
      packagePath = path.join(packagePath, settings.path);
    }
    paths[packageId] = [packagePath];
  }
  // update paths in tsconfig.json
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json'));
  tsconfig.compilerOptions.paths = paths;
  console.log(`Update paths in tsconfig.json`);
  fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 4));
  return pkgs;
};
