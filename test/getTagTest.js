'use strict';

const chai = require('chai');
const rimraf = require('rimraf');
const developer = require('../src/index.js');
const expect = chai.expect;
const util = require('util');
const fs = require('fs');
const exec = util.promisify(require('child_process').exec);

describe('getTag', () => {
	beforeEach(async () => {
        await exec('./test/test-setup.sh');
		developer.getRepoDir('./test');
	});

	it('gets the tag', async () => {
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
        const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
        await developer.getTag('repo1', repo, 'v1');
        const commit = await repo.getHeadCommit();
		expect(commit.message()).to.be.equal('Add file 1\n');
		expect(fs.existsSync('./test/src/develop/repo1/file2.txt')).to.be.false;
    });

	afterEach(() => {
		rimraf.sync('./test/src/develop');
		rimraf.sync('./fake-remote');
	});
});
