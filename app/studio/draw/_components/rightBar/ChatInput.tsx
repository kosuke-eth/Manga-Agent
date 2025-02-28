import React, { FormEvent, useState, KeyboardEvent } from "react";
import { ActionIcon, Textarea, Box } from "@mantine/core";
import { IconSend } from "@tabler/icons-react";
import { SelectedShapePreview, ChatActions } from "./Actions";
import { useProjectContext } from "../../ProjectProvider";

interface ChatInputProps {
    onSubmit: (text: string, tool?: string) => void;
    disabled?: boolean;
    chatType: 'chat' | 'image';
    selectedCommand: string;
    setSelectedCommand: (cmd: string) => void;
}

export const ChatInput = React.memo(({ onSubmit, disabled, chatType, selectedCommand, setSelectedCommand }: ChatInputProps) => {
    const [input, setInput] = useState("");
    const { editor } = useProjectContext();

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || disabled) return;
        
        const selectedShapes = editor?.getSelectedShapes() ?? [];
        if (selectedShapes.length === 1 && selectedShapes[0].type === 'freeShape') {
            const shape = selectedShapes[0];
            const selectedAsset = shape.props.selectedAssetIndex >= 0 && 
                shape.props.assetIds[shape.props.selectedAssetIndex] ?
                editor?.getAsset(shape.props.assetIds[shape.props.selectedAssetIndex] as any) : 
                null;
            const children = editor?.getSortedChildIdsForParent(shape.id);
            const hasChildren = children?.length > 0;

            if (selectedAsset && selectedAsset.type === 'image' && hasChildren) {
                onSubmit(input, 'composite');
                setInput("");
                return;
            }
        }
        
        onSubmit(input);
        setInput("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as FormEvent);
        }
    };

    return (
        <Box
            style={{
                backgroundColor: "white",
                borderTop: "1px solid #eee",
                padding: "10px 0",
            }}
        >
            {chatType === 'image' && <SelectedShapePreview />}
            {chatType === 'chat' && (
                <ChatActions 
                    onSelect={(command) => setInput(command)}
                    selectedCommand={selectedCommand}
                    setSelectedCommand={setSelectedCommand}
                />
            )}
            <form
                onSubmit={handleSubmit}
                style={{
                    display: "flex",
                    gap: "8px",
                }}
            >
                    <Textarea
                        placeholder="メッセージを入力..."
                        value={input}
                        onChange={(e) => setInput(e.currentTarget.value)}
                        style={{ flex: 1 }}
                        minRows={1}
                        maxRows={4}
                        autosize
                        disabled={disabled}
                        onKeyDown={handleKeyDown}
                    />
                    <ActionIcon
                        type="submit"
                        variant="filled"
                        color="blue"
                        size="lg"
                        disabled={disabled}
                        style={{ alignSelf: "flex-end" }}
                    >
                        <IconSend size={18} />
                    </ActionIcon>
            </form>
        </Box>
    );
});