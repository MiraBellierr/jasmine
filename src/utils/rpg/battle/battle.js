const schemas = require("../../../database/schemas");
const Discord = require("discord.js");
const constants = require("../../../utils/constants");
const { getProgBar } = require("../../../utils/utils");

class Battle {
	constructor(message, user) {
		this.user = user;
		this.message = message;
	}

	async getCharacter() {
		const character = await schemas.character().findOne({
			where: {
				userID: this.user.id,
			},
		});

		if (!character)
			return this.message.channel.send(
				`You havent registered a character yet!`
			);

		return character.toJSON();
	}

	async getrandomOpponent() {
		const allCharacter = await schemas.character().findAll();
		const randomCharacter =
			allCharacter[Math.floor(Math.random() * allCharacter.length)];

		return randomCharacter.toJSON();
	}

	async startRandom() {
		this.character = await this.getCharacter();
		this.opponent = await this.getrandomOpponent();
		this.character.maxHp = this.character.hp;
		this.opponent.maxHp = this.opponent.hp;

		if (this.character.agl === this.opponent.agl) {
			this.character.agl += Math.random();
			this.opponent.agl += Math.random();
		}

		const battleEmbed = new Discord.EmbedBuilder()
			.setAuthor({
				name: this.message.author.username,
				iconURL: this.message.author.displayAvatarURL(),
			})
			.setImage(this.opponent.img)
			.setThumbnail(this.character.img)
			.setColor("#DDA0DD")
			.addFields([
				{
					name: `${this.character.name}`,
					value: `**• ${constants.assets.xp.emoji} Level:** ${
						this.character.level
					}\n**• :emoji: Weapon:** None\n**• ${
						constants.assets.hp.emoji
					} HP:** ${this.character.hp}\n**• ${
						constants.assets.str.emoji
					} STR:** ${this.character.str}\n**• ${
						constants.assets.agl.emoji
					} AGL:** ${Math.floor(this.character.agl)}\n**• ${
						constants.assets.att.emoji
					} ATT:** ${this.character.att}\n**• ${
						constants.assets.def.emoji
					} DEF:** ${this.character.def}\n${getProgBar(
						this.character.hp,
						this.character.maxHp,
						20
					)}`,
				},
				{
					name: `${this.opponent.name}`,
					value: `**• ${constants.assets.xp.emoji} Level:** ${
						this.opponent.level
					}\n**• :emoji: Weapon:** None\n**• ${
						constants.assets.hp.emoji
					} HP:** ${this.opponent.hp}\n**• ${
						constants.assets.str.emoji
					} STR:** ${this.opponent.str}\n**• ${
						constants.assets.agl.emoji
					} AGL:** ${Math.floor(this.opponent.agl)}\n**• ${
						constants.assets.att.emoji
					} ATT:** ${this.opponent.att}\n**• ${
						constants.assets.def.emoji
					} DEF:** ${this.opponent.def}\n${getProgBar(
						this.opponent.hp,
						this.opponent.maxHp,
						20
					)}`,
				},
			]);

		this.battleMessage = await this.message.channel.send({
			embeds: [battleEmbed],
		});

		setTimeout(() => {
			this.battle();
		}, 2000);
	}

