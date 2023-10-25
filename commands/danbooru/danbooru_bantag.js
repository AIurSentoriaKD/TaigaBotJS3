const Command = require("../../base/Command.js");

const Danbooru = require('danbooru');

module.exports = class Danboorubans extends Command {
    constructor(client) {
        super(client, {
            name: "dangooru bantag",
            description: "Este comando te permite 'banear' algunas etiquetas en tu servidor",
            usage: "Unas 10 imagenes de danbooru, si conoces el sitio ya sabes lo que puede salir... "+
            "Aunque, por suerte para tí, puedo hacer unos filtros. Los tags mas extraños no los enviaré. Así que, ¡tranquilidad!"+
            "para ello revisa el comando danbooru bantag!",
            aliases: ["dubt"],
            category: "Danbooru"
        });
    }

    async run(message){

    }
}