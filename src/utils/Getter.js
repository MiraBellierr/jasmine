// @ts-nocheck

class Getter {
	constructor(message, toFind = "") {
		this.message = message;
		this.toFind = toFind;
	}

	async getMember() {
		const toFind = this.toFind.toLowerCase();
		let target = false;
		const members = await this.message.guild.members.fetch();

		target = await members.get(toFind);

		if (!target) {
			target = this.message.guild.members.cache.get(toFind);
		} else if (!target.user) {
			target = this.message.guild.members.cache.get(toFind);
		}

		if (!target && this.message.mentions.members) {
			target = this.message.mentions.members.first();
		}
		if (!target && toFind) {
			target = members.find(
				(member) =>
					member.displayName.toLowerCase().includes(toFind) ||
					member.user.tag.toLowerCase().includes(toFind)
			);
		}

		return target;
	}

	async getChannel() {
		const toFind = this.toFind.toLowerCase();
		let target = false;
		const channels = await this.message.guild.channels.fetch();

		target = await channels.get(toFind);

		if (!target) {
			target = this.message.guild.channels.cache.get(toFind);
		}

		if (!target && this.message.mentions.channels) {
			target = this.message.mentions.channels.first();
		}

		if (!target && toFind) {
			target = channels.find((channel) =>
				channel.name.toLowerCase().includes(toFind)
			);
		}

		return target;
	}

	async getRole() {
		const toFind = this.toFind.toLowerCase();
		let target = false;
		const roles = await this.message.guild.roles.fetch();

		target = await roles.get(toFind);

		if (!target) {
			target = this.message.guild.roles.cache.get(toFind);
		}

		if (!target && this.message.mentions.roles) {
			target = this.message.mentions.roles.first();
		}

		if (!target && toFind) {
			target = roles.find((role) => role.name.toLowerCase().includes(toFind));
		}

		return target;
	}
}

module.exports = Getter;
