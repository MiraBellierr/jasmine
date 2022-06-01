class Error {
	constructor(obj, client, message) {
		this.obj = obj;
		this.client = client;
		this.message = message;
	}

	argsError() {
		return this.message.channel.send(
			`The right syntax is \`${this.client.prefixes.get(
				this.message.guild.id
			)}${this.obj.name} ${this.obj.usage}\`.`
		);
	}
}

module.exports = Error;
