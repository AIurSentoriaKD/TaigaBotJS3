# first run:
# pip install pixivpy-async
# pip install requests
# the token will eventually expire- to get a new one follow the doc at https://gist.github.com/ZipFile/c9ebedb224406f4f11845ab700124362
# note- to see NSFW art, log into your account and edit "Viewing restriction" https://www.pixiv.net/setting_user.php

TOKEN=""
ITER_LIMIT = 10
ILLUSTRATIONS_PAGE = 30

from queue import Empty
from pixivpy_async import *
import asyncio
from os.path import exists

def calc_next_url(current_user_id, current_offset):
   return f"https://app-api.pixiv.net/v1/user/illusts?user_id={current_user_id}&filter=for_ios&type=illust&offset={current_offset}"

async def download(aapi, illust):
    # if illust["x_restrict"] == 0:
    #    print("not restricted")
    #    return
    create_date = illust["create_date"][:10].replace("-","_")
    id = illust["id"]
    artist = f"{illust['user']['id']} {illust['user']['name']} {illust['user']['account']}"
    if len(illust.get("meta_single_page", {})):
        await aapi.download(illust["meta_single_page"]["original_image_url"], name=f"{create_date}_01")
        print(f"downloaded {artist} post {id} image 1")
    elif len(illust.get("meta_pages", [])):
        for index, page in enumerate(illust["meta_pages"]):
          await aapi.download(page["image_urls"]["original"], name=f"{create_date}_{index+1:02d}")
          print(f"downloaded {artist} post {id} image {index+1}")
    else:
        print(f"{id} already downloaded")

async def gettem(aapi, artist_id, current_offset, iter=0):
    print("Next page...")
    next_url = calc_next_url(artist_id, current_offset)
    print(next_url)
    await asyncio.sleep(30) # try to not get rate limited?
    next_qs = aapi.parse_qs(next_url)
    print(next_qs)
    json_result = await aapi.user_illusts(**next_qs)
    print("next url?", json_result.next_url, json_result["next_url"])
    if len(json_result["illusts"]) == 0:
        print(f"Rate limited? Sleeping... iter: {iter} of limit {ITER_LIMIT}")
        await asyncio.sleep(10)
        if iter > ITER_LIMIT:
            raise Exception(f"nothing in illusts: {json_result}")
        iter += 1
        gettem(aapi, artist_id, current_offset - ILLUSTRATIONS_PAGE, iter)
    for illust in json_result["illusts"]:
        await download(aapi, illust)

async def main():
    artist_id = 151689
    current_user_id = 275527
    current_offset = ILLUSTRATIONS_PAGE # pages are 30 items long
    async with PixivClient() as client:
        aapi = AppPixivAPI(client=client)
        await aapi.login(refresh_token=TOKEN)
        json_result = await aapi.user_illusts(artist_id)
        # print(json_result)
        for illust in json_result["illusts"]:
            await download(aapi, illust)
        print("next url?", json_result.next_url, json_result["next_url"])
        print(json_result["next_url"])
        while True: # continue until errorsplode
            print("still true")
            await gettem(aapi, artist_id, current_offset)
            current_offset += ILLUSTRATIONS_PAGE
asyncio.run(main())