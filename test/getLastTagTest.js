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
		await Promise.resolve(developer.getRepoDir('./test'));
	});
	
	it('gets last tag', async () => {
		await exec('./test/test-create-tags.sh');
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
		const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
        const last = await developer.getLastTag(repo);
		expect(last).to.be.equal('1.0.11');
	});

	afterEach(() => {
		rimraf.sync('./test/src/develop');
		rimraf.sync('./fake-remote');
	});
});
