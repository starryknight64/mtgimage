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
	moment = require("moment"),
	GET_SOURCES = require("./sources").GET_SOURCES,
	tiptoe = require("tiptoe");

var SET_PATH = "/mnt/compendium/DevLab/mtgimage/web/actual/set";
var JSON_PATH = "/mnt/compendium/DevLab/mtgjson/json";
var runOptions = {silent : true};

processSet(process.argv[2], function(err)
{
	if(err)
	{
		base.error(err);
		process.exit(1);
	}

	process.exit(0);
});

function processSet(setCode, cb)
{
	base.info("Creating new image symlinks for set for: %s", setCode);

	tiptoe(
		function loadJSON()
		{
			fs.readFile(path.join(JSON_PATH, setCode + ".json"), {encoding:"utf8"}, this);
		},
		function getConvertedCrops(setRaw)
		{
			var set = JSON.parse(setRaw);

			var variations = [];

			set.cards.forEach(function(card)
			{
				if(card.layout==="split")
				{
					base.error("TODO: Split card: %s", card.name);
				}
				else if(card.variations || (C.SETS_NOT_ON_GATHERER.contains(setCode) && card.rarity==="Basic Land"))
				{
					variations.push(card.imageName.trim("0123456789"));
					variations = variations.uniqueBySort();
				}
			}.bind(this));

			variations.forEach(function(variation)
			{
				var prefix = path.join(SET_PATH, setCode.toLowerCase(), variation);
				fs.symlink(variation + "1.jpg", prefix + ".jpg", this.parallel());
				fs.symlink(variation + "1.hq.jpg", prefix + ".hq.jpg", this.parallel());
				fs.symlink(variation + "1.crop.jpg", prefix + ".crop.jpg", this.parallel());
				fs.symlink(variation + "1.crop.hq.jpg", prefix + ".crop.hq.jpg", this.parallel());
			}.bind(this));

			this.parallel()();
		},
		function finish(err)
		{
			setImmediate(function() { cb(err); });
		}
	);
}

