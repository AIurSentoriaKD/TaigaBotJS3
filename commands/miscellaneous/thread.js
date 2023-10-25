const Command = require("../../base/Command.js");


module.exports = class ThreadJoin extends Command {
    constructor(client) {
        super(client, {
            name: "threadjoin",
            description: "Taiga puede unirse o salir de un hilo. thread join <nombre>, thread leave <nombre>. Ejecutar en el canal que tenga el hilo.",
            usage: "threadjoin",
        });
    }

    async run(message) {
        const threadname = message.content.split(" ").at(-1);
        const option = message.content.split(" ").at(1);
        switch (option) {
            case "join":
                try {
                    const thread = message.channel.threads.cache.find(x => x.name === threadname);
                    if (thread.joinable) await thread.join();
                } catch (e) {
                    console.log(e);
                    message.reply("El hilo no existe, lo escribiste mal o no tengo permisos para entrar. . .").then(msg => {
                        setTimeout(() => msg.delete(), 5000);
                    }).catch(
                        console.log("error borrando msg")
                    );
                }
                break;
            case "leave":

                try {
                    const thread = message.channel.threads.cache.find(x => x.name === 'food-talk');
                    await thread.leave();
                } catch (e) {
                    console.log(e);
                    message.reply("El hilo no existe o lo escribiste mal. . .").then(msg => {
                        setTimeout(() => msg.delete(), 5000);
                    }).catch(
                        console.log("error borrando msg")
                    );
                }
                break;
            default:
                break;
        }


    }
};