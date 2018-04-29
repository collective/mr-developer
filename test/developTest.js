'use strict';

const chai = require('chai');
const rimraf = require('rimraf');
const developer = require('../src/index.js');
const expect = chai.expect;
const git = require('nodegit');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');

describe('develop', () => {
	beforeEach(async () => {
        await exec('./test/test-setup.sh');
		await Promise.resolve(developer.getRepoDir('./test'));
	});
	
	it('clones all the repositories indicated in mr.developer.json', async () => {
		await developer.develop({root: './test'});
        const repo1 = await developer.openRepository('repo1', './test/src/develop/repo1');
        const commit1 = await repo1.getHeadCommit();
        expect(commit1.message()).to.be.equal('Add file 2\n');
        const repo2 = await developer.openRepository('repo2', './test/src/develop/repo2');
        const commit2 = await repo2.getHeadCommit();
        expect(commit2.message()).to.be.equal('Modify file 1\n');
        const repo3 = await developer.openRepository('repo3', './test/src/develop/repo3');
        const commit3 = await repo3.getHeadCommit();
		expect(commit3.message()).to.be.equal('Add file 1\n');
    });

    it('updates tsconfig.json with proper paths', async () => {
		await developer.develop({root: './test'});
        const raw = fs.readFileSync('./test/tsconfig.json');
        const config = JSON.parse(raw);
        expect(config.compilerOptions.baseUrl).to.be.equal('src');
        expect(config.compilerOptions.paths.repo1[0]).to.be.equal('develop/repo1');
        expect(config.compilerOptions.paths['@test/package2'][0]).to.be.equal('develop/repo2');
        expect(config.compilerOptions.paths.repo3[0]).to.be.equal('develop/repo3/lib/core');
    });

    it('updates mr.developer.json with last tag', async () => {
        await exec('./test/test-create-tags.sh');
        await developer.develop({root: './test', lastTag: true});
        const raw = fs.readFileSync('./test/mr.developer.json');
        const config = JSON.parse(raw);
        expect(config.repo1.tag).to.be.equal('1.0.11');
    });

	afterEach(() => {
		rimraf.sync('./test/src/develop');
		rimraf.sync('./fake-remote');
	});
});
