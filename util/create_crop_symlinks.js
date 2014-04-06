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
var runOptions = {silent : true};

var SKIP_DESTINATIONS =
[
	// These already have sub-crops for each side of the card
	"/ddj/life.crop.jpg",
	"/ddj/death.crop.jpg",
	"/ddj/fire.crop.jpg",
	"/ddj/ice.crop.jpg",
	"/arc/wax.crop.jpg",
	"/arc/wane.crop.jpg",
	"/inv/assault.crop.jpg",
	"/inv/battery.crop.jpg",
	"/inv/stand.crop.jpg",
	"/inv/deliver.crop.jpg",
	"/inv/wax.crop.jpg",
	"/inv/wane.crop.jpg",
	"/inv/pain.crop.jpg",
	"/inv/suffering.crop.jpg",
	"/inv/spite.crop.jpg",
	"/inv/malice.crop.jpg",
	"/cmd/fire.crop.jpg",
	"/cmd/ice.crop.jpg",
	"/apc/fire.crop.jpg",
	"/apc/ice.crop.jpg",
	"/apc/illusion.crop.jpg",
	"/apc/reality.crop.jpg",
	"/apc/life.crop.jpg",
	"/apc/death.crop.jpg",
	"/apc/night.crop.jpg",
	"/apc/day.crop.jpg",
	"/apc/order.crop.jpg",
	"/apc/chaos.crop.jpg",
	"/dis/bound.crop.jpg",
	"/dis/determined.crop.jpg",
	"/dis/crime.crop.jpg",
	"/dis/punishment.crop.jpg",
	"/dis/hide.crop.jpg",
	"/dis/seek.crop.jpg",
	"/dis/hit.crop.jpg",
	"/dis/run.crop.jpg",
	"/dis/odds.crop.jpg",
	"/dis/ends.crop.jpg",
	"/dis/pure.crop.jpg",
	"/dis/simple.crop.jpg",
	"/dis/research.crop.jpg",
	"/dis/development.crop.jpg",
	"/dis/rise.crop.jpg",
	"/dis/fall.crop.jpg",
	"/dis/supply.crop.jpg",
	"/dis/demand.crop.jpg",
	"/dis/trial.crop.jpg",
	"/dis/error.crop.jpg",
	"/tsb/assault.crop.jpg",
	"/tsb/battery.crop.jpg",
	"/plc/boom.crop.jpg",
	"/plc/bust.crop.jpg",
	"/plc/dead.crop.jpg",
	"/plc/gone.crop.jpg",
	"/plc/rough.crop.jpg",
	"/plc/tumble.crop.jpg",
	"/hop/order.crop.jpg",
	"/hop/chaos.crop.jpg",
	"/hop/assault.crop.jpg",
	"/hop/battery.crop.jpg",
	"/ddh/rise.crop.jpg",
	"/ddh/fall.crop.jpg",
	"/ddh/pain.crop.jpg",
	"/ddh/suffering.crop.jpg",
	"/ddh/spite.crop.jpg",
	"/ddh/malice.crop.jpg",
	"/dgm/alive.crop.jpg",
	"/dgm/well.crop.jpg",
	"/dgm/armed.crop.jpg",
	"/dgm/dangerous.crop.jpg",
	"/dgm/beck.crop.jpg",
	"/dgm/call.crop.jpg",
	"/dgm/breaking.crop.jpg",
	"/dgm/entering.crop.jpg",
	"/dgm/catch.crop.jpg",
	"/dgm/release.crop.jpg",
	"/dgm/down.crop.jpg",
	"/dgm/dirty.crop.jpg",
	"/dgm/far.crop.jpg",
	"/dgm/away.crop.jpg",
	"/dgm/flesh.crop.jpg",
	"/dgm/blood.crop.jpg",
	"/dgm/give.crop.jpg",
	"/dgm/take.crop.jpg",
	"/dgm/profit.crop.jpg",
	"/dgm/loss.crop.jpg",
	"/dgm/protect.crop.jpg",
	"/dgm/serve.crop.jpg",
	"/dgm/ready.crop.jpg",
	"/dgm/willing.crop.jpg",
	"/dgm/toil.crop.jpg",
	"/dgm/trouble.crop.jpg",
	"/dgm/turn.crop.jpg",
	"/dgm/burn.crop.jpg",
	"/dgm/wear.crop.jpg",
	"/dgm/tear.crop.jpg",

	// These are tokens that are missing
	"/shm/elemental.crop.jpg",
	"/shm/elf warrior.crop.jpg",
	"/ddd/beast.crop.jpg",
	"/roe/eldrazi spawn.crop.jpg",
	"/som/wurm.crop.jpg",
	"/isd/wolf.crop.jpg",
	"/isd/zombie.crop.jpg",
	"/avr/human.crop.jpg",
	"/avr/spirit.crop.jpg",
	"/avr/spirit1.crop.jpg",
	"/avr/spirit2.crop.jpg"
];
SKIP_DESTINATIONS = SKIP_DESTINATIONS.map(function(a) { return path.join(SET_PATH, a); });

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
	base.info("Processing symlinks for crops for: [%s] %s", SET.code, SET.name);

	tiptoe(
		function listCurrentSymlinks()
		{
			runUtil.run("ls", ["-al", path.join(SET_PATH, SET.code.toLowerCase())], runOptions, this);
		},
		function getConvertedCrops(rawOutput)
		{
			rawOutput.split("\n").filter(function(line) { return line.contains("->"); }).map(function(line) { return (/[^ ]+[ ]+[^ ]+[ ]+[^ ]+[ ]+[^ ]+[ ]+[^ ]+[ ]+[^ ]+[ ]+[^ ]+[ ]+[^ ]+[ ]+(.*) -> (.*)/).exec(line).slice(1); }).serialForEach(function(symlink, subcb)
			{
				var src = symlink[1].replaceAll(".jpg", ".crop.jpg");
				var dest = path.join(SET_PATH, SET.code.toLowerCase(), symlink[0].replaceAll(".jpg", ".crop.jpg"));

				if(SKIP_DESTINATIONS.contains(dest))
					return setImmediate(subcb);

				if(!fs.existsSync(path.join(SET_PATH, SET.code.toLowerCase(), src)))
					throw new Error("Source does not exist: " + SET.code.toLowerCase() + "/" + src);
				if(fs.existsSync(dest))
					throw new Error("Dest already exists: " + dest);

				fs.symlink(src, dest, subcb);
				//setImmediate(subcb);
			}, this);
		},
		function finish(err)
		{
			setImmediate(function() { cb(err); });
		}
	);
}
