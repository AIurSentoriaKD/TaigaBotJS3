// This event executes when a guild (server) is left.

module.exports = class {
  constructor(client) {
    this.client = client;
  }

  async run(guild) {
    // Set the bot's activity, updating when ever it is invited to a server.
    this.client.user.setActivity(`@me || ${this.client.guilds.cache.size} servidores`);

    // Well they're gone. Let's remove them from the settings and log it!
    this.client.settings.delete(guild.id);

    // Log the event.
    this.client.logger.cmd(`[GUILD REMOVE] ${guild.id} removed the bot. Owner: ${guild.ownerId}`);
  }
};