import React from "react";
import { Paper, Text, Button, Group } from "@mantine/core";
import { Message } from "@/types/project";

interface ChatMessageProps {
    message: Message;
    onAccept?: () => void;
}

export const ChatMessage = React.memo(({ message, onAccept }: ChatMessageProps) => {
    const hasSuggestion = !message.isUser && message.suggestion;

    return (
        <div
            style={{
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                marginBottom: "12px",
                flexDirection: message.isUser ? "row-reverse" : "row",
            }}
        >
            <Paper
                p="xs"
                style={{
                    backgroundColor: message.isUser ? "#007AFF" : "#f1f1f1",
                    borderRadius: "12px",
                    maxWidth: "98%",
                }}
            >
                <Text
                    size="sm"
                    c={message.isUser ? "white" : "black"}
                    style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                    }}
                >
                    {message.text}
                </Text>
                {hasSuggestion && onAccept && (
                    <Group mt="md">
                        <Button size="xs" color="green" onClick={onAccept}>
                            適用
                        </Button>
                    </Group>
                )}
            </Paper>
        </div>
    );
});