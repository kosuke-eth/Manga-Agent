import {DefaultToolbar, TldrawUiMenuItem, useIsToolSelected, useTools, useEditor, DefaultSizeStyle} from "tldraw";
import React from "react";

export function CustomToolbar() {
    const tools = useTools()
    const isDrawSelected = useIsToolSelected(tools['draw'])
    const isSelectSelected = useIsToolSelected(tools['select'])
    const isHandSelected = useIsToolSelected(tools['hand'])
    const isSpeechBubbleSelected = useIsToolSelected(tools['speechBubble'])
    const isFreeShapeSelected = useIsToolSelected(tools['freeShape'])
    const isEraserSelected = useIsToolSelected(tools['eraser'])
    const isHighlightSelected = useIsToolSelected(tools['highlight'])


    return (
        <div>
            <DefaultToolbar>
                {/*<TldrawUiMenuItem {...tools['line']} isSelected={isLineSelected} />*/}
                {/*<TldrawUiMenuItem {...tools['rectangle']} isSelected={isRectangleSelected} />*/}
                <TldrawUiMenuItem {...tools['freeShape']} isSelected={isFreeShapeSelected} />
                {/*<TldrawUiMenuItem {...tools['asset']} isSelected={isAssetSelected} />*/}
                {/*<TldrawUiMenuItem {...tools['frame']} isSelected={isFrameSelected} />*/}
                <TldrawUiMenuItem {...tools['speechBubble']} isSelected={isSpeechBubbleSelected} />

                <TldrawUiMenuItem {...tools['draw']} isSelected={isDrawSelected} />

                <TldrawUiMenuItem {...tools['highlight']} isSelected={isHighlightSelected} />
                <TldrawUiMenuItem {...tools['eraser']} isSelected={isEraserSelected} />

                <TldrawUiMenuItem {...tools['hand']} isSelected={isHandSelected} />
                <TldrawUiMenuItem {...tools['select']} isSelected={isSelectSelected} />
                {/*<DefaultToolbarContent />*/}
            </DefaultToolbar>
        </div>
    )
}
