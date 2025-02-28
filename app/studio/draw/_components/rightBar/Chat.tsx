import { Paper, Tabs, ScrollArea, Box, rem } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Resizable } from "re-resizable";
import { useProjectContext } from "@/app/studio/draw/ProjectProvider";
import React from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Message, PageData, ParsedCommand } from "@/types/project";
import { notifications } from "@mantine/notifications";
import { FreeShape, FreeShapeUtil } from "../../_objects/panel/FreeShapeUtil";

const TabPanel = React.memo(({ id, value, initialMessage }: {
    id: string;
    value: string; 
    initialMessage: string;
}) => {
    const { updateChatSession, getChatSession, applyStorySuggestion, projectState, generatePanels, generateStory, editor } = useProjectContext();
    const [messages, setMessages] = useState<Message[]>(() => {
        const savedMessages = getChatSession(id);
        return savedMessages.length > 0 ? savedMessages : [
            { id: 1, text: initialMessage, isUser: false },
        ];
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCommand, setSelectedCommand] = useState<string>('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const currentSession = projectState.chatSessions[id];
        if (currentSession) {
            setMessages(currentSession);
        }
    }, [projectState.chatSessions, id]);

    useEffect(() => {
        updateChatSession(id, messages);
    }, [messages, id, updateChatSession]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }, [messages]);

    const handleSubmit = useCallback(async (text: string) => {
        if (isSubmitting) return;

        const userMessage: Message = { 
            id: Date.now(), 
            text, 
            isUser: true 
        };
        setMessages(prev => [...prev, userMessage]);
        setIsSubmitting(true);

        try {
            if (id === 'chat') {
                // Use selectedCommand to trigger panel or story
                if (selectedCommand === 'panel') {
                    if (editor) {
                        const currentPageId = editor.getCurrentPageId();
                        await generatePanels(currentPageId, text);
                    }
                } else {
                    await generateStory(text);
                }
            } else if (id === 'image') {
                if (!editor) return;
                const selectedIds = editor.getSelectedShapeIds();
                if (selectedIds.length !== 1) {
                    throw new Error('Please select exactly one panel');
                }

                const shape = editor.getShape(selectedIds[0]);
                if (!shape || shape.type !== 'freeShape') {
                    throw new Error('Selected shape is not a panel');
                }

                // Get current page story
                const currentPageId = editor.getCurrentPageId();
                const currentPage = editor.getPage(currentPageId);
                if (!currentPage) {
                    throw new Error('Failed to get current page');
                }

                const util = editor.getShapeUtil('freeShape') as FreeShapeUtil
                util.compositeBackground(shape as FreeShape, text)
            }
        } catch (error) {
            console.error('Error:', error);
            notifications.show({
                title: 'エラー',
                message: error instanceof Error ? error.message : '予期せぬエラーが発生しました',
                color: 'red'
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [id, editor, projectState, generateStory, generatePanels, isSubmitting, selectedCommand]);

    const handleAccept = useCallback((message: Message) => {
        if (message.suggestion) {
            applyStorySuggestion(message.suggestion);
            notifications.show({
                title: '提案を適用',
                message: '提案内容を反映しました',
                color: 'green'
            });
        }
    }, [applyStorySuggestion]);

    return (
        <Tabs.Panel
            value={value}
            style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                marginTop: 16,
            }}
        >
            <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                <ScrollArea
                    style={{ flex: 1, padding: "10px" }}
                    viewportRef={scrollRef}
                >
                    {messages.map((message) => (
                        <ChatMessage 
                            key={message.id} 
                            message={message}
                            onAccept={message.suggestion ? () => handleAccept(message) : undefined}
                        />
                    ))}
                </ScrollArea>
                <ChatInput 
                    onSubmit={handleSubmit} 
                    disabled={isSubmitting} 
                    chatType={id as 'chat' | 'image'}
                    selectedCommand={selectedCommand}
                    setSelectedCommand={setSelectedCommand}
                />
            </div>
        </Tabs.Panel>
    );
});

export const Chat = React.memo(() => {
    const [visible, setVisible] = useState(true);
    const [size, setSize] = useState({ width: "400px", height: "100%" });

    const tabPanels = useMemo(() => [
        {
            id: "chat",
            value: "チャット",
            message: "こんにちは！あなたの漫画創作をお手伝いいたします。今日はどんな漫画を描きますか？",
        },
        {
            id: "image",
            value: "画像生成",
            message: "現在選択中のラフスケッチから、画像を生成します 🖼️",
        }
    ], []);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            position: 'relative',
        }}>
            <Box
                style={{
                    position: "absolute",
                    right: visible ? size.width : "0",
                    top: "50%", // Changed from rem(10)
                    transform: "translateY(-50%)", // Added to center vertically
                    zIndex: 100,
                    cursor: "pointer",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px 0 0 8px",
                    border: "1px solid #ccc",
                    borderRight: "none",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    padding: rem(8),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "right 0.3s ease", // Added to match the panel transition
                }}
                onClick={() => setVisible(!visible)}
            >
                {visible ? <IconChevronRight size={24} /> : <IconChevronLeft size={24} />}
            </Box>

            <div style={{ 
                width: visible ? size.width : "0",
                overflow: "hidden",
                transition: "width 0.3s ease",
            }}>
                <Resizable
                    size={size}
                    onResizeStop={(e, direction, ref) =>
                        setSize({ width: ref.style.width, height: ref.style.height })
                    }
                    minWidth={300}
                    maxWidth={500}
                    enable={{ left: true }}
                >
                    <Paper
                        shadow="lg"
                        p="md"
                        style={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <Tabs
                            defaultValue="チャット"
                            style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}
                        >
                            <Tabs.List
                                grow
                                style={{
                                    position: "sticky",
                                    top: 0,
                                    zIndex: 1,
                                    backgroundColor: "white",
                                }}
                            >
                                {tabPanels.map(tab => (
                                    <Tabs.Tab key={tab.value} value={tab.value}>
                                        {tab.value}
                                    </Tabs.Tab>
                                ))}
                            </Tabs.List>

                            {tabPanels.map(tab => (
                                <TabPanel
                                    key={tab.value}
                                    id={tab.id}
                                    value={tab.value}
                                    initialMessage={tab.message}
                                />
                            ))}
                        </Tabs>
                    </Paper>
                </Resizable>
            </div>
        </div>
    );
});
