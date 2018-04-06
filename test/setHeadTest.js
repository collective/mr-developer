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

	it('can set head to a branch', async () => {
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
        const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
        await developer.setHead('repo1', repo, {'branch': 'staging'});
        const commit = await repo.getHeadCommit();
		expect(commit.message()).to.be.equal('Modify file 1\n');
    });

    it('can set head to a tag', async () => {
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
        const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
        await developer.setHead('repo1', repo, {'tag': 'v1'});
        const commit = await repo.getHeadCommit();
		expect(commit.message()).to.be.equal('Add file 1\n');
    });

    it('ignores branch if tag is metionned', async () => {
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
        const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
        await developer.setHead('repo1', repo, {'branch': 'staging', 'tag': 'v1'});
        const commit = await repo.getHeadCommit();
		expect(commit.message()).to.be.equal('Add file 1\n');
    });

	afterEach(() => {
        rimraf.sync('./test/src/develop');
        rimraf.sync('./fake-remote');
	});
});
