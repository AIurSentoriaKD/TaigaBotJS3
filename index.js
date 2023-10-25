// This will check if the node version you are running is the required
// Node version, if it isn't it will throw the following error to inform
// you.
if (Number(process.version.slice(1).split(".")[0]) < 16)
    throw new Error(
        "Node 16.x or higher is required. Update Node on your system."
    );

// Load up the discord.js library
const {
    Client,
    Collection,
    MessageAttachment,
    WebhookClient,
    MessageEmbed,
} = require("discord.js");
// We also load the rest of the things we need in this file:
const { readdirSync, statSync, writeFileSync, readFileSync, existsSync, mkdirSync, renameSync } = require("fs");
const config = require("./config.js");
const { randomHexColor } = require('random-hex-color-generator');
const Enmap = require("enmap");
const path = require("path");
const PixivApi = require("pixiv-api-client");
const mysql = require("mysql2/promise");
//const sqlite3 = require('sqlite3');
const pixivImg = require("pixiv-img");
const bluebird = require('bluebird');

//const { ImgurClient } = require('imgur');

const imgur = require("imgur");

const { add_image, get_dailyranks_webhooks, check_image } = require("./base/dbmethods.js");

class GuideBot extends Client {
    constructor(options) {
        super(options);

        // Here we load the config.js file that contains our token and our prefix values.
        this.config = config;
        // client.config.token contains the bot's token
        // client.config.prefix contains the message prefix

        // Aliases, commands and slash commands are put in collections where they can be read from,!
        // catalogued, listed, etc.
        this.commands = new Collection();
        this.aliases = new Collection();
        this.slashcmds = new Collection();
        this.pixiv = new PixivApi();
        this.pixivImg = pixivImg;
        this.owners = new Array();

        this.lastIllustID = null;
        this.dailies_last_date = null;
        this.imgur = imgur;

        // Now we integrate the use of Evie's awesome Enhanced Map module, which
        // essentially saves a collection to disk. This is great for per-server configs,
        // and makes things extremely easy for this purpose.
        this.settings = new Enmap({ name: "settings" });

        // requiring the Logger class for easy console logging
        this.logger = require("./util/logger.js");

        // Basically just an async shortcut to using a setTimeout. Nothing fancy!
        this.wait = require("util").promisify(setTimeout);

        this.pool = null;
    }
    getlastillustid() {
        return this.lastIllustID;
    }
    setlastillustid(id) {
        this.lastIllustID = id;
    }
    getdailies_last_date() {
        return this.dailies_last_date;
    }
    setdailies_last_date(date) {
        this.dailies_last_date = date;
    }
    /*
        PERMISSION LEVEL FUNCTION
      
        This is a very basic permission system for commands which uses "levels"
        "spaces" are intentionally left black so you can add them if you want.
        NEVER GIVE ANYONE BUT OWNER THE LEVEL 10! By default this can run any
        command including the VERY DANGEROUS `eval` command!
      
        */
    permlevel(message) {
        let permlvl = 0;

        const permOrder = this.config.permLevels
            .slice(0)
            .sort((p, c) => (p.level < c.level ? 1 : -1));

        while (permOrder.length) {
            const currentLevel = permOrder.shift();
            if (message.guild && currentLevel.guildOnly) continue;
            if (currentLevel.check(message)) {
                permlvl = currentLevel.level;
                break;
            }
        }
        return permlvl;
    }

    /* 
        COMMAND LOAD AND UNLOAD
        
        To simplify the loading and unloading of commands from multiple locations
        including the index.js load loop, and the reload function, these 2 ensure
        that unloading happens in a consistent manner across the board.
        */

    loadCommand(commandPath, commandName) {
        try {
            const props = new (require(commandPath))(this);
            props.conf.location = commandPath;
            if (props.init) {
                props.init(this);
            }

            this.commands.set(props.help.name, props);
            props.conf.aliases.forEach((alias) => {
                this.aliases.set(alias, props.help.name);
            });
            return false;
        } catch (e) {
            return `Unable to load command ${commandName}: ${e}`;
        }
    }

