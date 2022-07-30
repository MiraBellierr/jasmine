const schemas = require("../../../database/schemas");
const Discord = require("discord.js");
const constants = require("../../../utils/constants");
const { getProgBar } = require("../../../utils/utils");
const set = new Set();
const { setTimeout } = require("timers/promises");
const classes = require("../../../database/json/classes.json");

class Battle {
	constructor(message, user) {
		this.user = user;
		this.message = message;
		this.actions = ["battle started"];
	}

	async getCharacter() {
		const character = await schemas.character().findOne({
			where: {
				userID: this.user.id,
			},
		});

		if (!character) return null;

		return character.toJSON();
	}

	async getRandomOpponent() {
		const allCharacter = await schemas.character().findAll();
		const randomCharacter =
			allCharacter[Math.floor(Math.random() * allCharacter.length)];

		return randomCharacter.toJSON();
	}

	async startRandom() {
		this.character = await this.getCharacter();

		if (!this.character)
			return this.message.channel.send("You haven't registered yet!");

		if (set.has(this.user.id))
			return this.message.reply("You are already in a battle!");

		set.add(this.user.id);

		this.opponent = await this.getRandomOpponent();
		this.character.maxHp = this.character.hp;
		this.opponent.maxHp = this.opponent.hp;

		if (this.character.agl === this.opponent.agl) {
			this.character.agl += Math.random();
			this.opponent.agl += Math.random();
		}

		this.battleMessage = await this.message.channel.send({
			embeds: [this.battleEmbed()],
		});

		setTimeout(2000);

		this.battle();
	}

	async battle() {
		// DMG = ATT * ATT / (ATT + DEF)

		if (this.character.agl > this.opponent.agl) {
			this.playerAttack();

			await setTimeout(1500);

			if (this.opponent.hp < 1) return this.end();

			this.battleMessage.edit({ embeds: [this.battleEmbed()] });

			this.opponentAttack();

			await setTimeout(1500);

			if (this.character.hp < 1) return this.end();

			this.battleMessage.edit({ embeds: [this.battleEmbed()] });
		} else {
			this.opponentAttack();

			await setTimeout(1500);

			if (this.character.hp < 1) return this.end();

			this.battleMessage.edit({ embeds: [this.battleEmbed()] });

			this.playerAttack();

			await setTimeout(1500);

			if (this.opponent.hp < 1) return this.end();

			this.battleMessage.edit({ embeds: [this.battleEmbed()] });
		}

		this.battle();
	}

	async end() {
		if (this.character.hp < 1) {
			set.delete(this.user.id);

			this.character.hp = 0;

			const battleEmbed = this.battleEmbed()
				.setFooter({ text: "You lost!" })
				.setDescription(`\`\`\`\nBattle ended!\n\`\`\``);

			this.battleMessage.edit({ embeds: [battleEmbed] });
		} else {
			set.delete(this.user.id);

			this.opponent.hp = 0;

			const battleEmbed = this.battleEmbed();

			const xpGain = await this.updateXP();

			battleEmbed
				.setFooter({ text: `You Win! You gained ${xpGain} XP!` })
				.setDescription(`\`\`\`\nBattle ended!\n\`\`\``);

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
		let staGain = 0;
		let accGain;

		switch (this.character.class) {
			case "warrior":
				accGain = 3;
				break;
			case "thief":
				accGain = 5;
				break;
			case "monk":
				accGain = 3;
				break;
		}

		while (character.xp > attr.xpNeeded) {
			attr.level++;
			attr.xpNeeded += 10;

			hpGain += Math.floor(character.sta / 4) + 1;
			strGain += Math.floor(Math.random() * 2) + 1;
			aglGain += Math.floor(Math.random() * 2) + 1;
			staGain += Math.floor(Math.random() * 2) + 1;

			attr.att = attr.str / 2;

			if (this.character.att !== attr.att)
				attGain = attr.att - this.character.att;
		}

		if (this.character.level !== attr.level) {
			attr.hp += hpGain;
			attr.str += strGain;
			attr.agl += aglGain;
			attr.sta += staGain;
			attr.acc += accGain;

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
					`Your character has leveled up to **level ${attr.level}**!\n\n**• HP:** +${hpGain}\n**• STR:** +${strGain}\n**• AGL:** +${aglGain}\n**• STA:** +${staGain}\n**• ACC:** +${accGain}\n**• ATT:** +${attGain}`
				);

			this.message.channel.send({ embeds: [embed] });
		}

		return xpGain;
	}

