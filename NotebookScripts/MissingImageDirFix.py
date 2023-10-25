import os
import requests
import mysql.connector
import time

# Directorio de destino
destination_directory = "./images/2023-10-18"
illusts_directory = os.path.join(destination_directory, "illusts")
thumbs_directory = os.path.join(destination_directory, "thumbs")

# Crea los directorios si no existen
os.makedirs(illusts_directory, exist_ok=True)
os.makedirs(thumbs_directory, exist_ok=True)

# Configura la conexión a la base de datos MySQL
db_config = {
    "host": "localhost",
    "user": "minoribot",
    "password": "ShirakamiFubuki212112",
    "database": "illusts_test"
}

# Conecta a la base de datos
db_connection = mysql.connector.connect(**db_config)
db_cursor = db_connection.cursor(buffered=True)
def download_and_update_images():

    # Consulta la tabla illust_meta
    query = "SELECT illust_id, large, thumbnail FROM illust_meta where img_dir is null"
    db_cursor.execute(query)
    result = db_cursor.fetchall()
    # Contador para contar las descargas
    download_count = 0
    for (illust_id, large_url, thumbnail_url) in result:
        if not large_url or not thumbnail_url or "no image url" in (large_url, thumbnail_url):
            print(f"URL inválida para ID: {illust_id}")
            continue
        # Descarga la imagen large
        print(download_count+1, ": --->")
        large_response = requests.get(large_url)  # Agregar un timeout
        large_filename = os.path.basename(large_url)
        large_path = os.path.join(illusts_directory, large_filename)
        with open(large_path, "wb") as large_file:
            large_file.write(large_response.content)
            print(f"    Descargada imagen: {large_url}")

        # Descarga la imagen thumbnail
        thumbnail_response = requests.get(thumbnail_url)  # Agregar un timeout
        thumbnail_filename = os.path.basename(thumbnail_url)
        thumbnail_path = os.path.join(thumbs_directory, thumbnail_filename)
        with open(thumbnail_path, "wb") as thumbnail_file:
            thumbnail_file.write(thumbnail_response.content)
            print(f"    Descargada imagen: {thumbnail_url}")

        # Actualiza la fila en la tabla illust_meta con la nueva ruta de la imagen
        update_query = "UPDATE illust_meta SET img_dir = %s, thumb_dir = %s WHERE illust_id = %s"
        new_large_url = f"./images/2023-10-18/illusts/{large_filename}"
        new_thumbnail_url = f"./images/2023-10-18/thumbs/{thumbnail_filename}"
        db_cursor.execute(update_query, (new_large_url, new_thumbnail_url, illust_id))
        db_connection.commit()
        print(f"        Actualizado registro para ID: {illust_id}")

        # Incrementa el contador de descargas
        download_count += 1

        # Agrega una pausa cada 10 descargas
        if download_count % 10 == 0:
            time.sleep(5)  # Pausa de 5 segundos
            print("-------WATING--------")


# Llama a la función para ejecutar el proceso
download_and_update_images()
# Confirma y cierra la conexión a la base de datos

db_cursor.close()
db_connection.close()