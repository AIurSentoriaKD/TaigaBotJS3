//Method to check if an image by id, is on the db. returns true or false
async function checkimage(pool, illust_id) {
    try {
        const stmt = 'select * from illusts where id = ?';
        const illustquery = pool.query(stmt, [illust_id]);
        const illustdata = await illustquery;
        if (illustdata[0].length > 0) {
            console.log("la imagen existe");

            return illustdata[0];
        } else {
            console.log("la imagen no existe");
            return false;
        }
    } catch (err) {
        console.log("error al checkear imagen");
        console.log(err);
        return false;
    }
}

//metodo para comprobar los thumbs
async function checkthumb(pool, id) {
    try {
        const stmt = 'select thumb_link as img from illusts_thumbs where id = ?';
        const illustquery = pool.query(stmt, [id]);
        const illustdata = await illustquery;
        if (illustdata[0].length > 0) {
            console.log("la thumb existe");

            return illustdata[0];
        } else {
            console.log("la thumb no existe");
            return false;
        }
    } catch (err) {
        console.log("error al checkear thumb");
        console.log(err);
        return false;
    }
}

//method to add a new image to the db it creates hash
async function addimage(
    pool,
    id,
    title,
    related,
    bookmarks,
    image_link,
    type,
    pages,
    author_id) {
    const stmt = `insert into illusts(id, title, related, bookmarks, image_link, type, pages, author_id) values(?,?,?,?,?,?,?,?)`;
    try {
        await pool.query(stmt, [
            id,
            title,
            related,
            bookmarks,
            image_link,
            type,
            pages,
            author_id]);
        console.log("imagen nueva agregada");
    } catch (err) {
        console.log(err);
        console.log("Error al agregar a BD, o la imagen ya estaba.");
    }

}

//metodo para agregar un author a la bd
async function addauthor(pool, id, name, url) {
    const stmt = `insert into author(author_id,name,image) values(?,?,?)`;
    try {
        await pool.query(stmt, [id, name, url]);
        console.log("Nuevo author agregado");
    } catch (err) {
        console.log("Error al agregar author o ya estaba");
    }
}

//metodo para obtener los datos de un autor de la bd
async function getauthor(pool, id) {
    const stmt = `select * from author where author_id = ?`;
    try {
        const authorquery = pool.query(stmt, [id]);
        const authordata = await authorquery;
        if (authordata[0].length > 0) {
            console.log("author encontrado");
            return authordata[0];
        } else {
            console.log("author no encontrado");
            return false;
        }
    } catch (err) {
        console.log("error al obtener author");
        console.log(err);
        return false;
    }
}

//metodo para guardar las pages de una illust si las tuviera
async function save_pages(pool, id, pages) {
    const stmt = `insert into illust_pages(illust_id,page_link) values(?,?)`;
    let passes = 0;
    if (pages.length > 5) {
        passes = 5;
    } else {
        passes = pages.length;
    }

    for (let i = 0; i < passes; i++) {
        try {
            await pool.query(stmt, [id, pages[i]['image_urls']['large']]);
            console.log("page agregada");
        } catch (err) {
            console.log(err);
            console.log("Error al agregar page o ya estaba");
        }
    }
}

//metodo para añadir thumbs a la bd
async function save_thumb(pool, id, url) {
    const stmt = `insert into illust_thumbs(id,thumb_link) values(?,?)`;
    try {
        await pool.query(stmt, [id, url]);
        console.log("nueva thumb agregada");
    } catch (err) {
        console.log("Error al guardar la thumb o ya estaba.");
    }
}

//metodo para agregar tags a la tabla tags de un illust
async function addtags(pool, id, tags) {
    const stmt = `insert into illust_tags(illust_id,tag,tag_trad) values(?,?,?)`;

    for (let i = 0; i < tags.length; i++) {
        try {
            if (tags[i].translated_name != null) {
                await pool.query(stmt, [id, tags[i].name, tags[i].translated_name]);
            } else {
                await pool.query(stmt, [id, tags[i].name, '']);
            }
            console.log("tag agregado");
        } catch (err) {
            console.log(err);
            console.log("Error al agregar tag o ya estaba");
        }
    }
}

//metodo para agergar la imagen hd en la tabla illusts_metafull
async function addmetafull(pool, id, metafull) {
    const stmt = `insert into illusts_metafull(illust_id,meta_fullres) values(?,?)`;
    try {
        await pool.query(stmt, [id, metafull]);
        console.log("metafull agregado");
    } catch (err) {
        console.log("Error al agregar metafull o ya estaba");
        console.log(err);
    }
}

//method to add a webhook url for distribution of dailyranks
async function dailyranks_guild_add(conn, guildid, webhook_url) {

}

//method to remove a webhook from distribution of dailyranks
async function dailyranks_guild_remove(conn, guildid) {

}

//method to get all webhooks
async function get_dailyranks_webhooks(pool) {
    try {
        const stmt = 'select wb_url from DailyRankWebhooks';
        const hooksquery = pool.query(stmt, []);
        const hooksdata = await hooksquery;
        if (hooksdata[0].length > 0) {
            return hooksdata[0];
        } else {
            console.log("wtf, no hay hooks?");
            return false;
        }

    } catch (e) {
        console.log("error al obtener hooks");
        console.log(e);
        return false;
    }

}

//method to +1 on a search
async function searches_count(conn, search) {

}
//method to retrieve the total searches count
async function searches_view_count(conn) {

}

module.exports = {
    checkimage,
    addimage,
    dailyranks_guild_add,
    dailyranks_guild_remove,
    get_dailyranks_webhooks,
    searches_count,
    searches_view_count,
    checkthumb,
    save_thumb,
    addauthor,
    getauthor,
    addtags,
    save_pages,
    addmetafull
};