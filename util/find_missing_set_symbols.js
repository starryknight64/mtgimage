"use strict";

var base = require("xbase"),
	C = require("C"),
	fs = require("fs"),
	path = require("path"),
	dustUtil = require("xutil").dust,
	tiptoe = require("tiptoe");

var SET_SYMBOL_PATH = path.join(__dirname, "..", "web", "actual", "symbol", "set");

tiptoe(
	function findMissingSets()
	{
		var missingSets = {};
		C.SETS.forEach(function(SET)
		{
			JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "mtgjson", "json", SET.code + ".json"))).cards.forEach(function(card)
			{
				if(!card.rarity || ["Basic Land"].contains(card.rarity))
					return;

				var rarityLetter = card.rarity.substring(0, 1).toLowerCase();
				if(!fs.existsSync(path.join(SET_SYMBOL_PATH, SET.code.toLowerCase(), rarityLetter + ".svg")))
				{
					var setKey = SET.code + ": " + SET.name;
					if(!missingSets.hasOwnProperty(setKey))
						missingSets[setKey] = {};
					missingSets[setKey][card.rarity] = true;
				}
			});
		});
		base.info(missingSets);

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

