const Command = require("../../base/Command.js");
const { MessageEmbed, MessageAttachment, MessageActionRow, MessageButton } = require('discord.js');
const { addimage, check_image } = require("../../base/dbmethods.js");
//const { pagination } = require('reconlx');

module.exports = class PixivIDRI extends Command {
    constructor(client) {
        super(client, {
            name: "pixivrelatedimages",
            description:
                "Devuelve 5 imagenes relacionadas a un id. Solo se puede ejecutar en un canal nsfw.",
            usage:
                "pxidri <user ID> :: ID requerido, [t$pxidri 934046]",
            category: "Pixiv",
            aliases: ["pxidri"],
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
                    const illusts = await this.client.pixiv.illustRelated(id).then(res => {
                        return res.illusts.slice(0, 5);
                    });

                    const embedpages = [];
                    let datito = await create_embedpage(illusts[0], this.client);
                    let firstpage = datito[0];
                    embedpages.push(firstpage); //primera pagina

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
                                // si la página actual es 0, y solo hay una pagina, no hacer nada
                                if (currentResultPage == 0 && embedpages.length == 0) return;

                                // Si el usuario presiona atras en página 0, saltamos a la última página
                                if (currentResultPage <= 0) {
                                    currentResultPage = embedpages.length - 1;
                                } else {
                                    currentResultPage -= 1;
                                }
                                break;
                            case 'next':
                                // Si el usuario presiona adelante en la última página, saltamos a la primera
                                let datita = await create_embedpage(illusts[currentResultPage], this.client);
                                let newpage = datita[0];
                                embedpages.push(newpage);

                                if (currentResultPage >= embedpages.length - 1) {
                                    currentResultPage = 0;
                                } else {
                                    currentResultPage += 1;
                                }
                                break;
                        }
                        await i.deferUpdate(); // Don't ask why, just do this :P
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

                } catch (e) {
                    message.reply("Quiza el id es muy antiguo y esa cuenta ya no existe. ", e);
                    console.log(e);
                }
            } else {
                message.reply("Este comando solo se podrá ejecutar en canales nsfw.");
            }
        } else {
            message.reply("No lo ingresaste correctamente.");
        }

        async function getrelateds(id, pixivapi) {
            return await pixivapi.illustRelated(id).then(res => {
                return `${res.illusts[0].id}, ${res.illusts[1].id}, ${res.illusts[2].id}`;
            });
        }

        async function getimage(id, large, client) {
            let fromdb = await check_image(client.pool, id);
            if (fromdb != false) {
                return fromdb.large;
            } else {
                const image = await client.pixivImg(large);
                const channel_backup = await client.channels.cache.get('843911307572936704');
                let msg = await channel_backup.send({ files: [new MessageAttachment(`./${image}`)] });
                let url = msg.attachments.first().url;
                return url;

            }
        }

        async function create_embedpage(illust, client) {
            let relateds = await getrelateds(illust.id, client.pixiv);
            let image_link = await getimage(illust.id, illust.image_urls.large, client);
            const embed = new MessageEmbed()
                .setTitle(`Usuario: ${illust.user.name}`)
                .setURL(`https://www.pixiv.net/en/users/${illust.user.id}/illustrations`)
                .setDescription(`UID: ${illust.user.id}`)
                .setImage(`${image_link}`)
                .setAuthor({name:`Pixiv`, iconURL: `https://cdn.discordapp.com/attachments/843911307572936704/900771085979619388/unknown.png`, url: `https://www.pixiv.net/en/`})
                .setTimestamp();

            if (illust.tags[0].name === "R-18") {
                embed.setColor("BLURPLE");
                embed.setFooter({text: `ID: ${illust.id}, R-18`})
            } else {
                embed.setColor("BLUE");
                embed.setFooter({text: `ID: ${illust.id}`})
            }

            if (illust.page_count > 1) {
                embed.setFooter({text: `ID: ${illust.id} | Pags: ${illust.page_count} | pxid para ver todas.`})
            } else {
                embed.setFooter({text: `ID: ${illust.id} | Pags: ${illust.page_count}`})
            }


            let tags = ``;
            if (illust.tags.length > 4) {
                for (let k = 0; k < 3; k++) {
                    if (illust.tags[k].translated_name === null) {
                        tags = tags + `🏷️: ${illust.tags[k].name}\n`;
                    } else {
                        tags = tags + `🏷️: ${illust.tags[k].name}, 🌐: ${illust.tags[k].translated_name} \n`;
                    }
                }
            } else {
                for (let k = 0; k < illust.tags.length; k++) {
                    if (illust.tags[k].translated_name === null) {
                        tags = tags + `🏷️: ${illust.tags[k].name}\n`;
                    } else {
                        tags = tags + `🏷️: ${illust.tags[k].name}, 🌐: ${illust.tags[k].translated_name} \n`;
                    }
                }
            }
            embed.addField(`Detalles`, `\`\`\`Titulo: ${illust.title} - ❤️ ${illust.total_bookmarks} - 👁️ ${illust.total_view}\`\`\``)
            embed.addField(`Etiquetas`, `\`\`\`${tags}\`\`\``);
            embed.addField(`Relacionados`, `\`\`\`${relateds}\`\`\``);

            return [embed, relateds];
        }

    }
}