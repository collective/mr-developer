'use strict';

const chai = require('chai');
const rimraf = require('rimraf');
const developer = require('../src/index.js');
const expect = chai.expect;
const util = require('util');
const exec = util.promisify(require('child_process').exec);

describe('updateBranch', () => {
	beforeEach(async () => {
        await exec('./test/test-setup.sh');
		developer.getRepoDir('./test');
	});

	it('gets branch and update to last commit', async () => {
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
        const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
        await developer.updateBranch('repo1', repo, 'staging');
        const commit = await repo.getHeadCommit();
		expect(commit.message()).to.be.equal('Modify file 1\n');
	});
	
	it('aborts if conflict', async () => {
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
        let repo = await developer.openRepository('repo1', './test/src/develop/repo1');
		await developer.updateBranch('repo1', repo, 'staging');
		
		// let's change both remote and local
		await exec('./test/test-add-commit.sh');
		await exec('./test/test-create-conflict.sh');

		repo = await developer.openRepository('repo1', './test/src/develop/repo1');
		await developer.updateRepository('repo1', repo);
		await developer.updateBranch('repo1', repo, 'staging');
		
        const commit = await repo.getHeadCommit();
		expect(commit.message()).to.be.equal('I modify file1 too\n');
    });

	afterEach(() => {
		rimraf.sync('./test/src/develop');
		rimraf.sync('./fake-remote');
	});
});
