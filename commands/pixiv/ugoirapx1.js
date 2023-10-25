// => 92971028 <=

const Command = require("../../base/Command.js");
const pixivImg = require("pixiv-img");
const { Parse } = require('unzipper');
const sizeOf = require('image-size');

const videoshow = require('videoshow');
const util = require('util');

const { createWriteStream, createReadStream, existsSync, mkdirSync, readdirSync} = require('fs');

module.exports = class PixivUgoira extends Command {
    constructor(client) {
        super(client, {
            name: "pixivugoira",
            description: "Muestra el ugoira de un ID como video, (metodo servidor)",
            usage: "pxug <id> :: Comprobará el tipo de canal",
            category: "Pixiv",
            aliases: ["pxug", "pxugoira"],
            permLevel: "User"
        });
    }
    async run(message) {
        const attrs = message.content.split(" ");
        //message.channel.send("A");
        try {
            // 86665621
            if (!existsSync(`./tmp/${attrs.at(-1)}`)) {
                mkdirSync(`./tmp/${attrs.at(-1)}`);
            }
            await this.client.pixiv.illustDetail(attrs.at(-1)).then(result =>{
                console.log(util.inspect(result, {depth: null}));
            });
            await this.client.pixiv.ugoiraMetaData(attrs.at(-1)).then(async result => {
                console.log(util.inspect(result, {depth: null}));
                await pixivImg(result['ugoira_metadata']['zip_urls']['medium'])
                    .then(output => {

                        const unzip = () => {
                            const stream =
                                createReadStream(`./${output}`).pipe(Parse());

                            return new Promise((resolve, reject) => {
                                stream.on('entry', (entry) => {
                                    const writeStream =
                                        createWriteStream(`./tmp/${attrs.at(-1)}/${entry.path}`);
                                    return entry.pipe(writeStream);
                                });
                                stream.on('finish', () => resolve());
                                stream.on('error', (error) => reject(error));
                            });
                        };
                        console.log(output);

                        (async () => {
                            try {
                                await unzip().then(() => console.log("extraido correctamente"));
                                await sizeOf(`./tmp/${attrs.at(-1)}/000000.jpg`, function (err, dimensions) {

                                    console.log(dimensions.width, dimensions.height);

                                    const imgFiles = readdirSync(`./tmp/${attrs.at(-1)}/`);
                                    const filespaths = [];
                                    imgFiles.forEach(file => {
                                        filespaths.push(`./tmp/${attrs.at(-1)}/${file}`);
                                    });
                                    //VIDEO

                                    var videoOptions = {
                                        fps: 25,
                                        loop: 0.07, // seconds
                                        transition: false,
                                        transitionDuration: 0, // seconds
                                        videoBitrate: 2500,
                                        videoCodec: 'libx264',
                                        size: `${dimensions.width}x${dimensions.height}`,
                                        audioBitrate: '128k',
                                        audioChannels: 1,
                                        format: 'mp4',
                                        pixelFormat: 'yuv420p'
                                    }
                                    videoshow(filespaths, videoOptions)
                                        .save('video.mp4')
                                        .on('start', function (command) {
                                          console.log('ffmpeg process started:')
                                        })
                                        .on('error', function (err, stdout, stderr) {
                                          console.error('Error:', err)
                                          console.error('ffmpeg stderr:', stderr)
                                        })
                                        .on('end', function (output) {
                                          console.error('Video created in:', output)
                                        });
                                    
                                    // FIN VIDEO

                                    // GIF

                                    // FIN GIF
                                });


                            } catch (err) {
                                console.error(err);
                            }
                        })();
                    });

            });
            //Descarga el video
            //axios({
            //    method: 'get',
            //    url: 'https://ugoira.huggy.moe/mp4_1/87469646.mp4',
            //    responseType: 'stream'
            //})
            //    .then(function (response) {
            //        response.data.pipe(fs.createWriteStream('87469646.mp4'))
            //    });
        } catch (error) {
            this.client.logger.log("El id no era de un ugoira...");
            console.log(error);
        }
    }
};