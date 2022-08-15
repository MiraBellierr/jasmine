const Discord = require("discord.js");
const utils = require("../../utils/utils");
const signale = require('signale');


module.exports = {
	name: "shardstatus",
	aliases: ["shard"],
	category: "[📚] info",
	description: "Shows the shards status",
	run: async (client, interaction) => {
	
     try {
       
          client.shard.broadcastEval(client => [client.shard.ids, client.ws.status, client.ws.ping, client.guilds.cache.size])
    .then((results) =>{
        const embed = new MessageEmbed()
            .setColor("RANDOM")
            .setTitle(`📡 Total shards: (${interaction.client.shard.count})`)
            .setFooter({ text: 'Jasmine > shardstats'})
            
        
        results.map((data) => {
            embed.addFields({ name: `Shard ${data[0]}`, value: `**ID:** \`[ ${data[1]} ]\` | **Ping:** \`[ ${data[2]}ms ]\` | **Guilds:** \`[ ${data[3]} ]\``, inline: false})
        });
        interaction.reply({ embeds: [embed] });
    })
            
        } catch (err) {
        interaction.reply(`There is an error. Please try again later.`);
        signale.fatal(err)
    }
    
    
	},
};


// mira please stop using 



