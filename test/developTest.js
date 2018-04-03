'use strict';

const chai = require('chai');
const mock = require('mock-fs');
const fs = require('fs');
const rimraf = require('rimraf');
const developer = require('../src/index.js');
const expect = chai.expect;

describe('getRepoDir', () => {
	it('creates the ./src/develop folder if it does not exist', () => {
		developer.getRepoDir('./test');
		expect(fs.existsSync('./test/src/develop')).to.be.true;
	});

	afterEach(() => {
		rimraf('./test/src/develop', () => { });
	});
});

describe('cloneRepository', () => {
	beforeEach(() => {
		developer.getRepoDir('./test');
	});

	it('clones the repository in ./src/develop', async () => {
		const exists = await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake/repo1')
			.then(() => {
				return fs.existsSync('./test/src/develop/repo1');
			});
		expect(exists).to.be.true;
	});

	it('gets the repository if it exists already', async () => {
		await developer.cloneRepository('repo1', './test/src/develop/repo1', './test/fake/repo1');
		const repo = await developer.openRepository('repo1', './test/src/develop/repo1');
		expect(typeof repo.mergeBranches).to.be.equal('function');
	});

	afterEach(() => {
		rimraf('./test/src/develop', () => { });
	});
});
