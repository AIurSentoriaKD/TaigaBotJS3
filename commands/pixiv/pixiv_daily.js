const Command = require("../../base/Command.js");
const { check_pixiv_guild_status } = require("../../base/dbmethods.js");
const { Client, Collection, MessageAttachment, WebhookClient, MessageEmbed } = require("discord.js");

const { statSync } = require("fs");

module.exports = class PixivDaily extends Command {
    constructor(client) {
        super(client, {
            name: "pixiv daily",
            description:
                "Quieres suscribirte a los daily ranks de pixiv? Pixiv daily hace exactamente lo mismo que la web, mmuestra las imagenes top del dia.",
            usage:
                "Para suscribirte, usa el comando `pixiv daily` y responde con `y` o `n`.",
            category: "Pixiv",
            aliases: ["pxd"],
        });
    }
    async run(message) {
        if (await check_pixiv_guild_status(this.client.pool, message.guild.id) === true) {
            message.channel.send("Pixiv ya está habilitado en este servidor.");
        } else {
            const response4 = await this.client.awaitReply(message, "¿Deseas suscribirte a los daily ranks? y/n");
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
                        updateguild_status(this.client.pool, 'on', webhookdata.url, message.guild.id);
                    } catch (err) {
                        console.log("algo salió mal con el canal", err)
                        message.channel.send("Vaya, algo salió mal, probablemente el id esta mal. . .");
                    }

                }
            }
            else {
                await message.channel.send("Supongo que no quieres mucho spam, baka...");
            }
        }
    }
}