	async battle() {
		if (this.character.agl > this.opponent.agl) {
			this.opponent.hp -= Math.floor(
				(this.character.att * this.character.att) /
					(this.character.att + this.opponent.def)
			);

			if (this.opponent.hp < 1) return this.end();

			this.character.hp -= Math.floor(
				(this.opponent.att * this.opponent.att) /
					(this.opponent.att + this.character.def)
			);

			if (this.character.hp < 1) return this.end();
		} else {
			this.character.hp -= Math.floor(
				(this.opponent.att * this.opponent.att) /
					(this.opponent.att + this.character.def)
			);

			if (this.character.hp < 1) return this.end();

			this.opponent.hp -= Math.floor(
				(this.character.att * this.character.att) /
					(this.character.att + this.opponent.def)
			);

			if (this.opponent.hp < 1) return this.end();
		}

		const battleEmbed = new Discord.EmbedBuilder()
			.setAuthor({
				name: this.message.author.username,
				iconURL: this.message.author.displayAvatarURL(),
			})
			.setImage(this.opponent.img)
			.setThumbnail(this.character.img)
			.setColor("#DDA0DD")
			.addFields([
				{
					name: `${this.character.name}`,
					value: `**• ${constants.assets.xp.emoji} Level:** ${
						this.character.level
					}\n**• :emoji: Weapon:** None\n**• ${
						constants.assets.hp.emoji
					} HP:** ${this.character.hp}\n**• ${
						constants.assets.str.emoji
					} STR:** ${this.character.str}\n**• ${
						constants.assets.agl.emoji
					} AGL:** ${Math.floor(this.character.agl)}\n**• ${
						constants.assets.att.emoji
					} ATT:** ${this.character.att}\n**• ${
						constants.assets.def.emoji
					} DEF:** ${this.character.def}\n${getProgBar(
						this.character.hp,
						this.character.maxHp,
						20
					)}`,
				},
				{
					name: `${this.opponent.name}`,
					value: `**• ${constants.assets.xp.emoji} Level:** ${
						this.opponent.level
					}\n**• :emoji: Weapon:** None\n**• ${
						constants.assets.hp.emoji
					} HP:** ${this.opponent.hp}\n**• ${
						constants.assets.str.emoji
					} STR:** ${this.opponent.str}\n**• ${
						constants.assets.agl.emoji
					} AGL:** ${Math.floor(this.opponent.agl)}\n**• ${
						constants.assets.att.emoji
					} ATT:** ${this.opponent.att}\n**• ${
						constants.assets.def.emoji
					} DEF:** ${this.opponent.def}\n${getProgBar(
						this.opponent.hp,
						this.opponent.maxHp,
						20
					)}`,
				},
			]);

		this.battleMessage.edit({ embeds: [battleEmbed] });

		setTimeout(() => {
			this.battle();
		}, 2000);
	}

