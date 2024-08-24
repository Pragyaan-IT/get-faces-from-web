'use client'
import { useEffect, useRef, useState } from 'react';

interface Face {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [name, setName] = useState<string>('');
  const [faces, setFaces] = useState<Face[]>([]);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  

  useEffect(() => {
    async function getVideo() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing the webcam', error);
      }
    }
    getVideo();
  }, []);


  const captureImage = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (canvas && video) {
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg');

        try {
          const response = await fetch('http://127.0.0.1:5000/api/capture_frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData })
          });
          const result = await response.json();

          if (response.ok) {
            setFaces(result.faces);
            setCapturedImages([...capturedImages, imageData]); // Store captured image
          } else {
            console.error('Failed to capture frame', result.error);
          }
        } catch (error) {
          console.error('Error capturing image', error);
        }
      }
    }
  };

  const saveImages = async () => {
    if (name.trim() === '') {
      alert('Please enter your name');
      return;
    }

    try {
      for (const image of capturedImages) {
        await fetch('http://127.0.0.1:5000/api/save_face', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image, name })
        });
      }
      alert('Images saved successfully!');
      setCapturedImages([]);
    } catch (error) {
      console.error('Error saving images', error);
      alert('Failed to save images');
    }
  };

  return (
    <div>
      <input 
        type="text" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Enter your name" 
      />
      <video ref={videoRef} width="640" height="480" autoPlay></video>
      <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }}></canvas>
      <button onClick={captureImage}>Capture Image</button>
      <br />
      <button onClick={saveImages}>Save Images</button>
      <div>
        {capturedImages.map((image, index) => (
          <img key={index} src={image} alt={`Captured ${index + 1}`} width="160" height="120" />
        ))}
      </div>
      <div>
        {faces.map((face, index) => (
          <div key={index} style={{ border: '1px solid red', margin: '10px', padding: '5px' }}>
            Face {index + 1}: {`Top: ${face.top}, Left: ${face.left}, Bottom: ${face.bottom}, Right: ${face.right}`}
          </div>
        ))}
      </div>
    </div>
  );
}





