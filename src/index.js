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

const getBranch = function (repository, branchname) {
  return repository.getBranch(branchname)
  .catch(function() {
    // branch does not exist yet, we have to create it
    return createBranch(repository, branchname);
  });
};

const updateBranch = function (name, repository, branchname) {
  return getBranch(repository, branchname)
  .then(function(branch) {
    console.log(`...update ${name} to branch ${branchname}`);
    return repository.mergeBranches(branch, 'refs/remotes/origin/' + branchname).then(function() {
      return branch;
    })
    .catch(function (err) { console.error(`Cannot merge origin/${branchname}`, err); });
  })
  .then(function(branch) {
    repository.checkoutRef(branch);
  });
};

const getTag = function (name, repository, tagName) {
  return repository.getReference(`refs/tags/${tagName}`)
  .then(function(ref) {
    return ref.peel(git.Object.TYPE.COMMIT);
  })
  .then(function(commit) {
    console.log(`...update ${name} to tag ${tagName}`);
    return repository.setHeadDetached(commit, repository.defaultSignature, "Checkout: HEAD " + commit.id());
  });
};

const setHead = function (name, repository, settings) {
  if (settings.tag) {
    return getTag(name, repository, settings.tag);
  } else {
    return updateBranch(name, repository, settings.branch || 'master')
  }
}

const updateRepository = function (name, repository) {
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
    return repository;
  })
  .catch(function (err) { console.error(`Cannot fetch ${settings.url} origin`, err); });
};

const checkoutRepository = function(name, root, settings, noFetch) {
  const pathToRepo = path.join(root, name);
  
  const tag = settings.tag;
  var promise;

  if (!fs.existsSync(pathToRepo)) {
    promise = cloneRepository(name, pathToRepo, settings.url);
  } else {
    promise = openRepository(name, pathToRepo);
  }

  return promise.then(function(repository) {
    if (noFetch) {
      return setHead(name, repository, settings);
    } else {
      return updateRepository(name, repository)
      .then(function() {
        return setHead(name, repository, settings);
      });
    }
  })
  .catch(function(err) { console.log(err); });
};

const getRepoDir = function (root) {
  // Check for download directory; create if needed.
  const repoDir = path.join(root || '.', 'src', DEVELOP_DIRECTORY);
  if (!fs.existsSync(repoDir)){
    console.log(`Creating repoDir ${repoDir}`);
    fs.mkdirSync(repoDir);
  }
  //TODO: remove.
  else {
    console.log(`Using ${repoDir}`);
  }
  return repoDir;
};

const develop = function develop(options) {
  // Read in mr.developer.json.
  const raw = fs.readFileSync('mr.developer.json');
  const pkgs = JSON.parse(raw);
  const repoDir = getRepoDir(options.root);
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

exports.cloneRepository = cloneRepository;
exports.openRepository = openRepository;
exports.createBranch = createBranch;
exports.getBranch = getBranch;
exports.updateBranch = updateBranch;
exports.getTag = getTag;
exports.setHead = setHead;
exports.updateRepository = updateRepository;
exports.checkoutRepository = checkoutRepository;
exports.getRepoDir = getRepoDir;
exports.develop = develop;
