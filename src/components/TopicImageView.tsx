import React, { useEffect } from 'react';
import { envConfig } from "../utils/env.config";

function TopicImageView({ themeId, topicIdList, topics }: {
    themeId: string;
    topicIdList: string[];
    topics: string[];
}) {
    useEffect(() => {
        console.log('Received topics: ', topics);
    }, [topics]);
    return (
        <>
            {/* <h1 className="text-2xl text-center w-full">Theme {themeId}</h1> */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 gap-4">
                {topicIdList.map((topic, index) => (
                    <div key={index} className="text-center">
                        <figure className="figure-container">
                            <img
                                src={`${envConfig.theme_img.base_url}/${themeId}/${topic}.jpg`}
                                alt={`Topic ${index + 1}`}
                                className="w-full h-auto"
                            />
                            <figcaption className="font-bold capitalize">
                                {topics[parseInt(topic) - 1]}
                            </figcaption>
                        </figure>
                    </div>
                ))}
            </div>
        </>
    );
}

export { TopicImageView };
