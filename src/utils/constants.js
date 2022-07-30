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

module.exports.assets = {
	class: {
		path: "/assets/rpg-icons/167.png",
		emoji: "<:class:1002186813877801052>",
	},
	xp: {
		path: "/assets/rpg-icons/6.png",
		emoji: "<:xp:1002188020746821643>",
	},
	hp: {
		path: "/assets/rpg-icons/7.png",
		emoji: "<:hp:1002188539129245746>",
	},
	str: {
		path: "/assets/rpg-icons/16.png",
		emoji: "<:str:1002190036097302618>",
	},
	agl: {
		path: "/assets/rpg-icons/36.png",
		emoji: "<:agl:1002191334335062117>",
	},
	att: {
		path: "/assets/rpg-icons/64.png",
		emoji: "<:att:1002191699310825582>",
	},
	def: {
		path: "/assets/rpg-icons/65.png",
		emoji: "<:def:1002192083387416626>",
	},
	weapon: {
		path: "/assets/rpg-icons/31.png",
		emoji: "<:weapon:1002846528827834399>",
	},
};
