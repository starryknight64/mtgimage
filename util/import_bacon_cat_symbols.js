"use strict";

var base = require("xbase"),
	C = require("C"),
	util = require("util"),
	fs = require("fs"),
	glob = require("glob"),
	path = require("path"),
	rimraf = require("rimraf"),
	dustUtil = require("xutil").dust,
	printUtil = require("xutil").print,
	fileUtil = require("xutil").file,
	runUtil = require("xutil").run,
	imageUtil = require("xutil").image,
	moment = require("moment"),
	GET_SOURCES = require("./sources").GET_SOURCES,
	tiptoe = require("tiptoe");

var JSON_PATH = "/mnt/compendium/DevLab/mtgjson/json";
var SET_PATH = "/mnt/compendium/DevLab/mtgimage/web/actual/set";

tiptoe(
	function findSetSymbols()
	{
		glob(path.join("/home/sembiance/Assorted/BaconCat/1 - Accurate Style - SVG/K - Un-Sets", "**", "*.svg"), this);
	},
	function processFiles(svgFiles)
	{
		svgFiles.serialForEach(processSVGFile, this);
	},
	function finish(err)
	{
		if(err)
		{
			base.error(err);
			process.exit(1);
		}

		process.exit(0);
	}
);

function processSVGFile(svgFile, cb)
{
	var re = /[^ ]+ - ([^-]+) - ([^.]+)[.]svg/;
	var matches = re.exec(path.basename(svgFile));
	if(!matches || !matches[1] || !matches[2])
		return setImmediate(function() { cb(); });

	var targetSet = C.SETS.mutateOnce(function(SET) { if(SET.name.toLowerCase()===matches[1].toLowerCase().trim()) { return SET; } });
	if(!targetSet)
		return setImmediate(function() { cb(); });

	var rarityLetter = matches[2].substring(0, 1).toLowerCase();

	if(!Object.keys(C.SYMBOL_RARITIES).contains(rarityLetter))
		return setImmediate(function() { cb(); });

	base.info("%s: %s", targetSet.name, matches[2]);
	return setImmediate(function() { cb(); });

	//runUtil.run("node", ["import_set_symbol.js", targetSet.code, rarityLetter, svgFile], cb);
}
