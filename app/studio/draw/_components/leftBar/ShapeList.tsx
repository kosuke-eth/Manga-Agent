import { Box, Flex, TextInput, Button } from '@mantine/core';
import {useState} from 'react';
import { Editor, TLShapeId, useValue } from 'tldraw';
import {capitalize} from "lodash";
import { IconChevronRight, IconChevronDown, IconPhoto, IconFileText, IconEye, IconEyeOff, IconEdit } from '@tabler/icons-react';

const selectedBg = '#E8F4FE';
const childSelectedBg = '#F3F9FE';
const childBg = '#00000006';

function ShapeItem({
                       editor,
                       shapeId,
                       depth,
                       parentIsSelected,
                       parentIsHidden,
                   }: {
    editor: Editor;
    shapeId: TLShapeId;
    depth: number;
    parentIsSelected?: boolean;
    parentIsHidden?: boolean;
}) {

    const shape = useValue('shape', () => editor.getShape(shapeId), [editor]);
    const children = useValue('children', () => editor.getSortedChildIdsForParent(shapeId), [editor]);
    const isHidden = useValue('isHidden', () => editor.isShapeHidden(shapeId), [editor]);
    const isSelected = useValue('isSelected', () => editor.getSelectedShapeIds().includes(shapeId), [editor]);
    const shapeName = useValue('shapeName', () => getShapeName(editor, shapeId), [editor]);

    const [isEditingName, setIsEditingName] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isEditingContent, setIsEditingContent] = useState(false);

    if (!shape) return null;

    const hasChildren = children && children.length > 0;
    const isFreeShape = shape?.type === 'freeShape';
    const ShapeIcon = isFreeShape ? IconPhoto : IconFileText;
    // すべての階層で同じサイズのアイコンを使用
    const ICON_SIZE = 16;
    const toggleIcon = hasChildren ? (isCollapsed ? <IconChevronRight size={ICON_SIZE} /> : <IconChevronDown size={ICON_SIZE} />) : null;

    return (
        <Box className="shape-item-container">
            {!!shape && (
                <>
                    <Flex
                        className="shape-item"
                        onDoubleClick={() => setIsEditingName(true)}
                        onClick={() => {
                            editor.setCurrentTool('select');
                            if (editor.inputs.ctrlKey || editor.inputs.shiftKey) {
                                if (isSelected) {
                                    editor.deselect(shape);
                                } else {
                                    editor.select(...editor.getSelectedShapes(), shape);
                                }
                            } else {
                                editor.select(shape);
                            }
                        }}
                        style={{
                            paddingLeft: 10 + depth * 20,
                            opacity: parentIsHidden || isHidden ? 0.5 : 1,
                            background: isSelected
                                ? selectedBg
                                : parentIsSelected
                                    ? childSelectedBg
                                    : depth > 0
                                        ? childBg
                                        : undefined,
                            marginBottom: hasChildren && !isCollapsed ? 8 : 4, // 子要素があるときは余白を増やす
                        }}
                        align="center"
                        justify="space-between"
                        px={10}
                        py={6}
                    >
                        {isEditingName ? (
                            <TextInput
                                autoFocus
                                className="shape-name-input"
                                defaultValue={shapeName}
                                onBlur={() => setIsEditingName(false)}
                                onChange={(ev) => {
                                    if (shape.type === 'frame') {
                                        editor.updateShape({ ...shape, props: { name: ev.target.value } });
                                    } else {
                                        editor.updateShape({ ...shape, meta: { name: ev.target.value } });
                                    }
                                }}
                                onKeyDown={(ev) => {
                                    if (ev.key === 'Enter' || ev.key === 'Escape') {
                                        ev.currentTarget.blur();
                                    }
                                }}
                                styles={{ input: { border: 'none', background: 'none', flexGrow: 1, padding: 0 } }}
                            />
                        ) : (
                            <Flex align="center" gap="sm" style={{ width: '100%' }}>
                                <span 
                                    style={{ 
                                        width: '20px', 
                                        cursor: hasChildren ? 'pointer' : 'default',
                                        display: 'flex',
                                        alignItems: 'center',
                                        flexShrink: 0  // アイコンが縮小されるのを防ぐ
                                    }}
                                    onClick={(e) => {
                                        if (hasChildren) {
                                            e.stopPropagation();
                                            setIsCollapsed(!isCollapsed);
                                        }
                                    }}
                                >
                                    {toggleIcon}
                                </span>
                                <span style={{ flexShrink: 0 }}><ShapeIcon size={ICON_SIZE} /></span>
                                <Box className="shape-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1 }}>
                                    {shapeName}
                                </Box>
                                {isFreeShape && (
                                    <Flex gap="xs">
                                        <Button
                                            variant="subtle"
                                            size="xs"
                                            px={6}
                                            onClick={(ev) => {
                                                ev.stopPropagation();
                                                editor.updateShape({
                                                    ...shape,
                                                    props: {
                                                        ...shape.props,
                                                        showContent: !shape.props.showContent
                                                    }
                                                });
                                            }}
                                        >
                                            {shape.props.showContent ? <IconEye size={16} /> : <IconEyeOff size={16} />}
                                        </Button>
                                        <Button
                                            variant="subtle"
                                            size="xs"
                                            px={6}
                                            onClick={(ev) => {
                                                ev.stopPropagation();
                                                setIsEditingContent(true);
                                            }}
                                        >
                                            <IconEdit size={16} />
                                        </Button>
                                    </Flex>
                                )}
                            </Flex>
                        )}
                    </Flex>
                    {isFreeShape && isEditingContent && (
                        <Box px={10} py={6} style={{ marginTop: 4 }}>
                            <TextInput
                                autoFocus
                                defaultValue={shape.props.text || ''}
                                onBlur={() => setIsEditingContent(false)}
                                onChange={(ev) => {
                                    editor.updateShape({
                                        ...shape,
                                        props: {
                                            ...shape.props,
                                            text: ev.target.value
                                        }
                                    });
                                }}
                                onKeyDown={(ev) => {
                                    if (ev.key === 'Enter' || ev.key === 'Escape') {
                                        ev.currentTarget.blur();
                                    }
                                }}
                            />
                        </Box>
                    )}
                </>
            )}
            {!!children?.length && !isCollapsed && (
                <Box 
                    className="children-container" 
                    style={{
                        marginLeft: 4,
                        paddingLeft: 12,
                        borderLeft: '1px solid #E9ECEF',
                    }}
                >
                    <ShapeList
                        editor={editor}
                        shapeIds={children}
                        depth={depth + 1}
                        parentIsHidden={parentIsHidden || isHidden}
                        parentIsSelected={parentIsSelected || isSelected}
                    />
                </Box>
            )}
        </Box>
    );
}

