import React, { useState } from "react";
import { Button, Card, Flex, Grid, Group, Image, Modal, Textarea, TextInput, Title, ScrollArea, Paper, Text } from "@mantine/core";
import { useForm } from "react-hook-form";
import { Character, ProjectState } from "@/types/project";
import { useProjectContext } from '@/app/studio/draw/ProjectProvider';
import { FreeShape, FreeShapeUtil } from "../../_objects/panel/FreeShapeUtil";

export const CharacterForm = React.memo(({ onAddCharacter }: { onAddCharacter: (name: string, traits: string) => void }) => {
    const { register, handleSubmit, reset } = useForm<{name: string; traits: string}>({
        defaultValues: { name: "", traits: "" }
    });

    const onSubmit = (data: { name: string; traits: string }) => {
        onAddCharacter(data.name, data.traits);
        reset();
    };

    return (
        <Card shadow="sm" padding="lg">
            <form onSubmit={handleSubmit(onSubmit)}>
                <TextInput
                    label="名前"
                    {...register("name", { required: true })}
                />
                <Textarea
                    label="特徴"
                    autosize
                    minRows={2}
                    maxRows={5}
                    {...register("traits", { required: true })}
                />
                <Group mt="md">
                    <Button type="submit">追加</Button>
                </Group>
            </form>
        </Card>
    );
});

