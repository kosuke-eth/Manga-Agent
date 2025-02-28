// 要素選択時に表示されるツールバー
import {
    track,
    useEditor,
} from "tldraw";
import { useState } from "react";
import { PanelDetailModal } from "../_tools/PanelDetailModal";
import { FreeShape, FreeShapeUtil } from "../_objects/panel/FreeShapeUtil";
import { useProjectContext } from '../ProjectProvider';

const BORDER_STYLES = [
    { value: 'none', label: '枠なし' },
    { value: 'rectangle', label: '四角' },
    { value: 'round', label: '楕円' },
] as const

export const ContextToolbarComponent = track(() => {
    const editor = useEditor()
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { projectState } = useProjectContext();
    const showToolbar = editor.isIn('select.idle')
    if (!showToolbar) return null

    const selectionRotatedPageBounds = editor.getSelectionRotatedPageBounds()
    if (!selectionRotatedPageBounds) return null

    const selectedShapes = editor.getSelectedShapes()
    if (selectedShapes.length === 0) return null

    const firstShape = selectedShapes[0]
    const shapeType = firstShape.type

    const currentStrokeWidth = firstShape.type === 'freeShape' ? firstShape.props.strokeWidth : undefined

    const pageCoordinates = editor.pageToViewport(selectionRotatedPageBounds.point)

    // シェイプタイプに応じてツールバーの内容を変更
    const renderToolbarContent = () => {
        if (shapeType === 'speech-text') {
            return (
                <>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 32,
                            padding: '0 8px',
                            cursor: 'pointer',
                        }}
                        onClick={() => {
                            editor.updateShapes([{
                                id: firstShape.id,
                                type: 'speech-text',
                                props: {
                                    ...firstShape.props,
                                    isVertical: !firstShape.props.isVertical
                                }
                            }])
                        }}
                    >
                        {firstShape.props.isVertical ? '横書き' : '縦書き'}
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 32,
                            padding: '0 8px',
                            cursor: 'pointer',
                        }}
                        onClick={() => {
                            const currentStyle = firstShape.props.borderStyle
                            const currentIndex = BORDER_STYLES.findIndex(s => s.value === currentStyle)
                            const nextIndex = (currentIndex + 1) % BORDER_STYLES.length
                            const nextStyle = BORDER_STYLES[nextIndex].value

                            editor.updateShapes([{
                                id: firstShape.id,
                                type: 'speech-text',
                                props: {
                                    ...firstShape.props,
                                    borderStyle: nextStyle
                                }
                            }])
                        }}
                    >
                        {BORDER_STYLES.find(s => s.value === firstShape.props.borderStyle)?.label}
                    </div>
                </>
            )
        }

        if (shapeType === 'freeShape') {
            return (
                <>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 32,
                            padding: '0 8px',
                            cursor: 'pointer',
                        }}
                        onClick={() => setIsModalOpen(true)}
                    >
                        詳細
                    </div>
                </>
            )
        }

        if (shapeType === 'draw') {
            const currentFill = firstShape.props.fill ?? 'none'
            // 始点と終点の距離が20px以内なら閉じていると判定
            const isAlmostClosed = () => {
                const points = firstShape.props.segments.flatMap(seg => seg.points)
                if (points.length < 2) return false
                const start = points[0]
                const end = points[points.length - 1]
                return Math.hypot(end.x - start.x, end.y - start.y) < 20
            }
            const isClosed = firstShape.props.isClosed || isAlmostClosed()

            return (
                <>
                    {isClosed && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: 32,
                                padding: '0 8px',
                                background: currentFill === 'semi' ? 'var(--color-muted-2)' : 'transparent',
                                cursor: 'pointer',
                            }}
                            onClick={() => {
                                const nextProps = {
                                    id: firstShape.id,
                                    type: 'draw',
                                    props: {
                                        ...firstShape.props,
                                        fill: currentFill === 'none' ? 'semi' : 'none',
                                        size: "m",
                                        isClosed: true,
                                        color: 'black',
                                    }
                                }
                                editor.updateShapes([nextProps])
                            }}
                        >
                            塗り
                        </div>
                    )}
                </>
            )
        }
        return null
    }

    return (
        <>
            <div
                style={{
                    position: 'absolute',
                    pointerEvents: 'all',
                    top: pageCoordinates.y - 42,
                    left: pageCoordinates.x,
                    width: selectionRotatedPageBounds.width * editor.getZoomLevel(),
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
                onPointerDown={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        borderRadius: 8,
                        display: 'flex',
                        boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)',
                        background: 'var(--color-panel)',
                        width: 'fit-content',
                        alignItems: 'center',
                    }}
                >
                    {renderToolbarContent()}
                </div>
            </div>
            {selectedShapes.length === 1 && (
                <PanelDetailModal 
                    shapeId={selectedShapes[0].id}
                    onClose={() => setIsModalOpen(false)}
                    opened={isModalOpen}
                />
            )}
        </>
    )
})


