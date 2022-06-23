module.exports.options = {
	handler: {
		disabled: false,
		interactive: false,
		logLevel: "info",
		scope: "custom",
		secrets: [],
		stream: process.stdout,
		types: {
			loading: {
				badge: "↻",
				color: "yellow",
				label: "loading",
				logLevel: "info",
			},
		},
	},
	ready: {
		disabled: false,
		interactive: false,
		logLevel: "info",
		scope: "custom",
		secrets: [],
		stream: process.stdout,
		types: {
			rocket: {
				badge: "🚀",
				color: "red",
				label: "rocket",
				logLevel: "info",
			},
			loading: {
				badge: "↻",
				color: "yellow",
				label: "loading",
				logLevel: "info",
			},
		},
	},
};

module.exports.coins = {
	link: "https://miraiscute.com/img/coins.gif",
	emoji: "<a:Coins:987324624318648320>",
};

module.exports.errorChannel = {
	id: "879702885670211595",
};

module.exports.macs = {
	message: "macs is cute",
	isCute: true,
	id: "724552867662528513",
};
