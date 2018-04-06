'use strict';

const chai = require('chai');
const rimraf = require('rimraf');
const developer = require('../src/index.js');
const expect = chai.expect;
const git = require('nodegit');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

describe('updateRepository', () => {
	beforeEach(async () => {
        await exec('./test/test-setup.sh');
		developer.getRepoDir('./test');
	});
	
	it('fetchs last changes from remote', async () => {
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
		let repo = await developer.openRepository('repo1', './test/src/develop/repo1');
		await developer.updateBranch('repo1', repo, 'staging');

		// now let's make a change in the remote
		await exec('./test/test-add-commit.sh');
		
		// update again
		repo = await developer.openRepository('repo1', './test/src/develop/repo1');
        await developer.updateRepository('repo1', repo);
        await developer.updateBranch('repo1', repo, 'staging');
        const commit = await repo.getHeadCommit();
		expect(commit.message()).to.be.equal('Modify file 1 again\n');
	});

	afterEach(() => {
		rimraf.sync('./test/src/develop');
		rimraf.sync('./fake-remote');
	});
});