export const CharacterCard = React.memo(({ 
    character, 
    setProjectState,
    characters,
    isLoading = false,
    projectState,
}: { 
    character: Character;
    setProjectState: (newState: Partial<ProjectState>) => void;
    characters: Character[];
    isLoading?: boolean;
    projectState: ProjectState;
}) => {
    const { editor } = useProjectContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTraits, setEditedTraits] = useState(character.traits);
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>("");
    const [negativePrompt, setNegativePrompt] = useState<string>("");
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
    const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [editedPrompt, setEditedPrompt] = useState<string>("");
    const [editedNegativePrompt, setEditedNegativePrompt] = useState<string>("");
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);  // 追加

    const handleSave = () => {
        setProjectState({
            characters: characters.map(char => 
                char.name === character.name ? { ...char, traits: editedTraits } : char
            )
        });
        setIsEditing(false);
    };

    const handleImageSelect = (selectedUrl: string) => {
        setProjectState({
            characterImages: {
                [character.name]: [selectedUrl]
            }
        });
    };

    const generatePrompt = async (customMessage?: string) => {
        if (isGeneratingImage) return;  // 画像生成中は実行しない
        setIsGeneratingPrompt(true);
        try {
            const response = await fetch('/api/drawing/nl2prompt/character', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    traits: character.traits,
                    messages: customMessage ? 
                        [...chatMessages, { role: 'user' as const, content: customMessage }] : 
                        chatMessages
                }),
            });
            const { prompt: generatedPrompt, negative_prompt } = await response.json();
            setPrompt(generatedPrompt);
            setNegativePrompt(negative_prompt);
            
            const newMessages = [
                ...chatMessages,
                ...(customMessage ? [{ role: 'user' as const, content: customMessage }] : []),
                { 
                    role: 'assistant',
                    content: `プロンプト:\n${generatedPrompt}\n\n除外プロンプト:\n${negative_prompt}`
                }
            ];
            setChatMessages(newMessages);
            setCurrentMessage('');
        } catch (error) {
            console.error('Error generating prompt:', error);
        }
        setIsGeneratingPrompt(false);
    };

    const generateImage = async (customPrompt?: string, customNegativePrompt?: string, referenceImage?: string) => {
        if (!customPrompt && !prompt) return;
        if (isGeneratingPrompt) return;  // プロンプト生成中は実行しない

        setIsGeneratingImage(true);
        setProjectState({
            loadingImages: { ...projectState.loadingImages, [character.name]: true },
        });

        try {
            const response = await fetch('/api/drawing/image/character', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt: customPrompt || prompt,
                    negative_prompt: customNegativePrompt || negativePrompt,
                    referenceImage
                }),
            });

            const { images } = await response.json();
            if (Array.isArray(images)) {
                const newCharacterImages = images.map(img => ({
                    id: crypto.randomUUID(),
                    url: img.url,
                    isSelected: false,
                    prompt: img.prompt,
                    negative_prompt: img.negative_prompt
                }));
                
                setProjectState({
                    characters: projectState.characters.map(char => 
                        char.name === character.name 
                            ? { 
                                ...char, 
                                images: [...newCharacterImages, ...(char.images || [])] // 新しい画像を先頭に追加
                            }
                            : char
                    ),
                });
            }
        } catch (error) {
            console.error('Error generating images:', error);
        }

        setProjectState({
            loadingImages: { ...projectState.loadingImages, [character.name]: false },
        });
        setIsGeneratingImage(false);
    };

    const handleDelete = () => {
        if (window.confirm(`${character.name}を削除してもよろしいですか？`)) {
            setProjectState({
                characters: characters.filter(char => char.name !== character.name)
            });
        }
    };

    const updatePrompt = (index: number, newPrompt: string, newNegativePrompt: string) => {
        const updatedMessages = [...chatMessages];
        updatedMessages[index] = {
            ...updatedMessages[index],
            content: `プロンプト:\n${newPrompt}\n\n除外プロンプト:\n${newNegativePrompt}`
        };
        setChatMessages(updatedMessages);
        setEditingMessageId(null);
    };

    const handleRegenerate = (prompt: string, negativePrompt: string, referenceImage: string) => {
        const newMessages = [
            ...chatMessages,
            { 
                role: 'assistant',
                content: `プロンプト:\n${prompt}\n\n除外プロンプト:\n${negativePrompt}\n`
            }
        ];
        setChatMessages(newMessages);
        generateImage(prompt, negativePrompt, referenceImage);
    };

    const selectedImage = character.images?.find(img => img.isSelected)?.url;

    return (
        <>
            <Card
                shadow="sm"
                padding="lg"
                onClick={() => setIsModalOpen(true)}
                style={{ cursor: "pointer" }}
            >
                <Grid>
                    <Grid.Col span={9}>
                        <h3 style={{ margin: 0 }}>{character.name}</h3>
                    </Grid.Col>
                    <Grid.Col span={2}>
                        <Button 
                            color="red" 
                            variant="subtle" 
                            size="xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete();
                            }}
                        >
                            削除
                        </Button>
                    </Grid.Col>
                </Grid>
                {selectedImage && (
                    <Image
                        src={selectedImage}
                        alt={character.name}
                        height={120}
                        fit="contain"
                    />
                )}
            </Card>

            <Modal 
                opened={isModalOpen} 
                onClose={() => {
                    if (!isGeneratingPrompt && !isLoading) {
                        setIsModalOpen(false);
                    }
                }} 
                title={`${character.name} の詳細`} 
                size="xl"
            >
                <Paper withBorder p="md" mb="md">
                    <Title order={3}>特徴</Title>
                    {isEditing ? (
                        <Card shadow="sm" p="md" withBorder>
                            <Textarea
                                value={editedTraits}
                                onChange={(e) => setEditedTraits(e.currentTarget.value)}
                                autosize
                                minRows={3}
                                maxRows={6}
                            />
                            <Group mt="md" position="right">
                                <Button variant="light" onClick={() => {
                                    setIsEditing(false);
                                    setEditedTraits(character.traits);
                                }}>キャンセル</Button>
                                <Button onClick={handleSave}>保存</Button>
                            </Group>
                        </Card>
                    ) : (
                        <Card shadow="sm" p="md" withBorder>
                            <Text>{character.traits}</Text>
                            <Button variant="light" mt="md" onClick={() => setIsEditing(true)}>
                                編集
                            </Button>
                        </Card>
                    )}
                </Paper>

                <Paper withBorder p="md" mb="md">
                    <Title order={3} mb="md">画像生成</Title>
                    <ScrollArea h={400} mb="md">
                        <Flex direction="column" gap="sm">
                            {chatMessages.map((msg, index) => (
                                <Paper
                                    key={index}
                                    p="sm"
                                    withBorder
                                    style={{
                                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        maxWidth: '80%',
                                        backgroundColor: msg.role === 'user' ? '#e3f2fd' : 'white',
                                    }}
                                >
                                    {msg.role === 'assistant' && msg.content.includes('プロンプト:') ? (
                                        editingMessageId === index ? (
                                            <>
                                                <Textarea
                                                    label="プロンプト"
                                                    value={editedPrompt}
                                                    onChange={(e) => setEditedPrompt(e.currentTarget.value)}
                                                    autosize
                                                    minRows={2}
                                                    mb="sm"
                                                />
                                                <Textarea
                                                    label="除外プロンプト"
                                                    value={editedNegativePrompt}
                                                    onChange={(e) => setEditedNegativePrompt(e.currentTarget.value)}
                                                    autosize
                                                    minRows={2}
                                                    mb="md"
                                                />
                                                <Group position="right">
                                                    <Button 
                                                        variant="light"
                                                        onClick={() => setEditingMessageId(null)}
                                                    >
                                                        キャンセル
                                                    </Button>
                                                    <Button 
                                                        onClick={() => updatePrompt(index, editedPrompt, editedNegativePrompt)}
                                                    >
                                                        保存
                                                    </Button>
                                                </Group>
                                            </>
                                        ) : (
                                            <>
                                                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
                                                <Group mt="xs" position="right">
                                                    <Button
                                                        variant="light"
                                                        size="xs"
                                                        onClick={() => {
                                                            const promptMatch = msg.content.match(/プロンプト:\n([\s\S]*?)\n\n除外プロンプト:/);
                                                            const negativeMatch = msg.content.match(/除外プロンプト:\n([\s\S]*)/);
                                                            if (promptMatch && negativeMatch) {
                                                                setEditedPrompt(promptMatch[1].trim());
                                                                setEditedNegativePrompt(negativeMatch[1].trim());
                                                                setEditingMessageId(index);
                                                            }
                                                        }}
                                                    >
                                                        編集
                                                    </Button>
                                                    <Button
                                                        variant="light"
                                                        size="xs"
                                                        loading={isGeneratingImage}
                                                        disabled={isGeneratingPrompt}
                                                        onClick={() => {
                                                            const promptMatch = msg.content.match(/プロンプト:\n([\s\S]*?)\n\n除外プロンプト:/);
                                                            const negativeMatch = msg.content.match(/除外プロンプト:\n([\s\S]*)/);
                                                            if (promptMatch && negativeMatch) {
                                                                generateImage(promptMatch[1].trim(), negativeMatch[1].trim());
                                                            }
                                                        }}
                                                    >
                                                        画像生成
                                                    </Button>
                                                </Group>
                                            </>
                                        )
                                    ) : (
                                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
                                    )}
                                </Paper>
                            ))}
                        </Flex>
                    </ScrollArea>

                    <Card shadow="sm" p="md" withBorder>
                        <Textarea
                            value={currentMessage}
                            onChange={(e) => setCurrentMessage(e.currentTarget.value)}
                            placeholder="プロンプトの指示を入力（任意）..."
                            disabled={isGeneratingPrompt}
                            autosize
                            minRows={2}
                            maxRows={4}
                            mb="sm"
                        />
                        <Group position="right">
                            <Button 
                                onClick={() => generatePrompt(currentMessage)}
                                loading={isGeneratingPrompt}
                                disabled={isGeneratingImage}
                            >
                                プロンプト生成
                            </Button>
                        </Group>
                    </Card>
                </Paper>

                <Paper withBorder p="md">
                    <Title order={3} mb="md">生成された画像</Title>
                    <Grid gutter="sm">
                        {character.images && character.images.map((img, idx) => (
                            <Grid.Col span={6} key={img.id}>
                                <Card
                                    shadow="sm"
                                    padding="xs"
                                    style={{ 
                                        cursor: 'pointer',
                                        border: img.isSelected ? '2px solid blue' : 'none'
                                    }}
                                >
                                    <Image 
                                        src={img.url} 
                                        alt={`Generated ${idx}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEnlargedImage(img.url);
                                        }}
                                        style={{ cursor: 'zoom-in' }}
                                    />
                                    <Group grow gap="xs" mt="xs">
                                        <Button 
                                            variant="light" 
                                            size="xs"
                                            onClick={async () => {
                                                setProjectState({
                                                    characters: characters.map(c => 
                                                        c.name === character.name 
                                                            ? {
                                                                ...c,
                                                                images: c.images.map(i => ({
                                                                    ...i,
                                                                    isSelected: i.id === img.id
                                                                }))
                                                            }
                                                            : c
                                                    )
                                                });
                                            }}
                                        >
                                            {img.isSelected ? '選択中' : '選択'}
                                        </Button>
                                        <Button
                                            variant="light"
                                            color="red"
                                            size="xs"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setProjectState({
                                                    characters: characters.map(c =>
                                                        c.name === character.name
                                                            ? {
                                                                ...c,
                                                                images: c.images.filter(i => i.id !== img.id)
                                                            }
                                                            : c
                                                    )
                                                });
                                            }}
                                        >
                                            削除
                                        </Button>
                                        <Button
                                            variant="light"
                                            color="blue"
                                            size="xs"
                                            disabled={isGeneratingPrompt}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRegenerate(img.prompt, img.negative_prompt, img.url);
                                            }}
                                        >
                                            更に生成
                                        </Button>
                                    </Group>
                                </Card>
                            </Grid.Col>
                        ))}
                    </Grid>
                </Paper>
            </Modal>

            <Modal
                opened={!!enlargedImage}
                onClose={() => setEnlargedImage(null)}
                size="xl"
                padding="xs"
            >
                {enlargedImage && (
                    <Image
                        src={enlargedImage}
                        alt="Enlarged view"
                        fit="contain"
                        style={{ maxHeight: '80vh' }}
                    />
                )}
            </Modal>
        </>
    );
});