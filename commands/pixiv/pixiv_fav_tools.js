// agregar un usuario a la bd
async function add_user(pool, user_id) {
    const querynew = `INSERT INTO discord_user (id, premium_status) VALUES (?,?)`;
    const valuenew = [user_id, 'off'];
    try {
        await pool.query(querynew, valuenew);
        console.log(`${user_id} agregado a la bd`);
        return true;
    } catch (e) {
        console.log('Hubo un error al agregar usuario a bd -> ' + e);
        return false;
    }
}
// comprobar si el usuario está en bd
async function user_status(pool, user_id) {
    const query = `SELECT * FROM discord_user WHERE id = ?`;
    const values = [user_id];
    try {
        const result = await pool.query(query, values);
        if (result[0][0] === undefined) {
            // retorna false si no esta, pero lo agregamos a la bd
            await add_user(pool, user_id);
            return false;
        } else {
            //retorna true si esta
            return true;
        }
    } catch (sql_error) {
        console.log('Hubo un error al comprobar el estado de usuario -> ' + sql_error);
        return 'error';
    }
}

// agregar una illust a favoritos de un user
async function add_fav(pool, user_id, illust_id) {
    const query = 'insert into duser_favs (illust_id, duser_id) values (?,?)';
    const values = [illust_id, user_id];
    try {
        // comprobar que la illust no este en sus favoritos anteriormente
        await user_status(pool, user_id);
        if (await check_fav(pool, user_id, illust_id) === false) {
            await pool.query(query, values);
            console.log(`${illust_id} agregado a los favoritos de ${user_id} `);
            return true;
        } else {
            console.log(`${illust_id} ya estaba en los favoritos de ${user_id} `);
            return 'Ya estaba en favoritos';
        }
    } catch (e) {
        console.log('Hubo un error al agregar a favoritos -> ' + e);
        return false;
    }
}

// quitar un favorito
async function remove_fav(pool, user_id, illust_id) {
    const query = 'delete from duser_favs where duser_id = ? and illust_id = ?';
    const values = [user_id, illust_id];
    try {
        await pool.query(query, values);
        console.log(`${illust_id} eliminado de favoritos de ${user_id}`);
        return true;
    } catch (e) {
        console.log('Hubo un error al eliminar de favoritos -> ' + e);
        return false;
    }
}
// comprobar un fav
async function check_fav(pool, user_id, illust_id) {
    const query = 'select * from duser_favs where duser_id = ? and illust_id = ?';
    const values = [user_id, illust_id];
    try {
        const result = await pool.query(query, values);
        if (result[0][0] === undefined) {
            return false;
        } else {
            return true;
        }
    } catch (e) {
        console.log('Hubo un error al comprobar favoritos -> ' + e);
        return false;
    }
}

// generar lista de favoritos
async function get_favs(pool, user_id) {
    const query = 'select * from duser_favs where duser_id = ?';
    const values = [user_id];
    try {
        const result = await pool.query(query, values);
        return result[0];
    } catch (e) {
        console.log('Hubo un error al obtener favoritos -> ' + e);
        return false;
    }
}

// generar lista de etiquetas


/*
    agregar usuarios a la bd
    comprobar que un usuario esta en bd
    agregar un favorito
    quitar un favorito
    generar lista de favoritos
    generar lista de etiquetas

    --- comprobar estado premium

*/

module.exports = {
    add_user,
    user_status,
    add_fav,
    remove_fav,
    get_favs
}