import { BaseBoxShapeTool, StateNode, TLShapeId, createShapeId } from 'tldraw'


export class FreeShapeTool extends StateNode {
    static override id = 'freeShape'

    // ドラッグ開始時の形状IDを保持
    shapeId: string | null = null

    override onPointerDown() {
        const { currentPagePoint } = this.editor.inputs

        // 形状を作成し、IDを保持
        const shapeId = createShapeId()
        this.editor.createShape({
            id: shapeId,
            type: 'freeShape',
            x: currentPagePoint.x,
            y: currentPagePoint.y,
            props: {
                w: 200,
                h: 200
            }
        })

        this.shapeId = shapeId
        // this.openImageSelector()
    }

    override onPointerMove() {
        if (!this.shapeId) return

        const shape = this.editor.getShape(this.shapeId as TLShapeId)
        if (!shape) return

        // マウスの現在位置と形状の開始位置との差分を計算
        const { currentPagePoint } = this.editor.inputs
        const initialPoint = {
            x: shape.x,
            y: shape.y
        }

        // 幅と高さを計算（負の値にならないように）
        const width = Math.max(1, currentPagePoint.x - initialPoint.x)
        const height = Math.max(1, currentPagePoint.y - initialPoint.y)

        // 形状のサイズを更新
        this.editor.updateShape({
            id: this.shapeId as TLShapeId,
            type: 'freeShape',
            props: {
                w: width,
                h: height
            }
        })
    }

    override onPointerUp() {
        if (!this.shapeId) return
        this.editor.setCurrentTool('select')
        this.shapeId = null
    }
}

export class SpeechTextTool extends BaseBoxShapeTool {
    static override id = 'speechText'
    static override initial = 'idle'
    override shapeType = 'speech-text'
}
