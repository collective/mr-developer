'use strict';

const fs = require('fs');
const git = require('nodegit');
const path = require('path');
const colors = require('colors/safe');

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
        return console.log(colors.blue(`Loading ${name} ${progress}%...`));
      }
    }
  };
  return git.Clone(url, path, cloneOptions)
  .then(function (repo) {
    console.log(colors.green(`✓ cloned ${name} at ${path}`));
    return repo;
  })
  .catch(function (err) { console.error(colors.red(`Cannot clone ${url}`, err)); });;
};

const openRepository = function (name, path) {
  return git.Repository.open(path)
  .then(function(repo) {
    console.log(`Found ${name} at ${path}`);
    return repo;
  })
  .catch(function (err) { console.error(colors.red(`Cannot open ${path}`, err)); });
};

const createBranch = function (repository, branchname) {
  return repository.getHeadCommit()
  .then(function(commit) {
    return repository.createBranch(
      branchname,
      commit,
      0,
      repository.defaultSignature(),
      'Created new-branch on HEAD'
    );
  })
  .then(function() {
    return repository.getBranch(branchname);
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
    return repository.mergeBranches(branch, 'refs/remotes/origin/' + branchname).then(function() {
      console.log(colors.green(`✓ update ${name} to branch ${branchname}`));
      return branch;
    })
    .catch(function (index) {
      console.error(colors.yellow.inverse(`Cannot merge origin/${branchname}. Please merge manually.`));
      return {abort: true};
    });
  })
  .then(function(branch) {
    if (branch.abort) {
      return {abort: true};
    } else {
      return repository.checkoutRef(branch);
    }
  });
};

const getTag = function (name, repository, tagName) {
  return git.Reference
  .dwim(repository, `refs/tags/${tagName}`)
  .then(function (ref) {
    return ref.peel(git.Object.TYPE.COMMIT);
  })
  .then(function (ref) {
    return repository.getCommit(ref);
  })
  .then(function (commit) {
    return git.Checkout
    .tree(repository, commit, { checkoutStrategy: git.Checkout.STRATEGY.SAFE })
    .then(function () {
      return repository.setHeadDetached(commit, repository.defaultSignature,
        'Checkout: HEAD ' + commit.id());
    })
  });
};

const setHead = function (name, repository, settings) {
  return repository.getStatus().then(function (status) {
    if (status.length > 0) {
      console.log(colors.yellow.inverse(`Cannot update ${name}. Commit your changes first.`));
      return {abort: true};
    } else {
      if (settings.tag) {
        return getTag(name, repository, settings.tag);
      } else {
        return updateBranch(name, repository, settings.branch || 'master')
      }
    }
  });
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
  .catch(function (err) { console.error(colors.red(`Cannot fetch ${settings.url} origin`, err)); });
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
  .catch(function (err) { console.error(colors.red(err)); });
};

const getRepoDir = function (root) {
  // Check for download directory; create if needed.
  const repoDir = path.join(root || '.', 'src', DEVELOP_DIRECTORY);
  if (!fs.existsSync(repoDir)){
    console.log(`\nCreating repoDir ${repoDir}`);
    fs.mkdirSync(repoDir);
  }
  else {
    console.log(`\nUsing ${repoDir}`);
  }
  return repoDir;
};

const develop = async function develop(options) {
  // Read in mr.developer.json.
  const raw = fs.readFileSync(path.join(options.root || '.', 'mr.developer.json'));
  const pkgs = JSON.parse(raw);
  const repoDir = getRepoDir(options.root);
  const paths = {};
  // Checkout the repos.
  for (let name in pkgs) {
    const settings = pkgs[name];
    await checkoutRepository(name, repoDir, settings, options.noFetch);
    const packageId = settings.package || name;
    let packagePath = path.join('.', DEVELOP_DIRECTORY, name);
    if (settings.path) {
      packagePath = path.join(packagePath, settings.path);
    }
    paths[packageId] = [packagePath];
  }
  // update paths in configFile
  const configFile = options.configFile || 'tsconfig.json';
  const tsconfig = JSON.parse(fs.readFileSync(path.join(options.root || '.', configFile)));
  tsconfig.compilerOptions.paths = paths;
  console.log(colors.yellow(`Update paths in tsconfig.json\n`));
  fs.writeFileSync(path.join(options.root || '.', configFile), JSON.stringify(tsconfig, null, 4));
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
