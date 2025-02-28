"use client";
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from "react";
import { Editor, TLPageId, TLEventMapHandler, TLShapeId, getSnapshot, loadSnapshot } from "tldraw";
import { ProjectState, PageData, PanelResponse, PanelRequest, Message, StoryResponse, StorySuggestion, Point } from "@/types/project";
import { createB5Frame } from "./_objects/mangaPage";
import { createSuggestionApplier } from "./suggestions/appliers";
import { FreeShape } from "./_objects/panel/FreeShapeUtil";
import { deepMerge } from "@/lib/utils";

interface ProjectContextProps {
    editor: Editor | null;
    setEditor: (editor: Editor | null) => void;
    projectState: ProjectState;
    setProjectState: (newState: Partial<ProjectState>) => void;
    addCharacter: (name: string, traits: string) => void;
    updatePageStory: (pageId: TLPageId, story: string) => void;
    generatePanels: (pageId: TLPageId, message: string) => Promise<void>;
    getCurrentPageData: (pageId: TLPageId) => PageData;
    updateChatSession: (tabValue: string, messages: Message[]) => void;
    getChatSession: (tabValue: string) => Message[];
    createPage: () => TLPageId;
    deletePage: (pageId: TLPageId) => void;
    generateStory: (message: string) => Promise<Message>;
    applyStorySuggestion: (suggestion: StorySuggestion) => void;
    getPages: () => { id: TLPageId; name: string; story: string }[];
    isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextProps | undefined>(undefined);

export const useProjectContext = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error("useProjectContext must be used within a ProjectProvider");
    }
    return context;
};

interface ProjectProviderProps {
    children: ReactNode;
    projectId: string;
}

