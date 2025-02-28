import {
    DefaultColorStyle,
    DefaultFontStyle,
    DefaultHorizontalAlignStyle,
    DefaultVerticalAlignStyle,
    Geometry2d,
    Polygon2d,
    RecordPropsType,
    ShapeUtil,
    T,
    TLBaseShape,
    TLHandle,
    TLHandleDragInfo,
    TLResizeInfo,
    Vec,
    Editor,
    resizeBox,
    structuredClone,
    useDefaultColorTheme,
    vecModelValidator, IndexKey,
    TLShape,
    TLGroupShape,
    TEXT_PROPS,
    TextLabel,
} from 'tldraw'

export const freeShapeProps = {
    w: T.number,
    h: T.number,
    strokeWidth: T.number,
    color: DefaultColorStyle,
    font: DefaultFontStyle,
    align: DefaultHorizontalAlignStyle,
    verticalAlign: DefaultVerticalAlignStyle,
    text: T.string,
    assetIds: T.arrayOf(T.string),
    selectedAssetIndex: T.number,
    corners: T.arrayOf(vecModelValidator),
    showContent: T.boolean,
}

export type FreeShapeProps = RecordPropsType<typeof freeShapeProps>
export type FreeShape = TLBaseShape<'freeShape', FreeShapeProps>

export class FreeShapeUtil extends ShapeUtil<FreeShape> {
    static override type = 'freeShape' as const

    static override props = freeShapeProps

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    override isAspectRatioLocked = (_shape: FreeShape) => false

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    override canResize = (_shape: FreeShape)  => true

    override canEdit = () => true
    override canBind = () => true
    override canReceiveNewChildrenOfType = () => true
    override canDropShapes = () => true


