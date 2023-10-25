const Command = require("../../base/Command.js");
const { MessageAttachment, MessageEmbed } = require("discord.js");
const { add_image, check_image, check_pixiv_guild_status, get_illust_tags } = require("../../base/dbmethods.js");

module.exports = class PixivS extends Command {
    constructor(client) {
        super(client, {
            name: "pixivsearch",
            description:
                "Busca una imagen por palabra. Se puede especificar si quieres resultados NSFW.",
            usage:
                "px <search> (busqueda safe) :: px <search> -r18 (busqueda nsfw, requiere canal nsfw)",
            category: "Pixiv",
            aliases: ["px"],
        });
    }

    async run(message) {
        if (await check_pixiv_guild_status(this.client.pool, message.guild.id) === false) {
            await message.reply("Pixiv no esta habilitado en este servidor.");
        } else {
            const attrs = message.content.split(" ");
            const search = attrs[1];
            var nsfw = false;

            if (attrs.at(-1) === "-r18") {
                nsfw = true;
            }

            const user = this.client.users.cache.get(message.author.id);
            try {
                if (nsfw) {
                    this.client.logger.log("Peticion NSFW");
                    if (!message.channel.nsfw) {
                        await message.reply({ content: "El canal debe ser nsfw." }).then(msg => {
                            setTimeout(() => msg.delete(), 5000);
                        }).catch(
                            console.log("error borrando msg")
                        );
                        return;
                    }
                }
                const data = await searchpx(this.client.pixiv, search, nsfw);
                if (data === null) {
                    await message.reply("No se encontraron resultados.");
                    return;
                }

                const illust = data[0];
                this.client.logger.log(
                    `ENVIANDO ===> ID: ${illust.id}, Title: ${illust.title}`
                );

                const illustfromdb = await check_image(this.client.pool, illust['id']);
                if (illustfromdb === false) {



                    let nsfw = false;
                    if (illust['tags'][0]['name'] === "R-18") {
                        nsfw = true;
                        if (!message.channel.nsfw) {
                            //responder al mensaje y esperar 5 segundos, luego eliminarlo
                            await message.reply("Imagen nsfw, pero el canal no lo es. . .").then(msg => {
                                setTimeout(() => msg.delete(), 5000);
                            }).catch(
                                console.log("error borrando msg")
                            );
                            return;
                        }

                    }
                    const backup_channel = await this.client.channels.cache.get("843911307572936704");
                    const output = await this.client.pixivImg(illust["image_urls"]["large"]);
                    const file = new MessageAttachment(`./${output}`);
                    const msg = await backup_channel.send({ files: [file] });
                    const image = msg.attachments.first().url;
                    var color = "BLUE";
                    if (nsfw == true) {
                        var color = "PURPLE";
                    }

                    const embed = new MessageEmbed()
                        .setColor(color)
                        .setTitle(`${illust.user.name}`)
                        .setURL(`https://www.pixiv.net/en/users/${illust.user.id}/illustrations`)
                        .setDescription(`UID: ${illust.user.id}`)
                        .setImage(`${image}`)
                        .setAuthor({text: `Pixiv`, iconURL: `https://cdn.discordapp.com/attachments/843911307572936704/900771085979619388/unknown.png`, url: `https://www.pixiv.net/en/`})
                        .setTimestamp();

                    embed.setFooter({text:`ID: ${illust.id} | Pags: ${illust.page_count}`, iconURL: user.displayAvatarURL({ dynamic: true })});

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

                    let relateds;
                    if (data[1]) {
                        embed.addField(`Relacionados`, `\`\`\`${data[1]}\`\`\``);
                        relateds = `${data[1]}`;
                    } else {
                        //intentando actualizar relateds
                        try {
                            const related = await this.client.pixiv.illustRelated(illust.id);
                            embed.addField(`Relacionados`, `\`\`\`${related.illusts[0].id}, ${related.illusts[1].id}, ${related.illusts[2].id}\`\`\``);
                            relateds = `${related.illusts[0].id}, ${related.illusts[1].id}, ${related.illusts[2].id}`;
                        } catch (err) {
                            console.log("La imagen aún es nueva, no hay relateds todavia");
                            relateds = "Imagen nueva";
                        }
                    }

                    await message.reply({ embeds: [embed] });

                    //agregar a la bd la imagen nueva, junto con author
                    //console.log(util.inspect(illust, {depth: null}));
                    const thumbs_channel = await this.client.channels.cache.get("901165194275852348");
                    const meta_thumb = await this.client.pixivImg(illust.image_urls.square_medium);
                    const filethumb = new MessageAttachment(`./${meta_thumb}`);
                    const thumb_msg = await thumbs_channel.send({ files: [filethumb] });
                    const thumb_link = thumb_msg.attachments.first().url;

                    await add_image(this.client.pool, illust, relateds, thumb_link, image);




                } else {

                    this.client.logger.log("La imagen ya estaba en bd, enviando. . .");
                    console.log(illustfromdb);
                    const illust_tags_bd = await get_illust_tags(this.client.pool, illust.id);

                    let color = "BLUE";
                    if (illust_tags_bd[0].tag_name == 'R-18') {
                        color = "PURPLE";
                    }

                    const embed = new MessageEmbed()
                        .setColor(color)
                        .setTitle(`${illustfromdb[0].title}`)
                        .setURL(`https://www.pixiv.net/en/users/${illustfromdb[0].authorid}/illustrations`)
                        .setDescription(`UID: ${illustfromdb[0].authorid}`)
                        .setImage(`${illustfromdb[0].large}`)
                        .setAuthor({text: `Pixiv`, iconURL: `https://cdn.discordapp.com/attachments/843911307572936704/900771085979619388/unknown.png`, url: `https://www.pixiv.net/en/`})
                        .setTimestamp();

                    embed.setFooter({text: `ID: ${illustfromdb[0].id} | Pags: ${illustfromdb[0].page_count}`, iconURL: user.displayAvatarURL({ dynamic: true })});

                    let tags = ``;
                    if (illust_tags_bd.length > 4) {
                        for (let k = 0; k < 3; k++) {
                            if (illust_tags_bd[k].tag_trad === null) {
                                tags = tags + `🏷️: ${illust_tags_bd[k].tag_name}\n`;
                            } else {
                                tags = tags + `🏷️: ${illust_tags_bd[k].tag_name}, 🌐: ${illust_tags_bd[k].tag_trad} \n`;
                            }
                        }
                    } else {
                        for (let k = 0; k < illust_tags_bd.length; k++) {
                            if (illust_tags_bd[k].tag_trad === null) {
                                tags = tags + `🏷️: ${illust_tags_bd[k].tag_name}\n`;
                            } else {
                                tags = tags + `🏷️: ${illust_tags_bd[k].tag_name}, 🌐: ${illust_tags_bd[k].tag_trad} \n`;
                            }
                        }
                    }

                    embed.addField(`Detalles`, `\`\`\`Titulo: ${illustfromdb[0].title} - ❤️ ${illustfromdb[0].bookmarks}\`\`\``)
                    embed.addField(`Etiquetas`, `\`\`\`${tags}\`\`\``);

                    let relateds = illustfromdb[0].rel_id;
                    if (relateds != "imagen nueva") {
                        embed.addField(`Relacionados`, `\`\`\`${relateds}\`\`\``);
                    }
                    await message.reply({ embeds: [embed] });
                    try {
                        const related = await this.client.pixiv.illustRelated(illustfromdb[0].id);
                        embed.addField(`Relacionados`, `\`\`\`${related.illusts[0].id}, ${related.illusts[1].id}, ${related.illusts[2].id}\`\`\``);
                        relateds = `${related.illusts[0].id}, ${related.illusts[1].id}, ${related.illusts[2].id}`;
                        await updaterelateds(this.client.pool, relateds, illustfromdb[0].id);
                    } catch (err) {
                        console.log("La imagen aún es nueva, no hay relateds todavia");
                    }
                }
            } catch (e) {
                await message.reply("Probablemente hay un error con pixiv, por favor, contacta a: Aiur Str#4358").then(msg => {
                    setTimeout(() => msg.delete(), 15000);
                }).catch(
                    console.log("error eliminando un msg")
                );
                console.log(e);
            }
        }


        async function updaterelateds(pool, relateds, id) {
            try {
                try {
                    const stmt = `update illusts set rel_id=? where id=?`
                    await pool.query(stmt, [relateds, id]);
                    console.log("related upgrade");
                } catch (err) {
                    console.log("Error al actualizar relateds");
                    console.log(err);
                }


            } catch (err) {
                console.log("Error en relateds");
                console.log(err);
            }
        }

        async function searchpx(pixiv, search, nsfw) {
            console.log("Iniciando metodo:");
            const json_result = await pixiv
                .searchIllust(search)
                .then((json) => {
                    //console.log(json.illusts[0]);
                    //return pixiv.requestUrl(json.next_url);
                    //console.log(json.next_url);
                    return json;
                });
            try {
                console.log("Intentando extraer mas ilustraciones.");
                const json_result2 = await pixiv.requestUrl(
                    json_result.next_url
                );
                const json_result3 = await pixiv.requestUrl(
                    json_result2.next_url
                );

                const ilustraciones = [json_result, json_result2, json_result3];

                let illust_filtered = [];

                ilustraciones.forEach((json) => {
                    let json_illusts = json.illusts;

                    json_illusts.forEach((illust) => {
                        if (nsfw === true) {
                            if (illust["tags"][0]["name"] === "R-18") {
                                //imagen nsfw
                                if (
                                    illust["total_bookmarks"] > 100 &&
                                    illust["total_view"] > 100
                                ) {
                                    //console.log(`ID: ${illust.id}, Title: ${illust.title}, Bookmarks: ${illust['total_bookmarks']}`);
                                    illust_filtered.push(illust);
                                }
                            }
                        } else {
                            //imagen safe
                            if (illust["tags"][0]["name"] != "R-18") {
                                if (
                                    illust["total_bookmarks"] > 100 &&
                                    illust["total_view"] > 100
                                ) {
                                    //console.log(`ID: ${illust.id}, Title: ${illust.title}, Bookmarks: ${illust['total_bookmarks']}`);
                                    illust_filtered.push(illust);
                                }
                            }
                        }
                    });
                });

                let randomindex = Math.floor(Math.random() * illust_filtered.length);

                let final_illust = illust_filtered[randomindex];

                let additional = await pixiv
                    .illustRelated(final_illust.id)
                    .then((json) => {
                        return [json.illusts[0].id, json.illusts[1].id, json.illusts[2].id];
                    });
                console.log("Filtro terminado");
                return [final_illust, additional];
            } catch (error) {
                //busqueda con pocos resultados
                console.log(`hubo un fallo ${error}`);
                console.log("Intentando una sola pagina");
                try {
                    let output;
                    let maxviews = 10;

                    let illusts = json_result.illusts;

                    illusts.forEach((illust) => {
                        if (nsfw) {
                            if (illust["tags"][0]["name"] === "R-18") {
                                //imagen nsfw

                                if (
                                    illust["total_bookmarks"] > maxviews &&
                                    illust["total_view"] > maxviews
                                ) {
                                    illust_filtered.push(illust);
                                    maxviews = maxviews + 10;
                                }
                            }
                        } else {
                            //imagen safe
                            if (illust["tags"][0]["name"] != "R-18") {
                                if (
                                    illust["total_bookmarks"] > maxviews &&
                                    illust["total_view"] > maxviews
                                ) {
                                    illust_filtered.push(illust);
                                    maxviews = maxviews + 10;
                                }
                            }
                        }
                    });
                    return [output];
                } catch (err) {
                    console.log("Fallo final, no hay ilustraciones.");
                    return null;
                }
            }
        }
    }
};