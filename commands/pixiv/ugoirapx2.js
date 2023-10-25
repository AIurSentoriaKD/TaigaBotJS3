// => 92971028 <=

const Command = require("../../base/Command.js");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const Downloader = require('nodejs-file-downloader');
const { MessageEmbed } = require("discord.js");

module.exports = class PixivUgoira extends Command {
    constructor(client) {
        super(client, {
            name: "pixivugoirag",
            description: "Muestra el ugoira de un ID como video, (metodo request)",
            usage: "pxug <id> :: Comprobará el tipo de canal",
            category: "Pixiv",
            aliases: ["pxugg", "pxugoirag"],
            permLevel: "User"
        });
    }
    async run(message) {
        const id = message.content.split(" ").at(-1);

        if (!isNaN(id)) {

            const response = await fetch("https://ugoira.huggy.moe/api/illusts/queue/", {
                "headers": {
                    "accept": "application/json, text/plain, */*",
                    "content-type": "application/json;charset=UTF-8",
                },
                "body": `{\"id\":\"${id}\",\"type\":\"ugoira\"}`,
                "method": "POST",
                "mode": "cors"
            });
            const data = await response.json();
            console.log(data.data[0]);

            //await message.reply(`${data.data[0].url}`);

            const filename = data.data[0].url.split("/").at(-1);
            const downloader = new Downloader({
                url: `${data.data[0].url}`,
                directory: "./tmp/ugoiras",
                fileName: `${filename}`,//This will be the file name.  
                cloneFiles: false,
            });
            try {
                await downloader.download();//Downloader.download() returns a promise.

                console.log('All done');

            } catch (error) {//IMPORTANT: Handle a possible error. An error is thrown in case of network errors, or status codes of 400 and above.
                //Note that if the maxAttempts is set to higher than 1, the error is thrown only if all attempts fail.
                console.log('Download failed', error.message)
            }
            try {
                
                const responseimgur = await this.client.imgur.uploadFile(`./tmp/ugoiras/${filename}`);
                console.log(responseimgur.link);
                await message.reply(responseimgur.link);
            }catch(error){
                console.log(`Error subiendo a imgur: ${error.message}`);
                await message.reply(`Error subiendo ugoira: ${error}`); 
                
            }



        } else {
            message.reply("Ingresa el id correctamente");
        }


    }
};