    // corners は (0,0) -> (1,0) -> (1,1) -> (0,1) で、四隅を表現
    getDefaultProps(): FreeShapeProps {
        return {
            w: 300,
            h: 230,
            color: 'black',
            strokeWidth: 2,
            font: 'draw',
            align: 'middle',
            verticalAlign: 'start',
            text: '',
            assetIds: [],
            selectedAssetIndex: -1,
            corners: [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 1, y: 1 },
                { x: 0, y: 1 },
            ],
            showContent: true,
        }
    }

    /** 設定されているコーナーの絶対座標（shape space）を計算して返す */
    private getAbsoluteCorners(shape: FreeShape) {
        const { w, h, corners } = shape.props
        return corners.map((corner) => {
            // shape.props.w / h に対して [0..1] の相対値
            // => [絶対座標] に変換
            return [corner.x * w, corner.y * h] as [number, number]
        })
    }

    getGeometry(shape: FreeShape): Geometry2d {
        const points = this.getAbsoluteCorners(shape)
        return new Polygon2d({
            points: points.map(([x, y]) => new Vec(x, y)),
            isFilled: true,
        })
    }

    /**
     * 図形の頂点がハンドルとして表示されるように設定
     * corners 配列の各要素がハンドルとなる
     */
    override getHandles(shape: FreeShape): TLHandle[] {
        const absCorners = this.getAbsoluteCorners(shape)
        const handleSize = 16 // ハンドルのサイズ（ピクセル）
        const offset = handleSize // オフセット量

        return absCorners.map(([x, y], i) => {
            const index = `corner-${i}` as IndexKey
            return {
                index: index,
                id: index,
                type: 'vertex',
                // 座標をオフセットして内側に配置
                x: x + (x === 0 ? offset : x === shape.props.w ? -offset : 0),
                y: y + (y === 0 ? offset : y === shape.props.h ? -offset : 0),
                canBind: true,
            }
        })
    }

    /**
     * ハンドルがドラッグされた時の処理
     * corners の相対座標を更新
     */
    override onHandleDrag(shape: FreeShape, info: TLHandleDragInfo<FreeShape>) {
        const { handle } = info
        const corners = structuredClone(shape.props.corners)
        const index = parseInt(handle.id.replace('corner-', ''), 10)
        const handleSize = 16
        const offset = handleSize

        if (isNaN(index)) return shape

        // オフセットを考慮して座標を計算
        let newX = handle.x
        let newY = handle.y

        // オフセットを元に戻す
        if (newX <= offset) newX = 0
        else if (newX >= shape.props.w - offset) newX = shape.props.w
        if (newY <= offset) newY = 0
        else if (newY >= shape.props.h - offset) newY = shape.props.h

        // 相対座標に変換
        corners[index] = {
            x: newX / shape.props.w,
            y: newY / shape.props.h,
        }

        return {
            ...shape,
            props: {
                ...shape.props,
                corners,
            },
        }
    }

    // onBeforeCreate / onBeforeUpdate は必要に応じて実装
    // ここでは特に調整しない例

    /** 実際に描画する部分 */
    component(shape: FreeShape) {
        const { id, type } = shape
        const { color, strokeWidth, font, align, text } = shape.props
        const corners = this.getAbsoluteCorners(shape)
        const pathData = 'M' + corners.map(([x, y]) => `${x},${y}`).join(' L ') + ' Z'
        const isSelected = shape.id === this.editor.getOnlySelectedShapeId()
        const theme = useDefaultColorTheme()

        // Format text if it's valid JSON:
        let formattedText = text;
        try {
            const parsed = JSON.parse(text)
            if (typeof parsed === 'object' && parsed !== null) {
                formattedText = Object.entries(parsed)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n')
            }
        } catch(e) {
            // text is not JSON, do nothing
        }
        

        // 選択中の画像アセットを取得
        const selectedAsset = shape.props.selectedAssetIndex >= 0 && 
            shape.props.assetIds[shape.props.selectedAssetIndex] ?
            this.editor.getAsset(shape.props.assetIds[shape.props.selectedAssetIndex] as any) : 
            null

        return (
            <>
                <svg className="tl-svg-container" style={{ overflow: 'visible' }}>
                    <defs>
                        <clipPath id={`clip-path-${shape.id}`}>
                            <path d={pathData} />
                        </clipPath>
                    </defs>
                    {selectedAsset && selectedAsset.type === 'image' && (
                        <image
                            href={selectedAsset.props.src}
                            width={shape.props.w}
                            height={shape.props.h}
                            clipPath={`url(#clip-path-${shape.id})`}
                            preserveAspectRatio="none"
                        />
                    )}
                    <path
                        d={pathData}
                        strokeWidth={strokeWidth}
                        stroke={theme[color].solid}
                        fill="none"
                    />
                </svg>

                {/* 背景画像がない場合のみ content を表示 */}
                {!selectedAsset && shape.props.showContent && (
                    <TextLabel
                        shapeId={id}
                        type={type}
                        font={font}
                        textWidth={shape.props.w}
                        fontSize={60}
                        lineHeight={TEXT_PROPS.lineHeight}
                        align={align}
                        verticalAlign="middle"
                        text={formattedText}
                        labelColor={theme[color].solid}
                        isSelected={isSelected}
                        wrap
                    />
                )}
            </>
        )
    }
    override onDragShapesOver(frame: FreeShape, shapes: TLShape[]) {
        if (!shapes.every((child) => child.parentId === frame.id)) {
            this.editor.reparentShapes(shapes, frame.id)
        }
    }
    
    override onDragShapesOut(_shape: FreeShape, shapes: TLShape[]): void {
        const parent = this.editor.getShape(_shape.parentId)
        const isInGroup = parent && this.editor.isShapeOfType<TLGroupShape>(parent, 'group')
    
        if (isInGroup) {
            this.editor.reparentShapes(shapes, parent.id)
        } else {
            this.editor.reparentShapes(shapes, this.editor.getCurrentPageId())
        }
    }

    /** 選択時に表示されるインジケーターのアウトライン */
    indicator(shape: FreeShape) {
        const corners = this.getAbsoluteCorners(shape)
        const pathData = 'M' + corners.map(([x, y]) => `${x},${y}`).join(' L ') + ' Z'
        return <path d={pathData} />
    }

    /**
     * バウンディングボックスによるリサイズ処理
     */
    override onResize(shape: FreeShape, info: TLResizeInfo<FreeShape>) {
        // tldraw が標準で提供する resizeBox 関数を使用して
        // 移動・幅・高さを一括で計算
        const resized = resizeBox(shape, info)
        const next = structuredClone(info.initialShape)

        // リサイズ後の x, y, w, h を反映
        next.x = resized.x
        next.y = resized.y
        next.props.w = resized.props.w
        next.props.h = resized.props.h

        // corners は相対座標なので、そのままでも自然にスケールされます
        // （余計な計算は不要）

        return next
    }

    // 境界線を非表示にするためのオーバーライド
    // override hideSelectionBoundsFg = () => true
    // override hideSelectionBoundsBg = () => true
    // override hideResizeHandles = () => true
    // override hideRotateHandle = () => true

    /** 
     * 4点の座標を指定して新しいFreeShapeを作成するためのスタティックメソッド
     * @param points - 4つの頂点の絶対座標 [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
     */
    static create(editor: Editor, points: [number, number][]) {
        if (points.length !== 4) {
            throw new Error('FreeShape requires exactly 4 points')
        }

        // バウンディングボックスを計算
        const xs = points.map(([x]) => x)
        const ys = points.map(([, y]) => y)
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const maxY = Math.max(...ys)

        const w = maxX - minX
        const h = maxY - minY

        // 相対座標に変換
        const corners = points.map(([x, y]) => ({
            x: (x - minX) / w,
            y: (y - minY) / h,
        }))

        // 新しいシェイプを作成
        return editor.createShape<FreeShape>({
            type: 'freeShape',
            x: minX,
            y: minY,
            props: {
                w,
                h,
                color: 'black',
                strokeWidth: 2,
                font: 'draw',
                align: 'middle',
                verticalAlign: 'start',
                text: '',
                corners,
            },
        })
    }

    /** Calculate corners for rectangular shape based on width and height */
    private static getDefaultCorners() {
        return [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 0, y: 1 },
        ]
    }

    /** 背景画像を追加するメソッド */
    static addAsset(shape: FreeShape, assetId: string) {
        return {
            ...shape,
            props: {
                ...shape.props,
                assetIds: [...shape.props.assetIds, assetId],
                selectedAssetIndex: shape.props.selectedAssetIndex === -1 ? 0 : shape.props.selectedAssetIndex,
            },
        }
    }

    /** 表示する背景画像を選択するメソッド */
    selectAsset(shape: FreeShape, index: number) {
        if (index >= -1 && index < shape.props.assetIds.length) {
            return {
                ...shape,
                props: {
                    ...shape.props,
                    selectedAssetIndex: index,
                },
            }
        }
        return shape
    }

    /** 子要素の描画データを合成して黒塗りにする */
    compositeChildren(shape: FreeShape) {
        const children = this.editor.getSortedChildIdsForParent(shape.id)
        const highlightShapes = children
            .map(id => this.editor.getShape(id))
            .filter(shape => shape?.type === 'highlight')

        console.log('highlightShapes: ', highlightShapes);
        

        // highlight の領域を黒塗りに変更
        highlightShapes.forEach(shape => {
            if (!shape) return
            this.editor.updateShapes([{
                id: shape.id,
                type: 'draw',
                props: {
                    ...shape.props,
                    fill: 'solid',
                    color: 'black'
                }
            }])
        })

        return shape
    }

    /** 既存の背景画像に黒塗りを焼きこむ */
    async compositeBackground(shape: FreeShape, prompt: string) {
        const selectedAsset = shape.props.selectedAssetIndex >= 0 &&
            shape.props.assetIds[shape.props.selectedAssetIndex]
            ? this.editor.getAsset(shape.props.assetIds[shape.props.selectedAssetIndex] as any)
            : null

        if (!selectedAsset || selectedAsset.type !== 'image') {
            console.log('Asset error:', { selectedAsset });
            return shape
        }

        const children = this.editor.getSortedChildIdsForParent(shape.id)
        const highlightShapes = children
            .map(id => this.editor.getShape(id))
            .filter(child => child?.type === 'highlight')

        const characters = children
            .map(id => this.editor.getShape(id))
            .filter(child => 
                child?.type === 'freeShape' && 
                child.props.selectedAssetIndex >= 0 && 
                child.props.assetIds[child.props.selectedAssetIndex]
            )
            .map(child => {
                if (!child) return null;
                const asset = this.editor.getAsset(child.props.assetIds[child.props.selectedAssetIndex] as any);
                if (!asset?.type === 'image') return null;
                return {
                    image: asset.props.src,
                    prompt: asset.meta?.prompt || ''
                };
            })
            .filter((char): char is { image: string, prompt: string } => char != null);

        console.log(selectedAsset);

        try {
            let requestBody: any = {
                prompt: selectedAsset.meta.prompt + ", " + prompt,
                backgroundSrc: selectedAsset.props.src,
                characters,
            };

            // Only create and include maskImage if there are highlights
            if (highlightShapes.length > 0) {
                const maskCanvas = document.createElement('canvas')
                maskCanvas.width = shape.props.w
                maskCanvas.height = shape.props.h
                const maskCtx = maskCanvas.getContext('2d')
                if (!maskCtx) {
                    console.error('Failed to get canvas context')
                    return shape
                }

                // Create mask image
                maskCtx.fillStyle = 'black'
                maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)

                maskCtx.fillStyle = 'white'
                maskCtx.strokeStyle = 'white'
                highlightShapes.forEach((highlight) => {
                    if (!highlight?.props.segments) return

                    maskCtx.beginPath()
                    highlight.props.segments.forEach(segment => {
                        segment.points.forEach((point, idx) => {
                            const localX = highlight.x + point.x
                            const localY = highlight.y + point.y
                            if (idx === 0) {
                                maskCtx.moveTo(localX, localY)
                            } else {
                                maskCtx.lineTo(localX, localY)
                            }
                        })
                    })
                    maskCtx.lineCap = 'round'
                    maskCtx.lineJoin = 'round'
                    maskCtx.lineWidth = 16 * 2

                    if (highlight.props.isClosed) {
                        maskCtx.closePath()
                        maskCtx.fill()
                    }
                    maskCtx.stroke()
                })

                const maskImageUrl = maskCanvas.toDataURL('image/png')
                requestBody.maskImage = maskImageUrl;
            }            
            let metaPrompt = '';
            try {
                const content = JSON.parse(shape.props.text);
                metaPrompt = content.background_prompt || '';
            } catch (e) {
                metaPrompt = '';
            }

            const response = await fetch('/api/drawing/image/panel/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            })

            if (!response.ok) {
                throw new Error('Failed to complete image')
            }

            const { images } = await response.json()
            
            // Only use the first image
            const firstImage = images[0]
            const newAssetId = `asset:${Date.now()}`
            const newAsset = {
                id: newAssetId as any,
                typeName: 'asset',
                type: 'image',
                props: {
                    name: 'completed-image',
                    src: firstImage.url,
                    w: shape.props.w,
                    h: shape.props.h,
                    mimeType: 'image/png',
                    isAnimated: false,
                },
                meta: { prompt: firstImage.prompt || metaPrompt }
            }

            this.editor.createAssets([newAsset])
            this.editor.deleteShapes(highlightShapes.map(shape => shape.id))

            // Update shape with new asset
            this.editor.updateShapes([{
                id: shape.id,
                type: shape.type,
                props: {
                    ...shape.props,
                    assetIds: [...shape.props.assetIds, newAssetId],
                    selectedAssetIndex: shape.props.assetIds.length,
                },
            }])

            return shape
        } catch (error) {
            console.error('Complete area error:', error)
            return shape
        }
    }
}
