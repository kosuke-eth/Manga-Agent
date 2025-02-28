import {
    TLDefaultFontStyle,
    TLShapeId,
    preventDefault, 
    stopEventPropagation
} from '@tldraw/editor'
import React, { useEffect, useState } from 'react'
// import { TextHelpers } from './TextHelpers'
import { useEditableText } from 'tldraw'

export interface TextLabelVerticalProps {
    shapeId: TLShapeId
    type: string
    text: string
    labelColor: string
    font?: TLDefaultFontStyle
    fontSize?: number
    lineHeight?: number
    isSelected: boolean
    padding?: number
    style?: React.CSSProperties
    isVertical?: boolean
}

export const TextLabelVertical = React.memo(function TextLabelVertical({
    shapeId,
    type,
    text,
    labelColor,
    font = 'draw',
    fontSize = 16,
    lineHeight = 1.5,
    isSelected,
    padding = 8,
    style,
    isVertical = true,
}: TextLabelVerticalProps) {
    const { rInput, isEmpty, isEditing, isEditingAnything, ...editableTextRest } = useEditableText(
        shapeId,
        type,
        text
    )

    const [initialText, setInitialText] = useState(text)

    useEffect(() => {
        if (!isEditing) setInitialText(text)
    }, [isEditing, text])

    const finalText = text //TextHelpers.normalizeTextForDom(text)
    const hasText = finalText.length > 0

    const baseStyles = {
        writingMode: isVertical ? 'vertical-rl' as const : 'horizontal-tb' as const,
        textOrientation: isVertical ? 'upright' as const : 'mixed' as const,
        width: '100%',
        height: '100%',
        padding,
        fontSize,
        lineHeight: `${lineHeight}`,
        color: labelColor,
    }

    if (isEditing) {
        return (
            <div
                className="tl-text-vertical-wrapper"
                data-font={font}
                data-isediting={true}
                style={{
                    position: 'relative',
                    ...style,
                }}
            >
                <textarea
                    ref={rInput}
                    className="tl-text tl-text-input"
                    name="text"
                    tabIndex={-1}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    autoSave="off"
                    placeholder=""
                    spellCheck="true"
                    wrap="off"
                    dir="auto"
                    defaultValue={text}
                    style={{
                        width: '100%',
                        height: '100%',
                        resize: 'none',
                        border: 'none',
                        padding: padding,
                        background: style?.backgroundColor || '#efefef',
                        fontSize,
                        lineHeight: `${lineHeight}`,
                        color: labelColor,
                    }}
                    onFocus={editableTextRest.handleFocus}
                    onChange={editableTextRest.handleChange}
                    onKeyDown={editableTextRest.handleKeyDown}
                    onBlur={editableTextRest.handleBlur}
                    onTouchEnd={stopEventPropagation}
                    onContextMenu={stopEventPropagation}
                    onPointerDown={editableTextRest.handleInputPointerDown}
                    onDoubleClick={editableTextRest.handleDoubleClick}
                    onDragStart={preventDefault}
                />
            </div>
        )
    }

    if (!hasText) {
        return null
    }

    return (
        <div
            className="tl-text-vertical-wrapper"
            data-font={font}
            data-hastext={!isEmpty}
            data-isediting={false}
            data-isselected={isSelected}
            style={{
                ...baseStyles,
                ...style,
            }}
        >
            <div className="tl-text-vertical-content">
                {finalText.split('\n').map((line, index) => (
                    <div key={index} dir="auto">
                        {line || ' '}
                    </div>
                ))}
            </div>
        </div>
    )
})