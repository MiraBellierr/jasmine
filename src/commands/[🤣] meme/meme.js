const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
	name: "meme",
	description: "Sends a random meme",
	category: "[🤣] meme",
	run: async (client, message, args) => {
		const m = await message.reply("*Please wait...*");
		const subreddits = [
			"funny",
			"memes",
			"dankmemes",
			"wholesomememes",
			"okbuddyretard",
			"comedymemes",
			"pewdiepiesubmissions",
			"lastimages",
			"historymemes",
			"raimimemes",
		];
		const random = Math.floor(Math.random() * subreddits.length);
		const subreddit = subreddits[random];

		const response = await axios.get(
			`https://www.reddit.com/r/${subreddit}/hot.json`
		);

		const memes = [];

		const childrens = response.data.data.children;
		Array.from(childrens).forEach((child) => {
			if (
				(child.kind === "t3" && !child.data.over_18 && child.media) ||
				(child.kind === "t3" &&
					!child.data.over_18 &&
					child.data.url.includes("."))
			)
				memes.push(child);
		});

		const randomMeme = memes[Math.floor(Math.random() * memes.length)].data;

		const embed = new EmbedBuilder()
			.setAuthor({
				name: `By ${randomMeme.author} - `,
				iconURL:
					randomMeme.all_awardings.length > 0
						? randomMeme.all_awardings[
								Math.floor(Math.random() * randomMeme.all_awardings.length)
						  ].icon_url
						: client.user.avatarURL(),
			})
			.setTitle(`${randomMeme.title.slice(0, 253)}...`)
			.setURL(`https://www.reddit.com${randomMeme.permalink}`)
			.setImage(randomMeme.url)
			.setFooter({
				text: `⬆️ ${randomMeme.ups} | 💬 ${randomMeme.num_comments} | 🏅 ${randomMeme.total_awards_received}`,
			});

		if (randomMeme.is_video) {
			const attachment = new AttachmentBuilder()
				.setName("meme.mp4")
				.setFile(randomMeme.media.reddit_video.fallback_url)
				.setDescription("meme");

			message.reply({ content: randomMeme.title, files: [attachment] });
			m.delete();
		} else {
			message.reply({ embeds: [embed] });
			m.delete();
		}
	},
};
