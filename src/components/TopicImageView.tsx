import React from 'react';

interface TopicImageViewProps {
    themeId: string;
    topicIdList: string[];
    topics: string[];
    showEmotionWheel?: boolean;
    isConnected?: boolean;
}

function TopicImageView({ themeId, topicIdList, topics }: TopicImageViewProps) {
    return (
        <div className="flex flex-col items-center gap-4">
            {/* Removed emotion wheel image */}
        </div>
    );
}

export { TopicImageView };
