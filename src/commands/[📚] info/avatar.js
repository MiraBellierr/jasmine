const {
	EmbedBuilder,
	ContextMenuCommandBuilder,
	ApplicationCommandType,
} = require("discord.js");
const {
	getUserFromArguments,
	getMemberFromArguments,
} = require("../../utils/getters");
const Paginate = require("../../utils/pagination");

module.exports = {
	name: "avatar",
	aliases: ["av"],
	category: "[📚] info",
	description: "Shows user avatar",
	usage: "[user]",
	run: async (client, message, args) => {
		const pages = [];
		const user =
			(await getUserFromArguments(message, args.join(" "))) || message.author;

		const embed = new EmbedBuilder()
			.setAuthor({
				name: message.author.username,
				iconURL: message.author.displayAvatarURL(),
			})
			.setTitle(`${user.username}'s avatar`)
			.setColor("#CD1C6C")
			.setDescription(
				`[webp](${user.displayAvatarURL({
					size: 4096,
					extension: "webp",
				})}) | [png](${user.displayAvatarURL({
					size: 4096,
					extension: "png",
				})}) | [jpg](${user.displayAvatarURL({
					size: 4096,
					extension: "jpg",
				})}) | [jpeg](${user.displayAvatarURL({
					size: 4096,
					extension: "jpeg",
				})}) | [gif](${user.displayAvatarURL({
					size: 4096,
					extension: "gif",
				})})`
			)
			.setImage(user.displayAvatarURL({ size: 4096 }))
			.setTimestamp()
			.setFooter({
				text: client.user.tag,
				iconURL: client.user.displayAvatarURL(),
			});

		pages.push(embed);

		const member = await getMemberFromArguments(message, user.id);

		if (member && member.avatarURL()) {
			const embed = new EmbedBuilder()
				.setAuthor({
					name: message.author.username,
					iconURL: message.author.displayAvatarURL(),
				})
				.setTitle(`${member.user.username}'s server avatar`)
				.setColor("#CD1C6C")
				.setDescription(
					`[webp](${member.avatarURL({
						size: 4096,
						extension: "webp",
					})}) | [png](${member.avatarURL({
						size: 4096,
						extension: "png",
					})}) | [jpg](${member.avatarURL({
						size: 4096,
						extension: "jpg",
					})}) | [jpeg](${member.avatarURL({
						size: 4096,
						extension: "jpeg",
					})}) | [gif](${member.avatarURL({
						size: 4096,
						extension: "gif",
					})})`
				)
				.setImage(member.avatarURL({ size: 4096 }))
				.setTimestamp()
				.setFooter({
					text: client.user.tag,
					iconURL: client.user.displayAvatarURL(),
				});

			pages.push(embed);
		}

		await user.fetch(true);

		const banner = new EmbedBuilder()
			.setAuthor({
				name: message.author.username,
				iconURL: message.author.displayAvatarURL(),
			})
			.setTitle(`${user.username}'s banner`)
			.setColor("#CD1C6C")
			.setDescription(
				`[webp](${user.bannerURL({
					size: 4096,
					extension: "webp",
				})}) | [png](${user.bannerURL({
					size: 4096,
					extension: "png",
				})}) | [jpg](${user.bannerURL({
					size: 4096,
					extension: "jpg",
				})}) | [jpeg](${user.bannerURL({
					size: 4096,
					extension: "jpeg",
				})}) | [gif](${user.bannerURL({
					size: 4096,
					extension: "gif",
				})})`
			)
			.setImage(user.bannerURL({ size: 4096 }))
			.setTimestamp()
			.setFooter({
				text: client.user.tag,
				iconURL: client.user.displayAvatarURL(),
			});

		pages.push(banner);

		new Paginate.Paginate(client, message, pages).init();
	},
	interaction: {
		data: {
			name: "Get User Avatar",
			type: 2,
		},
		run: async (client, interaction) => {
			const pages = [];
			const user = await client.users.fetch(interaction.targetId);

			const embed = new EmbedBuilder()
				.setAuthor({
					name: interaction.user.username,
					iconURL: interaction.user.displayAvatarURL(),
				})
				.setTitle(`${user.username}'s avatar`)
				.setColor("#CD1C6C")
				.setDescription(
					`[webp](${user.displayAvatarURL({
						size: 4096,
						extension: "webp",
					})}) | [png](${user.displayAvatarURL({
						size: 4096,
						extension: "png",
					})}) | [jpg](${user.displayAvatarURL({
						size: 4096,
						extension: "jpg",
					})}) | [jpeg](${user.displayAvatarURL({
						size: 4096,
						extension: "jpeg",
					})}) | [gif](${user.displayAvatarURL({
						size: 4096,
						extension: "gif",
					})})`
				)
				.setImage(user.displayAvatarURL({ size: 4096 }))
				.setTimestamp()
				.setFooter({
					text: client.user.tag,
					iconURL: client.user.displayAvatarURL(),
				});

			pages.push(embed);

			const guild = await client.guilds.fetch(interaction.guildId);
			const member = await guild.members.fetch(user);

			if (member && member.avatarURL()) {
				const embed = new EmbedBuilder()
					.setAuthor({
						name: interaction.user.username,
						iconURL: interaction.user.displayAvatarURL(),
					})
					.setTitle(`${member.user.username}'s server avatar`)
					.setColor("#CD1C6C")
					.setDescription(
						`[webp](${member.avatarURL({
							size: 4096,
							extension: "webp",
						})}) | [png](${member.avatarURL({
							size: 4096,
							extension: "png",
						})}) | [jpg](${member.avatarURL({
							size: 4096,
							extension: "jpg",
						})}) | [jpeg](${member.avatarURL({
							size: 4096,
							extension: "jpeg",
						})}) | [gif](${member.avatarURL({
							size: 4096,
							extension: "gif",
						})})`
					)
					.setImage(member.avatarURL({ size: 4096 }))
					.setTimestamp()
					.setFooter({
						text: client.user.tag,
						iconURL: client.user.displayAvatarURL(),
					});

				pages.push(embed);
			}

			await user.fetch(true);

			const banner = new EmbedBuilder()
				.setAuthor({
					name: interaction.user.username,
					iconURL: interaction.user.displayAvatarURL(),
				})
				.setTitle(`${user.username}'s banner`)
				.setColor("#CD1C6C")
				.setDescription(
					`[webp](${user.bannerURL({
						size: 4096,
						extension: "webp",
					})}) | [png](${user.bannerURL({
						size: 4096,
						extension: "png",
					})}) | [jpg](${user.bannerURL({
						size: 4096,
						extension: "jpg",
					})}) | [jpeg](${user.bannerURL({
						size: 4096,
						extension: "jpeg",
					})}) | [gif](${user.bannerURL({
						size: 4096,
						extension: "gif",
					})})`
				)
				.setImage(user.bannerURL({ size: 4096 }))
				.setTimestamp()
				.setFooter({
					text: client.user.tag,
					iconURL: client.user.displayAvatarURL(),
				});

			pages.push(banner);

			new Paginate.Paginate(client, interaction, pages).init();
		},
	},
};
