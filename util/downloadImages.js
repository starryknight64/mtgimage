"use strict";
/*global setImmediate: true*/

var base = require("xbase"),
	C = require("C"),
	request = require("request"),
	fs = require("fs"),
	url = require("url"),
	moment = require("moment"),
	unicodeUtil = require("xutil").unicode,
	path = require("path"),
	querystring = require("querystring"),
	tiptoe = require("tiptoe");

var JSON_PATH = "/mnt/compendium/DevLab/mtgjson/json";
var IMAGES_PATH = "/mnt/compendium/DevLab/mtgimage/web/actual/set";

function usage()
{
	base.error("Usage: node %s <set code or name>", process.argv[1]);
	process.exit(1);
}

if(process.argv.length<3)
	usage();

var setToDo = process.argv[2];

var targetSet = C.SETS.mutateOnce(function(SET) { if(SET.name.toLowerCase()===setToDo.toLowerCase() || SET.code.toLowerCase()===setToDo.toLowerCase()) { return SET; } });
if(!targetSet)
{
	base.error("Set %s not found!", setToDo);
	process.exit(1);
}

tiptoe(
	function rip()
	{
		downloadImages(targetSet.code, this);
	},
	function finish(err)
	{
		if(err)
		{
			base.error(err);
			process.exit(1);
		}

		process.exit(0);
});

function downloadImages(setCode, cb)
{
	if(!fs.existsSync(path.join(IMAGES_PATH, setCode.toLowerCase())))
		fs.mkdirSync(path.join(IMAGES_PATH, setCode.toLowerCase()));
	else
		base.warn("Set images directory (%s) already exists!", setCode.toLowerCase());

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
					function downloadImage()
					{
						var targetImagePath = path.join(IMAGES_PATH, setCode.toLowerCase(), card.imageName + ".jpg");

						if(fs.existsSync(targetImagePath))
						{
							base.warn("Image already exists, skipping: %s", targetImagePath);
							this();
							return;
						}

						var imageURL = url.format(
						{
							protocol : "http",
							host     : "gatherer.wizards.com",
							pathname : "/Handlers/Image.ashx",
							query    :
							{
								multiverseid : card.multiverseid,
								type         : "card"
							}
						});

						base.info("Downloading image for card: %s", card.name);

						var requester = request(imageURL);
						requester.pipe(fs.createWriteStream(targetImagePath));
						requester.on("end", this);

						request(imageURL, this);
					},
					function finish(err)
					{
						setImmediate(function() { subcb(err); });
					}
				);
			}, cb);
		}
	);
	
}