    async unloadCommand(commandPath, commandName) {
        let command;
        if (this.commands.has(commandName)) {
            command = this.commands.get(commandName);
        } else if (this.aliases.has(commandName)) {
            command = this.commands.get(this.aliases.get(commandName));
        }
        if (!command)
            return `The command \`${commandName}\` doesn't seem to exist, nor is it an alias. Try again!`;

        if (command.shutdown) {
            await command.shutdown(this);
        }
        delete require.cache[require.resolve(commandPath)];
        return false;
    }

    /*
        MESSAGE CLEAN FUNCTION
        "Clean" removes @everyone pings, as well as tokens, and makes code blocks
        escaped so they're shown more easily. As a bonus it resolves promises
        and stringifies objects!
        This is mostly only used by the Eval and Exec commands.
        */
    async clean(text) {
        if (text && text.constructor.name == "Promise") text = await text;
        if (typeof text !== "string")
            text = require("util").inspect(text, { depth: 1 });

        text = text
            .replace(/`/g, "`" + String.fromCharCode(8203))
            .replace(/@/g, "@" + String.fromCharCode(8203));

        text = this.replaceAll(text, config.token, "[REDACTED]");

        return text;
    }

    /**
        This function will take an input string, split it
        at the needle, and replace it with the supplied string.
        */

    replaceAll(haystack, needle, replacement) {
        return haystack.split(needle).join(replacement);
    }

    /* SETTINGS FUNCTIONS
        These functions are used by any and all location in the bot that wants to either
        read the current *complete* guild settings (default + overrides, merged) or that
        wants to change settings for a specific guild.
        */

    // getSettings merges the client defaults with the guild settings. guild settings in
    // enmap should only have *unique* overrides that are different from defaults.
    getSettings(guild) {
        const defaults = this.settings.get("default") || {};
        const guildData = guild ? this.settings.get(guild.id) || {} : {};
        const returnObject = {};
        Object.keys(defaults).forEach((key) => {
            returnObject[key] = guildData[key] ? guildData[key] : defaults[key];
        });
        return returnObject;
    }

    // writeSettings overrides, or adds, any configuration item that is different
    // than the defaults. This ensures less storage wasted and to detect overrides.
    writeSettings(id, newSettings) {
        const defaults = this.settings.get("default");
        let settings = this.settings.get(id);
        if (typeof settings != "object") settings = {};
        for (const key in newSettings) {
            if (defaults[key] !== newSettings[key]) {
                settings[key] = newSettings[key];
            } else {
                delete settings[key];
            }
        }
        this.settings.set(id, settings);
    }

    // Daily pixiv ranks task

    /*
        SINGLE-LINE AWAIT MESSAGE
        A simple way to grab a single reply, from the user that initiated
        the command. Useful to get "precisions" on certain things...
        USAGE
        const response = await client.awaitReply(msg, "Favourite Color?");
        msg.reply(`Oh, I really love ${response} too!`);
        */
    async awaitReply(msg, question, limit = 60000) {
        const filter = (m) => m.author.id === msg.author.id;
        await msg.channel.send(question);
        try {
            const collected = await msg.channel.awaitMessages({
                filter,
                max: 1,
                time: limit,
                errors: ["time"],
            });
            return collected.first().content;
        } catch (e) {
            return false;
        }
    }
}

// Default Intents the bot needs.
// By default GuideBot needs Guilds, Guild Messages and Direct Messages to work.
// For join messages to work you need Guild Members, which is privileged and requires extra setup.
// For more info about intents see the README.

// This is your client. Some people call it `bot`, some people call it `self`,
// some might call it `cootchie`. Either way, when you see `client.something`,
// or `bot.something`, this is what we're referring to. Your client.
const client = new GuideBot({
    intents: config.intents,
    partials: config.partials,
});

// We're doing real fancy node 8 async/await stuff here, and to do that
// we need to wrap stuff in an anonymous function. It's annoying but it works.

const init = async () => {
    // Let's load the slash commands, we're using a recursive method so you can have
    // folders within folders, within folders, within folders, etc and so on.
    function getSlashCommands(dir) {
        const slashFiles = readdirSync(dir);
        for (const file of slashFiles) {
            const loc = path.resolve(dir, file);
            const stats = statSync(loc);
            if (stats.isDirectory()) {
                getSlashCommands(path.resolve(dir, file));
            } else {
                const command = new (require(loc))(client);
                const commandName = file.split(".")[0];
                client.logger.log(`Loading Slash command: ${commandName}. 👌`, "log");
                client.slashcmds.set(command.commandData.name, command);
            }
        }
    }

    // Here we load **commands** into memory, as a collection, so they're accessible
    // here and everywhere else, and like the slash commands, sub-folders for days!
    function getCommands(dir) {
        const cmdFile = readdirSync(dir);
        for (const file of cmdFile) {
            const loc = path.resolve(dir, file);
            const stats = statSync(loc);
            if (stats.isDirectory()) {
                getCommands(path.resolve(dir, file));
            } else {
                const commandName = file.split(".")[0];
                client.logger.log(`Loading command: ${commandName}. 👌`, "log");
                client.loadCommand(loc, commandName);
            }
        }
    }
    async function initpixiv() {
        await client.pixiv
            .refreshAccessToken(client.config.pixiv_token)
            .then(client.logger.log("Refrescado con exito", "log"))
            .catch((err) => {
                client.logger.log(`Error pixivapi ${err}`, "log");
            });
    }

    // Now let's call the functions to actually load up the commands!
    getCommands("./commands");
    getSlashCommands("./slash");
    setInterval(initpixiv, 60 * 60 * 1000);

    // Then we load events, which will include our message and ready event.
    const eventFiles = readdirSync("./events/").filter((file) =>
        file.endsWith(".js")
    );
    for (const file of eventFiles) {
        const eventName = file.split(".")[0];
        client.logger.log(`Loading Event: ${eventName}. 👌`, "log");
        const event = new (require(`./events/${file}`))(client);

        // This line is awesome by the way. Just sayin'.
        client.on(eventName, (...args) => event.run(...args));
        delete require.cache[require.resolve(`./events/${file}`)];
    }

    client.levelCache = {};
    for (let i = 0; i < client.config.permLevels.length; i++) {
        const thisLevel = client.config.permLevels[i];
        client.levelCache[thisLevel.name] = thisLevel.level;
    }

    //mysql conn
    const createTcpPool = async (config) => {
        // Extract host and port from socket address
        const dbSocketAddr = client.config.dbhost.split(":");

        // Establish a connection to the database
        return await mysql.createPool({
            user: client.config.username, // e.g. 'my-db-user'
            password: client.config.passwordb, // e.g. 'my-db-password'
            database: client.config.database, // e.g. 'my-database'
            host: dbSocketAddr[0], // e.g. '127.0.0.1'
            port: dbSocketAddr[1], // e.g. '3306'
            socketPath: "", // e.g. '/var/run/mysqld/mysqld.sock'
        });
    };

    const createPoolAnd = async () =>
        await createTcpPool()
            .then(
                client.logger.log("Conexión exitosa")
            )
            .catch((err) => {
                client.logger.log(err);

            });

    client.pool = await createPoolAnd();


    //client.imgur = new ImgurClient({accessToken: client.config.imgurtoken});

    client.imgur.setClientId(client.config.clientimgur);
    client.imgur.setCredentials(
        client.config.emailimgur,
        client.config.passimgur,
        client.config.clientimgur
    );
    client.imgur.setAccessToken(client.config.imgurtoken);
    client.imgur.setAPIUrl("https://api.imgur.com/3/");

    await initpixiv();

    // Here we login the client.
    await client.login(client.config.token);
    await client.wait(5000);

    let last_id = await JSON.parse(readFileSync('./data/last_id.json'));
    client.lastIllustID = last_id.last_illustid;
    client.dailies_last_date = last_id.dailies_last_date;
	
	await dailypixiv();

    await myfollows();

	setInterval(myfollows, 30 * 60 * 1000); // comprueba follows cada 30 min
    setInterval(dailypixiv, 48 * 60 * 60 * 1000); // comprueba dailies cada 48 horas
    // End top-level async/await function.
};

init();

async function dailypixiv() {
    let today = new Date();
    let previus_date = new Date(client.dailies_last_date);

    if (client.getdailies_last_date() === null || client.getdailies_last_date() === undefined) {
        // funciona solo al primer inicio
        client.dailies_last_date = String(today).split(" GMT+0000 ")[0];
    }
    // To calculate the time difference of two dates
    var Difference_In_Time = today.getTime() - previus_date.getTime();

    // To calculate the no. of days between two dates
    var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);

