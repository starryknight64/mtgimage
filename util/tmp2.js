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

process.exit(1);
var SET_PATH = "/mnt/compendium/DevLab/mtgimage/web/symbol/set";

C.SETS.serialForEach(makeSetSymlinks,
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

function makeSetSymlinks(SET, cb)
{
	tiptoe(
		function makeLinks()
		{
			if(SET.hasOwnProperty("oldCode"))
				fs.symlink(SET.code.toLowerCase(), path.join(SET_PATH, SET.oldCode.toLowerCase()), this.parallel());
			
			if(SET.hasOwnProperty("gathererCode"))
				fs.symlink(SET.code.toLowerCase(), path.join(SET_PATH, SET.gathererCode.toLowerCase()), this.parallel());

			this.parallel()();
		},
		function returnResult()
		{
			setImmediate(cb);
		}
	);
}