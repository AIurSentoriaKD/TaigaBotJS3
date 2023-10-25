const Command = require("../../base/Command.js");
const searchTools = require('../../base/searchTools.js');
// const config = require('../../config.js');
const { MessageActionRow, MessageButton } = require('discord.js');
// const anitomy = require('anitomy-js');


// import fetch from 'node-fetch';
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// const AWS = require("aws-sdk");

const embedBaseURL = 'https://rotf.lol/traceMoe?id=';
const traceMOEBaseURL = "https://api.trace.moe/search?anilistInfo&size=l&url=";

/*
AWS.config.update({
  accessKeyId: config.accessKeyId,
  accessSecretKey: config.accessSecretKey,
  region: "us-east-1",
});
*/
module.exports = class traceMOE extends Command {
  constructor(client) {
    super(client, {
      name: 'aiuraho',
      description: 'Busca información de un frame de anime',
      category: 'search',
      options: [],
      guildOnly: false, // Set this to false if you want it to be global.
    });
  }

  async run(message, level) {
    try {
      // Extract the image to search for in form of a URL
      let urlToSearch;
      if (message.attachments.first()) {
        // Extract this URL from the attachment
        urlToSearch = message.attachments.first().url;
      } else {
        // Search for a link on the message if there wasn't an attachment
        urlToSearch = searchTools.extractURLs(message.content);
        if (urlToSearch) {
          urlToSearch = urlToSearch[0];
        } else {
          // If it doesn't contain an URL or attachment, ignore message
          return;
        }
      }
      await message.channel.sendTyping();

      // Send it to TraceMOE API and save result
      const tMoeResponse = await fetch(traceMOEBaseURL + `${encodeURIComponent(urlToSearch)}`);
      const tMoeData = await tMoeResponse.json();
      console.log(tMoeData.result[0]);

      await message.channel.send(`Resultado? https://anilist.co/anime/${tMoeData.result[0].anilist.id}`);

    } catch (e) {
      console.log(e);
      return message.reply(`There was a problem with your request.\n\`\`\`${e.message}\`\`\``);
    }
  }


};