    if (Difference_In_Days > 1) {
        client.setdailies_last_date(String(today).split(" GMT+0000 ")[0]);
        client.logger.log(`Fecha de daily ${today}`);

        const webhooks = await get_dailyranks_webhooks(client.pool);
        if (webhooks != false) {
            console.log(`Enviendo Dailies a ${webhooks.length} servidores...`);
            const result = await client.pixiv.illustRanking();
            const illusts = result.illusts;
            const backup_channel = await client.channels.cache.get(
                "843911307572936704"
            );
            const thumbs_channel = await client.channels.cache.get(
                "901165194275852348"
            );
            const embeds = [];

            const dailies = [];
            const urls = [];

            let image_files = [];
            let image_thumb_files = [];

            for (let i = 0; i < 5; i++) {
                console.log(`Preparando: ${illusts[i].id}`);

                // si la imagen ya estaba en la bd, no lo enviará, entonces pasa al siguiente.
                let isonbd = await check_image(client.pool, illusts[i].id);
                if (isonbd === false) {

                    let image_file;
                    if (illusts[i].page_count > 1) {
                        image_file = await client.pixivImg(
                            illusts[i].meta_pages[0].image_urls.original
                        );
                    } else {
                        image_file = await client.pixivImg(
                            illusts[i].meta_single_page.original_image_url
                        );
                    }
                    let stats = statSync(image_file);

                    image_files.push(image_file);

                    var filesizemb = stats.size / (1024 * 1024);
                    console.log(`Tamaño: ${filesizemb}`);
                    let image_url;
                    if (filesizemb > 8) {
                        const response = await client.imgur.uploadFile(`./${image_file}`);
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

                    embeds.push(embed);
                    dailies.push(illusts[i]);
                    urls.push(image_url);
                }


            }

            for (let i = 0; i < webhooks.length; i++) {
                console.log(webhooks[i]["webhook_url"]);
                const paraurl = webhooks[i]["webhook_url"].split("/");
                const token = paraurl[paraurl.length - 1];
                const id = paraurl[paraurl.length - 2];
                const webhookClient = new WebhookClient({ id: id, token: token });
                for (let u = 0; u < dailies.length; u++) {
                    webhookClient.send({ embeds: [embeds[u]] });
                }
            }

            for (let i = 0; i < dailies.length; i++) {
                let relateds;
                try {
                    relateds = await client.pixiv
                        .illustRelated(dailies[i].id)
                        .then((result) => {
                            return [
                                result.illusts[0].id,
                                result.illusts[1].id,
                                result.illusts[2].id,
                            ];
                        });
                } catch {
                    console.log("Esta illust por alguna razon no tenia rels");
                    relateds = "Esperando relacionados";
                }
                const illust = dailies[i];

                const meta_thumb = await pixivImg(illust.image_urls.square_medium);
                image_thumb_files.push(meta_thumb);
                const filethumb = new MessageAttachment(`./${meta_thumb}`);
                const thumb_msg = await thumbs_channel.send({ files: [filethumb] });
                const thumb_link = thumb_msg.attachments.first().url;
                try{
                    await add_image(client, illust, `${relateds}`, thumb_link, urls[i]);
                    console.log(`Agregada nueva imagen: ${dailies[i].id}`);
                }catch(error){
                    client.logger.error("Ocurrió un error al agregar la imagen a la BD.");
                }
            }

            await movefiles(image_files, image_thumb_files);
        }
    }
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

async function myfollows() {
    await client.pixiv
        .illustFollow()
        .then(async (result) => {
            const illusts = result.illusts;
            //console.log(result);
            //console.log(illusts.length);

            // 934989228838912040 - ID del canal de imagenes privadas

            if (client.getlastillustid() === null) {
                client.setlastillustid(illusts[0]["id"]);
                client.logger.log(
                    `Ultimo ID de ilustracion establecido a: ${client.getlastillustid()}`
                );
            } else {
                let newfollows = [];
                for (let i = 0; i < illusts.length; i++) {
                    if (illusts[i]["id"] === parseInt(client.getlastillustid())) {
                        break;
                    } else {
                        //console.log(illusts[i]["id"]);
                        newfollows.push(illusts[i]);
                    }
                }

                if (newfollows.length === 30) {
                    const json2 = await client.pixiv.requestUrl(result.next_url);
                    const illusts2 = json2.illusts;
                    for (let i = 0; i < illusts2.length; i++) {
                        if (illusts2[i]["id"] === parseInt(client.getlastillustid())) {
                            break;
                        } else {
                            //console.log(illusts2[i]["id"]);
                            newfollows.push(illusts2[i]);
                        }
                    }
                }
                if (newfollows.length === 60){
                    const json3 = await client.pixiv.requestUrl(result.next_url);
                    const illusts3 = json3.illusts;
                    for (let i = 0; i < illusts3.length; i++) {
                        if (illusts3[i]["id"] === parseInt(client.getlastillustid())) {
                            break;
                        } else {
                            //console.log(illusts2[i]["id"]);
                            newfollows.push(illusts3[i]);
                        }
                    }
                }
                if (newfollows.length === 90){
                    const json4 = await client.pixiv.requestUrl(result.next_url);
                    const illusts4 = json4.illusts;
                    for (let i = 0; i < illusts4.length; i++) {
                        if (illusts4[i]["id"] === parseInt(client.getlastillustid())) {
                            break;
                        } else {
                            //console.log(illusts2[i]["id"]);
                            newfollows.push(illusts4[i]);
                        }
                    }
                }

                console.log(`Nuevas ilustraciones: ${newfollows.length}`);

                if (newfollows.length != 0) {
                    client.setlastillustid(newfollows[0]["id"]);
                    try {

                        const backup_channel = await client.channels.cache.get(
                            "843911307572936704"
                        );
                        const thumbs_channel = await client.channels.cache.get(
                            "901165194275852348"
                        );
                        const send_follows_channel = await client.channels.cache.get(
                            "899771384824225842"
                        );
                        const priv_follows_channel = await client.channels.cache.get(
                            "934989228838912040"
                        );

                        // cargando json BlockedTags.json
                        const BlockedTags = await JSON.parse(readFileSync('./data/BlockedTags.json', 'utf8'));

                        let image_files = [];
                        let image_thumb_files = [];

                        for (let i = 0; i < newfollows.length; i++) {
                            let illust = newfollows[i];

                            // comprobando que la imagen sea nueva, a razon de que a veces el bot repite las imagenes
                            let isonbd = await check_image(client.pool, illust.id);
                            if (isonbd === false) {
                                client.logger.log(
                                    `ENVIANDO ===> ID: ${illust.id}, Title: ${illust.title}`
                                );

                                // comprueba si el tag es uno de los rechazados
                                let blocked = false; // variable para rechazar o aceptar

                                for (let p = 0; p < illust["tags"].length; p++) {
                                    if (BlockedTags.reject_tags.includes(illust["tags"][p]["name"]) === true) {
                                        blocked = true;
                                        break;
                                    }
                                }
                                if (blocked === true) {
                                    await send_follows_channel.send(`\`\`\`${illust.id} - ${illust.title} - ${illust.tags[0]["name"]} :: R18G\`\`\``);
                                    continue;
                                } else {

                                    var color = "BLUE";
                                    var isnsfw = false;

                                    for (let i = 0; i < illust["tags"].length; i++) {
                                        if (illust["tags"][i]["name"] === "R-18") {
                                            var color = "PURPLE";
                                            isnsfw = true;
                                        }
                                    }

                                    const output = await pixivImg(illust["image_urls"]["large"]);
                                    const file = new MessageAttachment(`./${output}`);
                                    const msg = await backup_channel.send({ files: [file] });
                                    const image = msg.attachments.first().url;
                                    
                                    image_files.push(output);

                                    const embed = new MessageEmbed()
                                        .setColor(color)
                                        .setTitle(`${illust.user.name}`)
                                        .setURL(
                                            `https://www.pixiv.net/en/users/${illust.user.id}/illustrations`
                                        )
                                        .setDescription(`UID: ${illust.user.id}`)
                                        .setImage(`${image}`)
                                        .setAuthor(
                                            {
                                                name: `Pixiv`,
                                                iconUrl: `https://cdn.discordapp.com/attachments/843911307572936704/900771085979619388/unknown.png`,
                                                url: `https://www.pixiv.net/en/`
                                            }
                                        )
                                        .setTimestamp();
                                    embed.setFooter({ text: `ID: ${illust.id} | Pags: ${illust.page_count}` });

                                    let tags = ``;

                                    let furry_check = false;



                                    if (illust.tags.length > 4) {
                                        for (let k = 0; k < 3; k++) {
                                            if (illust.tags[k].translated_name === null) {
                                                tags = tags + `🏷️: ${illust.tags[k].name}\n`;
                                            } else {
                                                tags =
                                                    tags +
                                                    `🏷️: ${illust.tags[k].name}, 🌐: ${illust.tags[k].translated_name} \n`;
                                            }

                                            // comprobando si la illust tiene tags bloqueados


                                            // for (let i = 0; i < BlockedTags.tags.length; i++) {
                                            //     if (BlockedTags.tags[i] === illust.tags[k].name) {
                                            //         furry_check = true; //imagen privatizada
                                            //     }

                                            // }

                                            if (BlockedTags.tags.includes(illust.tags[k].name) === true) {
                                                furry_check = true; //imagen privatizada
                                            }
                                        }
                                    } else {
                                        for (let k = 0; k < illust.tags.length; k++) {
                                            if (illust.tags[k].translated_name === null) {
                                                tags = tags + `🏷️: ${illust.tags[k].name}\n`;
                                            } else {
                                                tags =
                                                    tags +
                                                    `🏷️: ${illust.tags[k].name}, 🌐: ${illust.tags[k].translated_name} \n`;
                                            }

                                            // comprobando si la illust tiene tags bloqueados
                                            // for (let i = 0; i < BlockedTags.tags.length; i++) {
                                            //     if (BlockedTags.tags[i] === illust.tags[k].name) {
                                            //         furry_check = true; //imagen privatizada
                                            //     }
                                            // }
                                            if (BlockedTags.tags.includes(illust.tags[k].name) === true) {
                                                furry_check = true; //imagen privatizada
                                            }
                                        }
                                    }

                                    let private_artist = false;
                                    // comprobando si el id del artista esta privatizado
                                    if (BlockedTags.private_artists.includes(illust.user.id) === true) {
                                        private_artist = true;
                                    }

                                    embed.addField(
                                        `Detalles`,
                                        `\`\`\`Titulo: ${illust.title} - ❤️ ${illust.total_bookmarks} - 👁️ ${illust.total_view}\`\`\``
                                    );
                                    embed.addField(`Etiquetas`, `\`\`\`${tags}\`\`\``);


                                    if (furry_check === true || private_artist === true)
                                        await priv_follows_channel.send({ embeds: [embed] });
                                    else
                                        await send_follows_channel.send({ embeds: [embed] });

                                    // obteniendo miniatura y guardando datos a la bd

                                    let relateds = "imagen nueva";
                                    const meta_thumb = await pixivImg(
                                        illust.image_urls.square_medium
                                    );

                                    const filethumb = new MessageAttachment(`./${meta_thumb}`);
                                    const thumb_msg = await thumbs_channel.send({
                                        files: [filethumb],
                                    });

                                    image_thumb_files.push(meta_thumb);

                                    await add_image(client, illust, relateds, thumb_msg.attachments.first().url, image);

                                    
                                    if(i % 5 == 0)
                                        await client.wait(10000);
                                    else
                                        await client.wait(5000);
                                }
                            }
                        }

                        await movefiles(image_files, image_thumb_files);

                        //Actualizando el last_id 
                        let data = { last_illustid: client.getlastillustid(), dailies_last_date: client.getdailies_last_date() };
                        console.log(data);
                        let tojson = JSON.stringify(data, null, 2);

                        writeFileSync("./data/last_id.json", tojson);

                    } catch (error) {
                        client.logger.error(error);
                    }
                } else {
                    client.logger.log("No new follows. . .");
                }
            }
        })
        .catch(console.error);
}

client
    .on("disconnect", () => client.logger.warn("Bot is disconnecting..."))
    .on("reconnecting", () => client.logger.log("Bot reconnecting...", "log"))
    .on("error", (e) => client.logger.error(e))
    .on("warn", (info) => client.logger.warn(info));

/* MISCELLANEOUS NON-CRITICAL FUNCTIONS */

// EXTENDING NATIVE TYPES IS BAD PRACTICE. Why? Because if JavaScript adds this
// later, this conflicts with native code. Also, if some other lib you use does
// this, a conflict also occurs. KNOWING THIS however, the following methods
// are, we feel, very useful in code. So let's just Carpe Diem.

// <String>.toProperCase() returns a proper-cased string such as:
// "Mary had a little lamb".toProperCase() returns "Mary Had A Little Lamb"
String.prototype.toProperCase = function () {
    return this.replace(/([^\W_]+[^\s-]*) */g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};
// <Array>.random() returns a single random element from an array
// [1, 2, 3, 4, 5].random() can return 1, 2, 3, 4 or 5.
Array.prototype.random = function () {
    return this[Math.floor(Math.random() * this.length)];
};

// These 2 process methods will catch exceptions and give *more details* about the error and stack trace.
process.on("uncaughtException", (err) => {
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
    console.error("Uncaught Exception: ", errorMsg);
    // Always best practice to let the code crash on uncaught exceptions.
    // Because you should be catching them anyway.
    process.exit(1);
});

process.on("unhandledRejection", (err) => {
    console.error("Uncaught Promise Error: ", err);
});

process.on("SIGINT", async function () {
    client.logger.warn("Desconectando...\n");
    client.logger.warn("Guardando ultimo id de illust...\n");

    let data = { last_illustid: client.getlastillustid(), dailies_last_date: client.getdailies_last_date() };
    console.log(data);
    let tojson = JSON.stringify(data, null, 2);

    writeFileSync("./data/last_id.json", tojson);

    process.exit();
});
