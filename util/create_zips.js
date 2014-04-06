"use strict";
/*global setImmediate: true*/

var base = require("xbase"),
	http = require("http"),
	fs = require("fs"),
	ProgressBar = require("progress"),
	fileUtil = require("xutil").file,
	path = require("path"),
	httpUtil = require("xutil").http,
	runUtil = require("xutil").run,
	tiptoe = require("tiptoe"),
	url = require("url"),
	rimraf = require("rimraf"),
	GET_SOURCES = require("./sources").GET_SOURCES,
	optimist = require("optimist");

var VALID_SOURCES = ["mtgjson", "ccghq", "cardnames", "cockatrice", "all"];
var ZIP_PATH = path.join(__dirname, "..", "web", "zip");

optimist = optimist.usage("Usage: $0");
optimist = optimist.describe({ "s" : "Source of URL's. Valid: " + VALID_SOURCES.join(", "),
                               "c" : "Code of set to process." });
optimist = optimist.demand(["s"]);
optimist = optimist.alias({ "s" : "source", "c" : "code"});

function showUsageAndExit()
{
    optimist.showHelp();
    process.exit(1);
}
var argv = optimist.argv;

if(!VALID_SOURCES.contains(argv.s))
    showUsageAndExit();

function zipSet(set, sourceType, cb)
{
	base.info("Zipping %d images for set: %s", set.sources.length, set.code);

	var zipDir = fileUtil.generateTempFilePath();
	var targetZip = path.join(ZIP_PATH, set.code.toUpperCase() + "-" + sourceType.toLowerCase() + ".zip");

	tiptoe(
		function prepare()
		{
			fs.mkdir(zipDir, this.parallel());
			if(fs.existsSync(targetZip))
				fs.unlink(targetZip, this.parallel());
		},
		function downloadImages()
		{
			set.sources.serialForEach(function(source, subcb)
			{
				httpUtil.download(source, path.join(zipDir, path.basename(source)), subcb);
			}, this);
		},
		function zipImages()
		{
			var zipArgs = ["-9", targetZip];
			zipArgs = zipArgs.concat(set.sources.map(function(source) { return path.basename(source); }));

			runUtil.run("zip", zipArgs, {cwd : zipDir, silent : true}, this);
		},
		function cleanup()
		{
			rimraf(zipDir, this);
		},
		function finish(err)
		{
			setImmediate(function() { cb(err); });
		}
	);
}

function zipSource(sourceType, cb)
{
	tiptoe(
		function getSources()
		{
			base.info("Getting sources [%s]", sourceType);

			GET_SOURCES[sourceType](this);
		},
		function processSources(sources)
		{
			var setSources = {};

			base.info("Got %d sources", sources.length);
			sources.forEach(function(source)
			{
				var u = url.parse(source);
				if(!u.path.startsWith("/set/"))
					return;

				var sourceSetCode = u.path.split("/").slice(2, 3)[0].toLowerCase();

				if(!setSources.hasOwnProperty(sourceSetCode))
					setSources[sourceSetCode] = [];

				setSources[sourceSetCode].push(source);
			});

			Object.mutate(setSources, function(key, value, result)
			{
				if(!argv.c || argv.c===key)
					result.push({ code : key, sources : value});
				return result;
			}, []).serialForEach(function(setSource, subcb)
			{
				zipSet(setSource, sourceType, subcb);
			}, this);
		},
		function finish(err)
		{
			if(err)
				base.error("Failed to zip source: %o", sourceType);

			setImmediate(function() { cb(err); });
		}
	);
}

(argv.s==="all" ? VALID_SOURCES.remove("all") : [argv.s]).serialForEach(function(source, subcb)
{
	zipSource(source, subcb);
}, function(err)
{
	if(err)
	{
		base.error(err);
		process.exit(1);
	}

	process.exit(0);
});
