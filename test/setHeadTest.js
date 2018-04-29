'use strict';

const chai = require('chai');
const rimraf = require('rimraf');
const developer = require('../src/index.js');
const expect = chai.expect;
const util = require('util');
const fs = require('fs');
const exec = util.promisify(require('child_process').exec);

describe('setHead', () => {
	beforeEach(async () => {
        await exec('./test/test-setup.sh');
		await Promise.resolve(developer.getRepoDir('./test'));
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
        await developer.setHead('repo1', repo, {'tag': '1.0.0'});
        const commit = await repo.getHeadCommit();
		expect(commit.message()).to.be.equal('Add file 1\n');
    });

    it('ignores branch if tag is metionned', async () => {
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
        const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
        await developer.setHead('repo1', repo, {'branch': 'staging', 'tag': '1.0.0'});
        const commit = await repo.getHeadCommit();
		expect(commit.message()).to.be.equal('Add file 1\n');
    });

    it('does nothing if status is not clean', async () => {
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
        let repo = await developer.openRepository('repo1', './test/src/develop/repo1');
        await developer.setHead('repo1', repo, {'branch': 'staging'});
		
		// now let's make a local change
		await exec('./test/test-local-change.sh');
		
		repo = await developer.openRepository('repo1', './test/src/develop/repo1');
		const head = await developer.setHead('repo1', repo, {'branch': 'staging'});
        expect(head.abort).to.be.true;
        const txt = fs.readFileSync('./test/src/develop/repo1/file1.txt').toString();
		expect(txt).to.be.equal('File 1\nMore text\nLocal change\n');
    });
    
    it('resets to HEAD if status is not clean but reset=true', async () => {
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
        let repo = await developer.openRepository('repo1', './test/src/develop/repo1');
        await developer.setHead('repo1', repo, {'branch': 'staging'});
		
		// now let's make a local change
		await exec('./test/test-local-change.sh');
		
		repo = await developer.openRepository('repo1', './test/src/develop/repo1');
		await developer.setHead('repo1', repo, {'branch': 'staging'}, true);
		const txt = fs.readFileSync('./test/src/develop/repo1/file1.txt').toString();
		expect(txt).to.be.equal('File 1\nMore text\n');
    });
    
    it('can get last tag', async () => {
        await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake-remote/repo1');
        await exec('./test/test-create-tags.sh');
        const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
        const tag = await developer.setHead('repo1', repo, {'tag': '1.0.0'}, false, true);
		expect(tag).to.be.equal('1.0.11');
        const commit = await repo.getHeadCommit();
        expect(commit.message()).to.be.equal('really?\n');
        const txt = fs.readFileSync('./test/src/develop/repo1/file1.txt').toString();
		expect(txt).to.be.equal('File 1\nKnowledge is power\nFrance is bacon\n');
	});

	afterEach(() => {
        rimraf.sync('./test/src/develop');
        rimraf.sync('./fake-remote');
	});
});
