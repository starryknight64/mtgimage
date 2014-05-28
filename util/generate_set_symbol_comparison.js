"use strict";

var base = require("xbase"),
	C = require("C"),
	fs = require("fs"),
	path = require("path"),
	dustUtil = require("xutil").dust,
	tiptoe = require("tiptoe");

var SET_SYMBOL_PATH = path.join(__dirname, "..", "web", "actual", "symbol", "set");

tiptoe(
	function moveOptimal()
	{
		var dustData = [];
		C.SETS.forEach(function(SET)
		{
			var cards = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "mtgjson", "json", SET.code + ".json"))).cards;
			var setData = {name : SET.name, code : SET.code.toLowerCase(), imageName : cards[0].imageName, rarities : []};
			["c", "u", "r", "m", "s"].forEach(function(RARITY_LETTER)
			{
				if(fs.existsSync(path.join(SET_SYMBOL_PATH, SET.code.toLowerCase(), RARITY_LETTER + ".svg")))
					setData.rarities.push(RARITY_LETTER);
			});
			dustData.push(setData);
		});

		dustUtil.render(__dirname, "set_symbol_comparison", {sets : dustData}, { keepWhitespace : true }, this);
	},
	function saveToDisk(sideBySideHTML)
	{
		fs.writeFile(path.join(__dirname, "set_symbol_comparison.html"), sideBySideHTML, {encoding : "utf8"}, this);
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

