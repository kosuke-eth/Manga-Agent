import { Editor, createShapeId } from "tldraw";

export const createB5Frame = (editor: Editor, pageId: string, pageName: string) => {
    // B5サイズ: 176 x 250 mm = 665 x 944 pixels
    const frameWidth = 665 * 2;
    const frameHeight = 944 * 2;

    const frameId = createShapeId(`frame-${pageId}`);
    editor.createShape({
        id: frameId,
        type: 'frame',
        x: 0,
        y: 0,
        props: {
            w: frameWidth,
            h: frameHeight,
            name: pageName,
        }
    });

    editor.zoomToBounds(
        editor.getShapePageBounds(frameId)!,
        {
            targetZoom: 0.5
        }
    );

    return frameId;
};