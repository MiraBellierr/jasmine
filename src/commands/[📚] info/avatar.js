const { EmbedBuilder } = require("discord.js");
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
				iconURL: message.author.displayAvatarURL({ dynamic: true }),
			})
			.setTitle(`${user.username}'s avatar`)
			.setColor("#CD1C6C")
			.setDescription(
				`[webp](${user.displayAvatarURL({
					format: "webp",
				})}) | [png](${user.displayAvatarURL({
					format: "png",
				})}) | [jpg](${user.displayAvatarURL({
					format: "jpg",
				})}) | [jpeg](${user.displayAvatarURL({
					format: "jpeg",
				})}) | [gif](${user.displayAvatarURL({
					format: "gif",
					dynamic: true,
				})})`
			)
			.setImage(user.displayAvatarURL({ dynamic: true, size: 4096 }))
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
					iconURL: message.author.displayAvatarURL({ dynamic: true }),
				})
				.setTitle(`${member.user.username}'s server avatar`)
				.setColor("#CD1C6C")
				.setDescription(
					`[webp](${member.avatarURL({
						format: "webp",
					})}) | [png](${member.avatarURL({
						format: "png",
					})}) | [jpg](${member.avatarURL({
						format: "jpg",
					})}) | [jpeg](${member.avatarURL({
						format: "jpeg",
					})}) | [gif](${member.avatarURL({
						format: "gif",
						dynamic: true,
					})})`
				)
				.setImage(member.avatarURL({ dynamic: true, size: 4096 }))
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
				iconURL: message.author.displayAvatarURL({ dynamic: true }),
			})
			.setTitle(`${user.username}'s banner`)
			.setColor("#CD1C6C")
			.setDescription(
				`[webp](${user.bannerURL({
					format: "webp",
				})}) | [png](${user.bannerURL({
					format: "png",
				})}) | [jpg](${user.bannerURL({
					format: "jpg",
				})}) | [jpeg](${user.bannerURL({
					format: "jpeg",
				})}) | [gif](${user.bannerURL({
					format: "gif",
					dynamic: true,
				})})`
			)
			.setImage(user.bannerURL({ dynamic: true, size: 4096 }))
			.setTimestamp()
			.setFooter({
				text: client.user.tag,
				iconURL: client.user.displayAvatarURL(),
			});

		pages.push(banner);

		new Paginate.Paginate(client, message, pages).init();
	},
};
