const slashCommand = require("../../base/slashCommand.js");

module.exports = class Ping extends slashCommand {

  constructor(client) {
    super(client, {
      name: "ping",
      description: "peng.",
      options: [],
      guildOnly: true // Set this to false if you want it to be global.
    });
  }

  async run(client, interaction) {
    try {
      await interaction.deferReply();
      const reply = await interaction.editReply("Ping?");
      await interaction.editReply(`Pong! Latency is ${reply.createdTimestamp - interaction.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms.`);

    } catch (e) {
      console.log(e);
      return await interaction.editReply(`There was a problem with your request.\n\`\`\`${e.message}\`\`\``);
    }
  }
};