const Command = require("../../base/Command.js");
const { MessageEmbed, MessageAttachment, MessageActionRow, MessageButton, TextBasedChannelMixin } = require('discord.js');
const { get_author_pic } = require("../../base/dbmethods.js");

//const { pagination } = require('reconlx');

module.exports = class PixivUID extends Command {
    constructor(client) {
        super(client, {
            name: "pixivuserimageid",
            description:
                "Busca trabajos de un artista por ID, mostrando los bookmarks, los tags, y si es nsfw.",
            usage:
                "pxui <user ID> :: ID requerido, [t$pxui 934046]",
            category: "Pixiv",
            aliases: ["pxui"],
        });
    }
    async run(message) {
        /** 
         * Procedimiento:
         * 1. Obtener el result de pixiv-api-client.
         * 1.1. Extraer: titulo, bookmarks, views, tags....
         * 2. Construir las (maximo 5) paginas de los embeds.
         * 2.1. Si no tiene muchos works, controlar eso.
         * 2.2. Cada pagina tendrá 6 works (maximo). Si tiene menos de 6, controlar eso.
         * 2.3. si es nsfw, se mostrará un emote red circle.
         * 3. Enviar el embed.
         * 3.1. escuchar clicks durante maximo 30 segundos.
         * 3.2. quitar botones?
         * **/
        const id = message.content.split(" ").at(-1);
        if (!isNaN(id)) {
            try {
                const user = this.client.users.cache.get(message.author.id);
                await this.client.pixiv.userIllusts(id)
                    .then(async result => {

                        //console.log(result.illusts[7]);
                        //console.log(result.illusts[7].meta_pages);
                        await this.client.pixivImg(result.illusts[0].user.profile_image_urls.medium).then(output_profile => {
                            //console.log(output_profile);
                            let illust_total = result.illusts.length;
                            console.log("Cantidad de illusts en pag 1: ", illust_total, typeof illust_total);
                            if (illust_total != 0) {
                                let counter = 0;
                                const fullpages = illust_total / 6;
                                const extrapage = illust_total % 6;
                                const embedpages = [];

                                const db_thumb = await get_author_pic(this.client.pool, result.illusts[0].user.id);
                                let thumb;
                                if (db_thumb === false) {
                                    this.client.logger.log(`Imagen de autor no encontrada en la base de datos. Descargando`);
                                    const file = new MessageAttachment(`./${output_profile}`);

                                    const channel = await this.client.channels.fetch("900838104917766165")

                                    const msg_thumb = await channel.send({ content: [`${result.illusts[0].user.id}`],files: [file] });

                                    thumb = msg_thumb.attachments.first().url;
                                }else{
                                    thumb = db_thumb;
                                }

                                for (let c = 0; c < fullpages; c++) {
                                    //console.log(`Pagina nro: ${c + 1}`);
                                    const embedpage = new MessageEmbed()
                                        .setColor('BLUE')
                                        .setTitle(`${result.illusts[0].user.name}, ${result.illusts[0].user.account}, ${result.illusts[0].user.id}`)
                                        .setURL(`https://www.pixiv.net/en/users/${result.illusts[0].user.id}/illustrations`)
                                        .setAuthor({ name: `Pixiv`, iconURL: `https://cdn.discordapp.com/attachments/843911307572936704/900771085979619388/unknown.png`, url: `https://www.pixiv.net/en/` })
                                        .setThumbnail(`${thumb}`)
                                        .setFooter({ text: `Pagina ${c + 1} de 5. Solicitado por: ${user.username}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
                                    //.setThumbnail(`attachment://${output_profile}`);
                                    if (extrapage > 0 && c + 1 === fullpages) {
                                        console.log("pagina final");
                                        var illust_per_page = extrapage;
                                    } else {
                                        var illust_per_page = 6;
                                    }
                                    for (let i = 0; i < illust_per_page; i++) {
                                        //console.log("illust: ", counter+1);
                                        let tags = '';
                                        if (counter === illust_total) {
                                            break;
                                        }
                                        // contador de etiquetas
                                        if (result.illusts[counter].tags.length > 4) {
                                            for (let t = 0; t < 3; t++) {
                                                if (result.illusts[counter].tags[t].translated_name === null) {
                                                    if (result.illusts[counter].tags[t].name != "R-18") {
                                                        tags = tags + `🏷️: ${result.illusts[counter].tags[t].name}\n`;
                                                    }
                                                } else {
                                                    tags = tags + `🏷️: ${result.illusts[counter].tags[t].name}, 🌐: ${result.illusts[counter].tags[t].translated_name} \n`;
                                                }
                                            }
                                        } else {
                                            for (let t = 1; t < result.illusts[counter].tags.length; t++) {
                                                if (result.illusts[counter].tags[t].translated_name === null) {
                                                    tags = tags + `🏷️: ${result.illusts[counter].tags[t].name} \n`;
                                                } else {
                                                    tags = tags + `🏷️: ${result.illusts[counter].tags[t].name}, 🌐: ${result.illusts[counter].tags[t].translated_name} \n`;
                                                }
                                            }
                                        }

                                        //define que emoji poner dependiendo de si es nsfw o no
                                        if (result.illusts[counter].tags[0].name === 'R-18') {
                                            var nsfw = `🔞`;
                                        } else {
                                            var nsfw = `🟢`;
                                        }


                                        embedpage.addField(`🆔: ${result.illusts[counter].id} - 🔤: ${result.illusts[counter].title} - 🖼️: ${result.illusts[counter].type} - ${nsfw}`,
                                            `Imgs: ${result.illusts[counter].page_count} - ❤️ ${result.illusts[counter].total_bookmarks} - 👁️ ${result.illusts[counter].total_view} \n` +
                                            `\`\`\`${tags}\`\`\``);

                                        counter = counter + 1;
                                    }
                                    embedpages.push(embedpage);
                                    //message.reply({ embeds: [embedpage], files: [output_profile] });
                                }
                                /*
                                pagination({
                                    embeds: embedpages,
                                    channel: message.channel,
                                    time: 15000,
                                    author: message.author,
                                });*/

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






                                //paginacion del embed
                                //message.channel.send({embeds: [embedpages[0]], files: [output_profile]});


                                //a
                            }
                        }).catch(e => console.log(e));
                    }).catch(e => console.log(e));
            } catch (e) {
                message.reply("Quiza el id es muy antiguo y esa cuenta ya no existe.");
                console.log(e);
            }
        } else {
            message.reply("No lo ingresaste correctamente.");
        }
    }
}