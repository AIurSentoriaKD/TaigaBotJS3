const Command = require("../../base/Command.js");
const client = require('nekos.life');

module.exports = class PixivIDRI extends Command {
    constructor(client) {
        super(client, {
            name: "nekoslife",
            description:
                "Esa bonita api que da lindas gatitas... No podia faltar",
            usage:
                "Puedes usar t$neko <arg>, donde arg es una de estas palabras." +
                "smug, baka, tickle, slap, poke, pat, neko, nekoGif, meow, hug, kiss, foxgirl, feed, cuddle, kemonomimi, holo." +
                "Diviertete descubriendo que devuelven!",
            category: "Neko arc",
            aliases: ["neko"],
        });
    }
    async run(message) {
        const attr = message.content.split(" ").at(-1);
        console.log(attr);
        const neko = new client();
        if (attr) {
            switch (attr) {
                case "smug":
                    await neko.sfw.smug().then(async (catText) => {
                        console.log(catText);
                        await message.reply(`${catText['url']}`);
                    });
                    break;
                case "baka":

                    break;
                case "tickle":

                    break;
                case "slap":

                    break;
                case "poke":

                    break;
                case "pat":

                    break;
                case "neko":

                    break;
                case "nekoGif":

                    break;
                case "meow":

                    break;
                case "hug":

                    break;
                case "kiss":

                    break;
                case "foxgirl":

                    break;
                case "feed":

                    break;
                case "cuddle":

                    break;
                case "kemonomimi":

                    break;

                default:
                    break;
            }
        }
    }
}