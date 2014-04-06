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

var TARGET_PATH = "/mnt/compendium/DevLab/mtgimage/web/actual/set/van";

tiptoe(
	function getLinks()
	{
		runUtil.run("find", ["-type", "l", "-not", "-name", "*.crop.jpg", "-not", "-name", "*.crop.hq.jpg", "-name", "*.jpg"], { cwd : TARGET_PATH}, this);
	},
	function processLinks(links)
	{
		this.data.links = links.split("\n").filterEmpty().map(function(link) { return path.join(TARGET_PATH, link); });
		this.data.links.serialForEach(fs.readlink, this);
	},
	function createHQLinks(symlinkTargets)
	{
		this.data.links.serialForEach(function(link, subcb, i)
		{
			var srcExtension = link.endsWith(".hq.jpg") ? ".hq.jpg" : ".jpg";
			var targetExtension = link.endsWith(".hq.jpg") ? ".crop.hq.jpg" : ".crop.jpg";

			var destPath = path.join(path.dirname(link), path.basename(link, srcExtension) + targetExtension);
			if(fs.existsSync(destPath))
				fs.unlinkSync(destPath);
			fs.symlink(path.basename(symlinkTargets[i], srcExtension) + targetExtension, destPath, subcb);
		}, this);
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