export const ProjectProvider = ({ children, projectId }: ProjectProviderProps) => {
    const [editor, setEditor] = useState<Editor | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [projectState, setProjectStateInternal] = useState<ProjectState>({
        story: {
            title: "",
            summary: "",
        },
        characters: [],
        characterImages: {},
        loadingImages: {},
        chatSessions: {},
    });

    useEffect(() => {
        const fetchProjectState = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/project/${projectId}`);
                const data = await response.json();                
                if (data) {
                    const initialState: ProjectState = {
                        story: {
                            title: data.title || "",
                            summary: data.summary || "",
                        },
                        characters: data.characters.map((char: any) => ({
                            ...char,
                            images: char.images || []
                        })) || [],
                        characterImages: {},
                        loadingImages: {},
                        chatSessions: {},
                    };
                    
                    setProjectStateInternal(initialState);
                    if (editor && data.tldrawState) {
                        loadSnapshot(editor.store, data.tldrawState);
                    }
                }
            } catch (error) {
                console.error("Error fetching project state:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjectState();
    }, [projectId, editor]);

    // 未保存の変更があるかどうかを追跡
    const hasUnsavedChanges = useRef(false);
    
    // エディタの変更を監視
    useEffect(() => {
        if (!editor) return;
        
        const handleStoreChange: TLEventMapHandler<'change'> = (change) => {
            // 追加された要素をチェック
            for (const record of Object.values(change.changes.added)) {
                if (record.typeName === 'shape') {
                    hasUnsavedChanges.current = true;
                }
            }
            // 更新された要素をチェック
            for (const [from, to] of Object.values(change.changes.updated)) {
                if (from.typeName === 'instance' && to.typeName === 'instance' && 
                    from.currentPageId !== to.currentPageId) {
                    hasUnsavedChanges.current = true;
                } else if (from.id.startsWith('shape') && to.id.startsWith('shape')) {
                    hasUnsavedChanges.current = true;
                }
            }
            // 削除された要素をチェック
            for (const record of Object.values(change.changes.removed)) {
                if (record.typeName === 'shape') {
                    hasUnsavedChanges.current = true;
                }
            }
        };
        const cleanupFunction = editor.store.listen(handleStoreChange, { 
            source: 'user',
            scope: 'all' 
        });
        return () => {
            cleanupFunction();
        };
    }, [editor]);
    
    const saveProjectToDB = useCallback(async () => {
        if (!editor) {
            console.error("Editor is not initialized");
            return;
        }
        
        try {
            const snapshot = getSnapshot(editor.store);
            const payload = {
                ...projectState,
                tldrawState: snapshot
            };

            await fetch(`/api/project/${projectId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            hasUnsavedChanges.current = false;
            // console.log('Project saved successfully:', payload);
        } catch (error) {
            console.error("Error saving project:", error);
            throw error;
        }
    }, [editor, projectState, projectId]);

    // 自動保存の処理を修正
    useEffect(() => {
        if (!editor) return;

        let saveInterval: NodeJS.Timeout;

        const setupAutoSave = () => {
            saveInterval = setInterval(async () => {
                if (hasUnsavedChanges.current) {
                    try {
                        await saveProjectToDB();
                    } catch (error) {
                        console.error('Auto-save failed:', error);
                    }
                }
            }, 30000); // 30秒に1回
        };

        setupAutoSave();

        return () => {
            if (saveInterval) clearInterval(saveInterval);
        };
    }, [editor, saveProjectToDB]);

    // また、ページを離れる前に未保存の変更があれば警告
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges.current) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const getPageMeta = useCallback((pageId: TLPageId): PageData | undefined => {
        if (!editor) return undefined;
        const page = editor.getPage(pageId);
        return page?.meta as PageData;
    }, [editor]);

    const updatePageMeta = useCallback((pageId: TLPageId, meta: Partial<PageData>) => {
        if (!editor) return;
        const page = editor.getPage(pageId);
        if (!page) return;

        editor.updatePage({
            id: pageId,
            meta: {
                ...page.meta,
                ...meta,
            },
        });
    }, [editor]);

    const updatePageStory = useCallback((pageId: TLPageId, story: string) => {
        updatePageMeta(pageId, { story });
    }, [updatePageMeta]);

    const getPagePanels = useCallback((pageId: TLPageId) => {
        if (!editor) return [];
        
        // ページ上の全シェイプIDを取得
        const shapeIds = editor.getPageShapeIds(pageId);
        
        // フレームを探す
        let frameId: TLShapeId | undefined;
        for (const id of shapeIds) {
            const shape = editor.getShape(id);
            if (shape?.type === 'frame') {
                frameId = id;
                break;
            }
        }
        
        if (!frameId) return [];

        // フレーム内のfreeShapeを取得
        return editor.getSortedChildIdsForParent(frameId)
            .map(id => editor.getShape(id))
            .filter((shape): shape is FreeShape => 
                shape?.type === 'freeShape'
            );
    }, [editor]);

    // 新しいヘルパー関数を追加
    const checkAndFixCrossing = (points: Point[]) => {
        // 多角形が時計回りか反時計回りかを判定
        const area = points.reduce((sum, point, i) => {
            const nextPoint = points[(i + 1) % points.length];
            return sum + (nextPoint.x - point.x) * (nextPoint.y + point.y);
        }, 0);
    
        // 時計回りの場合は反時計回りに修正
        if (area < 0) {
            points = [...points].reverse();
        }
    
        // 凸包を計算して交差を解消
        const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    
        // 中心点からの角度でソート
        return points.sort((a, b) => 
            Math.atan2(a.y - centerY, a.x - centerX) - 
            Math.atan2(b.y - centerY, b.x - centerX)
        );
    };

    const generatePanels = async (pageId: TLPageId, message: string) => {
        if (!editor) return;
      
        try {
            const currentPage = getPageMeta(pageId) || { story: "" };
            const currentPanels = getPagePanels(pageId);
            const scaledPanelData = currentPanels.map((panel) => {
                const frame = editor?.getShape(panel.parentId);
                if (!frame || frame.type !== 'frame') {
                    return {
                        points: [],
                        content: panel.props.text
                    };
                }
              
                // フレーム座標に合わせてcornerを変換し、0-100スケールへ正規化
                const { w: frameW, h: frameH } = frame.props;
                const points = panel.props.corners.map((corner) => {
                    const absX = panel.x + corner.x * panel.props.w;
                    const absY = panel.y + corner.y * panel.props.h;
                    const scaledX = (absX / frameW) * 100;
                    const scaledY = (absY / frameH) * 100;
                    return {
                        x: Number((100 - scaledX).toFixed(2)),
                        y: Number(scaledY.toFixed(2)),
                    };
                });
              
                return {
                    points,
                    content: panel.props.text
                };
            });
              
            const payload: PanelRequest = {
                storySummary: projectState.story.summary,
                storyCharacters: projectState.characters.map(c => c.name),
                pageSummary: currentPage.story,
                currentPanels: currentPanels.length ? {
                    count: currentPanels.length,
                    panels: scaledPanelData
                } : undefined,
                message
            };
      
          const response = await fetch('/api/drawing/panel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      
          const data = await response.json() as PanelResponse;
          if (!data.panels) return;

          // Add reasoning to chat session
          const userMessage: Message = {
            id: Date.now(),
            text: message,
            isUser: true
          };
          const aiMessage: Message = {
            id: Date.now() + 1,
            text: `【コマ割りの意図】\n${data.reasoning}`,
            isUser: false
          };
          setProjectState({
            chatSessions: {
              chat: [...(projectState.chatSessions.chat || []), userMessage, aiMessage]
            }
          });
          console.log(projectState);
          
      
          // フレームを取得
          const shapeIds = editor.getPageShapeIds(pageId);
          let frameId: TLShapeId | undefined;
          for (const id of shapeIds) {
            const shape = editor.getShape(id);
            if (shape?.type === 'frame') {
              frameId = id;
              break;
            }
          }
          if (!frameId) return;
          const frame = editor.getShape(frameId);
          if (!frame) return;
      
          // 既存のパネルを削除
          if (currentPanels.length > 0) {
            editor.deleteShapes(currentPanels.map(panel => panel.id));
          }
      
          // 新しいパネルを生成
          data.panels.forEach(panel => {
            const pts = checkAndFixCrossing(panel.points); // ポイントの順序を修正
            
            // 座標を右上原点に変換（x座標を反転）
            const transformedPts = pts.map(p => ({
              x: p.x,  // 100 - p.x （x座標を反転）
              y: p.y
            }));
      
            // x, y の最小値・最大値を求める（0-100のスケールで）
            const minX = Math.min(...transformedPts.map(p => p.x));
            const maxX = Math.max(...transformedPts.map(p => p.x));
            const minY = Math.min(...transformedPts.map(p => p.y));
            const maxY = Math.max(...transformedPts.map(p => p.y));
      
            // フレームのサイズに対する実際の幅と高さを計算
            const shapeW = (maxX - minX) * frame.props.w / 100;
            const shapeH = (maxY - minY) * frame.props.h / 100;
      
            // corners: ローカル座標系 (0〜1) へ正規化
            const corners = transformedPts.map(p => ({
              x: (p.x - minX) / (maxX - minX),
              y: (p.y - minY) / (maxY - minY),
            }));
      
            // フレーム内での位置を計算（オプション）
            const x = minX * frame.props.w / 100;
            const y = minY * frame.props.h / 100;
      
            editor.createShape<FreeShape>({
              type: 'freeShape',
              parentId: frame.id,
              x,
              y,
              props: {
                text: JSON.stringify({
                    content: panel.content,
                    background_prompt: panel.background_prompt
                }, null, 2),
                w: shapeW,
                h: shapeH,
                corners,
                color: 'black',
                strokeWidth: 3,
                font: 'draw',
                align: 'middle',
                verticalAlign: 'middle',
              }
            });
          });
      
          // メタデータを更新
          updatePageMeta(pageId, {
            panels: {
              list: data.panels,
              reasoning: data.reasoning
            }
          });
      
        } catch (error) {
          console.error('Error generating panels:', error);
        }
      };

    const getCurrentPageData = useCallback((pageId: TLPageId): PageData => {
        return getPageMeta(pageId) || { story: '' };
    }, [getPageMeta]);

    const createPage = useCallback(() => {
        if (!editor) throw new Error("Editor is not initialized");
        const pageId = `page:${Date.now()}` as TLPageId;
        const pageName = `Page ${editor.getPages().length + 1}`;
        
        editor.createPage({
            id: pageId,
            name: pageName,
            meta: { story: '' } as PageData
        });
        
        editor.setCurrentPage(pageId);
        createB5Frame(editor, pageId, pageName);
        return pageId;
    }, [editor]);

    const deletePage = useCallback((pageId: TLPageId) => {
        if (!editor) return;
        editor.deletePage(pageId);
    }, [editor]);

    const setProjectState = useCallback((newState: Partial<ProjectState>) => {
        hasUnsavedChanges.current = true;
        setProjectStateInternal(prev => {
            const merged = deepMerge(prev, newState);
            return merged;
        });
    }, []);

    const addCharacter = useCallback((name: string, traits: string) => {
        if (!name || !traits) return;
        setProjectState({
            characters: [...projectState.characters, { name, traits, images: [] }],
        });
    }, [projectState.characters, setProjectState]);

    const updateChatSession = useCallback((tabValue: string, messages: Message[]) => {
        setProjectState({
            chatSessions: {
                [tabValue]: messages
            }
        });
    }, [setProjectState]);

    const getChatSession = useCallback((tabValue: string) => {
        return projectState.chatSessions[tabValue] || [];
    }, [projectState.chatSessions]);

    const generateStory = async (message: string) => {
        try {
            const currentMessages = projectState.chatSessions.chat || [];
            const userMessage: Message = {
                id: Date.now(),
                text: message,
                isUser: true
            };
            const response = await fetch('/api/drawing/story', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentTitle: projectState.story.title,
                    currentSummary: projectState.story.summary,
                    characters: projectState.characters,
                    message,
                    messageHistory: currentMessages.map(m => ({
                        text: m.text,
                        isUser: m.isUser
                    }))
                }),
            });

            const {suggestion} = await response.json() as StoryResponse;
            if (!suggestion) {
                throw new Error('No story suggestion received.');
            }

            let suggestionText = `【${suggestion.type === 'chat' ? '回答' : '提案内容'}】\n${suggestion.reasoning}\n\n`;
            
            if (suggestion.type === 'story' && suggestion.story) {
                suggestionText += [
                    `▼ タイトル・概要の改善\nタイトル: ${suggestion.story.title}\n概要: ${suggestion.story.summary}\n`,
                    suggestion.story.characters && [
                        `▼ キャラクター変更\n`,
                        suggestion.story.characters.add?.map(c => 
                            `追加: ${c.name} (${c.traits})\n`
                        ).join(''),
                        suggestion.story.characters.update?.map(c =>
                            `更新: ${c.name} (${c.traits})\n`
                        ).join(''),
                        suggestion.story.characters.remove?.map(c =>
                            `削除: ${c.name}\n`
                        ).join('')
                    ].filter(Boolean).join('')
                ].filter(Boolean).join('\n');
            } else if (suggestion.type === 'pages' && suggestion.pages) {
                suggestionText += [
                    `▼ ページ構成\n`,
                    suggestion.pages.map(p => 
                        `${p.pageNumber}ページ目: ${p.content}`
                    ).join('\n')
                ].join('\n');
            } else if (suggestion.type === 'chat' && suggestion.chat_response) {
                suggestionText = suggestion.chat_response;
            }

            const suggestionMessage: Message = {
                id: Date.now(),
                text: suggestionText,
                isUser: false,
                suggestion: suggestion.type !== 'chat' ? suggestion : undefined
            };

            setProjectState({
                chatSessions: {
                    chat: [...currentMessages, userMessage, suggestionMessage]
                }
            });

            return suggestionMessage;
        } catch (error) {
            console.error('Error generating story:', error);
            throw error;
        }
    };

    const applyStorySuggestion = (suggestion: StorySuggestion) => {
        const applier = createSuggestionApplier(suggestion, editor, createPage);
        const updates = applier.apply(suggestion, projectState);
        
        if (Object.keys(updates).length > 0) {
            setProjectState(updates);
        }
    };

    const getPages = useCallback(() => {
        if (!editor) return [];
        return editor.getPages().map(page => ({
            id: page.id,
            name: page.name,
            story: (page.meta as PageData)?.story || ''
        }));
    }, [editor]);

    const getScaledPanelData = useCallback((pageId: TLPageId) => {
        const panels = getPagePanels(pageId);
        return panels.map(panel => {
            const points = panel.props.corners.map(corner => ({
                x: corner.x * 100,
                y: corner.y * 100,
            }));
            return {
                id: panel.id,
                points,
                content: panel.props.text,
            };
        });
    }, [getPagePanels]);

    return (
        <ProjectContext.Provider
            value={{ 
                isLoading,
                editor, 
                setEditor, 
                projectState, 
                setProjectState, 
                addCharacter, 
                updatePageStory,
                generatePanels,
                getCurrentPageData,
                updateChatSession,
                getChatSession,
                createPage,
                deletePage,
                generateStory,
                applyStorySuggestion,
                getPages,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
};
