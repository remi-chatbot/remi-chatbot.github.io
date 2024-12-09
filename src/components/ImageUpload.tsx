import React, { useRef, useState, useEffect } from 'react';
import { Paperclip, X } from 'react-feather';

interface ImageUploadProps {
  onImageUpload: (imageDataUrl: string) => void;
  isProcessing?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload, isProcessing }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (isProcessing) {
            clearPreview();
        }
    }, [isProcessing]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (PNG, JPG, GIF)');
            return;
        }

        // Validate file size (e.g., max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB');
            return;
        }

        // Convert to base64 and show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                setPreview(reader.result);
                onImageUpload(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const clearPreview = () => {
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onImageUpload(''); // Clear the pending image in parent component
    };

    return (
        <div className="upload-wrapper">
            {preview ? (
                <div className="preview-container">
                    <img 
                        src={preview} 
                        alt="Upload preview" 
                        className="preview-image"
                    />
                    <button
                        type="button"
                        className="clear-preview"
                        onClick={clearPreview}
                        title="Clear image"
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <button 
                    type="button" 
                    className="action-button upload-button"
                    title="Upload image"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Paperclip size={20} />
                </button>
            )}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
            />

            <style>{`
                .upload-wrapper {
                    position: relative;
                    display: inline-block;
                }

                .preview-container {
                    position: relative;
                    display: inline-block;
                }

                .preview-image {
                    max-width: 100px;
                    max-height: 100px;
                    border-radius: 8px;
                    object-fit: cover;
                    cursor: pointer;
                }

                .clear-preview {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    background: #ff4444;
                    border: none;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: white;
                    padding: 0;
                }

                .clear-preview:hover {
                    background: #ff0000;
                }

                .action-button {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    padding: 8px;
                    color: #666;
                    transition: color 0.2s;
                }

                .action-button:hover {
                    color: #0099ff;
                }
            `}</style>
        </div>
    );
};

export default ImageUpload; 