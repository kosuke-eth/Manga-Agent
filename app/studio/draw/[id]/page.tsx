"use client";

import React from "react";
import {
    Tldraw,
    TLEditorComponents,
    SVGContainer,
    TLComponents,
    TLUiOverrides, TLUiAssetUrlOverrides,
    Editor,
} from "tldraw";
import "tldraw/tldraw.css";
import Sidebar from "@/app/studio/draw/_components/leftBar/Sidebar";
import {FreeShapeTool, SpeechTextTool} from "@/app/studio/draw/_tools/MyCustomTool";
import {ContextToolbarComponent} from "@/app/studio/draw/_contexts/ContextToolbar";
import {CustomToolbar} from "@/app/studio/draw/_tools/CustomToolbar";
import {CustomContextMenu} from "@/app/studio/draw/_contexts/CustomContextMenu";
import { createB5Frame } from "@/app/studio/draw/_objects/mangaPage";
import {Chat} from "@/app/studio/draw/_components/rightBar/Chat";
import {useProjectContext} from "@/app/studio/draw/ProjectProvider";
import {FreeShapeUtil} from "@/app/studio/draw/_objects/panel/FreeShapeUtil";
import { SpeechTextUtil } from "../_objects/bubble/SpeechText";
import { Center } from "@mantine/core";



// 定数をコンポーネントの外に移動し、useMemoで再生成を防ぐ
const shapeUtils = [FreeShapeUtil, SpeechTextUtil]
const customTools = [FreeShapeTool, SpeechTextTool]
const customAssetUrls: TLUiAssetUrlOverrides = {
    icons: {
        'heart': 'https://emojicdn.elk.sh/❤️',
        'chat': 'https://emojicdn.elk.sh/💬',
    },
};

// ローディングコンポーネントの定義
const LoadingScreen = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}>
    <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(0, 0, 0, 0.6)'
    }} />
    <Center style={{height: '100vh', position: 'relative', zIndex: 10}} c="white">
        Loading Project...
    </Center>
</div>
);

const MemoizedSidebar = Sidebar;
const MemoizedChat = Chat;

export default function TlDrawPage() {

    // コンポーネントをメモ化
    const MemoizedContextToolbarComponent = React.memo(ContextToolbarComponent);

    // uiOverridesをメモ化
    const uiOverrides: TLUiOverrides = React.useMemo(() => ({
        tools(editor, tools) {
            tools.freeShape = {
                id: 'freeShape',
                icon: 'geo-rectangle',
                label: 'Free Shape',
                kbd: 'f',
                onSelect: () => {
                    editor.setCurrentTool('freeShape')
                },
            }
            tools.speechBubble = {
                id: 'speechText',
                icon: 'chat',
                label: 'Speech Text',
                kbd: 'b',
                onSelect: () => {
                    editor.setCurrentTool('speechText')
                },
            }
            return tools
        },
    }), []);

    // tlDrawComponentsをメモ化
    const tlDrawComponents: TLComponents = React.useMemo(() => ({
        ActionsMenu: null,
        MainMenu: null,
        PageMenu: null,
        QuickActions: null,
        StylePanel: null,
        HelpMenu: null,
        DebugMenu: null,
        ContextMenu: CustomContextMenu,
        Toolbar: CustomToolbar,
        KeyboardShortcutsDialog: null,
        NavigationPanel: null,
        ZoomMenu: null,
    }), []);

    const {isLoading, setEditor} = useProjectContext();
    const hasInitialized = React.useRef(false);

    // componentsをuseMemoで最適化
    const components: TLEditorComponents = React.useMemo(() => ({
        InFrontOfTheCanvas: () => {
            return (
                <>
                    <MemoizedContextToolbarComponent/>
                </>
            )
        },
        ...tlDrawComponents
    }), []);

    // onMountをuseCallbackで最適化
    const handleMount = React.useCallback((editorInstance: Editor) => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;
        editorInstance.setCameraOptions({
            zoomSteps: [0.1, 0.5, 1, 2],
        });
        createB5Frame(editorInstance, 'page-1', 'Page 1');
        setEditor(editorInstance);
    }, [setEditor]);

    return (
        <>
            {isLoading && <LoadingScreen />}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                width: '100vw',
                height: '100vh',
            }}>
                <MemoizedSidebar />
                <div style={{position: 'relative', height: '100vh'}}>
                    <Tldraw
                        shapeUtils={shapeUtils}
                        tools={customTools}
                        overrides={uiOverrides}
                        assetUrls={customAssetUrls}
                        components={components}
                        onMount={handleMount}
                    />
                </div>
                <MemoizedChat />
            </div>
        </>
    );
}