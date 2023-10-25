const Command = require("../../base/Command.js");

module.exports = class Reboot extends Command {
  constructor(client) {
    super(client, {
      name: "lastid",
      description: "Muestra el id de la ultima ilustracion enviada de follows.",
      category: "Owner",
      usage: "lastid",
      permLevel: "Bot Owner",
      aliases: ["lastid"]
    });
  }

  async run(message, args, level) { // eslint-disable-line no-unused-vars
    try {
      message.reply(`Ultimo ID es: ${this.client.getlastillustid()}`)
    } catch (e) {
      console.log(e);
    }
  }
};