const Discord = require("discord.js");
const utils = require("../../utils/utils");
const osu = require("node-os-utils");
const si = require("systeminformation");
const sqlite = require("../../../node_modules/sqlite3/package.json");

const cpu = osu.cpu;
const drive = osu.drive;
const mem = osu.mem;
const os = osu.os;

module.exports = {
	name: "botinfo",
	aliases: ["bot"],
	category: "[📚] info",
	description: "Shows bot information",
	run: async (client, message) => {
		const m = await message.channel.send("*Please wait...*");
		const clientApplication = await client.application.fetch();
		const owner = clientApplication.owner.tag;

		const cpuCount = cpu.count();
		const cpuUsagePercentage = await cpu.usage();
		const driveInfo = await drive.info().catch(() => {
			return {
				usedGb: undefined,
			};
		});
		const memInfo = await mem.info();
		const osInfo = await os.oos();
		const processor = await si.cpu();

		let totalSeconds = client.uptime / 1000;
		const days = Math.floor(totalSeconds / 86400);
		const hours = Math.floor(totalSeconds / 3600);
		totalSeconds %= 3600;
		const minutes = Math.floor(totalSeconds / 60);
		const uptime = `${days} days, ${hours} hours, ${minutes} minutes`;

		m.delete();

		const embed = new Discord.EmbedBuilder()
			.setAuthor({ name: "Bot Information" })
			.setThumbnail(client.user.avatarURL())
			.setColor("#DA70D6")
			.setDescription(
				`**• Developer:** ${owner}\n**• Tag:** ${
					client.user.tag
				}\n**• Cached Members:** ${client.users.cache.size.toLocaleString()}\n**• Total Members:** ${client.guilds.cache
					.map((guild) => guild.memberCount)
					.reduce((accumulator, currentValue) => accumulator + currentValue)
					.toLocaleString()}\n**• Total Servers:** ${client.guilds.cache.size.toLocaleString()}\n**• Total Shards:** ${client.shard.count.toLocaleString()}\n**• Total Channels:** ${client.channels.cache.size.toLocaleString()}\n**• Total Emojis:** ${client.emojis.cache.size.toLocaleString()}\n**• Created At:** ${utils.formatDate(
					client.user.createdAt
				)}\n**• Library:** Discord.js v${
					Discord.version
				}\n**• Database:** SQlite3 v${sqlite.version}\n**• JRE:** Node ${
					process.version
				}\n**• Websocket Status:** ${
					client.ws.status
				}\n**• Websocket Ping:** ${client.ws.ping.toLocaleString()}ms\n**• CPU Count:** ${cpuCount}\n**• CPU Usage:** ${cpuUsagePercentage.toFixed(
					2
				)}%\n**• Drive Usage:** ${driveInfo.usedGb}GB (${
					driveInfo.usedPercentage
				}%)\n**• Memory Usage:** ${(memInfo.usedMemMb / 1000).toFixed(2)}GB (${(
					100 - memInfo.freeMemPercentage
				).toFixed(2)}%)\n**• Operating System:** ${osInfo}\n**• Processor:** ${
					processor.manufacturer
				} ${processor.brand}\n**• Ready At:** ${utils.formatDate(
					client.readyAt
				)}\n**• Uptime:** ${uptime}`
			);

		message.reply({ embeds: [embed] });
	},
	interaction: {
		data: {
			name: "botinfo",
			type: 1,
			description: "Shows bot information",
		},
		run: async (client, interaction) => {
			interaction.deferReply();

			const clientApplication = await client.application.fetch();
			const owner = clientApplication.owner.tag;

			const cpuCount = cpu.count();
			const cpuUsagePercentage = await cpu.usage();
			const driveInfo = await drive.info().catch(() => {
				return {
					usedGb: undefined,
				};
			});
			const memInfo = await mem.info();
			const osInfo = await os.oos();
			const processor = await si.cpu();

			let totalSeconds = client.uptime / 1000;
			const days = Math.floor(totalSeconds / 86400);
			const hours = Math.floor(totalSeconds / 3600);
			totalSeconds %= 3600;
			const minutes = Math.floor(totalSeconds / 60);
			const uptime = `${days} days, ${hours} hours, ${minutes} minutes`;

			const embed = new Discord.EmbedBuilder()
				.setAuthor({ name: "Bot Information" })
				.setThumbnail(client.user.avatarURL())
				.setColor("#DA70D6")
				.setDescription(
					`**• Developer:** ${owner}\n**• Tag:** ${
						client.user.tag
					}\n**• Cached Members:** ${client.users.cache.size.toLocaleString()}\n**• Total Members:** ${client.guilds.cache
						.map((guild) => guild.memberCount)
						.reduce((accumulator, currentValue) => accumulator + currentValue)
						.toLocaleString()}\n**• Total Servers:** ${client.guilds.cache.size.toLocaleString()}\n**• Total Shards:** ${client.shard.count.toLocaleString()}\n**• Total Channels:** ${client.channels.cache.size.toLocaleString()}\n**• Total Emojis:** ${client.emojis.cache.size.toLocaleString()}\n**• Created At:** ${utils.formatDate(
						client.user.createdAt
					)}\n**• Library:** Discord.js v${
						Discord.version
					}\n**• Database:** SQlite3 v${sqlite.version}\n**• JRE:** Node ${
						process.version
					}\n**• Websocket Status:** ${
						client.ws.status
					}\n**• Websocket Ping:** ${client.ws.ping.toLocaleString()}ms\n**• CPU Count:** ${cpuCount}\n**• CPU Usage:** ${cpuUsagePercentage.toFixed(
						2
					)}%\n**• Drive Usage:** ${driveInfo.usedGb}GB (${
						driveInfo.usedPercentage
					}%)\n**• Memory Usage:** ${(memInfo.usedMemMb / 1000).toFixed(
						2
					)}GB (${(100 - memInfo.freeMemPercentage).toFixed(
						2
					)}%)\n**• Operating System:** ${osInfo}\n**• Processor:** ${
						processor.manufacturer
					} ${processor.brand}\n**• Ready At:** ${utils.formatDate(
						client.readyAt
					)}\n**• Uptime:** ${uptime}`
				);

			interaction.editReply({ embeds: [embed] });
		},
	},
};
