import { systemPromptsV1, getTopicSystemPrompt, getEndingSysPrompt } from "./prompts";

export enum SysPromptOpt {
    DEFAULT = 'Default',
    TALKY = 'Talky',
    TALKY_NO_IMG = 'Talky_no_img',
    DEMO_TALKY_NO_IMG = 'Demo_Talky_no_img',
    DEBUG = 'Debug',
}

export function getInitialSystemPrompt(themeId: string, prompt_opt: SysPromptOpt, user_memory: string | undefined, name: string | undefined): string {
    console.log("user_memory: ", user_memory)
    const t = JSON.parse(localStorage.getItem('theme') ?? "")
    const topics = t['topics']

    switch (prompt_opt) {
        case SysPromptOpt.DEFAULT:
            return systemPromptsV1.DEFAULT(name ?? "", user_memory ?? "", topics, themeId);
        case SysPromptOpt.TALKY:
            return systemPromptsV1.TALKY(name ?? "", topics, themeId);
        case SysPromptOpt.TALKY_NO_IMG:
            return systemPromptsV1.TALKY_NO_IMG(name ?? "", topics);
        case SysPromptOpt.DEMO_TALKY_NO_IMG:
            return systemPromptsV1.DEMO_TALKY_NO_IMG(name ?? "");
        case SysPromptOpt.DEBUG:
            return systemPromptsV1.DEBUG(name ?? "", topics, themeId);
        default:
            console.log(`ERROR: no system prompt is found for ${prompt_opt}`);
            return "";
    }
}

export { getTopicSystemPrompt, getEndingSysPrompt };
