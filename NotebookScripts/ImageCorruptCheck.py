from PIL import Image
import os

def is_image_corrupted(image_path):
    try:
        img = Image.open(image_path)
        img.verify()
        return False
    except (IOError, SyntaxError):
        return True

def check_images_in_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            image_path = os.path.join(root, file)
            if is_image_corrupted(image_path):
                print(f"Imagen corrupta: {image_path}")

indexados_directory = "./test"
indexprueba_directory = "./train"

print("Verificando imágenes en Indexados:")
check_images_in_directory(indexados_directory)

print("Verificando imágenes en indexPrueba:")
check_images_in_directory(indexprueba_directory)
