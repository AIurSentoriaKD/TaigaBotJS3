""" 
creador del dataset a partir de las imagenes guardadas en 
directorios y base de datos
PROCEDIMIENTO:
    1:  Obtener una tabla con los IDS y tags de TODAS las imagenes en la bases de datos
            Campos necesarios pueden ser: ID, title, numero de etiquetas, NSFW?, url de imagen de pixiv, directorio.
    2:  Comprobar si el archivo de la imagen existe.
        2.1:    Descargar la imagen nuevamente, colocarla en el directorio:
    3:  Comprobar si el archivo de la imagen no está corrupto.
        3.1:    Si existe pero está corrupto, redescargar, pero si fue descargada al comprobar si existe, omitir este paso.
    4:  Mover la imagen a una carpeta.
        4.1:    Si es nsfw, mover a r34.
        4.2:    Si es sfw, mover a safe.
    5:  Crear un archivo JSON que servirá como indíce de los datos, ahí colocar:
        5.1:    Los datos de la imagen, Id, title, tags, directorio de imagen, y directorio al cual se movió.
    6:  Crear un archivo json, ahí colocar los nombres de las carpetas que contienen las imagenes, osea las fechas, para evitar repetir esa carpeta antigua
        en el futuro.
"""
import os
import shutil
import mysql.connector
from PIL import Image
from io import BytesIO
from queue import Empty
from pixivpy_async import *
import asyncio

def conectar_base_de_datos():
    try:
    # Configura la conexión a la base de datos MySQL
        conexion = mysql.connector.connect(
            host= "localhost",
            user= "minoribot",
            password= "ShirakamiFubuki212112",
            database= "illusts_test"
        )
        if conexion.is_connected():
            print("Conexión exitosa a la base de datos")
            return conexion
    except mysql.connector.Error as e:
        print("Error al conectarse a la base de datos:", e)
        return None

def consultar_datos():
    # Conectar a la base de datos
    conexion = conectar_base_de_datos()
    if conexion is None:
        return None
    
    try:
        # Crear un cursor para ejecutar la consulta
        cursor = conexion.cursor()

        # Consulta SQL
        consulta = """
        SELECT
            i.ID,
            i.title,
            i.pixiv_link,
            COUNT(DISTINCT it.tag_name) AS tag_count,
            IF(COUNT(DISTINCT CASE WHEN it.tag_name = 'R-18' THEN it.tag_name END) > 0, TRUE, FALSE) AS nsfw,
            im.img_dir
        FROM illusts i
        LEFT JOIN illust_tags it ON i.ID = it.illust_id
        LEFT JOIN illust_meta im ON i.ID = im.illust_id
        GROUP BY i.ID;
        """

        # Ejecutar la consulta
        cursor.execute(consulta)

        # Recuperar los resultados
        resultados = cursor.fetchall()

        return resultados

    except mysql.connector.Error as e:
        print("Error al ejecutar la consulta:", e)
        return None

    finally:
        # Cerrar el cursor y la conexión
        if conexion.is_connected():
            cursor.close()
            conexion.close()

def imagen_existe(ruta):
    return os.path.exists(ruta)

def es_imagen_corrupta(imagen_path):
    try:
        with open(imagen_path, 'rb') as img_file:
            # Intenta abrir la imagen
            img = Image.open(img_file)
            img.verify()  # Intenta verificar la integridad de la imagen
            return False  # La imagen no está corrupta
    except (IOError, SyntaxError):
        return True  # La imagen está corrupta
    
async def pixiv_img_redl(img_url, filename):
    async with PixivClient() as client:
        aapi = AppPixivAPI(client=client)
        await aapi.login(refresh_token="9a5OnDP8B-ojVMTZ8ezTIuiEfYKKoqcRgG84ZHyTXZE")
        await aapi.download(img_url, name=filename)

async def main():
    # Ejemplo de uso
    print("INDEXANDO DATASET DE IMAGENES")
    datos = consultar_datos()
    if datos is not None:
        contador = 1
        for fila in datos:
            print(fila)
            print(f"Imagen # {contador}, con ID: [{fila[0]}] - Titulo: {fila[1]}") 
            print("     Comprobando estado de imagen:")
            await pixiv_img_redl(fila[2], str(fila[5].split("/")[-1]))
            break

           

asyncio.run(main())