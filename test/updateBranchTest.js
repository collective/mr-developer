'use strict';

const chai = require('chai');
const rimraf = require('rimraf');
const developer = require('../src/index.js');
const expect = chai.expect;
const util = require('util');
const fs = require('fs');
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
		const txt = fs.readFileSync('./test/src/develop/repo1/file1.txt').toString();
		expect(txt).to.be.equal('File 1\nMore text\n');
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
		const txt = fs.readFileSync('./test/src/develop/repo1/file1.txt').toString();
		expect(txt).to.be.equal('Totally new content\n');
    });

	afterEach(() => {
		rimraf.sync('./test/src/develop');
		rimraf.sync('./fake-remote');
	});
});
