'use strict';

const chai = require('chai');
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
		rimraf.sync('./test/src/develop');
		rimraf.sync('./fake-remote');
	});
});
