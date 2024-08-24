import base64
from flask import Flask, request, jsonify
import dlib
import numpy as np
import cv2
import os
from PIL import Image
import io
import logging
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Initialize the dlib face detector
detector = dlib.get_frontal_face_detector()

# Define the path for saving face images
path_photos_from_camera = "data/data_faces_from_camera/"
if not os.path.exists(path_photos_from_camera):
    os.makedirs(path_photos_from_camera)

# Define logging configuration
logging.basicConfig(level=logging.INFO)

@app.route('/api/capture_frame', methods=['POST'])
def capture_frame():
    data = request.json
    image_data = data['image']

    # Decode the base64 image data
    image_data = image_data.split(',')[1]
    image_bytes = io.BytesIO(base64.b64decode(image_data))
    image = Image.open(image_bytes)
    image = np.array(image)

    # Perform face detection
    faces = detector(image, 1)
    face_data = [{'left': d.left(), 'top': d.top(), 'right': d.right(), 'bottom': d.bottom()} for d in faces]

    return jsonify({'faces': face_data})

@app.route('/api/save_face', methods=['POST'])
def save_face():
    data = request.json
    image_data = data['image']
    name = data['name']

    # Decode the base64 image data
    image_data = image_data.split(',')[1]
    image_bytes = io.BytesIO(base64.b64decode(image_data))
    image = Image.open(image_bytes)
    image = np.array(image)

    # Create folder for the person if it does not exist
    person_folder = os.path.join(path_photos_from_camera, name)
    if not os.path.exists(person_folder):
        os.makedirs(person_folder)
        logging.info(f"Created folder: {person_folder}")
    else:
        logging.info(f"Folder already exists: {person_folder}")

    # Generate a unique filename using datetime
    now = datetime.now()
    formatted_time = now.strftime("%Y%m%d_%H%M%S")
    img_name = f"img_face_{formatted_time}.jpg"
    file_path = os.path.join(person_folder, img_name)

    # Save the image
    try:
        cv2.imwrite(file_path, cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
        logging.info(f"Saved image to: {file_path}")
        return jsonify({'message': f'Face saved as {file_path}'})
    except Exception as e:
        logging.error(f"Error saving image: {e}")
        return jsonify({'message': 'Error saving image'}), 500

if __name__ == '__main__':
    app.run(debug=True)

