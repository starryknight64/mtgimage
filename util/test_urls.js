"use strict";
/*global setImmediate: true*/

var base = require("xbase"),
	hyperquest = require("hyperquest"),
	fs = require("fs"),
	ProgressBar = require("progress"),
	path = require("path"),
	tiptoe = require("tiptoe"),
	GET_SOURCES = require("./sources").GET_SOURCES,
	optimist = require("optimist");

var VALID_SOURCES = ["mtgjson", "ccghq", "cardnames", "cockatrice", "multiverseid", "all"];

optimist = optimist.usage("Usage: $0");
optimist = optimist.describe({ "s" : "Source of URL's. Valid: " + VALID_SOURCES.join(", "),
							   "prod" : "Check production instead of dev" });
optimist = optimist.demand(["s"]);
optimist = optimist.boolean("prod");
optimist = optimist.alias({ "s" : "source"});

function showUsageAndExit()
{
    optimist.showHelp();
    process.exit(1);
}

var argv = optimist.argv;

if(!VALID_SOURCES.contains(argv.s))
    showUsageAndExit();

function testSource(source, cb)
{
	tiptoe(
		function performHTTPHEAD()
		{
			hyperquest(source, {method : "HEAD"}, this);
		},
		function finish(err, response, body)
		{
			if(!err && (!response || response.statusCode!==200 || !response.headers || +response.headers["content-length"]<=0))
				base.error("\nFailed to access [" + source + "] with statusCode: " + (response ? response.statusCode : "UNKNOWN"));
			else if(err)
				base.error("\nFailed to access [" + source + "]");

			setImmediate(function() { cb(err); });
		}
	);
}

function testSources(source, cb)
{
	tiptoe(
		function getSources()
		{
			base.info("Getting sources [%s]", source);

			GET_SOURCES[source](this);
		},
		function processSources(sources)
		{
			base.info("Got %d sources", sources.length);
			base.info("Filtering out duplicates...");
			sources = sources.uniqueBySort();
			base.info("Testing %d sources", sources.length);

			var bar = new ProgressBar("[:bar] :percent :etas", { complete : "=", incomplete : " ", width : 60, total : sources.length });
			sources.serialForEach(function(source, subcb, i)
			{
				bar.tick(1);
				testSource(source, subcb);
			}, this);
		},
		function finish(err)
		{
			if(err)
				base.error("Error for set [%s]\n", source);

			setImmediate(function() { cb(err); });
		}
	);
}

(argv.s==="all" ? VALID_SOURCES.remove("all") : [argv.s]).serialForEach(function(source, subcb)
{
	testSources(source, subcb);
}, function(err)
{
	if(err)
	{
		base.error(err);
		process.exit(1);
	}

	process.exit(0);
});
