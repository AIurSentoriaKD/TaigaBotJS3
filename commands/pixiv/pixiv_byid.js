const Command = require("../../base/Command.js");
const pixivImg = require("pixiv-img");
const { MessageAttachment, MessageEmbed } = require("discord.js");
const { add_image, check_image, check_pixiv_guild_status, get_illust_tags } = require("../../base/dbmethods.js");
const { add_fav } = require("./pixiv_fav_tools.js");
const { readdirSync, statSync, writeFileSync, readFileSync, existsSync, mkdirSync, renameSync } = require("fs");
module.exports = class PixivID extends Command {
    constructor(client) {
        super(client, {
            name: "pixivid",
            description:
                "Busca una imagen por su ID. Verifica si el canal y la imagen es nsfw.",
            usage:
                "pxid <ID> :: ID requerido, [t$pxid 93404783]",
            category: "Pixiv",
            aliases: ["pxid"],
        });
    }
    async run(message) {

        if (await check_pixiv_guild_status(this.client.pool, message.guild.id) === false) {
            await message.reply("Pixiv no esta habilitado en este servidor.");
        } else {
            const id = message.content.split(" ").at(-1);

            if (!isNaN(id)) {
                const illustfromdb = await check_image(this.client.pool, id);
                const user = this.client.users.cache.get(message.author.id);

                // cargando json BlockedTags.json
                const BlockedTags = await JSON.parse(readFileSync('./data/BlockedTags.json', 'utf8'));

                if (illustfromdb === false) {
                    this.client.logger.log("Imagen nueva, descargando. . .");
                    const data = await pxid(this.client, id);
                    const illust = data[0];
                    let nsfw = false;

                    // analizando tags para ver si tiene R-28
                    for (let i = 0; i < illust["tags"].length; i++) {
                        if (illust["tags"][i]["name"] === "R-18") {
                            nsfw = true;
                        }
                    }

                    if (nsfw === true) {
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


                    let furry_check = false;
                    let tags = ``;
                    if (illust.tags.length > 4) {
                        for (let k = 0; k < 3; k++) {
                            if (illust.tags[k].translated_name === null) {
                                tags = tags + `🏷️: ${illust.tags[k].name}\n`;
                            } else {
                                tags = tags + `🏷️: ${illust.tags[k].name}, 🌐: ${illust.tags[k].translated_name} \n`;
                            }
                            if (BlockedTags.tags.includes(illust.tags[k].name) === true) {
                                furry_check = true; //imagen privatizada
                            }
                        }
                    } else {
                        for (let k = 0; k < illust.tags.length; k++) {
                            if (illust.tags[k].translated_name === null) {
                                tags = tags + `🏷️: ${illust.tags[k].name}\n`;
                            } else {
                                tags = tags + `🏷️: ${illust.tags[k].name}, 🌐: ${illust.tags[k].translated_name} \n`;
                            }
                            if (BlockedTags.tags.includes(illust.tags[k].name) === true) {
                                furry_check = true; //imagen privatizada
                            }
                        }
                    }

                    // if (furry_check === true) {
                    //     this.client.logger.log("Imagen furry, no lo enviaré.")
                    //     await message.reply("pinche furro");

                    // } else {
                    this.client.logger.log(
                        `ENVIANDO ===> ID: ${illust.id}, Title: ${illust.title}`
                    );
                    const backup_channel = await this.client.channels.cache.get("843911307572936704");
                    const output = await pixivImg(illust["image_urls"]["large"]);
                    let image_files = [];
                    image_files.push(output);
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
                        .setURL(`https://www.pixiv.net/en/artworks/${illust.id}`)
                        .setDescription(`UID: ${illust.user.id}`)
                        .setImage(`${image}`)
                        .setAuthor({ name: `Pixiv`, iconURL: `https://cdn.discordapp.com/attachments/843911307572936704/900771085979619388/unknown.png`, url: `https://www.pixiv.net/en/` })
                        .setTimestamp();

                    embed.setFooter({ text: `ID: ${illust.id} | Pags: ${illust.page_count} | ❤️ React to fav`, iconURL: user.displayAvatarURL({ dynamic: true }) });



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
                    const meta_thumb = await pixivImg(illust.image_urls.square_medium);
                    let image_thumb_files = [];
                    image_thumb_files.push(meta_thumb);
                    const filethumb = new MessageAttachment(`./${meta_thumb}`);
                    const thumb_msg = await thumbs_channel.send({ files: [filethumb] });
                    try {
                        await add_image(this.client, illust, relateds, thumb_msg.attachments.first().url, image);
                    } catch (error) {
                        this.client.logger.error("Ocurrió un error al agregar la imagen a la BD");
                    }

                    await movefiles(image_files, image_thumb_files);
                    //}
                } else {

                    const illust_tags_bd = await get_illust_tags(this.client.pool, id);

                    let color = "BLUE";
                    let nsfw = false;

                    for (let i = 0; i < illust_tags_bd.length; i++) {
                        if (illust_tags_bd[i].tag_name === "R-18") {
                            nsfw = true;
                            color = "PURPLE";
                        }
                    }
                    if (nsfw == true) {
                        if (!message.channel.nsfw) {
                            await message.reply("Imagen nsfw, pero el canal no lo es. . .").then(msg => {
                                setTimeout(() => msg.delete(), 5000);
                            }).catch(
                                console.log("error borrando msg")
                            );
                            return;
                        }
                    }
                    let tags = ``;

                    let furry_check = false;
                    if (illust_tags_bd.length > 4) {
                        for (let k = 0; k < 3; k++) {
                            if (illust_tags_bd[k].tag_trad === null) {
                                tags = tags + `🏷️: ${illust_tags_bd[k].tag_name}\n`;
                            } else {
                                tags = tags + `🏷️: ${illust_tags_bd[k].tag_name}, 🌐: ${illust_tags_bd[k].tag_trad} \n`;
                            }
                            if (BlockedTags.tags.includes(illust_tags_bd[k].tag_name) === true) {
                                furry_check = true; //imagen privatizada
                            }
                        }
                    } else {
                        for (let k = 0; k < illust_tags_bd.length; k++) {
                            if (illust_tags_bd[k].tag_trad === null) {
                                tags = tags + `🏷️: ${illust_tags_bd[k].tag_name}\n`;
                            } else {
                                tags = tags + `🏷️: ${illust_tags_bd[k].tag_name}, 🌐: ${illust_tags_bd[k].tag_trad} \n`;
                            }
                            if (BlockedTags.tags.includes(illust_tags_bd[k].tag_name) === true) {
                                furry_check = true; //imagen privatizada
                            }
                        }
                    }
                    // if (furry_check === true) {
                    //     this.client.logger.log("Imagen furry, no lo enviaré.")
                    //     await message.reply("pinche furro");
                    // } else {
                    this.client.logger.log("La imagen ya estaba en bd, enviando. . .");

                    console.log(illustfromdb);

                    this.client.logger.log(
                        `ENVIANDO ===> ID: ${illustfromdb[0].id}, Title: ${illustfromdb[0].title}`
                    );


                    const embed = new MessageEmbed()
                        .setColor(color)
                        .setTitle(`${illustfromdb[0].title}`)
                        .setURL(`https://www.pixiv.net/en/artworks/${illustfromdb[0].id}`)
                        .setDescription(`UID: ${illustfromdb[0].authorid}`)
                        .setImage(`${illustfromdb[0].large}`)
                        .setAuthor({ name: `Pixiv`, iconURL: `https://cdn.discordapp.com/attachments/843911307572936704/900771085979619388/unknown.png`, url: `https://www.pixiv.net/en/` })
                        .setTimestamp();

                    embed.setFooter({ text: `ID: ${illustfromdb[0].id} | Pags: ${illustfromdb[0].page_count} | ❤️ React to fav`, iconURL: user.displayAvatarURL({ dynamic: true }) });



                    embed.addField(`Detalles`, `\`\`\`Titulo: ${illustfromdb[0].title} - ❤️ ${illustfromdb[0].bookmarks}\`\`\``)
                    embed.addField(`Etiquetas`, `\`\`\`${tags}\`\`\``);

                    let relateds = illustfromdb[0].rel_id;
                    if (relateds != "imagen nueva") {
                        embed.addField(`Relacionados`, `\`\`\`${relateds}\`\`\``);
                    } else {
                        try {
                            const related = await this.client.pixiv.illustRelated(illustfromdb[0].id);
                            embed.addField(`Relacionados`, `\`\`\`${related.illusts[0].id}, ${related.illusts[1].id}, ${related.illusts[2].id}\`\`\``);
                            relateds = `${related.illusts[0].id}, ${related.illusts[1].id}, ${related.illusts[2].id}`;
                            if (relateds == "imagen nueva") {
                                await updaterelateds(this.client.pool, relateds, illustfromdb[0].id);
                            }
                        } catch (err) {
                            console.log("La imagen aún es nueva, no hay relateds todavia");
                        }
                    }

                    try {
                        const msgreact = await message.reply({ embeds: [embed] })
                        // agregando imagen a favoritos
                        // react to message
                        //await msgreact.react("❤️");
                        // wait for reactions
                        const filter = (reaction, user) => {
                            return ['❤️']
                                .includes(reaction.emoji.name) && user.id === message.author.id;
                        };
                        // listen to reactions
                        const collector = msgreact.createReactionCollector(filter, { time: 30000 });
                        collector.on('collect', async (reaction, user) => {
                            console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
                            await reaction.users.remove(user);

                            const mes_res = await add_fav(this.client.pool, user.id, illustfromdb[0].id)

                            if (mes_res === false) {
                                let res = await msgreact.channel.send({ content: 'Ups... Algo salió mal... Intentalo de nuevo luego!', ephemeral: true });
                                // delete message
                                res.delete({ timeout: 3000 });
                            }

                            //await msgreact.react('❤️');
                        });
                        collector.on('end', collected => {
                            console.log(`Collected ${collected.size} items`);
                            msgreact.react("❌");
                        });
                    } catch (err) {
                        console.log(err.message);
                    }



                    //}

                }
            }
        }

        // si la imagenya estaba en bd, pero no tenia rels, actualizo los rels
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

        // obteniendo datos de la imagen
        async function pxid(client, imageid) {
            client.logger.log("Obteniendo datos iniciales. . .");
            const json_result = await client.pixiv.illustDetail(imageid);
            try {
                client.logger.log("Intentando extraer mas ilustraciones. . .");
                let additionals = await client.pixiv
                    .illustRelated(imageid)
                    .then((json) => {
                        return `${json.illusts[0].id}, ${json.illusts[1].id}, ${json.illusts[2].id}`;
                    });
                //console.log(json_result);
                client.logger.log("Exito")
                return [json_result.illust, additionals];
            } catch (error) {
                client.logger.log("No hay relateds, imagen reciente.")
                return [json_result.illust];
            }
        }
        async function movefiles(image_files, image_thumb_files) {
            const date = new Date();
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const dirname = `${year}-${month}-${day}`;

            if (!existsSync(`./images/${dirname}`)) {
                mkdirSync(`./images/${dirname}`);
                mkdirSync(`./images/${dirname}/illusts`);
                mkdirSync(`./images/${dirname}/thumbs`);
            }
            // move images to images folder
            for (let i = 0; i < image_files.length; i++) {
                //move image to ./images/daily/illusts
                await renameSync(`./${image_files[i]}`, `./images/${dirname}/illusts/${image_files[i]}`, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
            }

            for (let i = 0; i < image_thumb_files.length; i++) {
                //move image to ./images/daily/thumbs
                await renameSync(`./${image_thumb_files[i]}`, `./images/${dirname}/thumbs/${image_thumb_files[i]}`, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
            }
        }
    }
};