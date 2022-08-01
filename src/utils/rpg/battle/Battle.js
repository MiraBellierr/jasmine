const schemas = require("../../../database/schemas");
const Discord = require("discord.js");
const constants = require("../../constants");
const { getProgBar } = require("../../utils");
const set = new Set();
const { setTimeout } = require("timers/promises");
const classes = require("../../../database/json/classes.json");
const equipments = require("../../../database/json/equipments.json");
const economies = require("../../../utils/economies");

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
		let randomCharacter =
			allCharacter[Math.floor(Math.random() * allCharacter.length)];

		if (allCharacter.length > 1) {
			while (randomCharacter.get("userID") === this.user.id) {
				randomCharacter =
					allCharacter[Math.floor(Math.random() * allCharacter.length)];
			}
		} else {
			randomCharacter = allCharacter[0];
		}

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

		this.character.crit = 0;
		this.opponent.crit = 0;

		this.opponent.weight = 0;
		this.character.weight = 0;

		await this.registerEquipments();

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

			const rewardGained = await this.registerReward();

			battleEmbed
				.setFooter({
					text: `You Win! You gained ${xpGain} XP and ${rewardGained.toLocaleString()}!`,
				})
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
		let accGain = 0;

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
			default:
				accGain = 0;
				break;
		}

		while (character.xp > attr.xpNeeded) {
			attr.level++;
			attr.xpNeeded *= 2;

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

			if (attr.acc < 100) {
				if (Math.random() < 0.125) {
					attr.acc += accGain;
				} else {
					accGain = 0;
				}
			} else {
				attr.acc = 99;
			}

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

	async registerEquipments() {
		const playerEquipments = JSON.parse(this.character.equipments);
		const opponentEquipments = JSON.parse(this.opponent.equipments);
		// weapons
		if (playerEquipments.weapons.equipped) {
			const attr = equipments.weapons[playerEquipments.weapons.equipped].attr;
			Object.keys(attr).forEach((key) => {
				this.character[key] += attr[key];
			});
		}
		if (opponentEquipments.weapons.equipped) {
			const attr = equipments.weapons[opponentEquipments.weapons.equipped].attr;
			Object.keys(attr).forEach((key) => {
				this.opponent[key] += attr[key];
			});
		}
		// shields
		if (playerEquipments.shields.equipped) {
			const attr = equipments.shields[playerEquipments.shields.equipped].attr;
			Object.keys(attr).forEach((key) => {
				this.character[key] += attr[key];
			});
		}
		if (opponentEquipments.shields.equipped) {
			const attr = equipments.shields[opponentEquipments.shields.equipped].attr;
			Object.keys(attr).forEach((key) => {
				this.opponent[key] += attr[key];
			});
		}
		// helmet
		if (playerEquipments.helmet.equipped) {
			const attr = equipments.helmet[playerEquipments.helmet.equipped].attr;
			Object.keys(attr).forEach((key) => {
				this.character[key] += attr[key];
			});
			if (equipments.helmet[playerEquipments.helmet.equipped].weight) {
				this.character.weight +=
					equipments.helmet[playerEquipments.helmet.equipped].weight;
			}
		}
		if (opponentEquipments.helmet.equipped) {
			const attr = equipments.helmet[opponentEquipments.helmet.equipped].attr;
			Object.keys(attr).forEach((key) => {
				this.opponent[key] += attr[key];
			});
			if (equipments.helmet[opponentEquipments.helmet.equipped].weight) {
				this.opponent.weight +=
					equipments.helmet[opponentEquipments.helmet.equipped].weight;
			}
		}
		// armor
		if (playerEquipments.armor.equipped) {
			const attr = equipments.armor[playerEquipments.armor.equipped].attr;
			Object.keys(attr).forEach((key) => {
				this.character[key] += attr[key];
			});
			if (equipments.armor[playerEquipments.armor.equipped].weight) {
				this.character.weight +=
					equipments.armor[playerEquipments.armor.equipped].weight;
			}
		}
		if (opponentEquipments.armor.equipped) {
			const attr = equipments.armor[opponentEquipments.armor.equipped].attr;
			Object.keys(attr).forEach((key) => {
				this.opponent[key] += attr[key];
			});
			if (equipments.armor[opponentEquipments.armor.equipped].weight) {
				this.opponent.weight +=
					equipments.armor[opponentEquipments.armor.equipped].weight;
			}
		}
		// gloves
		if (playerEquipments.gloves.equipped) {
			const attr = equipments.gloves[playerEquipments.gloves.equipped].attr;
			Object.keys(attr).forEach((key) => {
				this.character[key] += attr[key];
			});
			if (equipments.gloves[playerEquipments.gloves.equipped].weight) {
				this.character.weight +=
					equipments.gloves[playerEquipments.gloves.equipped].weight;
			}
		}
		if (opponentEquipments.gloves.equipped) {
			const attr = equipments.gloves[opponentEquipments.gloves.equipped].attr;
			Object.keys(attr).forEach((key) => {
				this.opponent[key] += attr[key];
			});
			if (equipments.gloves[opponentEquipments.gloves.equipped].weight) {
				this.opponent.weight +=
					equipments.gloves[opponentEquipments.gloves.equipped].weight;
			}
		}
	}

	async registerReward() {
		const wallet = await economies.getCoins(this.user);

		const reward = Math.ceil(Math.random() * 10);

		schemas.coins().update(
			{
				wallet: wallet.get("wallet") + reward,
			},
			{
				where: { userID: this.user.id },
			}
		);

		return reward;
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

		let playerDmg = Math.floor(Math.random() * (dmg - acc + 1) + acc) + 1;

		const opponentSuccess =
			Math.random() < (this.opponent.eva - this.opponent.weight) / 100;

		if (opponentSuccess) {
			const crit = (this.character.crit + 1) / 201 / 100;

			if (this.character.crit > 0 && Math.random() < crit) {
				this.opponent.hp -= playerDmg + playerDmg;
				this.actions.push(
					`${this.character.name} attacked ${this.opponent.name} and did ${playerDmg} damage. Its a critical hit!`
				);
			} else {
				this.opponent.hp -= playerDmg;
				this.actions.push(
					`${this.character.name} attacked ${this.opponent.name} and did ${playerDmg} damage!`
				);
			}
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

		const playerSuccess =
			Math.random() < (this.character.eva - this.character.weight) / 100;

		if (playerSuccess) {
			const crit = (this.opponent.crit + 1) / 201 / 100;

			if (this.opponent.crit > 0 && Math.random() < crit) {
				this.character.hp -= opponentDmg + opponentDmg;
				this.actions.push(
					`${this.opponent.name} attacked ${this.character.name} and did ${opponentDmg} damage. Its a critical hit!`
				);
			} else {
				this.character.hp -= opponentDmg;
				this.actions.push(
					`${this.opponent.name} attacked ${this.character.name} and did ${opponentDmg} damage!`
				);
			}
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
					}\n**• ${constants.assets.hp.emoji} HP:** ${this.character.hp}\n**• ${
						constants.assets.str.emoji
					} STR:** ${this.character.str}\n**• ${
						constants.assets.agl.emoji
					} AGL:** ${Math.floor(this.character.agl)}\n**• ${
						constants.assets.sta.emoji
					} STA:** ${this.character.sta}\n**• ${
						constants.assets.acc.emoji
					} ACC:** ${this.character.acc}\n**• ${
						constants.assets.eva.emoji
					} EVA:** ${this.character.eva}\n**• ${
						constants.assets.eva.emoji
					} ATT:** ${this.character.att}\n**• ${
						constants.assets.def.emoji
					} DEF:** ${this.character.def}\n${getProgBar(
						this.character.hp,
						this.character.maxHp,
						20
					)}`,
					inline: true,
				},
				{
					name: `${this.opponent.name}`,
					value: `**• ${constants.assets.xp.emoji} Level:** ${
						this.opponent.level
					}\n**• ${constants.assets.hp.emoji} HP:** ${this.opponent.hp}\n**• ${
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
					inline: true,
				},
			]);
	}
}

module.exports = Battle;
