"use strict";
/*global setImmediate: true*/

var base = require("xbase"),
	C = require("C"),
	fileUtil = require("xutil").file,
	imageUtil = require("xutil").image,
	runUtil = require("xutil").run,
	fs = require("fs"),
	mkdirp = require("mkdirp"),
	path = require("path"),
	rimraf = require("rimraf"),
	tiptoe = require("tiptoe");

var SET_PATH = path.join(__dirname, "..", "web", "actual", "symbol", "set");

function usage()
{
	base.error("Usage: node %s <set code> <rarity> <symbol.svg>", path.basename(process.argv[1]));
	process.exit(1);
}

if(process.argv.length<5)
	usage();

var targetSet = C.SETS.mutateOnce(function(SET) { if(SET.name.toLowerCase()===process.argv[2].toLowerCase() || SET.code.toLowerCase()===process.argv[2].toLowerCase()) { return SET; } });
if(!targetSet)
{
	base.error("No such set code: %s", process.argv[2]);
	usage();
}

var rarityLetter = process.argv[3].substring(0, 1).toLowerCase();
if(!Object.keys(C.SYMBOL_RARITIES).contains(rarityLetter))
{
	base.error("Invalid rarity: %s", rarityLetter);
	usage();
}

var svgFile = process.argv[4];

if(!fs.existsSync(svgFile))
{
	base.error("File does not exist: %s", svgFile);
	usage();
}

base.info("Importing set [%s] rarity [%s] from file: %s", targetSet.name, rarityLetter, svgFile);

var TARGET_PATH = path.join(SET_PATH, targetSet.code.toLowerCase(), rarityLetter);
var runOptions = {silent:true};



tiptoe(
	function clearTargetDir()
	{
		rimraf(TARGET_PATH, this);
	},
	function mktargetDir()
	{
		mkdirp(TARGET_PATH, this);
	},
	function getSize()
	{
		imageUtil.getWidthHeight(svgFile, this);
	},
	function generateImages(size)
	{
		var self=this;

		C.SYMBOL_SIZES.forEach(function(SYMBOL_SIZE)
		{
			var targetWidth = SYMBOL_SIZE;
			var targetHeight = SYMBOL_SIZE;
			if(size[0]>size[1])
				targetHeight = Math.round((size[1]*(SYMBOL_SIZE/size[0])));
			else if(size[1]>size[0])
				targetWidth = Math.round((size[0]*(SYMBOL_SIZE/size[1])));

			runUtil.run("inkscape", ["--export-png=" + path.join(TARGET_PATH, SYMBOL_SIZE + ".png"), "--export-width=" + targetWidth, "--export-height=" + targetHeight, svgFile], runOptions, self.parallel());
		});
	},
	function createGIFs()
	{
		var self=this;

		C.SYMBOL_SIZES.forEach(function(SYMBOL_SIZE)
		{
			runUtil.run("convert", [path.join(TARGET_PATH, SYMBOL_SIZE + ".png"), path.join(TARGET_PATH, SYMBOL_SIZE + ".gif")], runOptions, self.parallel());
		});
	},
	function compressImages()
	{
		var self=this;
		C.SYMBOL_SIZES.forEach(function(SYMBOL_SIZE)
		{
			var fileName = path.join(TARGET_PATH, SYMBOL_SIZE + ".png");
			imageUtil.compress(fileName, fileName, false, self.parallel());
		});
	},
	function copySVG()
	{
		fileUtil.copy(svgFile, path.join(TARGET_PATH, "..", rarityLetter + ".svg"), this);
	},
	function symlink()
	{
		var self=this;
		C.SYMBOL_RARITIES[rarityLetter].forEach(function(FULL_RARITY)
		{
			fs.symlink(rarityLetter + ".svg", path.join(path.resolve(TARGET_PATH, ".."), FULL_RARITY + ".svg"), self.parallel());
			fs.symlink(rarityLetter, path.join(path.resolve(TARGET_PATH, ".."), FULL_RARITY), self.parallel());
		});
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