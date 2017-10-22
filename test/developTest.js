'use strict';

var expect = require('chai').expect;
var mock = require('mock-fs');
var develop = require('../src/index.js').develop;

describe('Read valid JSON from "mr.developer.json"', function () {
	beforeEach(function () {
		mock({
			'mr.developer.json': JSON.stringify({'a': 1}),
		});
	});

  it('and return valid JSON', function () {
    expect(develop('mr.developer.json')).to.deep.equal({'a': 1});
  });

	afterEach(function () {
		mock.restore();
	});
});
