"use strict";
/*global setImmediate: true*/

var base = require("xbase"),
	hyperquest = require("hyperquest"),
	fs = require("fs"),
	C = require("C"),
	url = require("url"),
	unicodeUtil = require("xutil").unicode,
	runUtil = require("xutil").run,
	glob = require("glob"),
	path = require("path"),
	fileUtil = require("xutil").file,
	assert = require("assert"),
	querystring = require("querystring"),
	tiptoe = require("tiptoe");

var runOptions = {silent : true};

var TEST_URL = "http://dev.mtgimage.com";

var CARDNAMES_SKIP = ["Which of You Burns Brightest?"];

var CCGHQ_NO_CARD_LINK =
{
	"10E" : ["Dragon", "Goblin", "Saproling", "Soldier", "Wasp", "Zombie"],
	"ALA" : ["Beast", "Dragon", "Goblin", "Homunculus", "Ooze", "Saproling", "Skeleton", "Soldier", "Thopter", "Zombie"],
	"ARB" : ["Bird Soldier", "Dragon", "Lizard", "Zombie Wizard"],
	"AVR" : ["Angel", "Demon", "Emblem Tamiyo, the Moon Sage", "Human1", "Human2", "Spirit1", "Spirit2", "Zombie"],
	"BOK" : ["Budoka Pupil_Ichiga, Who Topples Oaks", "Callow Jushi_Jaraku the Interloper", "Cunning Bandit_Azamuki, Treachery Incarnate", "Faithful Squire_Kaiso, Memory of Loyalty", "Hired Muscle_Scarmaker"],
	"CHK" : ["Akki Lavarunner_Tok-Tok, Volcano Born", "Brothers Yamazakia", "Brothers Yamazakib", "Budoka Gardener_Dokai, Weaver of Life", "Bushi Tenderfoot_Kenzo the Hardhearted", "Jushi Apprentice_Tomoya the Revealer",
			 "Kitsune Mystic_Autumn-Tail, Kitsune Sage", "Nezumi Graverobber_Nighteyes the Desecrator", "Nezumi Shortfang_Stabwhisker the Odious", "Initiate of Blood_Goka the Unjust", "Orochi Eggwatcher_Shidako, Broodmistress",
			 "Student of Elements_Tobita, Master of Winds"],
	"CFX" : ["Angel", "Elemental"],
	"CMD" : ["Nezumi Graverobber_Nighteyes the Desecrator"],
	"DDF" : ["Soldier"],
	"DDG" : ["Knight Exempler", "Mudbuttun Torchrunner"],
	"DDH" : ["Griffin"],
	"DDI" : ["Emblem Venser, the Sojourner", "Emblem Koth of the Hammer"],
	"DDL" : ["Griffin"],
	"DKA" : ["Human", "Vampire", "Emblem Sorin, Lord of Innistrad"],
	"EVE" : ["Beast", "Bird", "Elemental", "Goat", "Goblin Soldier", "Spirit", "Worm"],
	"GTC" : ["Angel", "Cleric", "Emblem Domri Rade", "Frog Lizard", "Horror", "Rat", "Soldier", "Spirit"],
	"ISD" : ["Angel", "Demon", "Homunculus", "Ooze", "Spider", "Spirit", "Vampire", "Wolf1", "Wolf2", "Zombie1", "Zombie2", "Zombie3"],
	"LEG" : ["rathi Berserker"],
	"LRW" : ["Avatar", "Beast", "Elemental Shaman", "Elemental", "Elemental2", "Elf Warrior", "Goblin Rogue", "Kithkin Soldier", "Merfolk Wizard", "Shapeshifter", "Wolf"],
	"M10" : ["Avatar", "Beast", "Gargoyle", "Goblin", "Insect", "Soldier", "Wolf", "Zombie"],
	"M11" : ["Avatar", "Beast", "Bird", "Ooze1", "Ooze2", "Zombie"],
	"M12" : ["Beast", "Bird", "Pentavite", "Saproling", "Soldier", "Wurm", "Zombie"],
	"M13" : ["Beast", "Cat", "Drake", "Emblem Liliana of the Dark Realms", "Goat", "Goblin", "Hellion", "Saproling", "Soldier", "Wurm", "Zombie"],
	"MBS" : ["Germ", "Golem", "Horror", "Thopter", "Zombie"],
	"MMA" : ["Bat", "Dragon", "Emblem Elspeth, Knight-Errant", "Faerie Rogue", "Giant Warrior", "Goblin Rogue", "Illusion", "Kithkin Soldier", "Spider", "Treefolk Shaman", "Worm"],
	"MOR" : ["Faerie Rogue", "Giant Warrior", "Treefolk Shaman"],
	"NPH" : ["Beast", "Goblin", "Golem", "Myr"],
	"ROE" : ["Eldrazi Spawn1", "Eldrazi Spawn2", "Eldrazi Spawn3", "Elemental", "Hellion", "Ooze", "Tuktuk the Returned"],
	"RTR" : ["Assassin", "Bird", "Centaur", "Dragon", "Elemental", "Goblin", "Knight", "Ooze", "Rhino", "Saproling", "Soldier", "Wurm"],
	"SHM" : ["Elemental1", "Elemental2", "Elf Warrior1", "Elf Warrior2", "Faerie Rogue", "Giant Warrior", "Goblin Warrior", "Kithkin Soldier", "Rat", "Spider", "Spirit", "Wolf"],
	"SOK" : ["Erayo, Soratami Ascendant_Erayo's Essence", "Homura, Human Ascendant_Homura's Essence", "Kuon, Ogre Ascendant_Kuon's Essence", "Rune-Tail, Kitsune Ascendant_Rune-Tail's Essence", "Sasaya, Orochi Ascendant_Sasaya's Essence"],
	"SOM" : ["Cat", "Goblin", "Golem", "Insect", "Myr", "Soldier", "Wolf", "Wurm1", "Wurm2"],
	"WWK" : ["Construct", "Dragon", "Elephant", "Ogre", "Plant", "Soldier Ally"],
	"UNH" : ["Our Market Research"]
};

