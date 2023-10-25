import os
import shutil
import mysql.connector

# Configura la conexión a la base de datos MySQL
db_config = {
    "host": "localhost",
    "user": "minoribot",
    "password": "ShirakamiFubuki212112",
    "database": "illusts_test"
}

# Conecta a la base de datos
db_connection = mysql.connector.connect(**db_config)
db_cursor = db_connection.cursor()

# Ejecuta la consulta SQL
query = "SELECT illust_id, img_dir, thumb_dir FROM illust_meta WHERE img_dir LIKE '%2023-10-15%' AND thumb_dir LIKE '%2023-10-15%'"
db_cursor.execute(query)

# Crea una carpeta temporal
temp_directory = "./images/temp"
os.makedirs(temp_directory, exist_ok=True)

# Crea carpetas dentro de la carpeta temporal
temp_illusts_directory = os.path.join(temp_directory, "illusts")
temp_thumbs_directory = os.path.join(temp_directory, "thumbs")
os.makedirs(temp_illusts_directory, exist_ok=True)
os.makedirs(temp_thumbs_directory, exist_ok=True)

# Mueve las imágenes a las carpetas temporales
for (id, img_dir, thumb_dir) in db_cursor:
    img_filename = os.path.basename(img_dir)
    thumb_filename = os.path.basename(thumb_dir)
    img_source = img_dir
    thumb_source = thumb_dir
    img_destination = os.path.join(temp_illusts_directory, img_filename)
    thumb_destination = os.path.join(temp_thumbs_directory, thumb_filename)
    shutil.move(img_source, img_destination)
    shutil.move(thumb_source, thumb_destination)
    print(f"Imagen movida a la carpeta temporal: {img_filename} / {thumb_filename}")
    

# Confirma y cierra la conexión a la base de datos
db_cursor.close()
db_connection.close()