const Command = require("../../base/Command.js");
const { MessageAttachment, MessageEmbed } = require("discord.js");

module.exports = class PixivID extends Command {
    constructor(client) {
        super(client, {
            name: "pixivhelp",
            description:
                "Un comando que muestra la información completa de los comandos de pixiv... que son los que mas se usa.",
            usage:
                "pxh",
            category: "Pixiv",
            aliases: ["pxh"],
        });
    }
    async run(message) {
        const pagina1 = new MessageEmbed()
            .setColor("BLUE")
            .setTitle("Comandos de Pixiv")
            .setDescription("En esta página estan los comandos px y pxid.")
            .addField("px", "O pixiv search, -> t$px 'loli' <- Buscaré una imagen en pixiv con lo que sea que hayas buscado, no siempre devuelvo algo bueno, pero depende de los tags. Pero.. hago un pequeño filtro a las imagenes, casi como un pixivpremium, aún así, normalmente deberias usar la etiqueta de busqueda en japonés, ten eso en cuenta! -> Si agregas '-r18' en la busqueda, te devolveré una imagen r18.")
            .addField("pxid", "O pixiv por ID, -> t$pxid 94420961 <- Traeré directamente la imagen del id especificado, si usas pixiv, ya sabes cual es el ID, pero si no, 'son los ultimos digitos del enlace de la pagina'. Es el comando mas rapido, pero si el id tiene muchas páginas traeré solo 5 y tardaré un poco. . . ¿Algún problema con eso? ¿Ah?")
            .addField("Y los nsfw?", "Claro... ambos comandos reconocen entre imagenes safe y nsfw, pero recuerda que algunas ilustraciones son bastante subidas de tono que deberian ser nsfw, así que lo mejor es que me des acceso a canales nsfw y que me puedan llamar solo desde ellos.")
            .setImage("https://media.discordapp.net/attachments/829406711914954802/914914231982387210/px_pxid.jpg")
            .setFooter({text: "Aisaka Taiga Bot by Aiur Str#4358"});
        const pagina2 = new MessageEmbed()
            .setColor("BLUE")
            .setTitle("Comandos de Pixiv")
            .setDescription("En esta página estan los comandos pxidr, pxidri, pxui, pxuim.")
            .addField("pxidr", "O pixiv Relateds por ID, -> t$pxidr 94420961 <- Haré unos bonitos embeds con florecitas y todo... nah, con esto puedes ver la información de otras imagenes relacionadas a un id, vaya. Es puro texto, pero como muestra la cantidad de bookmarks y así... talvez te sea util.")
            .addField("pxidri", "O pixiv RelatedsImages por ID, -> t$pxidri 94420961 <- Haré unos bonitos embeds con florecitas y todo... este tal vez, similar al anterior, pero este contiene imagenes. Cuesta un poco pero, te gustará... supongo.")
            .addField("pxui","O pixiv User por ID, -> t$pxui 576423 <- Este caso es similar al de pxidr, pero solo de un artista. Mostraré la informacion de muchos de las ilustraciones de un artista, ya sabes, por si ves alguno que te interesa...")
            .addField("pxuim","O pixiv UserImages por ID, -> t$pxuim 576423 <- Este caso viene de pxui, pero combinado con pxidri. Ademas de la información mostraré algunas imagenes del artista. Sencillo, ¿no?")
            .addField("Notita","Si la imagen que buscas con pxidr o pxidri es muy reciente, no tendrá relateds!")
            .setFooter({text:"Aisaka Taiga Bot by Aiur Str#4358"});

        const pagina3 = new MessageEmbed()
            .setColor("BLUE")
            .setTitle("Comandos de Pixiv")
            .setDescription("Esta pagina habla de pxugg y pxc.")
            .addField("pxugg", "O pixiv Ugoiras por ID, -> t$pxugg 94418754 <- Buscaré, bajaré y hasta subiré, un ugoira de pixiv. Si, soy genial.")
            .addField("pxc", "O pixiv Collage WUUUU por id, -> t$pxc rel/uw 94420xxx <- Pues, lo que dice, ¿Quieres un collage? Toma un collage. El primer parametro se *REL* refiere a [Relacionados] y *UW* [UserWorks]. Rel, Ids de ilustración, Uw, Ids de arista. Simple. -> (Este es el comando que mas tarda, y tiene un largo enfriamiento, usalo si realmente quieres un collage. ¿Para qué? ... ¡Si no quieres no lo uses!) ")
            .setImage("https://media.discordapp.net/attachments/829406711914954802/902275836885999616/collage.png")
            .setFooter({text: "Aisaka Taiga Bot by Aiur Str#4358"});


        message.channel.send("Si... Ya me conoces, o quizá no, no importa. Estas son las formas en las que me puedes llamar...");
        message.channel.send("https://i.gifer.com/C1YJ.gif");
        message.channel.send({embeds: [pagina1]});
        message.channel.send({embeds: [pagina2]});
        message.channel.send({embeds: [pagina3]});
    }
}