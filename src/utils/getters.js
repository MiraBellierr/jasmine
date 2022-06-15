const getUserFromArguments = async (message, arguments) => {
	const userToFind = arguments.toLowerCase();

	if (message.mentions.users.first()) return message.mentions.users.first();

	if (!Number.isNaN(Number(userToFind))) {
		const fetched = await message.client.users
			.fetch(userToFind)
			.catch(() => null);

		if (fetched) return fetched;
	}

	return message.client.users.cache.find(
		(target) =>
			target.username.toLowerCase().includes(userToFind) ||
			target.tag.toLowerCase().includes(userToFind)
	);
};

const getMemberFromArguments = async (message, arguments) => {
	const memberToFind = arguments.toLowerCase();

	if (message.mentions.members.first()) return message.mentions.members.first();

	if (!Number.isNaN(Number(memberToFind))) {
		const fetched = await message.guild.members
			.fetch(memberToFind)
			.catch(() => null);

		if (fetched) return fetched;
	}

	return message.guild.members.cache.find(
		(target) =>
			target.displayName.toLowerCase().includes(memberToFind) ||
			target.user.tag.toLowerCase().includes(memberToFind)
	);
};

const getChannelFromArguments = async (message, arguments) => {
	const channelToFind = arguments.toLowerCase();

	if (message.mentions.channels.first())
		return message.mentions.channels.first();

	if (!Number.isNaN(Number(channelToFind))) {
		const fetched = await message.guild.channels
			.fetch(channelToFind)
			.catch(() => null);
		if (fetched) return fetched;
	}

	return message.guild.channels.cache.find((channel) =>
		channel.name.toLowerCase().includes(channelToFind)
	);
};

const getRoleFromArguments = async (message, arguments) => {
	const roleToFind = arguments.toLowerCase();

	if (message.mentions.roles.first()) return message.mentions.roles.first();

	if (!Number.isNaN(Number(roleToFind))) {
		const fetched = await message.guild.roles
			.fetch(roleToFind)
			.catch(() => null);
		if (fetched) return fetched;
	}

	return message.guild.roles.cache.find((role) =>
		role.name.toLowerCase().includes(roleToFind)
	);
};

module.exports = {
	getUserFromArguments,
	getMemberFromArguments,
	getChannelFromArguments,
	getRoleFromArguments,
};
