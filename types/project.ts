import { z } from "zod";


export interface CharacterImage {
    id: string;
    url: string;
    isSelected: boolean;
    prompt: string;
    negative_prompt: string;
}

export interface Character {
    name: string;
    traits: string;
    images: CharacterImage[];
}

export interface Story {
    title: string;
    summary: string;
}

export interface Point {
    x: number;
    y: number;
}

export interface Panel {
    id: number;
    points: Point[];
    content: string;
}

export interface PageData {
    story: string;
    panels?: {
        list: Panel[];
        reasoning: string;
    };
    [key: string]: any;
}

export type StorySuggestion = z.infer<typeof StoryResponseSchema>['suggestion'];

export interface Message {
    id: number;
    text: string;
    isUser: boolean;
    suggestion?: StorySuggestion;
}

export interface ProjectState {
    story: Story;
    characters: Character[];
    characterImages: { [key: string]: string[] };
    loadingImages: { [key: string]: boolean };
    chatSessions: {
        [tabValue: string]: Message[];
    };
}

export const PanelRequestSchema = z.object({
    storySummary: z.string().min(1),
    storyCharacters: z.array(z.string()),
    pageSummary: z.string().min(1),
    currentPanels: z.object({
        count: z.number(),
        panels: z.array(z.object({
            points: z.array(z.object({
                x: z.number(),
                y: z.number()
            })),
            content: z.string()
        }))
    }).optional(),
    message: z.string().min(1)
});

export const PanelResponseSchema = z.object({
    panels: z.array(z.object({
        id: z.number(),
        points: z.array(z.object({
            x: z.number(),
            y: z.number()
        })),
        content: z.string(),
        background_prompt: z.string(),
    })),
    reasoning: z.string()
});

export const StoryRequestSchema = z.object({
    currentTitle: z.string(),
    currentSummary: z.string(),
    characters: z.array(z.object({
        name: z.string(),
        traits: z.string()
    })),
    message: z.string(),
    messageHistory: z.array(z.object({
        text: z.string(),
        isUser: z.boolean(),
    })).optional()
});

export const StoryResponseSchema = z.object({
    suggestion: z.object({
        type: z.enum(['story', 'pages', 'chat']),
        type_reasoning: z.string(),
        reasoning: z.string(),
        story: z.object({
            title: z.string(),
            summary: z.string(),
            characters: z.object({
                add: z.array(z.object({
                    name: z.string(),
                    traits: z.string(),
                })).optional(),
                update: z.array(z.object({
                    name: z.string(),
                    traits: z.string(),
                })).optional(),
                remove: z.array(z.object({
                    name: z.string(),
                })).optional()
            }).optional()
        }).optional(),
        pages: z.array(z.object({
            pageNumber: z.number(),
            content: z.string()
        })).optional(),
        chat_response: z.string().optional()
    })
});

export interface SuggestionApplier {
    apply(suggestion: StorySuggestion, currentState: ProjectState): Partial<ProjectState>;
}

// チャット関連の型を整理
export const ChatResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        response: z.string(),
        suggestion: z.union([
            StoryResponseSchema,
            PanelResponseSchema,
            // 今後の拡張用
        ]).optional(),
    }),
    error: z.string().optional(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export type PanelRequest = z.infer<typeof PanelRequestSchema>;
export type PanelResponse = z.infer<typeof PanelResponseSchema>;
export type StoryRequest = z.infer<typeof StoryRequestSchema>;
export type StoryResponse = z.infer<typeof StoryResponseSchema>;

export const PanelPromptRequestSchema = z.object({
    story: z.object({
        title: z.string(),
        summary: z.string(),
    }),
    characters: z.array(z.object({
        name: z.string(),
        traits: z.string(),
    })),
    pageStory: z.string(),
    panel: z.object({
        content: z.string(),
        width: z.number(),
        height: z.number(),
    }),
    message: z.string(),
});

export type PanelPromptRequest = z.infer<typeof PanelPromptRequestSchema>;

export type CommandType = 'story' | 'panel' | 'none';

export interface ParsedCommand {
    type: CommandType;
    message: string;
}

export interface GeneratedImage {
    url: string;
    prompt: string;
    negative_prompt: string;
}
