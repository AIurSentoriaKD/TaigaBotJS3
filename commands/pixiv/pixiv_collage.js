const Canvas = require('canvas')
const webp = require('webp-converter');
const Command = require("../../base/Command.js");
const { MessageAttachment } = require("discord.js");
const { check_thumb, add_image } = require("../../base/dbmethods.js");

module.exports = class PixivC extends Command {
    constructor(client) {
        super(client, {
            name: "pixivcollage",
            description:
                "Hace un bonito collage con imagenes obtenidas dependiendo del tipo de busqueda. Solo canales nsfw.",
            usage:
                "pxc <option> <id> Option, donde especificas el tipo de busqueda." +
                "\n1. uw :: (userworks) obtiene los trabajos de un artista. <id> deberá ser el id del artista." +
                "\n2. rel :: (related) obtiene imagenes relacionados a un id. <id> deberá ser el id de una ilustracion" +
                "\n3. rec :: ... " +
                "\nEjemplos: `t$pxc uw 7304883` me dará un collage con los trabajos del artista con ese id." +
                "\n`t$px rel 87073670` me dará un collage con trabajos relacionados a ese id." +
                "\n `t$px rec` ...¿estás segur@?",
            category: "Pixiv",
            aliases: ["pxc"],
        });
    }
    async run(message) {
        /**
         * PROCEDIMIENTO:
         * 1.obtener la opción y el parametro del mensaje.
         * 1.1. comprobar que todo concuerda.
         * 1.2. ver si el id solicitado ya se pidió antes.
         * 1.3. si ya estaba, enviar directamente ese collage. se salta todo :D
         * 2. obtener el result de pixiv.
         * 3. tengo array de las 9 thumbs a usar
         * 3.1. comprobar la bd,
         * 3.1.1. si la imagen no esta en la bd
         * 3.1.1.1. convertir a png.
         * 3.1.1.2. subir a discord
         * 3.1.1.3. obtener los enlaces de las imagenes.
         * 3.1.1.4. guardar a la bd.
         * 3.1.2. si ya estaba en bd
         * 3.1.2.1. obtener los enlaces de las imagenes
         * 3.1.2.2. lo siguiente esta en 4.2.
         * 4. componer el collage.
         * 4.1. si la imagen no estaba en la bd.
         * 4.1.1. si los thumbs no estaban en bd, se debe haber convertido y subido a discord
         * 4.1.2. con los enlaces obtenidos de png, componer collage en buffer y enviar
         * 4.1.3. ese buffer enviado se debe guardar en la bd con el id que se solicitó.
         * 4.2. si la imagen estaba en la bd.
         * 4.2.1. si los thumbs estaban en la bd, se debe obtener los enlaces en png de la bd
         * 4.2.2. se debe componer el collage y enviar.
         * 4.2.3. obtener el enalace de ese buffer enviado y guardar en bd.
         * 5. tomar un juguito de pera.
         */
        const attrs = message.content.split(" ");

        if (attrs.length > 3) {
            message.reply("Revisa el comando e intentalo de nuevo")
        } else {
            if (!isNaN(attrs[2])) {
                const premsg = await message.reply("Este comando suele tardar 15 segundos como minimo, paciencia!");
                switch (attrs[1]) {
                    case "uw":
                        try {
                            const illusts = await get_pixiv_result_artist(attrs[2], this.client.pixiv);

                            const data = await get_thumbs(illusts, this.client);
                            premsg.edit("Ya casi esta. . .");
                            const attachment = await create_collage(data[0]);

                            premsg.edit("Bien, aquí esta tu bonito collage. . .");
                            premsg.edit({ files: [attachment] });

                            // llamando al metodo sincrono para guardar la meta de las imagenes
                            prep_savedata(this.client.pool, data, this.client);
                        } catch (e) {
                            console.log(e);
                            premsg.edit("Comprueba el ID del usuario.");
                        }
                        break;

                    case "rel":
                        try {
                            const illusts = await get_pixiv_result(attrs[2], this.client.pixiv);

                            const data = await get_thumbs(illusts, this.client);
                            premsg.edit("Ya casi esta. . .");
                            const attachment = await create_collage(data[0]);

                            premsg.edit("Bien, aquí esta tu bonito collage. . .");
                            premsg.edit({ files: [attachment] });

                            prep_savedata(this.client.pool, data);
                        } catch (e) {
                            console.log(e);
                            premsg.edit("Comprueba el ID de la ilustración.");
                        }
                        break;
                    case "rec":

                        break;
                }
            } else {
                message.reply("Comprueba el ID e intentalo de nuevo");
            }

        }

        async function prep_savedata(pool, data, client) {
            const illusts = data[1]; // info de la imagen objeto illust y todb status
            const thumburls = data[0]; // urls de las thumbs previamente enviadas a discord
            const backup_channel = await client.channels.cache.get(
                "843911307572936704"
            );
            for (let i = 0; i < illusts.length; i++) {
                if (illusts[i].todb == true) {
                    const output = await client.pixivImg(illusts[i].illust.image_urls.large);
                    const file = new MessageAttachment(`./${output}`);
                    const msg = await backup_channel.send({ files: [file] });
                    const large_image_url = msg.attachment.first().url;
                    let relateds = '0, 0, 0';

                    try{
                        relateds = await client.pixiv.illustRelated(illusts[i].illust.id).then(res => {
                            return `${res.illusts[0].id}, ${res.illusts[1].id}, ${res.illusts[2].id}`;
                        });
                    }catch{
                        relateds = '0, 0, 0';
                    }

                    await add_image(pool, illusts[i].illust, relateds, thumburls[i], large_image_url);
                }
            }
        }
        async function get_pixiv_result(id, pixiv) {
            const result = await pixiv.illustRelated(attrs[2]);

            if (result.illusts[0] === undefined) {
                throw "No hay nada.";
            }
            return result.illusts;
        }
        async function get_pixiv_result_artist(id, pixiv) {
            const result = await pixiv.userIllusts(attrs[2]);

            if (result.illusts[0] === undefined) {
                throw "No hay nada.";
            }
            return result.illusts;
        }
        async function get_thumbs(illusts, client) {
            const thumbs = [];
            const ids = [];
            const backup_channel = await client.channels.fetch("901165194275852348");

            for (let i = 0; i < 9; i++) {
                // compruebo si el thumb esta en la bd
                let isondb = await check_thumb(client.pool, illusts[i].id);
                var todb = false;
                if (!isondb) {
                    // si no esta, descargo la thumb
                    let image_file = await client.pixivImg(illusts[i].image_urls.square_medium);
                    // convierto la imagen a png
                    try {
                        await convert_topng(image_file);
                        // console.log(image_png);
                        // defino un file con el nombre del archivo convertido
                        let file = new MessageAttachment(`./tmp/icons/${image_file}.png`);
                        // envio la imagen al canal de backups
                        let msg = await backup_channel.send({ files: [file] });
                        // obtengo el url del mensaje enviado
                        var url = msg.attachments.first().url;
                    } catch (e) {
                        console.log("Error convirtiendo, no paso este thumb: ", image_file);
                        console.log(e);
                        console.log("==========================================");
                        var url = null;
                    }
                    todb = true;
                } else {
                    //si esta, agrego su enlace al array
                    var url = isondb;
                }
                // la url obtenida la guardo en el array de thumbs
                // este 'ids' contiene la info de la illust y si se debe agregar a bd
                // si todb es true, se agregará toda la info de la imagen
                ids.push({ illust: illusts[i], todb: todb });
                thumbs.push(url);

            }
            return [thumbs, ids];
        }
        async function convert_topng(file) {
            webp.grant_permission();
            const result = await webp.dwebp(`./${file}`, `./tmp/icons/${file}.png`, "-o");
        }
        async function create_collage(images) {

            const canvas = Canvas.createCanvas(600, 600);
            const context = canvas.getContext('2d');

            let i = 0;
            for (let y = 0; y < 401; y = y + 200) {
                for (let x = 0; x < 401; x = x + 200) {
                    console.log(`Dibujando ${i} en: X: ${x} - Y: ${y}`);
                    if (images[i] != null) {
                        const thumb = await Canvas.loadImage(images[i]);
                        context.drawImage(thumb, x, y, 200, 200);
                    }

                    i++;
                }
            }
            const attachment = new MessageAttachment(canvas.toBuffer(), 'collage.png');

            return attachment;

        }
    }

}
