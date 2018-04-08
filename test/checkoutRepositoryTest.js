'use strict';

const chai = require('chai');
const rimraf = require('rimraf');
const developer = require('../src/index.js');
const expect = chai.expect;
const git = require('nodegit');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

describe('checkoutRepository', () => {
	beforeEach(async () => {
        await exec('./test/test-setup.sh');
		await Promise.resolve(developer.getRepoDir('./test'));
	});
	
	it('clones the repository locally and checkout the proper branch', async () => {
		await developer.checkoutRepository('repo1', './test/src/develop', {
            url: './test/fake-remote/repo1',
            branch: 'staging'
        });
        const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
        const branch = await repo.getCurrentBranch();
		expect(branch.name()).to.be.equal('refs/heads/staging');
        const commit = await repo.getHeadCommit();
		expect(commit.message()).to.be.equal('Modify file 1\n');
    });
    
    it('fetchs last changes if repository exists', async () => {
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
		let repo = await developer.openRepository('repo1', './test/src/develop/repo1');
		await developer.updateBranch('repo1', repo, 'staging');

		// now let's make a change in the remote
		await exec('./test/test-add-commit.sh');
        
        // and checkout
        await developer.checkoutRepository('repo1', './test/src/develop', {
            url: './test/fake-remote/repo1',
            branch: 'staging'
        });
        repo = await developer.openRepository('repo1', './test/src/develop/repo1');
        const commit = await repo.getHeadCommit();
        expect(commit.message()).to.be.equal('Modify file 1 again\n');
    });
    
    it('does not fetchs last changes if noFetch', async () => {
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
		let repo = await developer.openRepository('repo1', './test/src/develop/repo1');
		await developer.updateBranch('repo1', repo, 'staging');

		// now let's make a change in the remote
		await exec('./test/test-add-commit.sh');
        
        // and checkout
        await developer.checkoutRepository('repo1', './test/src/develop', {
            url: './test/fake-remote/repo1',
            branch: 'staging'
        }, true);
        repo = await developer.openRepository('repo1', './test/src/develop/repo1');
        const commit = await repo.getHeadCommit();
        expect(commit.message()).to.be.equal('Modify file 1\n');
	});

	afterEach(() => {
		rimraf.sync('./test/src/develop');
		rimraf.sync('./fake-remote');
	});
});
