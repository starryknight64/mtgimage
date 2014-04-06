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

C.SETS.serialForEach(function(SET, subcb)
{
	checkSet(SET.code, subcb);
}, function(err)
{
	if(err)
	{
		base.error(err);
		process.exit(1);
	}

	process.exit(0);
});

function checkSet(setCode, cb)
{
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
				if(!card.types || (!card.types.contains("Plane") && !card.types.contains("Scheme") && !card.types.contains("Phenomenon")))
					return setImmediate(subcb);

				var imagePathPrefix = path.join(SET_PATH, setCode.toLowerCase(), card.imageName);
				base.info("Cropping %s: %s", card.types, imagePathPrefix);

				tiptoe(
					function getSize()
					{
						imageUtil.getWidthHeight(imagePathPrefix + ".jpg", this);
					},
					function crop(size)
					{
						runUtil.run("convert", [imagePathPrefix + ".jpg", "-crop", (card.types.contains("Scheme") ? "494x519+93+104" : "1255x520+117+135"), imagePathPrefix + ".crop.jpg"], {silent : true}, this.parallel());
						runUtil.run("convert", [imagePathPrefix + ".hq.jpg", "-crop", (card.types.contains("Scheme") ? "494x519+93+104" : "1255x520+117+135"), imagePathPrefix + ".crop.hq.jpg"], {silent : true}, this.parallel());
					},
					function continueAlong(err)
					{
						setImmediate(function() { subcb(err); });
					}
				);
			}, cb);
		}
	);
}
