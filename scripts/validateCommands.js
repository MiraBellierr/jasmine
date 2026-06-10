const { readdirSync } = require("node:fs");
const { join } = require("node:path");

function loadCommand(filePath) {
	delete require.cache[require.resolve(filePath)];
	return require(filePath);
}

function getInteractionJson(command) {
	if (!command.interaction || !command.interaction.data) {
		return null;
	}

	return typeof command.interaction.data.toJSON === "function"
		? command.interaction.data.toJSON()
		: command.interaction.data;
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
			const interactionJson = getInteractionJson(command);

			if (typeof command.run !== "function") {
				missingPrefixRun.push(relativePath);
			}

			if (!interactionJson || typeof command.interaction.run !== "function") {
				missingInteraction.push(relativePath);
			} else {
				interactions.push({ file: relativePath, data: interactionJson });
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
			`Commands missing slash interactions:\n${missingInteraction.join("\n")}`,
		);
	}

	if (duplicates.length) {
		throw new Error(`Duplicate slash command names: ${duplicates.join(", ")}`);
	}

	if (interactions.length > 100) {
		throw new Error(
			`Discord application command limit exceeded: ${interactions.length}/100`,
		);
	}

	console.log(`Validated ${interactions.length} slash commands.`);
}

if (require.main === module) {
	validateCommands();
}

module.exports = validateCommands;