export function ShapeList({
                              editor,
                              shapeIds,
                              depth,
                              parentIsSelected,
                              parentIsHidden,
                          }: {
    editor: Editor;
    shapeIds: TLShapeId[];
    depth: number;
    parentIsSelected?: boolean;
    parentIsHidden?: boolean;
}) {
    // Filter to show only freeShapes and frames at root level
    const filteredShapeIds = shapeIds.filter(id => {
        const shape = editor.getShape(id);
        return shape && (
            depth > 0 || // Show all shapes inside panels
            shape.type === 'freeShape' || // Show panels
            shape.type === 'frame' // Show frames
        );
    });

    if (!filteredShapeIds.length) return null;

    return (
        <Box className="shape-tree" style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredShapeIds.map((shapeId) => (
                <ShapeItem 
                    editor={editor} 
                    key={shapeId} 
                    shapeId={shapeId} 
                    depth={depth} 
                    parentIsHidden={parentIsHidden} 
                    parentIsSelected={parentIsSelected} 
                />
            ))}
        </Box>
    );
}

function getShapeName(editor: Editor, shapeId: TLShapeId) {
    const shape = editor.getShape(shapeId);
    if (!shape) return 'Unknown shape';
    
    // For freeShape, show panel number or content preview
    if (shape.type === 'freeShape') {
        const text = shape.props.text;
        return text ? `Panel: ${text.slice(0, 20)}...` : 'Empty Panel';
    }
    
    return (
        (shape.meta.name as string) ||
        editor.getShapeUtil(shape).getText(shape) ||
        capitalize(shape.type + ' shape')
    );
}