var VALID_SETS = C.SETS.filter(function(SET) { return !C.SETS_WITH_NO_IMAGES.contains(SET.code); });

exports.GET_SOURCES =
{
	mtgjson : function(cb)
	{
		tiptoe(
			function loadJSON()
			{
				fs.readFile(path.join(__dirname, "mtgjson", "AllSets.json"), { encoding : "utf8" }, this);
			},
			function processJSON(err, setsRaw)
			{
				if(err)
					return setImmediate(function() { cb(err); });

				var sources = [];
				var sets = JSON.parse(setsRaw);
				C.SETS_WITH_NO_IMAGES.forEach(function(SET_WITH_NO_IMAGE) { delete sets[SET_WITH_NO_IMAGE]; });

				Object.forEach(sets, function(setCode, set)
				{
					var SETDATA = VALID_SETS.filter(function(SET) { return SET.code.toLowerCase()===setCode.toLowerCase(); })[0];
					set.cards.forEach(function(card)
					{
						sources.push(TEST_URL + "/set/" + setCode + "/" + card.imageName + ".jpg");
						sources.push(TEST_URL + "/set/" + setCode + "/" + card.imageName + ".hq.jpg");

						if(SETDATA.hasOwnProperty("gathererCode"))
						{
							sources.push(TEST_URL + "/set/" + SETDATA.gathererCode + "/" + card.imageName + ".jpg");
							sources.push(TEST_URL + "/set/" + SETDATA.gathererCode + "/" + card.imageName + ".hq.jpg");
						}

						if(SETDATA.hasOwnProperty("oldCode"))
						{
							sources.push(TEST_URL + "/set/" + SETDATA.oldCode + "/" + card.imageName + ".jpg");
							sources.push(TEST_URL + "/set/" + SETDATA.oldCode + "/" + card.imageName + ".hq.jpg");
						}

						sources.push(TEST_URL + "/card/" + card.imageName.trim("0123456789 .") + ".jpg");
						sources.push(TEST_URL + "/card/" + card.imageName.trim("0123456789 .") + ".hq.jpg");

						sources.push(TEST_URL + "/setname/" + set.name + "/" + card.imageName + ".jpg");
						sources.push(TEST_URL + "/setname/" + set.name + "/" + card.imageName + ".hq.jpg");

						sources.push(TEST_URL + "/set/" + setCode + "/" + card.imageName + "-crop.jpg");
						sources.push(TEST_URL + "/set/" + setCode + "/" + card.imageName + "-crop.hq.jpg");

						if(SETDATA.hasOwnProperty("gathererCode"))
						{
							sources.push(TEST_URL + "/set/" + SETDATA.gathererCode + "/" + card.imageName + ".jpg");
							sources.push(TEST_URL + "/set/" + SETDATA.gathererCode + "/" + card.imageName + ".hq.jpg");
						}

						if(SETDATA.hasOwnProperty("oldCode"))
						{
							sources.push(TEST_URL + "/set/" + SETDATA.oldCode + "/" + card.imageName + ".jpg");
							sources.push(TEST_URL + "/set/" + SETDATA.oldCode + "/" + card.imageName + ".hq.jpg");
						}

						sources.push(TEST_URL + "/card/" + card.imageName.trim("0123456789 .") + "-crop.jpg");
						sources.push(TEST_URL + "/card/" + card.imageName.trim("0123456789 .") + "-crop.hq.jpg");

						sources.push(TEST_URL + "/setname/" + set.name + "/" + card.imageName + "-crop.jpg");
						sources.push(TEST_URL + "/setname/" + set.name + "/" + card.imageName + "-crop.hq.jpg");
					});
				});

				setImmediate(function() { cb(null, sources); });
			}
		);
	},
	multiverseid : function(cb)
	{
		tiptoe(
			function loadJSON()
			{
				fs.readFile(path.join(__dirname, "mtgjson", "AllSets.json"), { encoding : "utf8" }, this);
			},
			function processJSON(err, setsRaw)
			{
				if(err)
					return setImmediate(function() { cb(err); });

				var sources = [];
				var sets = JSON.parse(setsRaw);
				C.SETS_WITH_NO_IMAGES.forEach(function(SET_WITH_NO_IMAGE) { delete sets[SET_WITH_NO_IMAGE]; });
				Object.forEach(sets, function(setCode, set)
				{
					var SETDATA = VALID_SETS.filter(function(SET) { return SET.code.toLowerCase()===setCode.toLowerCase(); })[0];
					set.cards.forEach(function(card)
					{
						if(!card.multiverseid)
							return;
						
						sources.push(TEST_URL + "/multiverseid/" + card.multiverseid + ".jpg");
						sources.push(TEST_URL + "/multiverseid/" + card.multiverseid + ".hq.jpg");

						sources.push(TEST_URL + "/multiverseid/" + card.multiverseid + "-crop.jpg");
						sources.push(TEST_URL + "/multiverseid/" + card.multiverseid + "-crop.hq.jpg");
					});
				});

				setImmediate(function() { cb(null, sources); });
			}
		);
	},
	cardnames : function(cb)
	{
		tiptoe(
			function loadJSON()
			{
				fs.readFile(path.join(__dirname, "mtgjson", "AllSets.json"), { encoding : "utf8" }, this);
			},
			function processJSON(err, setsRaw)
			{
				if(err)
					return setImmediate(function() { cb(err); });

				var sources = [];
				var sets = JSON.parse(setsRaw);
				C.SETS_WITH_NO_IMAGES.forEach(function(SET_WITH_NO_IMAGE) { delete sets[SET_WITH_NO_IMAGE]; });
				Object.forEach(sets, function(setCode, set)
				{
					var SETDATA = VALID_SETS.filter(function(SET) { return SET.code.toLowerCase()===setCode.toLowerCase(); })[0];
					set.cards.forEach(function(card)
					{
						if(CARDNAMES_SKIP.contains(card.name))
							return;

						if(card.name.toLowerCase().contains("token card"))
							return;

						sources.push(TEST_URL + "/set/" + setCode + "/" + card.name + ".jpg");
						sources.push(TEST_URL + "/set/" + setCode + "/" + card.name + ".hq.jpg");

						sources.push(TEST_URL + "/card/" + card.name + ".jpg");
						sources.push(TEST_URL + "/card/" + card.name + ".hq.jpg");

						sources.push(TEST_URL + "/setname/" + set.name + "/" + card.name + ".jpg");
						sources.push(TEST_URL + "/setname/" + set.name + "/" + card.name + ".hq.jpg");

						sources.push(TEST_URL + "/set/" + setCode + "/" + card.name + "-crop.jpg");
						sources.push(TEST_URL + "/set/" + setCode + "/" + card.name + "-crop.hq.jpg");

						sources.push(TEST_URL + "/card/" + card.name + "-crop.jpg");
						sources.push(TEST_URL + "/card/" + card.name + "-crop.hq.jpg");

						sources.push(TEST_URL + "/setname/" + set.name + "/" + card.name + "-crop.jpg");
						sources.push(TEST_URL + "/setname/" + set.name + "/" + card.name + "-crop.hq.jpg");

						if(card.layout==="split")
						{
							sources.push(TEST_URL + "/set/" + setCode + "/" + card.names.join("") + "-crop.jpg");
							sources.push(TEST_URL + "/set/" + setCode + "/" + card.names.join(" ") + "-crop.hq.jpg");

							sources.push(TEST_URL + "/card/" + card.names.join("") + "-crop.jpg");
							sources.push(TEST_URL + "/card/" + card.names.join(" ") + "-crop.jpg");

							sources.push(TEST_URL + "/card/" + card.names.join("") + "-crop.hq.jpg");
							sources.push(TEST_URL + "/card/" + card.names.join(" ") + "-crop.hq.jpg");

							sources.push(TEST_URL + "/setname/" + set.name + "/" + card.names.join("") + "-crop.jpg");
							sources.push(TEST_URL + "/setname/" + set.name + "/" + card.names.join(" ") + "-crop.hq.jpg");

							sources.push(TEST_URL + "/set/" + setCode + "/" + card.names.join("") + ".jpg");
							sources.push(TEST_URL + "/set/" + setCode + "/" + card.names.join(" ") + ".jpg");
							sources.push(TEST_URL + "/set/" + setCode + "/" + card.names.join("") + ".hq.jpg");
							sources.push(TEST_URL + "/set/" + setCode + "/" + card.names.join(" ") + ".hq.jpg");

							sources.push(TEST_URL + "/card/" + card.names.join("") + ".jpg");
							sources.push(TEST_URL + "/card/" + card.names.join(" ") + ".jpg");
							sources.push(TEST_URL + "/card/" + card.names.join("") + ".hq.jpg");
							sources.push(TEST_URL + "/card/" + card.names.join(" ") + ".hq.jpg");

							sources.push(TEST_URL + "/setname/" + set.name + "/" + card.names.join("") + ".jpg");
							sources.push(TEST_URL + "/setname/" + set.name + "/" + card.names.join(" ") + ".jpg");
							sources.push(TEST_URL + "/setname/" + set.name + "/" + card.names.join("") + ".hq.jpg");
							sources.push(TEST_URL + "/setname/" + set.name + "/" + card.names.join(" ") + ".hq.jpg");
						}
					});
				});

				setImmediate(function() { cb(null, sources); });
			}
		);
	},
	ccghq : function(cb)
	{
		var sources = [];

		tiptoe(
			function getFullZipPaths()
			{
				glob(path.join(__dirname, "ccghq", "*.zip"), this);
			},
			function processFullZips(zipPaths)
			{
				zipPaths.serialForEach(function(zipPath, subcb)
				{
					this.data.setCode = path.basename(zipPath, path.extname(zipPath));
					listZipFiles(zipPath, subcb);
				}.bind(this), this);
			},
			function getCropZipPaths(zipFiles)
			{
				zipFiles.flatten().forEach(function(zipFile)
				{
					if(!zipFile.endsWith(".full.jpg") && zipFile.endsWith(".jpg"))
					{
						//base.warn("NOTE: CCGHQ FULL ZIP file doesn't end with .full.jpg: %s", zipFile);
						zipFile = zipFile.substring(0, zipFile.lastIndexOf(".jpg")) + ".full.jpg";
					}

					var setCode = path.dirname(zipFile);
					var imageName = path.basename(zipFile, ".full.jpg");

					sources.push(TEST_URL + "/set/" + setCode + "/" + imageName + ".full.jpg");
					sources.push(TEST_URL + "/set/" + setCode + "/" + imageName + ".full.hq.jpg");

					if(!CCGHQ_NO_CARD_LINK.hasOwnProperty(setCode) || !CCGHQ_NO_CARD_LINK[setCode].contains(imageName))
					{
						sources.push(TEST_URL + "/card/" + imageName.trim("0123456789 .") + ".full.jpg");
						sources.push(TEST_URL + "/card/" + imageName.trim("0123456789 .") + ".full.hq.jpg");
					}
				});

				glob(path.join(__dirname, "ccghq_crops", "*.zip"), this);
			},
			function processCropZips(zipPaths)
			{
				zipPaths.serialForEach(function(zipPath, subcb)
				{
					this.data.setCode = path.basename(zipPath, path.extname(zipPath));
					listZipFiles(zipPath, subcb);
				}.bind(this), this);
			},
			function finish(err, zipFiles)
			{
				if(err)
					return setImmediate(function() { cb(err); });

				zipFiles.flatten().forEach(function(zipFile)
				{
					if(!zipFile.endsWith(".crop.jpg") && zipFile.endsWith(".jpg"))
					{
						//base.warn("NOTE: CCGHQ CROP ZIP file doesn't end with .crop.jpg: %s", zipFile);
						zipFile = zipFile.substring(0, zipFile.lastIndexOf(".jpg")) + ".crop.jpg";
					}

					var setCode = path.dirname(zipFile);
					var imageName = path.basename(zipFile, ".crop.jpg");

					sources.push(TEST_URL + "/set/" + setCode + "/" + imageName + "-crop.jpg");
					sources.push(TEST_URL + "/set/" + setCode + "/" + imageName + "-crop.hq.jpg");

					if(!CCGHQ_NO_CARD_LINK.hasOwnProperty(setCode) || !CCGHQ_NO_CARD_LINK[setCode].contains(imageName))
					{
						sources.push(TEST_URL + "/card/" + imageName.trim("0123456789 .") + "-crop.jpg");
						sources.push(TEST_URL + "/card/" + imageName.trim("0123456789 .") + "-crop.hq.jpg");
					}
				});

				setImmediate(function() { cb(null, sources); });
			}
		);
	},
	cockatrice : function(cb)
	{
		var urlsJSONPath = fileUtil.generateTempFilePath();

		tiptoe(
			function generateURLSJSON()
			{
				runUtil.run("xsltproc", ["-o", urlsJSONPath, path.join(__dirname, "cockatrice", "cards_xml_to_json.xsl"), path.join(__dirname, "cockatrice", "cards.xml")], {"redirect-stderr" : false}, this);
			},
			function readURLSJSON()
			{
				fs.readFile(urlsJSONPath, { encoding : "utf8" }, this);
			},
			function processPathsJSON(urlsJSON)
			{
				var sources = [];

				JSON.parse(urlsJSON).forEach(function(urlRaw)
				{
					if(!urlRaw)
						return;

					sources.push(TEST_URL + decodeURIComponent(url.parse(urlRaw).path));
				});

				this.data.sources = sources;

				fs.unlink(urlsJSONPath, this);
			},
			function finish(err)
			{
				if(err)
					return setImmediate(function() { cb(err); });

				setImmediate(function() { cb(err, this.data.sources); }.bind(this));
			}
		);
	}
};

function listZipFiles(zip, cb)
{
	tiptoe(
		function runUnzip()
		{
			runUtil.run("unzip", ["-l", zip], runOptions, this);
		},
		function returnList(err, data)
		{
			var zipFiles = data.split("\n").map(function(line)
			{
				var parts = /^\s+([0-9]+)\s+[0-9][0-9]-[0-9][0-9]-[0-9][0-9][0-9][0-9] [0-9][0-9]:[0-9][0-9]\s+(.*)$/.exec(line);
				if(!parts || parts.length!==3 || +parts[1]<=0 || parts[2].length<=0)
					return null;

				return parts[2];
			}).filterEmpty();

			setImmediate(function() { cb(err, zipFiles); });
		}
	);
}
