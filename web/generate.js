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
	runUtil = require("xutil").run,
	moment = require("moment"),
	tiptoe = require("tiptoe");

var JSON_PATH = "/mnt/compendium/DevLab/mtgjson/json";

var dustData = 
{
	title : "Magic the Gathering card images",
	sets  : [],
	version : "4.2.0",
	lastUpdated : "Mar 30, 2014"
};

var ACTUAL_PATH = path.join(__dirname, "actual");
var CREATE_LINKS = process.argv.length>2 && process.argv[2].toLowerCase().startsWith("createlinks");

var CARD_PATH = path.join(ACTUAL_PATH, "card");
var SET_PATH = path.join(ACTUAL_PATH, "set");
var MULTIVERSEID_PATH = path.join(ACTUAL_PATH, "multiverseid");
var SETNAME_PATH = path.join(ACTUAL_PATH, "setname");

var EXTRA_CARD_SYMLINKS =
[
	"ugl/b.f.m. (big furry monster)",
	"unh/our market research shows that players like really long card names so we made this card to have the absolute longest card name ever elemental",
	"unh/richard garfield, ph.d.",
	"unh/s.n.o.t.",
	"ugl/b.f.m.",
	"unh/land aid '04",
	"unh/     ",
	"unh/        ",
	"ugl/goblin token card.jpg",
	"ugl/pegasus token card.jpg",
	"ugl/sheep token card.jpg",
	"ugl/soldier token card.jpg",
	"ugl/squirrel token card.jpg",
	"ugl/zombie token card.jpg",
	"nph/tresspassing souleater.crop.jpg",
	"nph/tresspassing souleater.crop.hq.jpg"
];

var EXTRA_SETNAME_SYMLINKS =
{
	"cmd" : "commander",
	"pd2" : "premium deck series fire & lightning"
};

var EXTRA_MULTIVERSEID_SYMLINKS =
{
	"20579" : "inv/assaultbattery",
	"20573" : "inv/standdeliver",
	"20575" : "inv/spitemalice",
	"20577" : "inv/painsuffering",
	"20581" : "inv/waxwane",
	"27167" : "apc/orderchaos",
	"26276" : "apc/nightday",
	"27161" : "apc/lifedeath",
	"27165" : "apc/fireice",
	"27163" : "apc/illusionreality"
};

var VALID_SETS = C.SETS.filter(function(SET) { return !C.SETS_WITH_NO_IMAGES.contains(SET.code); });

