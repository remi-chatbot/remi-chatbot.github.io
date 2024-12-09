import React, { useEffect } from 'react';
import { envConfig } from "../utils/env.config";

interface TopicImageViewProps {
    themeId: string;
    topicIdList: string[];
    topics: string[];
    showEmotionWheel?: boolean;
    isConnected?: boolean;
}

function TopicImageView({ themeId, topicIdList, topics, showEmotionWheel, isConnected }: TopicImageViewProps) {
    useEffect(() => {
        console.log('Received topics: ', topics);
    }, [topics]);
    return (
        <div className="flex flex-col items-center gap-4">
            {showEmotionWheel && isConnected && (
                <div className="mb-4 max-w-full">
                    <img 
                        src="https://www.davidhodder.com/wp-content/uploads/2018/10/Emotion-Feeling-Wheel-1-1.jpg"
                        alt="Emotion Wheel"
                        className="rounded-lg shadow-md"
                        style={{ 
                            maxWidth: '400px',
                            width: '100%',
                            height: 'auto',
                            margin: '0 auto'
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export { TopicImageView };