// This event executes when a new guild (server) is joined.

const { create_insert_from_guild } = require("../base/dbmethods.js");
module.exports = class {
  constructor(client) {
    this.client = client;
  }

  async run(guild) {
    // Filter and map out guild only commands
    const guildCmds = this.client.slashcmds.filter(c => c.guildOnly).map(c => c.commandData);

    // Set the slash commands for the guild.
    await this.client.guilds.cache.get(guild.id)?.commands.set(guildCmds);

    // Set the bot's activity, updating when ever it is invited to a server.
    this.client.user.setActivity(`@me || ${this.client.guilds.cache.size} servidores`);

    // Log the event.
    this.client.logger.cmd(`[GUILD JOIN] ${guild.id} added the bot. Owner: ${guild.ownerId}`);

    // update discord_guilds table with quild.id
    await create_insert_from_guild(this.client.pool, guild.id);
  }
};