import React, { useMemo, useState } from 'react';
import { Modal, Stack, Text, Group, Card, SimpleGrid, Tabs, Paper, ScrollArea, Button, Textarea, Grid } from '@mantine/core';
import { Image as MantineImage } from '@mantine/core'; 
import { FreeShape } from '../_objects/panel/FreeShapeUtil';
import { TLShapeId, useEditor } from 'tldraw';
import { useProjectContext } from '../ProjectProvider';
import { IconPhotoPlus, IconEdit, IconCheck } from '@tabler/icons-react';

const STROKE_WIDTHS = [
    { value: 0, label: '無' },
    { value: 2, label: '小' },
    { value: 4, label: '中' },
    { value: 6, label: '大' },
] as const

interface PanelDetailModalProps {
    shapeId: TLShapeId;
    onClose: () => void;
    opened: boolean;
}

export const PanelDetailModal = ({ shapeId, onClose, opened }: PanelDetailModalProps) => {
    const editor = useEditor();
    const { projectState } = useProjectContext();
    const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
    const [editedBackgroundPrompt, setEditedBackgroundPrompt] = useState('');
    const [isEditingPrompt, setIsEditingPrompt] = useState(false);
    const [isEditingContent, setIsEditingContent] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    
    if (!shapeId) return null;
    
    const shape = editor.getShape(shapeId) as FreeShape;
    if (!shape) return null;

    // パネルの内容をパースして表示用に整形
    const panelContent = useMemo(() => {
        try {
            const content = JSON.parse(shape.props.text);
            setEditedBackgroundPrompt(content.background_prompt || '');
            setEditedContent(content.content || '');
            return content;
        } catch {
            return { content: shape.props.text };
        }
    }, [shape.props.text]);

    // 背景画像アセットを取得
    const backgroundAssets = useMemo(() => {
        return (shape.props.assetIds || []).map(assetId => {
            const asset = editor.getAsset(assetId as any);
            return asset?.type === 'image' ? asset : null;
        }).filter(Boolean);
    }, [shape.props.assetIds, editor]);

    const handleCharacterSelect = async (selectedImage: { id: string, url: string }) => {
        if (!shape) return;

        const assetId = `asset:${selectedImage.id}`;
        
        // Get image dimensions
        const img = new Image();
        img.src = selectedImage.url;
        await new Promise((resolve) => {
            img.onload = resolve;
        });
        
        const imageWidth = img.width;
        const imageHeight = img.height;

        const asset = {
            id: assetId as any,
            typeName: 'asset',
            type: 'image',
            props: {
                name: 'CharacterImage',
                src: selectedImage.url,
                w: imageWidth,
                h: imageHeight,
                mimeType: 'image/png',
                isAnimated: false,
            },
            meta: { prompt: '' } // added meta with prompt for character image
        };
        
        editor.createAssets([asset]);
        const createdAsset = editor.getAsset(assetId);
        
        if (createdAsset) {
            const panelBounds = editor.getShapePageBounds(shape);
            const x = (panelBounds.width - imageWidth) / 2;
            const y = (panelBounds.height - imageHeight) / 2;

            editor.createShape<FreeShape>({
                type: 'freeShape',
                x,
                y,
                parentId: shape.id,
                props: {
                    text: "",
                    w: imageWidth,
                    h: imageHeight,
                    corners: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
                    color: 'black',
                    strokeWidth: 0,
                    font: 'draw',
                    align: 'middle',
                    verticalAlign: 'middle',
                    assetIds: [assetId],
                    selectedAssetIndex: 0,
                }
            });
        }
    };

    const handleGenerateBackground = async () => {
        if (isGeneratingBackground || !shape) return;
        setIsGeneratingBackground(true);
        try {
            const panelContent = JSON.parse(shape.props.text);
            const response = await fetch('/api/drawing/image/panel/background', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: panelContent.background_prompt
                }),
            });
            
            if (!response.ok) throw new Error('Failed to generate background');
            
            const result = await response.json();
            const assets = [];
            const assetIds = [...shape.props.assetIds];
            const currentSelectedIndex = shape.props.selectedAssetIndex;

            for (const img of result.images) {
                if (img.url) {
                    const tempImg = new Image();
                    tempImg.src = img.url;
                    await new Promise((resolve) => { tempImg.onload = resolve; });

                    const assetId = `asset:${crypto.randomUUID()}`;
                    const asset = {
                        id: assetId as any,
                        typeName: 'asset',
                        type: 'image',
                        props: {
                            name: 'Generated Background',
                            src: img.url,
                            w: tempImg.width,
                            h: tempImg.height,
                            mimeType: 'image/png',
                            isAnimated: false,
                        },
                        meta: { prompt: img.prompt || panelContent.background_prompt } // use img.prompt if available
                    };
                    assets.push(asset);
                    assetIds.push(assetId);
                }
            }

            if (assets.length > 0) {
                editor.createAssets(assets);
                editor.updateShape({
                    id: shape.id,
                    type: 'freeShape',
                    props: {
                        ...shape.props,
                        assetIds: assetIds,
                        selectedAssetIndex: currentSelectedIndex
                    }
                });
            }
        } catch (error) {
            console.error('Background generation failed:', error);
        } finally {
            setIsGeneratingBackground(false);
        }
    };

    const handleUpdateBackgroundPrompt = () => {
        const updatedContent = {
            ...panelContent,
            background_prompt: editedBackgroundPrompt
        };
        editor.updateShape({
            id: shape.id,
            type: 'freeShape',
            props: {
                ...shape.props,
                text: JSON.stringify(updatedContent)
            }
        });
        setIsEditingPrompt(false);
    };

    const handleUpdateContent = () => {
        const updatedContent = {
            ...panelContent,
            content: editedContent
        };
        editor.updateShape({
            id: shape.id,
            type: 'freeShape',
            props: {
                ...shape.props,
                text: JSON.stringify(updatedContent)
            }
        });
        setIsEditingContent(false);
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="コマの詳細"
            size="90vw"
            styles={{
                title: {
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                },
                body: {
                    maxHeight: '80vh',
                },
                inner: {
                    padding: '20px'
                }
            }}
        >
            <Tabs defaultValue="content">
                <Tabs.List mb="md">
                    <Tabs.Tab value="content">内容と背景</Tabs.Tab>
                    <Tabs.Tab value="characters">キャラクター</Tabs.Tab>
                    <Tabs.Tab value="info">情報</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="content">
                    <Grid align="flex-start" >
                        {/* 左ペイン：パネル情報 */}
                        <Paper p="md" withBorder style={{ width: '40%' }}>
                            <Stack gap="xl">
                                <div>
                                    <Group position="apart" mb="xs">
                                        <Text fw={700} size="lg">シーンの説明</Text>
                                        <Button
                                            variant="subtle"
                                            size="sm"
                                            p={4}
                                            onClick={() => {
                                                if (isEditingContent) {
                                                    handleUpdateContent();
                                                } else {
                                                    setIsEditingContent(true);
                                                }
                                            }}
                                        >
                                            {isEditingContent ? <IconCheck size={20} /> : <IconEdit size={20} />}
                                        </Button>
                                    </Group>
                                    {isEditingContent ? (
                                        <Textarea
                                            value={editedContent}
                                            onChange={(e) => setEditedContent(e.currentTarget.value)}
                                            minRows={4}
                                            autosize
                                            maxRows={8}
                                            placeholder="シーンの説明を入力してください"
                                            styles={{ input: { backgroundColor: '#f8f9fa' } }}
                                        />
                                    ) : (
                                        <Paper p="xs" bg="gray.0" style={{ whiteSpace: 'pre-wrap' }}>
                                            {editedContent || 'シーンの説明がありません'}
                                        </Paper>
                                    )}
                                </div>
                                <div>
                                    <Group mb="xs">
                                        <Text fw={700} size="lg">背景の指示</Text>
                                        <Button
                                            variant="subtle"
                                            size="sm"
                                            p={4}
                                            onClick={() => {
                                                if (isEditingPrompt) {
                                                    handleUpdateBackgroundPrompt();
                                                } else {
                                                    setIsEditingPrompt(true);
                                                }
                                            }}
                                        >
                                            {isEditingPrompt ? <IconCheck size={20} /> : <IconEdit size={20} />}
                                        </Button>
                                    </Group>
                                    {isEditingPrompt ? (
                                        <Textarea
                                            value={editedBackgroundPrompt}
                                            onChange={(e) => setEditedBackgroundPrompt(e.currentTarget.value)}
                                            minRows={4}
                                            autosize
                                            maxRows={8}
                                            placeholder="背景の説明を入力してください"
                                            styles={{ input: { backgroundColor: '#f8f9fa' } }}
                                        />
                                    ) : (
                                        <Paper p="xs" bg="gray.0" style={{ whiteSpace: 'pre-wrap' }}>
                                            {editedBackgroundPrompt || '背景の説明がありません'}
                                        </Paper>
                                    )}
                                    <Button 
                                        onClick={handleGenerateBackground}
                                        loading={isGeneratingBackground}
                                        leftSection={<IconPhotoPlus size={20} />}
                                        mt="md"
                                        fullWidth
                                    >
                                        新しい背景を生成
                                    </Button>
                                </div>
                                {panelContent.character_descriptions && (
                                    <div>
                                        <Text fw={700} size="lg" mb="xs">キャラクターの配置</Text>
                                        <Paper p="xs" bg="gray.0" style={{ whiteSpace: 'pre-wrap' }}>
                                            {panelContent.character_descriptions}
                                        </Paper>
                                    </div>
                                )}
                            </Stack>
                        </Paper>

                        {/* 右ペイン：背景画像 */}
                        <Stack gap="md" style={{ width: '60%' }}>
                            <ScrollArea h={600}>
                                <SimpleGrid cols={1} spacing="lg">
                                    {backgroundAssets.map((asset, index) => (
                                        <Card key={asset.id} shadow="sm" padding={0} radius="md" withBorder>
                                            <Card.Section>
                                                <MantineImage
                                                    src={asset.props.src}
                                                    height={300}
                                                    alt={`Background ${index + 1}`}
                                                    fit="cover"
                                                />
                                            </Card.Section>
                                            <Group p="sm" style={{ backgroundColor: shape.props.selectedAssetIndex === index ? '#e7f5ff' : 'transparent' }}>
                                                <Text fw={500} size="sm">背景 {index + 1}</Text>
                                                <Group gap="xs">
                                                    {shape.props.selectedAssetIndex !== index && (
                                                        <Button 
                                                            size="xs" 
                                                            variant="light"
                                                            onClick={() => {
                                                                editor.updateShape({
                                                                    id: shape.id,
                                                                    type: 'freeShape',
                                                                    props: {
                                                                        ...shape.props,
                                                                        selectedAssetIndex: index
                                                                    }
                                                                });
                                                            }}
                                                        >
                                                            選択
                                                        </Button>
                                                    )}
                                                    <Button 
                                                        size="xs" 
                                                        color="red" 
                                                        variant="subtle"
                                                        onClick={() => {
                                                            const newAssetIds = [...shape.props.assetIds];
                                                            newAssetIds.splice(index, 1);
                                                            const newSelectedIndex = shape.props.selectedAssetIndex >= index ? 
                                                                Math.max(0, shape.props.selectedAssetIndex - 1) : 
                                                                shape.props.selectedAssetIndex;
                                                            
                                                            editor.updateShape({
                                                                id: shape.id,
                                                                type: 'freeShape',
                                                                props: {
                                                                    ...shape.props,
                                                                    assetIds: newAssetIds,
                                                                    selectedAssetIndex: newSelectedIndex
                                                                }
                                                            });
                                                        }}
                                                    >
                                                        削除
                                                    </Button>
                                                </Group>
                                            </Group>
                                        </Card>
                                    ))}
                                </SimpleGrid>
                            </ScrollArea>
                        </Stack>
                    </Grid>
                </Tabs.Panel>

                <Tabs.Panel value="characters">
                    <ScrollArea h={400}>
                        <SimpleGrid cols={3} spacing="md">
                            {projectState.characters?.map((character) => {
                                const selectedImage = character.images?.find(img => img.isSelected);
                                if (!selectedImage) return null;
                                
                                return (
                                    <Card
                                        key={character.name}
                                        shadow="sm"
                                        padding="sm"
                                        radius="md"
                                        withBorder
                                    >
                                        <Text fw={500} mb="sm" align="center">{character.name}</Text>
                                        <MantineImage
                                            src={selectedImage.url}
                                            height={150}
                                            alt={character.name}
                                            fit="contain"
                                        />
                                        <Button
                                            fullWidth
                                            mt="sm"
                                            onClick={async () => {
                                                await handleCharacterSelect(selectedImage);
                                                onClose(); // モーダルを閉じる
                                            }}
                                        >
                                            追加
                                        </Button>
                                    </Card>
                                );
                            })}
                        </SimpleGrid>
                    </ScrollArea>
                </Tabs.Panel>

                <Tabs.Panel value="info">
                    <Paper p="md" withBorder>
                        <Stack gap="md">
                            <Group>
                                <Text fw={500} size="sm" style={{ width: 100 }}>サイズ:</Text>
                                <Text size="sm">
                                    {Math.round(shape.props.w)} × {Math.round(shape.props.h)} px
                                </Text>
                            </Group>
                            <Group>
                                <Text fw={500} size="sm" style={{ width: 100 }}>位置:</Text>
                                <Text size="sm">
                                    X: {Math.round(shape.x)}px, Y: {Math.round(shape.y)}px
                                </Text>
                            </Group>
                            <Group>
                                <Text fw={500} size="sm" style={{ width: 100 }}>線の太さ:</Text>
                                <Button.Group>
                                    {STROKE_WIDTHS.map((width) => (
                                        <Button
                                            key={width.value}
                                            variant={shape.props.strokeWidth === width.value ? 'filled' : 'light'}
                                            size="xs"
                                            onClick={() => {
                                                editor.updateShape({
                                                    id: shape.id,
                                                    type: 'freeShape',
                                                    props: {
                                                        ...shape.props,
                                                        strokeWidth: width.value
                                                    }
                                                });
                                            }}
                                        >
                                            {width.label}
                                        </Button>
                                    ))}
                                </Button.Group>
                            </Group>
                        </Stack>
                    </Paper>
                </Tabs.Panel>
            </Tabs>
        </Modal>
    );
};