const Command = require("../../base/Command.js");
const pixivImg = require("pixiv-img");
const { randomHexColor } = require('random-hex-color-generator');
const { MessageAttachment, MessageEmbed } = require("discord.js");
const { add_image, check_image, check_pixiv_guild_status, get_illust_tags } = require("../../base/dbmethods.js");
const { add_fav } = require("./pixiv_fav_tools.js");
const { readdirSync, statSync, writeFileSync, readFileSync, existsSync, mkdirSync, renameSync } = require("fs");
module.exports = class PixivID extends Command {
    constructor(client) {
        super(client, {
            name: "pixivrecommended",
            description:
                "Busca algunas recomendaciones de imagenes.",
            usage:
                "pxrec",
            category: "Pixiv",
            aliases: ["pxrec"],
        });
    }
    async run(message) {
        if (await check_pixiv_guild_status(this.client.pool, message.guild.id) === false) {
            await message.reply("Pixiv no esta habilitado en este servidor.");
        } else {
            const json_result = await this.client.pixiv.illustRecommended();
            const illusts = json_result.illusts;
            const backup_channel = await this.client.channels.cache.get(
                "843911307572936704"
            );
            const thumbs_channel = await this.client.channels.cache.get(
                "901165194275852348"
            );
            const embeds = [];
            const recommendeds = [];
            const urls = [];
            let image_files = [];
            let image_thumb_files = [];
            for(let i = 0; i < 5; i++){
                console.log(`Preparando Recommended: ${illusts[i].id}`);
                let isonbd = await check_image(this.client.pool, illusts[i].id);
                if(!isonbd){
                    let image_file;
                    if (illusts[i].page_count > 1) {
                        image_file = await this.client.pixivImg(
                            illusts[i].meta_pages[0].image_urls.original
                        );
                    } else {
                        image_file = await this.client.pixivImg(
                            illusts[i].meta_single_page.original_image_url
                        );
                    }
                    let stats = statSync(image_file);

                    image_files.push(image_file);

                    var filesizemb = stats.size / (1024 * 1024);
                    console.log(`Tamaño: ${filesizemb}`);
                    let image_url;
                    if (filesizemb > 8) {
                        const response = await this.client.imgur.uploadFile(`./${image_file}`);
                        console.log(response.link);

                        image_url = response.link;
                    } else {
                        let file = new MessageAttachment(`./${image_file}`);

                        image_url = await backup_channel
                            .send({ files: [file] })
                            .then((msg) => {
                                return msg.attachments.first().url;
                            });
                    }
                    const embed = new MessageEmbed()
                        .setTitle(`Usuario: ${illusts[i].user.name}`)
                        .setURL(
                            `https://www.pixiv.net/en/artworks/${illusts[i].id}`
                        )
                        .setDescription(`UID: ${illusts[i].user.id}`)
                        .setImage(`${image_url}`)
                        .setAuthor(
                            {
                                name: `Pixiv`,
                                iconURL: `https://cdn.discordapp.com/attachments/843911307572936704/900771085979619388/unknown.png`,
                                url: `https://www.pixiv.net/en/`
                            }
                        )
                        .setTimestamp()
                        .setColor(String(randomHexColor()));

                    embed.setFooter(
                        { text: `ID: ${illusts[i].id} | Pags: ${illusts[i].page_count}, | #${i + 1}` }
                    );

                    let tags = ``;
                    if (illusts[i].tags.length > 4) {
                        for (let k = 0; k < 3; k++) {
                            if (illusts[i].tags[k].translated_name === null) {
                                tags = tags + `🏷️: ${illusts[i].tags[k].name}\n`;
                            } else {
                                tags =
                                    tags +
                                    `🏷️: ${illusts[i].tags[k].name}, 🌐: ${illusts[i].tags[k].translated_name} \n`;
                            }
                        }
                    } else {
                        for (let k = 0; k < illusts[i].tags.length; k++) {
                            if (illusts[i].tags[k].translated_name === null) {
                                tags = tags + `🏷️: ${illusts[i].tags[k].name}\n`;
                            } else {
                                tags =
                                    tags +
                                    `🏷️: ${illusts[i].tags[k].name}, 🌐: ${illusts[i].tags[k].translated_name} \n`;
                            }
                        }
                    }

                    embed.addField(
                        `Detalles`,
                        `\`\`\`Titulo: ${illusts[i].title} - ❤️ ${illusts[i].total_bookmarks} - 👁️ ${illusts[i].total_view}\`\`\``
                    );
                    embed.addField(`Etiquetas`, `\`\`\`${tags}\`\`\``);
                    recommendeds.push(illusts[i]);
                    urls.push(image_url);
                    await message.channel.send({embeds: [embed]});
                }else{
                    console.log("   Ya estaba en BD.")
                }
            }
            for(let i = 0; i < recommendeds.length; i++){
                let relateds;
                console.log("Obteniendo relacionados de: "+recommendeds[i].id);
                try{
                    relateds = await this.client.pixiv.illustRelated(recommendeds[i].id)
                        .then((result) => {
                            return [
                                result.illusts[0].id,result.illusts[1].id,result.illusts[3].id
                            ]
                        });
                }catch{
                    console.log("Error al obtener relateds de: "+recommendeds[i].id);
                    relateds = "ERROR";
                }
                console.log("   Agregando a la BD. . .")
                const illust = recommendeds[i];

                const meta_thumb = await pixivImg(illust.image_urls.square_medium);
                image_thumb_files.push(meta_thumb);
                const filethumb = new MessageAttachment(`./${meta_thumb}`);
                const thumb_msg = await thumbs_channel.send({ files: [filethumb] });
                const thumb_link = thumb_msg.attachments.first().url;
                try{
                    await add_image(this.client, illust, `${relateds}`, thumb_link, urls[i]);
                    console.log(`Agregada nueva imagen: ${recommendeds[i].id}`);
                }catch(error){
                    client.logger.error("Ocurrió un error al agregar la imagen a la BD.");
                }
                
            }
            await movefiles(image_files, image_thumb_files);
        }
        async function movefiles(image_files, image_thumb_files){
            const date = new Date();
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const dirname = `${year}-${month}-${day}`;
            
            if(!existsSync(`./images/${dirname}`)){
                mkdirSync(`./images/${dirname}`);
                mkdirSync(`./images/${dirname}/illusts`);
                mkdirSync(`./images/${dirname}/thumbs`);
            }
            // move images to images folder
            for (let i = 0; i < image_files.length; i++) {
                //move image to ./images/daily/illusts
                await renameSync(`./${image_files[i]}`, `./images/${dirname}/illusts/${image_files[i]}`, function (err){
                    if (err) {
                        console.log(err);
                    }
                });
            }
        
            for (let i = 0; i < image_thumb_files.length; i++) {
                //move image to ./images/daily/thumbs
                await renameSync(`./${image_thumb_files[i]}`, `./images/${dirname}/thumbs/${image_thumb_files[i]}`, function (err){
                    if (err) {
                        console.log(err);
                    }
                });
            }
        }
    }
}
    