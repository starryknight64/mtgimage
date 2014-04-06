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

process.exit(0);

var JSON_PATH = "/mnt/compendium/DevLab/mtgjson/json";
var SET_PATH = "/mnt/compendium/DevLab/mtgimage/web/actual/set";
var RUN_OPTIONS = {silent : true};

C.SETS.serialForEach(function(SET, subcb)
{
	rotateCrops(SET.code, subcb);
}, function(err)
{
	if(err)
	{
		base.error(err);
		process.exit(1);
	}

	process.exit(0);
});

function rotateCrops(setCode, cb)
{
	base.info("Rotating crops for: %s", setCode);

	var SETDATA = C.SETS.filter(function(SET) { return SET.code.toLowerCase()===setCode.toLowerCase(); })[0];

	tiptoe(
		function loadJSON()
		{
			fs.readFile(path.join(JSON_PATH, setCode + ".json"), {encoding : "utf8"}, this);
		},
		function processCards(err, setJSON)
		{
			if(err)
			{
				setImmediate(function() { cb(err); });
				return;
			}

			var set = JSON.parse(setJSON);
			set.cards.serialForEach(function(card, subcb)
			{
				if(card.layout!=="flip")
					return setImmediate(subcb);

				if(card.names[0]===card.name)
					return setImmediate(subcb);

				var srcImage = path.join(SET_PATH, setCode.toLowerCase(), card.names[0].toLowerCase() + ".crop.jpg");
				if(!fs.existsSync(srcImage))
				{
					base.info("Error: srcImage for flip card not found: %s", srcImage);
					return setImmediate(subcb);
				}

				var destImage = path.join(SET_PATH, setCode.toLowerCase(), card.names[1].toLowerCase() + ".crop.jpg");
				if(fs.existsSync(destImage))
				{
					base.info("Error: destImage for flip card already exists: %s", srcImage);
					return setImmediate(subcb);
				}
				
				base.info("Flipping %s/%s", setCode, card.names.join(" to "));

				runUtil.run("convert", [srcImage, "-rotate", "180", destImage], RUN_OPTIONS, subcb);
			}, cb);
		}
	);
}