tiptoe(
	function reset()
	{
		if(!CREATE_LINKS)
			return this();

		base.info("Resetting...");
		rimraf(CARD_PATH, this.parallel());
		rimraf(SETNAME_PATH, this.parallel());
		rimraf(MULTIVERSEID_PATH, this.parallel());
	},
	function setup()
	{
		if(!CREATE_LINKS)
			return this();

		base.info("Setting up...");
		fs.mkdir(CARD_PATH, this.parallel());
		fs.mkdir(SETNAME_PATH, this.parallel());
		fs.mkdir(MULTIVERSEID_PATH, this.parallel());
	},
	function createSetAndSetNameLinks()
	{
		if(!CREATE_LINKS)
			return this();

		base.info("Creating old set code links...");

		Object.forEach(C.OLD_SET_CODE_MAP, function(oldCode, newCode)
		{
			var oldCodePath = path.join(SET_PATH, oldCode.toLowerCase());
			if(!fs.existsSync(oldCodePath))
				fs.symlinkSync(newCode.toLowerCase(),oldCodePath);
		});

		base.info("Creating set name links...");
		
		VALID_SETS.serialForEach(function(SET, subcb)
		{
			var setSrcPath = path.join("..", "set", SET.code.toLowerCase());
			fs.symlink(setSrcPath, path.join(SETNAME_PATH, SET.name.strip(":\"?").toLowerCase()), subcb);
		}.bind(this), this);
	},
	function createGathererSetCodeLinks()
	{
		if(!CREATE_LINKS)
			return this();

		base.info("Creating gathererCode links...");
		VALID_SETS.serialForEach(function(SET, subcb)
		{
			if(!SET.hasOwnProperty("gathererCode"))
				return setImmediate(subcb);

			var gathererCodePath = path.join(SET_PATH, SET.gathererCode.toLowerCase());
			if(fs.existsSync(gathererCodePath))
				return setImmediate(subcb);

			fs.symlink(SET.code.toLowerCase(), gathererCodePath, subcb);
		}.bind(this), this);
	},
	function createExtraSetNameLinks()
	{
		if(!CREATE_LINKS)
			return this();

		base.info("Creating extra set name links...");

		Object.forEach(EXTRA_SETNAME_SYMLINKS, function(setCode, setName)
		{
			fs.symlink(path.join("..", "set", setCode), path.join(SETNAME_PATH, setName), this.parallel());
		}.bind(this));
	},
	function countImages()
	{
		base.info("Counting images...");

		VALID_SETS.forEach(function(SET)
		{
			glob(path.join(SET_PATH, SET.code.toLowerCase()) + "/*.jpg", this.parallel());
		}.bind(this));
	},
	function populateDustData()
	{
		var args=arguments;

		VALID_SETS.serialForEach(function(SET, subcb, i)
		{
			base.info("Getting width/heights for: %s", SET.name);
			getWidthHeights(args[i].filter(function(a) { return !a.endsWith(".crop.jpg") && !a.endsWith(".hq.jpg"); }), subcb);
          
			/*var zipSize = printUtil.toSize(fs.statSync(path.join(__dirname, "zip", SET.code + ".zip")).size, 0);
            zipSize = "&nbsp;".repeat(6-zipSize.length) + zipSize;*/

			/*var zips = [];
			["ccghq", "mtgjson"].forEach(function(zipType)
			{
				var zipSize = printUtil.toSize(fs.statSync(path.join(__dirname, "zip", SET.code + "-" + zipType + ".zip")).size, 0);
				zipSize = "&nbsp;".repeat(6-zipSize.length) + zipSize;

				zips.push({zipType : zipType, zipCode : SET.code, zipSize : zipSize});
			});*/

			dustData.sets.push({code : SET.code, name : SET.name, releaseDate : SET.releaseDate});
		}, this);

	},
	function renderIndex(widthHeightCountMaps)
	{
		base.info("Rendering...");

		dustData.sets.forEach(function(dustDataSet, i)
		{
			dustDataSet.resolution = Object.keys(widthHeightCountMaps[i]).sort(function(a, b) { return a.length-b.length; }).join("<br>");
		});

		dustData.sets = dustData.sets.sort(function(a, b) { return moment(a.releaseDate, "YYYY-MM-DD").unix()-moment(b.releaseDate, "YYYY-MM-DD").unix(); });
		dustUtil.render(__dirname, "index", dustData, { keepWhitespace : true }, this);
	},
	function saveIndex(html)
	{
		fs.writeFile(path.join(__dirname, "index.html"), html, {encoding:"utf8"}, this);
	},
	function createCardSymlinks()
	{
		if(!CREATE_LINKS)
			return this();

		dustData.sets.reverse().serialForEach(function(dustDataSet, subcb)
		{
			createSetCardSymlinks(dustDataSet.code, subcb);
		}, this);
	},
	function createExtraCardSymlinks()
	{
		if(!CREATE_LINKS)
			return this();

		Object.forEach(EXTRA_MULTIVERSEID_SYMLINKS, function(multiverseid, srcImagePath)
		{
			makeSymlink(path.join(SET_PATH, srcImagePath + ".jpg"), path.join(MULTIVERSEID_PATH, multiverseid + ".jpg"), this.parallel());
			makeSymlink(path.join(SET_PATH, srcImagePath + ".hq.jpg"), path.join(MULTIVERSEID_PATH, multiverseid + ".hq.jpg"), this.parallel());

			makeSymlink(path.join(SET_PATH, srcImagePath + ".crop.jpg"), path.join(MULTIVERSEID_PATH, multiverseid + ".crop.jpg"), this.parallel());
			makeSymlink(path.join(SET_PATH, srcImagePath + ".crop.hq.jpg"), path.join(MULTIVERSEID_PATH, multiverseid + ".crop.hq.jpg"), this.parallel());
		}.bind(this));

		EXTRA_CARD_SYMLINKS.serialForEach(function(srcSymlinkPath, subcb)
		{
			if(srcSymlinkPath.endsWith(".jpg"))
			{
				fs.symlink(path.relative(CARD_PATH, path.join(SET_PATH, srcSymlinkPath)), path.join(CARD_PATH, path.basename(srcSymlinkPath)), subcb);
			}
			else
			{
				fs.symlink(path.relative(CARD_PATH, path.join(SET_PATH, srcSymlinkPath + ".jpg")), path.join(CARD_PATH, path.basename(srcSymlinkPath + ".jpg")), subcb);
				fs.symlink(path.relative(CARD_PATH, path.join(SET_PATH, srcSymlinkPath + ".hq.jpg")), path.join(CARD_PATH, path.basename(srcSymlinkPath + ".hq.jpg")), subcb);

				fs.symlink(path.relative(CARD_PATH, path.join(SET_PATH, srcSymlinkPath + ".crop.jpg")), path.join(CARD_PATH, path.basename(srcSymlinkPath + ".crop.jpg")), subcb);
				fs.symlink(path.relative(CARD_PATH, path.join(SET_PATH, srcSymlinkPath + ".crop.hq.jpg")), path.join(CARD_PATH, path.basename(srcSymlinkPath + ".crop.hq.jpg")), subcb);
			}
		}, this.parallel());
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

function createSetCardSymlinks(setCode, cb)
{
	base.info("Creating card symlinks for: %s", setCode);

	var SETDATA = VALID_SETS.filter(function(SET) { return SET.code.toLowerCase()===setCode.toLowerCase(); })[0];

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
				tiptoe(
					function makeSymlinks()
					{
						makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.imageName) + ".jpg", path.join(CARD_PATH, card.imageName.trim("0123456789 .") + ".jpg"), this.parallel());
						makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.imageName) + ".hq.jpg", path.join(CARD_PATH, card.imageName.trim("0123456789 .") + ".hq.jpg"), this.parallel());

						makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.imageName) + ".crop.jpg", path.join(CARD_PATH, card.imageName.trim("0123456789 .") + ".crop.jpg"), this.parallel());
						makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.imageName) + ".crop.hq.jpg", path.join(CARD_PATH, card.imageName.trim("0123456789 .") + ".crop.hq.jpg"), this.parallel());

						if(card.multiverseid)
						{
							makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.imageName) + ".jpg", path.join(MULTIVERSEID_PATH, card.multiverseid + ".jpg"), this.parallel());
							makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.imageName) + ".hq.jpg", path.join(MULTIVERSEID_PATH, card.multiverseid + ".hq.jpg"), this.parallel());

							makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.imageName) + ".crop.jpg", path.join(MULTIVERSEID_PATH, card.multiverseid + ".crop.jpg"), this.parallel());
							makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.imageName) + ".crop.hq.jpg", path.join(MULTIVERSEID_PATH, card.multiverseid + ".crop.hq.jpg"), this.parallel());
						}

						if(card.layout==="split")
						{
							makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.imageName) + ".jpg", path.join(CARD_PATH, card.name.toLowerCase().strip(":\"?").replaceAll("/", " ").trim("0123456789 .") + ".jpg"), this.parallel());
							makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.imageName) + ".hq.jpg", path.join(CARD_PATH, card.name.toLowerCase().strip(":\"?").replaceAll("/", " ").trim("0123456789 .") + ".hq.jpg"), this.parallel());

							makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.name.toLowerCase().strip(":\"?").replaceAll("/", " ").trim("0123456789 .")) + ".crop.jpg", path.join(CARD_PATH, card.name.toLowerCase().strip(":\"?").replaceAll("/", " ").trim("0123456789 .") + ".crop.jpg"), this.parallel());
							makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.name.toLowerCase().strip(":\"?").replaceAll("/", " ").trim("0123456789 .")) + ".crop.hq.jpg", path.join(CARD_PATH, card.name.toLowerCase().strip(":\"?").replaceAll("/", " ").trim("0123456789 .") + ".crop.hq.jpg"), this.parallel());

							if(card.names[0]===card.name)
							{
								makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.imageName) + ".jpg", path.join(CARD_PATH, card.names.map(function(name) { return name.toLowerCase().strip(":\"?").replaceAll("/", " ").trim("0123456789 ."); }).join(" ") + ".jpg"), this.parallel());
								makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.imageName) + ".hq.jpg", path.join(CARD_PATH, card.names.map(function(name) { return name.toLowerCase().strip(":\"?").replaceAll("/", " ").trim("0123456789 ."); }).join(" ") + ".hq.jpg"), this.parallel());

								makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.imageName) + ".crop.jpg", path.join(CARD_PATH, card.names.map(function(name) { return name.toLowerCase().strip(":\"?").replaceAll("/", " ").trim("0123456789 ."); }).join(" ") + ".crop.jpg"), this.parallel());
								makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.imageName) + ".crop.hq.jpg", path.join(CARD_PATH, card.names.map(function(name) { return name.toLowerCase().strip(":\"?").replaceAll("/", " ").trim("0123456789 ."); }).join(" ") + ".crop.hq.jpg"), this.parallel());

								if(card.names.length>2)
								{
									makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.imageName) + ".jpg", path.join(CARD_PATH, card.names.map(function(name) { return name.toLowerCase().strip(":\"?").replaceAll("/", " ").trim("0123456789 ."); }).join("") + ".jpg"), this.parallel());
									makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.imageName) + ".hq.jpg", path.join(CARD_PATH, card.names.map(function(name) { return name.toLowerCase().strip(":\"?").replaceAll("/", " ").trim("0123456789 ."); }).join("") + ".hq.jpg"), this.parallel());
									
									makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.imageName) + ".crop.jpg", path.join(CARD_PATH, card.names.map(function(name) { return name.toLowerCase().strip(":\"?").replaceAll("/", " ").trim("0123456789 ."); }).join("") + ".crop.jpg"), this.parallel());
									makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.imageName) + ".crop.hq.jpg", path.join(CARD_PATH, card.names.map(function(name) { return name.toLowerCase().strip(":\"?").replaceAll("/", " ").trim("0123456789 ."); }).join("") + ".crop.hq.jpg"), this.parallel());
								}
							}
						}

						if(card.name.endsWith("?"))
						{
							makeSymlink(path.join(SET_PATH, setCode.toLowerCase(), card.imageName) + ".jpg", path.join(CARD_PATH, card.name.trim("0123456789 .?").toLowerCase()), this.parallel());
						}
					},
					function finish(err) { setImmediate(function() { subcb(err); }); }
				);
			}, cb);
		}
	);
}