	async end() {
		if (this.character.hp < 1) {
			this.character.hp = 0;

			const battleEmbed = new Discord.EmbedBuilder()
				.setAuthor({
					name: this.message.author.username,
					iconURL: this.message.author.displayAvatarURL(),
				})
				.setImage(this.opponent.img)
				.setThumbnail(this.character.img)
				.setColor("#DDA0DD")
				.addFields([
					{
						name: `${this.character.name}`,
						value: `**• ${constants.assets.xp.emoji} Level:** ${
							this.character.level
						}\n**• :emoji: Weapon:** None\n**• ${
							constants.assets.hp.emoji
						} HP:** ${this.character.hp}\n**• ${
							constants.assets.str.emoji
						} STR:** ${this.character.str}\n**• ${
							constants.assets.agl.emoji
						} AGL:** ${Math.floor(this.character.agl)}\n**• ${
							constants.assets.att.emoji
						} ATT:** ${this.character.att}\n**• ${
							constants.assets.def.emoji
						} DEF:** ${this.character.def}\n${getProgBar(
							this.character.hp,
							this.character.maxHp,
							20
						)}`,
					},
					{
						name: `${this.opponent.name}`,
						value: `**• ${constants.assets.xp.emoji} Level:** ${
							this.opponent.level
						}\n**• :emoji: Weapon:** None\n**• ${
							constants.assets.hp.emoji
						} HP:** ${this.opponent.hp}\n**• ${
							constants.assets.str.emoji
						} STR:** ${this.opponent.str}\n**• ${
							constants.assets.agl.emoji
						} AGL:** ${Math.floor(this.opponent.agl)}\n**• ${
							constants.assets.att.emoji
						} ATT:** ${this.opponent.att}\n**• ${
							constants.assets.def.emoji
						} DEF:** ${this.opponent.def}\n${getProgBar(
							this.opponent.hp,
							this.opponent.maxHp,
							20
						)}`,
					},
				])
				.setFooter({ text: "You lost!" });

			this.battleMessage.edit({ embeds: [battleEmbed] });
		} else {
			this.opponent.hp = 0;

			const battleEmbed = new Discord.EmbedBuilder()
				.setAuthor({
					name: this.message.author.username,
					iconURL: this.message.author.displayAvatarURL(),
				})
				.setImage(this.opponent.img)
				.setThumbnail(this.character.img)
				.setColor("#DDA0DD")
				.addFields([
					{
						name: `${this.character.name}`,
						value: `**• ${constants.assets.xp.emoji} Level:** ${
							this.character.level
						}\n**• :emoji: Weapon:** None\n**• ${
							constants.assets.hp.emoji
						} HP:** ${this.character.hp}\n**• ${
							constants.assets.str.emoji
						} STR:** ${this.character.str}\n**• ${
							constants.assets.agl.emoji
						} AGL:** ${Math.floor(this.character.agl)}\n**• ${
							constants.assets.att.emoji
						} ATT:** ${this.character.att}\n**• ${
							constants.assets.def.emoji
						} DEF:** ${this.character.def}\n${getProgBar(
							this.character.hp,
							this.character.maxHp,
							20
						)}`,
					},
					{
						name: `${this.opponent.name}`,
						value: `**• ${constants.assets.xp.emoji} Level:** ${
							this.opponent.level
						}\n**• :emoji: Weapon:** None\n**• ${
							constants.assets.hp.emoji
						} HP:** ${this.opponent.hp}\n**• ${
							constants.assets.str.emoji
						} STR:** ${this.opponent.str}\n**• ${
							constants.assets.agl.emoji
						} AGL:** ${Math.floor(this.opponent.agl)}\n**• ${
							constants.assets.att.emoji
						} ATT:** ${this.opponent.att}\n**• ${
							constants.assets.def.emoji
						} DEF:** ${this.opponent.def}\n${getProgBar(
							this.opponent.hp,
							this.opponent.maxHp,
							20
						)}`,
					},
				]);

			const xpGain = await this.updateXP();

			battleEmbed.setFooter({ text: `You Win! You gained ${xpGain} XP!` });

			this.battleMessage.edit({ embeds: [battleEmbed] });
		}
	}

	async updateXP() {
		// formular: 1 * (5 * (O - P) / P + 4)

		let { id, userID, createdAt, updatedAt, ...character } =
			await this.getCharacter();

		const xpGain = Math.floor(
			1 *
				((5 * (this.opponent.level - this.character.level)) /
					this.character.level +
					4)
		);

		character.xp += xpGain;

		schemas.character().update(
			{
				xp: character.xp,
			},
			{ where: { userID: this.user.id } }
		);

		let { xp, ...attr } = character;

		let hpGain = 0;
		let strGain = 0;
		let aglGain = 0;
		let attGain = 0;

		while (character.xp > attr.xpNeeded) {
			attr.level++;
			attr.xpNeeded += 10;

			hpGain += Math.floor(Math.random() * 5) + 1;
			strGain += Math.floor(Math.random() * 2) + 1;
			aglGain += Math.floor(Math.random() * 2) + 1;

			if (attr.class === "monk") attr.att = attr.str + 2;
			else attr.att = attr.str / 2;

			if (this.character.att !== attr.att)
				attGain = attr.att - this.character.att;
		}

		if (this.character.level !== attr.level) {
			attr.hp += hpGain;
			attr.str += strGain;
			attr.agl += aglGain;

			schemas.character().update(attr, { where: { userID: this.user.id } });

			const embed = new Discord.EmbedBuilder()
				.setAuthor({
					name: this.user.username,
					iconURL: this.user.displayAvatarURL(),
				})
				.setColor("#DDA0DD")
				.setTitle("Level Up!")
				.setThumbnail(this.character.img)
				.setDescription(
					`Your character has leveled up to level ${character.level}!\n\n**• HP:** +${hpGain}\n**• STR:** +${strGain}\n**• AGL:** +${aglGain}\n**• ATT:** +${attGain}`
				);

			this.battleMessage.channel.send({ embeds: [embed] });
		}

		return xpGain;
	}
}

module.exports = Battle;
