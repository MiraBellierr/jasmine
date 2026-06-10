const { execFileSync } = require("node:child_process");
const { readdirSync, statSync } = require("node:fs");
const { join } = require("node:path");
const validateCommands = require("./validateCommands");

const roots = ["src", "getCharacters.js"];
let checkedFiles = 0;

function checkJavaScript(filePath) {
	execFileSync(process.execPath, ["--check", filePath], { stdio: "inherit" });
	checkedFiles += 1;
}

function walk(filePath) {
	const stats = statSync(filePath);

	if (stats.isDirectory()) {
		for (const entry of readdirSync(filePath)) {
			walk(join(filePath, entry));
		}
		return;
	}

	if (stats.isFile() && filePath.endsWith(".js")) {
		checkJavaScript(filePath);
	}
}

for (const root of roots) {
	walk(root);
}

console.log(`Checked ${checkedFiles} JavaScript files.`);
validateCommands();
