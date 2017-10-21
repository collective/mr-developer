'use strict';

exports.develop = function() {
	const fs = require('fs');
	let raw = fs.readFileSync('mr.developer.json');
	let pkgs = JSON.parse(raw);
	console.log(pkgs);
};
