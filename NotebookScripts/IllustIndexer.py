import os
import shutil
import mysql.connector

def scanner():
    # Configura la conexión a la base de datos MySQL
    db_config = {
        "host": "localhost",
        "user": "minoribot",
        "password": "ShirakamiFubuki212112",
        "database": "illusts_test"
    }
    # Directorios de origen y destino
    source_directory = "../images"
    destination_directory = "./Indexados"

    # Conecta a la base de datos
    db_connection = mysql.connector.connect(**db_config)
    db_cursor = db_connection.cursor()
    # Recorre los directorios y subdirectorios
    counter = 1
    for root, dirs, files in os.walk(source_directory):
        for file in files:
            if file.endswith("_master1200.jpg"):
                full_path = os.path.join(root, file)
                # Obtén el ID de la imagen del nombre de archivo
                image_id = file.split("_")[0]
                
                # Consulta la base de datos para obtener las etiquetas de la imagen
                query = "SELECT tag_name FROM illust_tags WHERE illust_id = %s"
                db_cursor.execute(query, (image_id,))
                result = db_cursor.fetchall()
                
                if result:
                    #print(counter, result)
                    tags = result[0]
                    if "R-18" in tags:
                        print("si")
                        destination_path = os.path.join(destination_directory, "r-18", file)
                    else:
                        print("no")
                        destination_path = os.path.join(destination_directory, "safe", file)
                    # Copia el archivo a la carpeta de destino
                    os.makedirs(os.path.dirname(destination_path), exist_ok=True)
                    shutil.copy(full_path, destination_path)
                    print(f"Copiado {full_path} a {destination_path}")
                    counter=counter+1
    # Cierra la conexión a la base de datos
    db_cursor.close()
    db_connection.close()

scanner()

