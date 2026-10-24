const { readdirSync } = require("node:fs");
const { join } = require("node:path");

function loadCommand(filePath) {
	delete require.cache[require.resolve(filePath)];
	return require(filePath);
}

function normalizeInteraction(entry) {
	if (!entry || !entry.data) {
		return null;
	}

	return {
		data:
			typeof entry.data.toJSON === "function"
				? entry.data.toJSON()
				: entry.data,
		run: entry.run,
	};
}

function getInteractions(command) {
	return [command.interaction, command.contextMenu]
		.map(normalizeInteraction)
		.filter(Boolean);
}

function validateCommands() {
	const commandRoot = join(process.cwd(), "src", "commands");
	const interactions = [];
	const missingPrefixRun = [];
	const missingInteraction = [];

	for (const dir of readdirSync(commandRoot)) {
		for (const file of readdirSync(join(commandRoot, dir))) {
			if (!file.endsWith(".js")) {
				continue;
			}

			const relativePath = join("src", "commands", dir, file);
			const command = loadCommand(join(process.cwd(), relativePath));
			const entries = getInteractions(command);
			const main = normalizeInteraction(command.interaction);

			if (typeof command.run !== "function") {
				missingPrefixRun.push(relativePath);
			}

			if (
				!main ||
				typeof main.run !== "function" ||
				entries.some((entry) => typeof entry.run !== "function")
			) {
				missingInteraction.push(relativePath);
			} else {
				for (const entry of entries) {
					interactions.push({ file: relativePath, data: entry.data });
				}
			}
		}
	}

	const names = interactions.map((interaction) => interaction.data.name);
	const duplicates = names.filter((name, index) => names.indexOf(name) !== index);

	if (missingPrefixRun.length) {
		throw new Error(
			`Commands missing prefix run():\n${missingPrefixRun.join("\n")}`,
		);
	}

	if (missingInteraction.length) {
		throw new Error(
			`Commands missing interactions:\n${missingInteraction.join("\n")}`,
		);
	}

	if (duplicates.length) {
		throw new Error(`Duplicate interaction names: ${duplicates.join(", ")}`);
	}

	if (interactions.length > 100) {
		throw new Error(
			`Discord application command limit exceeded: ${interactions.length}/100`,
		);
	}

	console.log(`Validated ${interactions.length} interactions.`);
}

if (require.main === module) {
	validateCommands();
}

module.exports = validateCommands;
