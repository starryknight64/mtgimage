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


tiptoe(
	function getSources()
	{
		GET_SOURCES["multiverseid"](this);
	},
	function process(sources)
	{
		base.info(sources.length);

		console.time("uniqueBySort");
		base.info(sources.uniqueBySort().length);
		console.timeEnd("uniqueBySort");

		console.time("unique");
		base.info(sources.unique().length);
		console.timeEnd("unique");

		this();
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

