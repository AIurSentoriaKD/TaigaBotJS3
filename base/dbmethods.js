async function add_image_directory(pool, img_dir, thumb_dir, illust_id) {
  try {
    let query = `UPDATE illust_meta SET img_dir = ?, thumb_dir = ? WHERE illust_id = ?`;
    await pool.query(query, [img_dir, thumb_dir, illust_id]);
    console.log("directorios de imagen agregada");
  } catch (e) {
    console.log(e);
  }
}
//insertando ilustracion, y toda su data requerida con el procedure
async function add_image(
  client,
  illust,
  related,
  illust_meta_thumb,
  illust_meta_large
) {
  try {
    let original_image_url;
    if (illust.page_count === 1) {
      //console.log("meta_single_page");
      original_image_url = illust.meta_single_page.original_image_url;
    } else {
      //console.log("meta_pages");
      original_image_url = illust.meta_pages[0].image_urls.original;
    }
    let query = `CALL newillust_author(?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    let params = [
      illust.user.id,
      illust.user.name,
      illust.user.profile_image_urls.medium,
      illust.id,
      related,
      illust.title,
      illust.total_bookmarks,
      illust.type,
      illust.image_urls.square_medium,
      illust.image_urls.large,
      original_image_url,
      illust_meta_thumb,
      illust_meta_large,
    ];

    await client.pool.query(query, params);
    console.log("Datos de imagen y autor, agregadas correctamente");
  } catch (err) {
    console.log("Error al insertar imagen: " + err);
    return;
  }

  try {
    if (illust.page_count > 1) {
      console.log("insertando meta_pages");
      let querypages = `insert into pages(illust_id, large_link, original_link) values(?,?,?)`;
      for (let i = 1; i < illust.page_count; i++) {
        let params = [
          illust.id,
          illust.meta_pages[i].image_urls.large,
          illust.meta_pages[i].image_urls.original,
        ];
        await client.pool.query(querypages, params);
      }
    }
    console.log("Meta de imagen agregada correctamente");
  } catch (err) {
    console.log("Error al insertar imagen: " + err);
    return;
  }
  let inserted_tags = [];
  let query_errors = 0;
  try {
    console.log(`Agregando/actualizando tags basadas en -> IL(${illust.id})`);

    for (let i = 0; i < illust.tags.length; i++) {
      let tagsselect = `select count(*) from illust_tags where tag_name = ?`;

      let tagselectparams = [illust.tags[i].name];

      let resultselect = await client.pool.execute(tagsselect, tagselectparams);

      console.log(
        `El tag: "${illust.tags[i].name}", ha sido usado ${resultselect[0][0]["count(*)"]} veces.`
      );

      // si la longitud del tag es mayor a 50, no insertarlo
      if (illust.tags[i].name.length > 50) {
        // console.log(
        //   `El tag: "${illust.tags[i].name}", no se insertara porque su longitud es mayor a 50.`
        // );
      } else {
        if (resultselect[0][0]["count(*)"] === 0) {
          let tagsquery = `insert into tags(tag_name, tag_trad, count) values(?,?,?)`;
          if (illust.tags[i].translated_name === null) {
            let tagparams = [illust.tags[i].name, null, 1];
            await client.pool.query(tagsquery, tagparams);
          } else {
            let tagparams = [
              illust.tags[i].name,
              illust.tags[i].translated_name,
              1,
            ];
            await client.pool.query(tagsquery, tagparams);
          }
          console.log(`-> Tag nuevo insertado.`);
        } else {
          console.log("   -> Tag existente, actualizando count:");
          let totalcount = resultselect[0][0]["count(*)"] + 1;
          console.log(
            `       Tiene: ${resultselect[0][0]["count(*)"]} :: ${totalcount}`
          );
          let tagupdatecount = `update tags set count=? where tag_name=?`;
          let tagupdateparams = [totalcount, illust.tags[i].name];
          await client.pool.query(tagupdatecount, tagupdateparams);
          //console.log(`       Actualizado.`);
        }
        //vinculando tag con illusts
        // console.log(
        //   `Vinculando tag con ilustracion -> tag(${illust.tags[i].name})`
        // );
        let tag_illust_query = `insert into illust_tags(illust_id, tag_name) values(?,?)`;
        let tag_illust_params = [illust.id, illust.tags[i].name];
        await client.pool.query(tag_illust_query, tag_illust_params);

        // console.log(
        //   "       Asegurandome que el tag haya sido agregado correctamente:"
        // );

        // let tag_illust_query_check = `select count(*) from illust_tags where illust_id = ? and tag_name = ?`;
        // let tag_illust_params_check = [illust.id, illust.tags[i].name];
        // let result_check = await client.pool.execute(
        //   tag_illust_query_check,
        //   tag_illust_params_check
        // );
        // if (result_check[0][0]["count(*)"] === 1) {
        //   console.log(
        //     `       El tag: "${illust.tags[i].name}", ha sido insertado ${result_check[0][0]["count(*)"]} vez.\n\n`
        //   );
        //   inserted_tags.push(illust.tags[i].name);
        // } else {
        //   console.log(
        //     `       El tag: "${illust.tags[i].name}", no ha sido insertado correctamente.\n\n`
        //   );
        //   query_errors++;
        // }
      }
    }
    //console.log(query_errors);
  } catch (err) {
    console.log("Error al insertar imagen: " + err);
    return;
  }

  //   await botlogs_channel.send(
  //     `${illust.id} Tags: ${inserted_tags} insertados correctamente. ${query_errors} Errores.`
  //   );
}

//Comprobando si la imagen existe en la bd, si está, retorna su data, si no, retorna false
async function check_image(pool, illust_id) {
  try {
    let query = `call get_illust_author_and_meta(?)`;
    let params = [illust_id];
    let result = await pool.execute(query, params);
    if (result[0][0].length > 0) {
      return result[0][0];
    } else {
      return false;
    }
  } catch (err) {
    console.log("ERROR:");
    console.log(err);
  }
}

// obteniendo los tags de una imagen que se que esta en bd
async function get_illust_tags(pool, illust_id) {
  try {
    let query = "call get_illust_tags(?)";
    let params = [illust_id];
    let result = await pool.execute(query, params);
    if (result[0].length > 0) {
      return result[0][0];
    } else {
      return false;
    }
  } catch (err) {
    console.log("ERROR:");
    console.log(err);
  }
}

// metodo para retornar los webhooks de la bd
async function get_dailyranks_webhooks(pool) {
  const guild_wb_query = `select webhook_url from discord_guild where webhook_url is not null
    `;
  const guild_wb_result = await pool.execute(guild_wb_query);
  return guild_wb_result[0];
}

//metodo para comprobar el estado de pixiv de un servidor
async function check_pixiv_guild_status(pool, id) {
  const guildquery = `select * from discord_guild where id = ?`;
  const guildparams = [id];
  const guildresult = await pool.execute(guildquery, guildparams);

  console.log(guildresult[0]);
  if (guildresult[0][0].pixiv_enabled == "off") {
    return false;
  } else {
    return true;
  }
}

//metodo par acomprobar el estado premium de pixiv de un servidor
async function check_pixiv_guild_premium(pool, id) {
  const guildquery = `select * from discord_guild where id = ?`;
  const guildparams = [id];
  const guildresult = await pool.execute(guildquery, guildparams);
  console.log(guildresult[0][0]);
  if (guildresult[0][0].pixiv_premium == "off") {
    return false;
  } else {
    return true;
  }
}

// when someone adds the bot to a server
async function create_insert_from_guild(pool, id) {
  const guildquery = `insert into discord_guild(id,pixiv_enabled, premium_status, daily_status) values(?,'off','off','off')`;
  const guildparams = [id];
  await pool.query(guildquery, guildparams);
}

async function check_thumb(pool, id) {
  const thumbquery = `select thumbnail from illust_meta where illust_id = ?`;
  const thumbparams = [id];
  const thumbresult = await pool.execute(thumbquery, thumbparams);
  console.log(thumbresult[0][0]);
  if (!thumbresult[0][0]) {
    return false;
  } else {
    return thumbresult[0][0].thumbnail;
  }
}

//method to get the author pic from pixiv
async function get_author_pic(pool, author_id) {
  const authorquery = `select profile_link from author where authorid = ?`;
  const authorparams = [author_id];
  const authorresult = await pool.promise().query(authorquery, authorparams);
  console.log(authorresult[0][0]);
  if (!authorresult[0][0]) {
    return false;
  } else return authorresult[0][0].profile_link;
}

module.exports = {
  add_image_directory,
  add_image,
  check_image,
  get_dailyranks_webhooks,
  check_pixiv_guild_status,
  check_pixiv_guild_premium,
  create_insert_from_guild,
  get_illust_tags,
  check_thumb,
  get_author_pic,
};
