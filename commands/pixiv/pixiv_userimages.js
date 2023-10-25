const Command = require("../../base/Command.js");
const { MessageEmbed, MessageAttachment, MessageActionRow, MessageButton } = require('discord.js');
const { addimage, checkimage } = require("../../base/dbhandler.js");
//const { pagination } = require('reconlx');

module.exports = class PixivUIm extends Command {
    constructor(client) {
        super(client, {
            name: "pixivuserworks",
            description:
                "Devuelve los ultimos 5 works de un artista. Solo se puede ejecutar en un canal nsfw.",
            usage:
                "pxuim <user ID> :: ID requerido, [t$pxuim 934046]",
            category: "Pixiv",
            aliases: ["pxuim"],
        });
    }
    async run(message) {
        /** 
         * PROCEDIMIENTO
         * 1. obtener el result de pixiv api.
         * 2. Obtener todos los detalles necesarios por illust.
         * 2.1. Obtener los datos de la bd si los hubiera.
         * 3. Descargar las imagenes.
         * 3.1. Agregar directamente los enlaces de imagen al embed.
         * 3.2. Agregar ese embed a un array.
         * 3.3. No se si agregar el thumnail del artista tambien.
         * 3.4. Enviar el embed con button pages.
         * 4. Subir los datos nuevos a la bd.
        */
        const id = message.content.split(" ").at(-1);
        if (!isNaN(id)) {
            if (message.channel.nsfw) {
                try {
                    const user = this.client.users.cache.get(message.author.id);
                    const result = await this.client.pixiv.userIllusts(id);

                    const illusts = [];

                    for (let i = 0; i < 5; i++) {
                        illusts.push(result.illusts[i]);
                    }

                    const image_files = [];

                    for (let i = 0; i < 5; i++) {
                        if (illusts[i].page_count > 1) {
                            let image_file = await this.client.pixivImg(illusts[i].meta_pages[0].image_urls.large);
                            image_files.push(image_file);
                        } else {
                            let image_file = await this.client.pixivImg(illusts[i].image_urls.large);
                            image_files.push(image_file);
                        }
                    }
                    console.log(image_files);

                    const backup_channel = await this.client.channels.fetch("843911307572936704");

                    const image_urls = [];

                    for (let i = 0; i < 5; i++) {
                        let isondb = await checkimage(this.client.pool, illusts[i].id);
                        if (!isondb) {
                            let file = new MessageAttachment(`./${image_files[i]}`);

                            let msg = await backup_channel.send({ files: [file] });

                            var url = msg.attachments.first().url;
                        } else {
                            var url = isondb[0].image_link;
                        }


                        image_urls.push(url);
                    }

                    console.log(image_urls);

                    const embedpages = [];

                    for (let i = 0; i < 5; i++) {

                        const embed = new MessageEmbed()
                            .setTitle(`Usuario: ${illusts[i].user.name}`)
                            .setURL(`https://www.pixiv.net/en/users/${illusts[0].user.id}/illustrations`)
                            .setDescription(`UID: ${illusts[i].user.id}`)
                            .setImage(`${image_urls[i]}`)
                            .setAuthor({text: `Pixiv`, iconURL: `https://cdn.discordapp.com/attachments/843911307572936704/900771085979619388/unknown.png`, url: `https://www.pixiv.net/en/`})
                            .setTimestamp();

                        if (illusts[i].tags[0].name === "R-18") {
                            embed.setColor("BLURPLE");
                            embed.setFooter({text: `ID: ${illusts[i].id}, R-18`, iconURL: user.displayAvatarURL({ dynamic: true })})
                        } else {
                            embed.setColor("BLUE");
                            embed.setFooter({text: `ID: ${illusts[i].id}`, iconURL: user.displayAvatarURL({ dynamic: true })})
                        }

                        if (illusts[i].page_count > 1) {
                            embed.setFooter({text: `ID: ${illusts[i].id} | Pags: ${illusts[i].page_count} | pxid para ver todas.`})
                        } else {
                            embed.setFooter({text:`ID: ${illusts[i].id} | Pags: ${illusts[i].page_count}`})
                        }


                        let tags = ``;
                        if (illusts[i].tags.length > 4) {
                            for (let k = 0; k < 3; k++) {
                                if (illusts[i].tags[k].translated_name === null) {
                                    tags = tags + `🏷️: ${illusts[i].tags[k].name}\n`;
                                } else {
                                    tags = tags + `🏷️: ${illusts[i].tags[k].name}, 🌐: ${illusts[i].tags[k].translated_name} \n`;
                                }
                            }
                        }else{
                            for (let k = 0; k < illusts[i].tags.length; k++) {
                                if (illusts[i].tags[k].translated_name === null) {
                                    tags = tags + `🏷️: ${illusts[i].tags[k].name}\n`;
                                } else {
                                    tags = tags + `🏷️: ${illusts[i].tags[k].name}, 🌐: ${illusts[i].tags[k].translated_name} \n`;
                                }
                            }
                        }
                        embed.addField(`Detalles`, `\`\`\`Titulo: ${illusts[i].title} - ❤️ ${illusts[i].total_bookmarks} - 👁️ ${illusts[i].total_view}\`\`\``)
                        embed.addField(`Etiquetas`, `\`\`\`${tags}\`\`\``);

                        embedpages.push(embed);
                    }

                    // Crea los botónes
                    const pageButtons = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setCustomId('previous')
                                .setLabel('PREVIOUS')
                                .setStyle('PRIMARY'))
                        .addComponents(
                            new MessageButton()
                                .setCustomId('next')
                                .setLabel('NEXT')
                                .setStyle('PRIMARY'));

                    // Envía el embed junto con los botónes
                    let traceMoeMSG = await message.channel.send({
                        embeds: [embedpages[0]], // Previamente creé una lista de los embeds (páginas) a mostrar
                        components: [pageButtons],
                    });

                    // Crea un "Collector", que reaccionará al usuario clickeando los botónes
                    // "time" creo que es por cuánto tiempo el collector estará recolectando. 
                    // Cuando este tiempo pase, collector enviará el evento 'end', en el cuál desactivamos los botones
                    const collector = await traceMoeMSG.createMessageComponentCollector({ componentType: 'BUTTON', time: 300000 });

                    let currentResultPage = 0;

                    // Evento! Usuario presionó un botón
                    collector.on('collect', async (i) => {
                        switch (i.customId) { // Son los IDs que definimos al crear los botónes
                            case 'previous':
                                // Si el usuario presiona atras en página 0, saltamos a la última página
                                if (currentResultPage <= 0) {
                                    currentResultPage = embedpages.length - 1;
                                } else {
                                    currentResultPage -= 1;
                                }
                                break;
                            case 'next':
                                if (currentResultPage >= embedpages.length - 1) {
                                    currentResultPage = 0;
                                } else {
                                    currentResultPage += 1;
                                }
                                break;
                        }
                        i.deferUpdate(); // Don't ask why, just do this :P
                        // A este punto ya sabemos el botón que el usuario presionó, y actualizamos nuestro número de página
                        // Ahora solo toca editar el mensaje del canal con el nuevo embed
                        traceMoeMSG = await traceMoeMSG.edit({ embeds: [embedpages[currentResultPage]] });
                    });

                    // Este es el evento 'end' en el cuál desactivamos los botónes
                    collector.on('end', async () => {
                        traceMoeMSG.edit({ embeds: embedpages[currentResultPage], components: deactivateButtons([pageButtons]) });
                        function deactivateButtons(buttons) {
                            buttons.forEach(buttonRow => {
                                buttonRow.components.forEach(button => {
                                    button.setDisabled();

                                });
                            });
                            return buttons;
                        }
                    });

                    //agregando imagenes a BD
                    this.client.logger.log("Agregando nuevas imagenes:");
                    for (let i = 0; i < 5; i++) {
                        await addimage(this.client.pool,
                            illusts[i].id,
                            illusts[i].title,
                            `Esperando relacionados`,
                            `${illusts[i].tags[0].name}, ${illusts[i].tags[1].name}`,
                            illusts[i].total_bookmarks,
                            image_urls[i])
                    }
                    this.client.logger.log(". . .Fin. . .");

                } catch (e) {
                    message.reply("Quiza el id es muy antiguo y esa cuenta ya no existe.");
                    console.log(e);
                }
            } else {
                message.reply("Este comando solo se podrá ejecutar en canales nsfw.");
            }
        } else {
            message.reply("No lo ingresaste correctamente.");
        }
        
    }
}