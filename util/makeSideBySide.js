"use strict";

var base = require("xbase"),
	C = require("C"),
	printUtil = require("xutil").print,
	fs = require("fs"),
	path = require("path"),
	dustUtil = require("xutil").dust,
	tiptoe = require("tiptoe");

var JSON_PATH = "/mnt/compendium/DevLab/mtgjson/json";

tiptoe(
	function loadJSON()
	{
		fs.readFile(path.join(JSON_PATH, "M14.json"), {encoding : "utf8"}, this);
	},
	function render(setJSON)
	{
		var dustData = JSON.parse(setJSON).cards.map(function(card) { return { imageName : card.imageName }; });

		dustData.forEach(function(card)
		{
			var beforeSize = fs.statSync(path.join("/", "home", "sembiance", "tmp", "before", card.imageName + ".jpg")).size;
			card.beforeSize = printUtil.toSize(beforeSize);

			var afterSize = fs.statSync(path.join("/", "home", "sembiance", "tmp", "after", card.imageName + ".jpg")).size;
			card.afterSize = printUtil.toSize(afterSize);

			card.savings = ((1-(afterSize/beforeSize))*100).toFixed();
		});

		dustUtil.render(__dirname, "sideBySide", {images : dustData}, { keepWhitespace : true }, this);
	},
	function saveToDisk(sideBySideHTML)
	{
		fs.writeFile(path.join(__dirname, "sideBySide.html"), sideBySideHTML, {encoding : "utf8"}, this);
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
