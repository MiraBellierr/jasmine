class Collector {
	constructor(message) {
		this.message = message;
	}

	async startCollector(limit) {
		const filter = (m) => m.author.id === this.message.author.id;

		const collector = await this.message.channel.awaitMessages({
			filter,
			max: 1,
			time: 30000,
		});

		if (!collector.size)
			return {
				message: false,
				error: "stop",
				attachment: false,
			};

		if (collector.first().content.toLowerCase() === "stop") {
			return {
				message: collector.first().content,
				error: "stop",
				attachment: false,
			};
		}

		if (collector.first().content.toLowerCase() === "skip") {
			return {
				message: collector.first().content,
				error: "skip",
				attachment: false,
			};
		}

		if (limit && collector.first().content.length > limit)
			return {
				message: collector.first().content,
				error: `Exceeded ${limit} characters`,
			};

		return {
			message: collector.first().content,
			error: false,
			attachment:
				collector.first().attachments.size > 0
					? collector.first().attachments.first().url
					: false,
		};
	}
}

module.exports = Collector;
