import os
import random
import shutil

source_directory = "./Indexados"  # Directorio de imágenes indexadas
destination_directory = "./indexPrueba"  # Directorio para el conjunto de prueba
test_split_percentage = 0.3  # Porcentaje de imágenes para el conjunto de prueba

os.makedirs(destination_directory, exist_ok=True)

# Recorre las categorías (r-18 y safe)
categories = ["r-18", "safe"]

for category in categories:
    category_source = os.path.join(source_directory, category)
    category_destination = os.path.join(destination_directory, category)
    
    os.makedirs(category_destination, exist_ok=True)
    
    # Obtiene la lista de imágenes en la categoría
    images = [file for file in os.listdir(category_source) if file.endswith(".jpg")]
    
    # Calcula el número de imágenes para el conjunto de prueba
    num_test_images = int(len(images) * test_split_percentage)
    
    # Selecciona aleatoriamente las imágenes para el conjunto de prueba
    test_images = random.sample(images, num_test_images)
    
    for image in test_images:
        source_path = os.path.join(category_source, image)
        destination_path = os.path.join(category_destination, image)
        
        # Mueve la imagen al directorio del conjunto de prueba
        shutil.move(source_path, destination_path)
        
        print(f"Movida a prueba: {source_path} -> {destination_path}")

print("División en conjuntos de prueba completada.")
