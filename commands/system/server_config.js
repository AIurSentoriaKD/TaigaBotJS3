const Command = require("../../base/Command.js");
const { MessageEmbed } = require("discord.js");
module.exports = class Help extends Command {
    constructor(client) {
        super(client, {
            name: "server config",
            description: "Muestra algunas configuraciones establecidas en tu servidor.",
            category: "System",
            usage: "sc",
            aliases: ["sc", "servconf"]
        });
    }
    async run(message, args, level) {
        const settings = message.settings;
        const guild = message.guild;
        //console.log(guild);
        const embed = new MessageEmbed()
            .setTitle(`Configuraciones del servidor ${message.guild.name}`)
            .setColor("WHITE");
        embed.addField("Prefijo", `${settings.prefix}`, true);
        //member count
        embed.addField("Miembros", `${guild.memberCount}`, true);
        //server owner
        embed.addField("Dueño", `${guild.ownerId}`, true);
        //server region
        embed.addField("Región", `${guild.preferredLocale}`, true);
        //server created at
        embed.addField("Creado el", `${guild.createdAt.toLocaleString()}`, true);
        //server roles
        embed.addField("Roles", `${guild.roles.cache.size}`, true);
        //server channels
        embed.addField("Canales", `${guild.channels.cache.size}`, true);
        //server emojis
        embed.addField("Emotes", `${guild.emojis.cache.size}`, true);
        //server icon
        embed.setThumbnail(guild.iconURL());
        //server pixiv settings
        const guildquery = `select * from discord_guild where id = ?`;
        const guildparams = [guild.id];
        const guildresult = await this.client.pool.query(guildquery, guildparams);
        console.log(guildresult[0][0]);
        if (guildresult[0][0].pixiv_enabled == 'off') {
            embed.addField("Pixiv", `Desactivado`, true);
        } else {
            embed.addField("Pixiv", `Activado`, true);
        }
        if (guildresult[0][0].premium_status == 'off') {
            embed.addField("Premium", `No afiliado`, true);
        } else {
            embed.addField("Premium", `Afiliado`, true);
        }
        if(guildresult[0][0].daily_status == 'off') {
            embed.addField("Daily", `No activado`, true);
        } else {
            embed.addField("Daily", `Activado`, true);
        }
        message.reply({ embeds: [embed] });
    }
}