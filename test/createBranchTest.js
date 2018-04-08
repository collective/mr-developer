'use strict';

const chai = require('chai');
const rimraf = require('rimraf');
const developer = require('../src/index.js');
const expect = chai.expect;
const util = require('util');
const exec = util.promisify(require('child_process').exec);

describe('createBranch', () => {
	beforeEach(async () => {
        await exec('./test/test-setup.sh');
		await Promise.resolve(developer.getRepoDir('./test'));
	});

	it('creates a local branch', async () => {
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
		const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
		const branch = await developer.createBranch(repo, 'conflicting')
		expect(branch.isBranch()).to.be.equal(1);
	});

	afterEach(() => {
		rimraf.sync('./test/src/develop');
		rimraf.sync('./fake-remote');
	});
});
