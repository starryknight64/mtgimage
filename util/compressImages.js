"use strict";

var base = require("xbase"),
	C = require("C"),
	fs = require("fs"),
	path = require("path"),
	fileUtil = require("xutil").file,
	runUtil = require("xutil").run,
	tiptoe = require("tiptoe");

if(process.argv.length<3)
{
	base.error("Usage: node %s <image>", process.argv[1]);
	process.exit(1);
}

var TEMP_PATH = fileUtil.generateTempFilePath();
var TARGET_FILE = process.argv[2];

fs.mkdirSync(TEMP_PATH);

tiptoe(
	function compressOptimal()
	{
		runUtil.run("jpegoptim", ["-d" + TEMP_PATH, TARGET_FILE], this);
	},
	function moveOptimal()
	{
		var destPath = path.join(path.dirname(TARGET_FILE), path.basename(TARGET_FILE, ".jpg") + ".hq.jpg");
		var tmpPath = path.join(TEMP_PATH, path.basename(TARGET_FILE));
		if(fs.existsSync(tmpPath))
			fileUtil.move(tmpPath, destPath, this);
		else
			fileUtil.copy(TARGET_FILE, destPath, this);
	},
	function compressNonOptimal()
	{
		fs.rmdir(TEMP_PATH, this.parallel());
		runUtil.run("jpegoptim", ["-m70", TARGET_FILE], this.parallel());
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

