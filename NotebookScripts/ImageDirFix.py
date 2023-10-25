import os
import re
import mysql.connector
print("ola")
# Conectarse a la base de datos MySQL
db = mysql.connector.connect(
    host="localhost",
    user="minoribot",
    password="ShirakamiFubuki212112",
    database="illusts_test"
)

cursor = db.cursor()

# Ruta al directorio de imágenes
ruta_base = "./images/"
# Obtener una lista de archivos en el directorio "large" de imágenes
# Función para buscar archivos de imagen y obtener la ruta del archivo
def buscar_imagenes_y_obtener_ruta(ruta_base):
    for directorio_raiz, directorios, archivos in os.walk(ruta_base):
        for archivo in archivos:
            if re.match(r"^\d+_.*\.(jpg|png)$", archivo):
                # Obtener el ID del nombre del archivo
                match = re.search(r"^(\d+)_", archivo)
                if match:
                    illust_id = int(match.group(1))
                    ruta_completa = os.path.join(directorio_raiz, archivo)
                    print(ruta_completa)
                    ruta_completa = ruta_completa.replace("\\", "/")

                    if "illusts" in ruta_completa:
                        update_query = f"UPDATE illust_meta SET img_dir = '{ruta_completa}' WHERE illust_id = {illust_id}"
                        cursor.execute(update_query)
                        db.commit()
                    elif "thumbs" in ruta_completa:
                        update_query = f"UPDATE illust_meta SET thumb_dir = '{ruta_completa}' WHERE illust_id = {illust_id}"
                        cursor.execute(update_query)
                        db.commit()
                    

# Obtener las rutas de las imágenes del directorio
buscar_imagenes_y_obtener_ruta(ruta_base)

# Cerrar la conexión a la base de datos
cursor.close()
db.close()
