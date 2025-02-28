import React, { useState } from 'react';
import { Box, Group, Tooltip, Center } from '@mantine/core';
import { IconRefresh, IconAdjustments, IconBook, IconLayoutGrid, IconMessages, IconBrush } from '@tabler/icons-react';
import { useProjectContext } from '../../ProjectProvider';
import { useValue } from 'tldraw';

export const SelectedShapePreview = () => {
    const { editor } = useProjectContext();
    const [selectedTool, setSelectedTool] = useState<'edit' | 'variation' | 'expand' | null>(null);

    const selectedShapeIds = useValue(
        'selectedShapeIds',
        () => editor?.getSelectedShapeIds() ?? [],
        [editor]
    );

    const shapeCount = selectedShapeIds.length;
    if (shapeCount === 0) return null;

    if (shapeCount === 1) {
        const shape = editor?.getShape(selectedShapeIds[0]);
        if (shape?.type === 'freeShape') {
            const selectedAsset = shape.props.selectedAssetIndex >= 0 && 
                shape.props.assetIds[shape.props.selectedAssetIndex] ?
                editor?.getAsset(shape.props.assetIds[shape.props.selectedAssetIndex] as any) : 
                null;
            const children = editor?.getSortedChildIdsForParent(shape.id);
            const hasChildren = children?.length > 0;

            return (
                <Center mb="xs">
                    <Group grow gap="md">
                        {/* <Tooltip label="選択中の画像を編集" withArrow>
                            <Box
                                onClick={() => setSelectedTool(selectedTool === 'edit' ? null : 'edit')}
                                onDoubleClick={() => setSelectedTool(null)}
                                style={{ cursor: 'pointer', color: selectedTool === 'edit' ? 'blue' : 'black' }}
                            >
                                <IconAdjustments size={32} />
                            </Box>
                        </Tooltip>
                        <Tooltip label="バリエーションを生成" withArrow>
                            <Box
                                onClick={() => setSelectedTool(selectedTool === 'variation' ? null : 'variation')}
                                style={{ cursor: 'pointer', color: selectedTool === 'variation' ? 'blue' : 'black' }}
                            >
                                <IconRefresh size={32} />
                            </Box>
                        </Tooltip> */}
                        {selectedAsset && selectedAsset.type === 'image' && hasChildren && (
                            <Tooltip label="画像を合成" withArrow>
                                <Box
                                    onClick={() => setSelectedTool(selectedTool === 'composite' ? null : 'composite')}
                                    style={{ cursor: 'pointer', color: selectedTool === 'composite' ? 'blue' : 'black' }}
                                >
                                    <IconBrush size={32} />
                                </Box>
                            </Tooltip>
                        )}
                    </Group>
                </Center>
            );
        }
    }
    return null;
};

export const ChatActions = React.memo(({ 
    onSelect, 
    selectedCommand, 
    setSelectedCommand 
}: { 
    onSelect: (command: string) => void;
    selectedCommand: string;
    setSelectedCommand: (command: string) => void;
}) => {
    return (
        <Center mb="xs">
            <Group grow gap="md">
                <Tooltip label="物語の相談・提案" withArrow>
                    <Box
                        onClick={() => {
                            const newCommand = selectedCommand === 'story' ? '' : 'story';
                            setSelectedCommand(newCommand);
                            onSelect('');
                        }}
                        style={{ cursor: 'pointer', color: selectedCommand === 'story' ? 'blue' : 'black' }}
                    >
                        <IconMessages size={32} />
                    </Box>
                </Tooltip>
                <Tooltip label="コマ割りの提案" withArrow>
                    <Box
                        onClick={() => {
                            const newCommand = selectedCommand === 'panel' ? '' : 'panel';
                            setSelectedCommand(newCommand);
                            onSelect('');
                        }}
                        style={{ cursor: 'pointer', color: selectedCommand === 'panel' ? 'blue' : 'black' }}
                    >
                        <IconLayoutGrid size={32} />
                    </Box>
                </Tooltip>
            </Group>
        </Center>
    );
});