function makeSymlink(symlinkSrcPath, symlinkDestPath, cb)
{
	tiptoe(
		function getTargetAndCurrentDimensions()
		{
			getWidthHeight(symlinkSrcPath, this.parallel());

			if(fs.existsSync(symlinkDestPath))
				getWidthHeight(symlinkDestPath, this.parallel());
			else
				this.parallel()();
		},
		function makeSymlinkIfNeeded()
		{
			if(arguments[1] && arguments[0][0]>arguments[1][0])
				fs.unlinkSync(symlinkDestPath);

			if(!arguments[1] || arguments[0][0]>arguments[1][0])
				fs.symlink(path.relative(CARD_PATH, symlinkSrcPath), symlinkDestPath, this);
			else
				this();
		},
		function finish(err)
		{
			if(err)
				base.error("Unable to create symlink from src [%s] to dest [%s]", symlinkSrcPath, symlinkDestPath);
			setImmediate(function() { cb(err); });
		}
	);
}

function getWidthHeights(files, cb)
{
	tiptoe(
		function go()
		{
			files.serialForEach(function(file, subcb)
			{
				getWidthHeight(file, subcb);
			}, this);
		},
		function finish(err, widthHeights)
		{
			var widthHeightCounts = {};
			widthHeights = widthHeights.map(function(widthHeight) { return widthHeight[0] + "x" + widthHeight[1]; });
			widthHeights.unique().forEach(function(widthHeight) { widthHeightCounts[widthHeight] = widthHeights.count(widthHeight); });
			setImmediate(function() { cb(err, widthHeightCounts); });
		}
	);
}

function getWidthHeight(file, cb)
{
	tiptoe(
		function getSize()
		{
			runUtil.run("identify", ["-quiet", file], {silent : true}, this);
		},
		function processSizes(err, result)
		{
			if(err)
				return cb(err);

			var matches = result.trim().match(/[^ ]+ [^ ]+ ([0-9]+)x([0-9]+) .*/);
			if(!matches || matches.length!==3)
			{
				base.error("Error reading width/height of file [%s] with result: %s", file, result);
				return setImmediate(function() { cb(null, [0, 0]); });
			}

			setImmediate(function() { cb(null, [+matches[1], +matches[2]]); });
		}
	);
}
