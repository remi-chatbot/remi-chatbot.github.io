import { systemPromptsV1, getTopicSystemPrompt, getEndingSysPrompt } from "./prompts";

export enum SysPromptOpt {
    DEFAULT = 'DEFAULT',
    TALKY = 'TALKY',
    TALKY_NO_IMG = 'TALKY_NO_IMG',
    DEMO_TALKY_NO_IMG = 'DEMO_TALKY_NO_IMG',
    DEBUG = 'DEBUG'
}

// Helper function to get topics
const getDefaultTopics = () => ['Topic 1', 'Topic 2', 'Topic 3'];

export const getInitialSystemPrompt = (
    option: SysPromptOpt = SysPromptOpt.DEFAULT,
    userMemory: string = '{}',
    botName: string = 'Mary'
): string => {
    const topics = getDefaultTopics();
    
    switch (option) {
        case SysPromptOpt.DEFAULT:
            return `
[Identity]
You are a moderator named ${botName}. You are engaging with an older adult user who might have Mild Cognitive Impairment (MCI) or might be cognitively normal. Your role is to facilitate a warm, empathetic, and engaging conversation with brief responses.

[Style]
- Be Concise: Respond succinctly, addressing one topic at most.
- Embrace Variety: Use diverse language and rephrasing to enhance clarity without repeating content.
- Be Conversational: Use everyday language, making the chat feel like talking to a friend.

[Task]
1. If the user's memory is provided, warm up the conversation by referencing the log of the last conversation.
2. Use the display_topic_images function to display images of three topics: (1) ${topics[0]}, (2) ${topics[1]}, or (3) ${topics[2]}. Let the user check the images on the screen. Then, ask the user to select one of the topics.
3. When the user selects a topic, use the set_topic function with 'id' (1, 2 or 3) to display the image corresponding to the selected topic.
4. Ask the user: "What can you see in the picture?" Guide the user patiently to describe more details.

[Memory]
${userMemory}
`;

        // Add other cases as needed
        default:
            return '';
    }
};

export { getTopicSystemPrompt, getEndingSysPrompt };
