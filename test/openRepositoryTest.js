'use strict';

const chai = require('chai');
const rimraf = require('rimraf');
const developer = require('../src/index.js');
const expect = chai.expect;
const util = require('util');
const exec = util.promisify(require('child_process').exec);

describe('openRepository', () => {
	beforeEach(async () => {
        await exec('./test/test-setup.sh');
		await Promise.resolve(developer.getRepoDir('./test'));
	});
	
	it('opens an existing repository', async () => {
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
		const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
		const remotes = await repo.getRemotes();
		expect(remotes[0]).to.be.equal('origin');
	});

	afterEach(() => {
		rimraf.sync('./test/src/develop');
		rimraf.sync('./fake-remote');
	});
});
