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

var CCGHQ_CROPS_PATH = "/mnt/compendium/DevLab/common/images/originals/mtg/CCGHQ/Crops/tmp";
var SET_PATH = "/mnt/compendium/DevLab/mtgimage/web/actual";
var CONVERTER_PATH = "/mnt/compendium/DevLab/mtgimage/converter/src/converter";

C.SETS.serialForEach(processSet, function(err)
{
	if(err)
	{
		base.error(err);
		process.exit(1);
	}

	process.exit(0);
});

function processSet(SET, cb)
{
	var cropZipPath = path.join(CCGHQ_CROPS_PATH, SET.code);
	if(!fs.existsSync(cropZipPath))
		return cb(new Error("No crops path found: " + cropZipPath));

	base.info("Processing crops for: [%s] %s", SET.code, SET.name);

	tiptoe(
		function getSourceCrops()
		{
			glob(path.join(CCGHQ_CROPS_PATH, SET.code, "*.jpg"), this);
		},
		function getConvertedCrops(sourceCrops)
		{
			this.data.sourceCrops = sourceCrops;
			sourceCrops.serialForEach(function(sourceCrop, subcb)
			{
				runUtil.run(CONVERTER_PATH, ["/set/" + SET.code.toLowerCase() + "/" + path.basename(sourceCrop)], {silent : true}, subcb);
			}, this);
		},
		function processCrops(convertedCrops)
		{
			var sourceCrops = this.data.sourceCrops;

			convertedCrops.forEach(function(convertedCrop, i)
			{
				var fullPath = path.join(SET_PATH, convertedCrop.replaceAll(".crop.jpg", ".jpg"));
				if(!fs.existsSync(fullPath))
					throw new Error("Full missing: " + fullPath + " converted: " + convertedCrop + " source: " + sourceCrops[i]);
				
				var cropPath = path.join(SET_PATH, convertedCrop);
				if(fs.existsSync(cropPath))
					throw new Error("Crop already exists: " + cropPath + " converted: " + convertedCrop + " source: " + sourceCrops[i]);
			});

			convertedCrops.serialForEach(function(convertedCrop, subcb, i)
			{
				fileUtil.copy(sourceCrops[i], path.join(SET_PATH, convertedCrop), subcb);
			}, this);
		},
		function finish(err)
		{
			setImmediate(function() { cb(err); });
		}
	);
}
