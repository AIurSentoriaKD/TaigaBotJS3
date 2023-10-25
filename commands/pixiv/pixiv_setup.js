const { MessageEmbed, WebhookClient } = require("discord.js");
const { check_pixiv_guild_status } = require("../../base/dbmethods.js");
const { updateLocale } = require("moment");
const Command = require("../../base/Command.js");

module.exports = class PixivSetup extends Command {
    constructor(client) {
        super(client, {
            name: "pixiv enable",
            description:
                "Usa este comando para habilitar pixiv en tu servidor.",
            usage:
                "Habilitar pixiv permitirá a los usuarios usar todos los comandos de pixiv," +
                " en el futuro, podrás bloquear algunas etiquetas que desees no ver.",
            category: "Pixiv",
            aliases: ["pixivsetup"],
        });
    }
    async run(message) {


        if (await check_pixiv_guild_status(this.client.pool, message.guild.id) === true) {
            message.channel.send("Pixiv ya está habilitado en este servidor.");
        } else {

            const embed = new MessageEmbed()
                .setTitle("Pixiv")
                .setColor("BLUE")
                .setDescription("Antes de continuar, por favor, lee las siguientes recomendaciones para tener una experiencia sin complicaciones.");
            embed.addField("Canal para Taiga", "Se recomienda que el bot tenga un canal dedicado marcado como nsfw, donde las imagenes de pixiv y los usos del comando name se realizarán.");
            embed.addField("Permisos de Taiga", "Los que solicita el bot al ingresar a tu servidor. Sin embargo, puedes restringir al bot a un unico canal, si así lo deseas.")
            embed.addField("Sobre imagenes explicitas", "Los comandos reconocen si la imagen que está por enviar es nsfw, pero se recomienda que el canal sea nsfw ya que existen ocasiones donde los artistas no colocan el tag apropiado de R-18, o que algunas ilustraciones son demasiado sugestivas.")
            embed.addField("Dailies (Daily Rank de pixiv)", "Si lo conoces, pixiv tiene un rank diario de imagenes, al cual te puedes 'suscribir' en el siguiente paso. (Si estas pensando en suscribirte, ten un url de webhook listo, o el ID del canal donde desees que Taiga cree el webhook)");
            embed.addField("Tiempo de respuesta", "Algunos comandos tardan entre 5 a 10 segundos, debido a la ubicación del host del bot con respecto a los de pixiv.");
            embed.addField("Cooldowns", "Se aplica un cooldown de 10 segundos a usuario antes de poder hacer otra solicitud, esto debido a que se puede exceder el consumo de la api y bloquear al bot.");
            embed.addField("====CONFIRMACION====", "Si estas de acuerdo, escribe 'y Y ' para confirmar o 'n' para cancelar.");
            const response1 = await this.client.awaitReply(message, { embeds: [embed] });
            if (response1.toLowerCase() === "y") {
                const response2 = await this.client.awaitReply(message, "Bien! Ahora te daré un pequeño resumen de los comandos. ¿Deseas verlo? y/n");
                if (response2.toLowerCase() === "y") {
                    const embedcommands = new MessageEmbed()
                        .setTitle("Pixiv")
                        .setColor("BLUE");
                    embedcommands.addField("Pixiv search - px", "La busqueda basica, si conoces pixiv, sabes que de preferencia se usan los nombres en japones.");
                    embedcommands.addField("Pixiv ID - pxid", "Si encuentras una imagen interesante en pixiv, puedes compartirla de mejor forma con este comando. El id son los ultimos digitos de una url de pixiv. -> https://www.pixiv.net/en/artworks/94075515 :: 94075515 es el ID");
                    embedcommands.addField("Pixiv ID Related - pxidr", "Muestra información de imagenes relacionadas al id proporcionado.");
                    embedcommands.addField("Pixiv ID Related Images - pxidri", "Similar la anterior, muestra la información junto con las imagenes.");
                    embedcommands.addField("Pixiv ID User Works - pxui", "Muestra información de las ilustraciones de un artista por su id. -> https://www.pixiv.net/en/users/20593668 :: 20593668 es el ID.");
                    embedcommands.addField("Pixiv ID User Images - pxuim", "Muestra 5 ilustraciones de un artista por su id.");
                    embedcommands.addField("Pixiv Collage - pxc", "Realiza un bonito collage con 9 imagenes de un artista <pxc uw <id>> o imagenes relacionadas <pxc rel <id>> Nota: Este es el comando que mas suele tardar, pero ten un poco de paciencia!");
                    embedcommands.addField("Pixiv Ugoira - pxugg (Premium)", "Un ugoira son los Gifs animados de pixiv, con el comando puedes obtener el gif animado instantameamente!");
                    embedcommands.addField("Pixiv Dailies - pxd", "Con el comando puedes ver el estado de tu subscripcion a los daily ranks de pixiv.");
                    embedcommands.addField("Detalles", "'pxidri' y 'pxuim' solo se pueden ejecutar en canales nsfw.\nMas info sobre premium en 'pxpri'");
                    embedcommands.setFooter({text: "Para más información, usa el comando help pixiv"});
                    await message.channel.send({ embeds: [embedcommands] });
                }
                const response3 = await this.client.awaitReply(message, "¿Deseas habilitar pixiv en tu servidor? y/n");
                if (response3.toLowerCase() === "y") {
                    const query = `UPDATE discord_guild SET pixiv_enabled = 'on' WHERE id = '${message.guild.id}'`;
                    await this.client.pool.query(query, []);
                    await message.channel.send("¡Habilitado!");
                    const response4 = await this.client.awaitReply(message, "¿Deseas suscribirte a los daily ranks? y/n (tambien puedes hacerlo con pxd en otro momento)");
                    if (response4.toLowerCase() === "y") {
                        const response5 = await this.client.awaitReply(message, "Bien, ahora necesito que elijas una opcion:\n1. Escribe 'webhook', para que envie los dailies con el webhook que quieras.\n2. Escribe 'canal', para usar este mismo canal, y lo cree yo (puedes editar su imagen o nombre despues).");
                        if (response5.toLowerCase() === "webhook") {
                            const response6 = await this.client.awaitReply(message, "Ajá, envia el webhook de tu canal (tan sencillo como un copia y pega):");
                            if (response6) {
                                let urlToSearch = response6;
                                if (urlToSearch) {
                                    try {
                                        console.log(urlToSearch);
                                        const paraurl = urlToSearch.split("/");
                                        const token = paraurl[paraurl.length - 1];
                                        const id = paraurl[paraurl.length - 2];
                                        const webhookClient = new WebhookClient({ id: id, token: token });
                                        webhookClient.send(`https://cdn.discordapp.com/attachments/843911307572936704/908451013973934130/FDqzAl6acAEv96E.jpg`);
                                        message.channel.send("Wuu... Parece que todo está listo, hasta otra.");

                                        //actualizando la info del server con y dailies y webhook
                                        updateguild_status(this.client.pool, 'on', urlToSearch, message.guild.id);
                                    } catch (err) {
                                        console.log(`Algo Salió mal con el webhook`, err)
                                        message.channel.send("Vaya, algo salió mal, intenta de nuevo luego.");
                                    }

                                } else {
                                    message.channel.send("Hmm... no pude encontrar el webhook, intenta de nuevo luego.");
                                    return;
                                }
                            }

                        } else if (response5.toLowerCase() === "canal") {
                            message.channel.send("Bien, lo haré yo misma. . . Al menos asegurate de que tengo permisos para crear webhooks.");
                            const response6 = await this.client.awaitReply(message, "Ahora dame el ID del canal:");
                            try {
                                const webhookdata = await message.channel.createWebhook('Watagoose Image Delivery Service', {
                                    avatar: 'https://images-ext-2.discordapp.net/external/4zCSXXGonzfP_QbL1g0OiKzjw87vQdhwjtfht8JGrkk/https/cdn.discordapp.com/emojis/835155524823678996.png',
                                });
                                console.log(webhookdata.url);

                                const paraurl = webhookdata.url.split("/");
                                const token = paraurl[paraurl.length - 1];
                                const id = paraurl[paraurl.length - 2];
                                const webhookClient = new WebhookClient({ id: id, token: token });
                                webhookClient.send(`https://cdn.discordapp.com/attachments/843911307572936704/908451013973934130/FDqzAl6acAEv96E.jpg`);
                                await message.channel.send("Wuu... Parece que todo está listo, hasta otra.");

                                //actualizando la info del server con dailies y webhook
                                updateguild_status(this.client.pool,'on',webhookdata.url, message.guild.id);
                            } catch (err) {
                                console.log("algo salió mal con el canal", err)
                                message.channel.send("Vaya, algo salió mal, probablemente el id esta mal. . .");
                            }

                        }
                    }
                    else {
                        await message.channel.send("Supongo que no quieres mucho spam, baka...");
                    }
                } else {
                    await message.channel.send("En fin, si no querias hacer nada, no debiste molestarme.");
                }
            } else {
                return;
            }

        }


        async function updateguild_status(pool, pxdail, pxwebhook, guild_id) {
            const query = `UPDATE discord_guild SET daily_status = '${pxdail}', pixiv_webhook = '${pxwebhook}' WHERE id = '${guild_id}'`;
            await pool.query(query, []);
        }
    }
}