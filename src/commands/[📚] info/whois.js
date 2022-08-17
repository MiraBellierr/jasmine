const Discord = require("discord.js");
const { getUserFromArguments } = require("../../utils/getters");
const utils = require("../../utils/utils");

module.exports = {
	name: "whois",
	aliases: ["userinfo", "user"],
	description: "shows user and member information",
	category: "[📚] info",
	usage: "[user]",
	run: async (client, message, args) => {
		const userflags = {
			BotHTTPInteractions:
				"Bot uses only HTTP interactions and is shown in the online member list",
			BugHunterLevel1: "Bug Hunter Level 1",
			BugHunterLevel2: "Bug Hunter Level 2",
			CertifiedModerator: "Discord Certified Moderator",
			HypeSquadOnlineHouse1: "House Bravery Member",
			HypeSquadOnlineHouse2: "House Brilliance Member",
			HypeSquadOnlineHouse3: "House Balance Member",
			Hypesquad: "HypeSquad Events Member",
			Partner: "Partnered Server Owner",
			PremiumEarlySupporter: "Early Nitro Supporter",
			Quarantined: "Quarantined User",
			Spammer: "Spammer",
			Staff: "Discord Employee",
			TeamPseudoUser: "User is a team",
			VerifiedBot: "Verified Bot",
			VerifiedDeveloper: "Early Verified Bot Developer",
		};

		const user =
			(await getUserFromArguments(message, args.join(" "))) || message.author;

		const created = utils.formatDate(user.createdTimestamp);

		const embed = new Discord.EmbedBuilder()
			.setAuthor({
				name: message.author.username,
				iconURL: message.author.displayAvatarURL(),
			})
			.setFooter({
				text: client.user.username,
				iconURL: client.user.displayAvatarURL(),
			})
			.setThumbnail(user.displayAvatarURL())
			.setColor("#CD1C6C")
			.addFields([
				{
					name: "User Information:",
					value: `**• Avatar URL:** [Link](${user.displayAvatarURL({
						size: 4096,
					})})\n**• ID:** ${user.id}\n**• Discriminator:** ${
						user.discriminator
					}\n**• Username**: ${user.username}\n**• Tag:** ${
						user.tag
					}\n**• Mention:** ${user}\n**• Account Type:** ${
						user.bot ? "Bot" : "Human"
					}\n**• Account created at**: ${created}\n**• Flags:** ${
						user.flags.toArray().length > 0
							? user.flags
									.toArray()
									.map((flag) => userflags[flag])
									.join(", ")
							: "None"
					}`,
					inline: true,
				},
			]);

		try {
			const member = await message.guild.members.fetch(user.id);

			const premiumSince = utils.formatDate(member.premiumSince);
			const joined = utils.formatDate(member.joinedAt);
			const roles =
				member.roles.cache
					.filter((r) => r.id !== message.guild.id)
					.sort((a, b) => b.position - a.position)
					.map((r) => r)
					.join(", ") || "None";

			embed.setColor(
				member.displayHexColor === "#000000"
					? "#CD1C6C"
					: member.displayHexColor
			);
			embed.addFields([
				{
					name: "Member Information:",
					value: `**• Nickname:** ${
						member.nickname === null ? "None" : member.nickname
					}\n**• Display Name:** ${
						member.displayName
					}\n**• Display Hex Color:** ${member.displayHexColor.toUpperCase()}\n**• Manageable by this bot:** ${
						member.manageable ? "Yes" : "No"
					}\n**• bannable by this bot:** ${
						member.bannable ? "Yes" : "No"
					}\n**• Kickable by this bot:** ${
						member.kickable ? "Yes" : "No"
					}\n**• Nitro Booster Since:** ${
						member.premiumSince === null ? "Not a Nitro Booster" : premiumSince
					}\n**• Joined At:** ${joined}`,
					inline: true,
				},
				{
					name: "Roles:",
					value: roles,
				},
			]);
		} catch {}

		message.reply({ embeds: [embed] });
	},
	interaction: {
		data: {
			name: "Get User Info",
			type: 2,
		},
		run: async (client, interaction) => {
			const userflags = {
				BotHTTPInteractions:
					"Bot uses only HTTP interactions and is shown in the online member list",
				BugHunterLevel1: "Bug Hunter Level 1",
				BugHunterLevel2: "Bug Hunter Level 2",
				CertifiedModerator: "Discord Certified Moderator",
				HypeSquadOnlineHouse1: "House Bravery Member",
				HypeSquadOnlineHouse2: "House Brilliance Member",
				HypeSquadOnlineHouse3: "House Balance Member",
				Hypesquad: "HypeSquad Events Member",
				Partner: "Partnered Server Owner",
				PremiumEarlySupporter: "Early Nitro Supporter",
				Quarantined: "Quarantined User",
				Spammer: "Spammer",
				Staff: "Discord Employee",
				TeamPseudoUser: "User is a team",
				VerifiedBot: "Verified Bot",
				VerifiedDeveloper: "Early Verified Bot Developer",
			};

			const user = await client.users.fetch(interaction.targetId);

			const created = utils.formatDate(user.createdTimestamp);

			const embed = new Discord.EmbedBuilder()
				.setAuthor({
					name: interaction.user.username,
					iconURL: interaction.user.displayAvatarURL(),
				})
				.setFooter({
					text: client.user.username,
					iconURL: client.user.displayAvatarURL(),
				})
				.setThumbnail(user.displayAvatarURL())
				.setColor("#CD1C6C")
				.addFields([
					{
						name: "User Information:",
						value: `**• Avatar URL:** [Link](${user.displayAvatarURL({
							size: 4096,
						})})\n**• ID:** ${user.id}\n**• Discriminator:** ${
							user.discriminator
						}\n**• Username**: ${user.username}\n**• Tag:** ${
							user.tag
						}\n**• Mention:** ${user}\n**• Account Type:** ${
							user.bot ? "Bot" : "Human"
						}\n**• Account created at**: ${created}\n**• Flags:** ${
							user.flags.toArray().length > 0
								? user.flags
										.toArray()
										.map((flag) => userflags[flag])
										.join(", ")
								: "None"
						}`,
						inline: true,
					},
				]);

			try {
				const member = await interaction.guild.members.fetch(user.id);

				const premiumSince = utils.formatDate(member.premiumSince);
				const joined = utils.formatDate(member.joinedAt);
				const roles =
					member.roles.cache
						.filter((r) => r.id !== interaction.guild.id)
						.sort((a, b) => b.position - a.position)
						.map((r) => r)
						.join(", ") || "None";

				embed.setColor(
					member.displayHexColor === "#000000"
						? "#CD1C6C"
						: member.displayHexColor
				);
				embed.addFields([
					{
						name: "Member Information:",
						value: `**• Nickname:** ${
							member.nickname === null ? "None" : member.nickname
						}\n**• Display Name:** ${
							member.displayName
						}\n**• Display Hex Color:** ${member.displayHexColor.toUpperCase()}\n**• Manageable by this bot:** ${
							member.manageable ? "Yes" : "No"
						}\n**• bannable by this bot:** ${
							member.bannable ? "Yes" : "No"
						}\n**• Kickable by this bot:** ${
							member.kickable ? "Yes" : "No"
						}\n**• Nitro Booster Since:** ${
							member.premiumSince === null
								? "Not a Nitro Booster"
								: premiumSince
						}\n**• Joined At:** ${joined}`,
						inline: true,
					},
					{
						name: "Roles:",
						value: roles,
					},
				]);
			} catch {}

			interaction.reply({ embeds: [embed] });
		},
	},
};
