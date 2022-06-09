const { MessageEmbed } = require("discord.js");
const Getter = require("../../utils/Getter");
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
			(await new Getter(message, args.join(" ")).getUser(client)) ||
			message.author;

		const embed = new MessageEmbed()
			.setAuthor({
				name: message.author.username,
				iconURL: message.author.displayAvatarURL({ forceStatic: false }),
			})
			.setTitle(`${user.username}'s avatar`)
			.setColor("#CD1C6C")
			.setDescription(
				`[webp](${user.displayAvatarURL({
					extension: "webp",
				})}) | [png](${user.displayAvatarURL({
					extension: "png",
				})}) | [jpg](${user.displayAvatarURL({
					extension: "jpg",
				})}) | [jpeg](${user.displayAvatarURL({
					extension: "jpeg",
				})}) | [gif](${user.displayAvatarURL({
					extension: "gif",
					forceStatic: false,
				})})`
			)
			.setImage(user.displayAvatarURL({ forceStatic: false, size: 4096 }))
			.setTimestamp()
			.setFooter({
				text: client.user.tag,
				iconURL: client.user.displayAvatarURL(),
			});

		pages.push(embed);

		const member = await new Getter(message, user.id).getMember();

		if (member) {
			const embed = new MessageEmbed()
				.setAuthor({
					name: message.author.username,
					iconURL: message.author.displayAvatarURL({ forceStatic: false }),
				})
				.setTitle(`${member.user.username}'s server avatar`)
				.setColor("#CD1C6C")
				.setDescription(
					`[webp](${member.avatarURL({
						extension: "webp",
					})}) | [png](${member.avatarURL({
						extension: "png",
					})}) | [jpg](${member.avatarURL({
						extension: "jpg",
					})}) | [jpeg](${member.avatarURL({
						extension: "jpeg",
					})}) | [gif](${member.avatarURL({
						extension: "gif",
						forceStatic: false,
					})})`
				)
				.setImage(member.avatarURL({ forceStatic: false, size: 4096 }))
				.setTimestamp()
				.setFooter({
					text: client.user.tag,
					iconURL: client.user.displayAvatarURL(),
				});

			pages.push(embed);
		}

		await user.fetch(true);

		const banner = new MessageEmbed()
			.setAuthor({
				name: message.author.username,
				iconURL: message.author.displayAvatarURL({ forceStatic: false }),
			})
			.setTitle(`${user.username}'s banner`)
			.setColor("#CD1C6C")
			.setDescription(
				`[webp](${user.bannerURL({
					extension: "webp",
				})}) | [png](${user.bannerURL({
					extension: "png",
				})}) | [jpg](${user.bannerURL({
					extension: "jpg",
				})}) | [jpeg](${user.bannerURL({
					extension: "jpeg",
				})}) | [gif](${user.bannerURL({
					extension: "gif",
					forceStatic: false,
				})})`
			)
			.setImage(user.bannerURL({ forceStatic: false, size: 4096 }))
			.setTimestamp()
			.setFooter({
				text: client.user.tag,
				iconURL: client.user.displayAvatarURL(),
			});

		pages.push(banner);

		new Paginate.Paginate(client, message, pages).init();
	},
};