	playerAttack() {
		const acc = Math.floor(
			(this.character.acc / 100) *
				Math.floor(
					(this.character.att * this.character.att) /
						(this.character.att + this.opponent.def)
				)
		);

		const dmg = Math.floor(
			(this.character.att * this.character.att) /
				(this.character.att + this.opponent.def)
		);

		const playerDmg = Math.floor(Math.random() * (dmg - acc + 1) + acc) + 1;

		const opponentSuccess = Math.random() < this.opponent.eva / 100;

		if (opponentSuccess) {
			this.opponent.hp -= playerDmg;
			this.actions.push(
				`${this.character.name} attacked ${this.opponent.name} and did ${playerDmg} damage!`
			);
		} else {
			this.actions.push(`${this.opponent.name} avoided the attack!`);
		}
	}

	opponentAttack() {
		const acc = Math.floor(
			(this.opponent.acc / 100) *
				Math.floor(
					(this.opponent.att * this.opponent.att) /
						(this.opponent.att + this.opponent.def)
				)
		);

		const dmg = Math.floor(
			(this.opponent.att * this.opponent.att) /
				(this.opponent.att + this.character.def)
		);

		const opponentDmg = Math.floor(Math.random() * (dmg - acc + 1) + acc) + 1;

		const playerSuccess = Math.random() < this.character.eva / 100;

		if (playerSuccess) {
			this.character.hp -= opponentDmg;
			this.actions.push(
				`${this.opponent.name} attacked ${this.character.name} and did ${opponentDmg} damage!`
			);
		} else {
			this.actions.push(`${this.character.name} avoided the attack!`);
		}
	}

	battleEmbed() {
		let actionShow = `${this.actions.length} - ${
			this.actions[this.actions.length - 1]
		}`;

		return new Discord.EmbedBuilder()
			.setAuthor({
				name: this.message.author.username,
				iconURL: this.message.author.displayAvatarURL(),
			})
			.setImage(this.opponent.img)
			.setThumbnail(this.character.img)
			.setColor("#DDA0DD")
			.setDescription(`\`\`\`\n${actionShow}\n\`\`\``)
			.addFields([
				{
					name: `${this.character.name}`,
					value: `**• ${constants.assets.xp.emoji} Level:** ${
						this.character.level
					}\n**• ${constants.assets.weapon.emoji} Weapon:** None\n**• ${
						constants.assets.hp.emoji
					} HP:** ${this.character.hp}\n**• ${
						constants.assets.str.emoji
					} STR:** ${this.character.str}\n**• ${
						constants.assets.agl.emoji
					} AGL:** ${Math.floor(this.character.agl)}\n**• ${
						constants.assets.sta.emoji
					} STA:** ${this.character.sta}\n**• ${
						constants.assets.acc.emoji
					} ACC:** ${this.character.acc}\n**• ${
						constants.assets.eva.emoji
					} EVA:** ${this.character.sta}\n**• ${
						constants.assets.eva.emoji
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
					}\n**• ${constants.assets.weapon.emoji} Weapon:** None\n**• ${
						constants.assets.hp.emoji
					} HP:** ${this.opponent.hp}\n**• ${
						constants.assets.str.emoji
					} STR:** ${this.opponent.str}\n**• ${
						constants.assets.agl.emoji
					} AGL:** ${Math.floor(this.opponent.agl)}\n**• ${
						constants.assets.sta.emoji
					} STA:** ${this.opponent.sta}\n**• ${
						constants.assets.acc.emoji
					} ACC:** ${this.opponent.acc}\n**• ${
						constants.assets.eva.emoji
					} EVA:** ${this.opponent.eva}\n**• ${
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
	}
}

module.exports = Battle;
