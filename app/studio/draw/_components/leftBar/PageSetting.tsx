"use client";
import React, {useCallback, useEffect, useState} from "react";
import {Box, Button, Group, Pagination, Textarea, Text} from "@mantine/core";
import {TLPageId, TLShapeId, type Editor} from "tldraw";
import {useForm} from "react-hook-form";
import {useProjectContext} from "@/app/studio/draw/ProjectProvider";
import {ShapeList} from "@/app/studio/draw/_components/leftBar/ShapeList";

// PageControlsを分離
const PageControls = React.memo(({ 
    pages, 
    currentPageIndex, 
    onSwitchPage, 
    onDeletePage, 
    onCreatePage 
}: {
    pages: any[];
    currentPageIndex: number;
    onSwitchPage: (index: number) => void;
    onDeletePage: () => void;
    onCreatePage: () => void;
}) => (
    <>
        <Group justify="center" py={12}>
            <Pagination
                withControls={false}
                total={pages.length}
                value={currentPageIndex + 1}
                onChange={(page) => onSwitchPage(page - 1)}
            />
        </Group>
        <Group justify="center" p={4}>
            <Button.Group>
                <Button color="red" onClick={onDeletePage} disabled={pages.length === 1}>🗑</Button>
                <Button color="gray" onClick={onCreatePage}>＋</Button>
            </Button.Group>
        </Group>
    </>
));

// PageStoryFormを改善
const PageStoryForm = React.memo(({ 
    pageId,
    onSubmit 
}: {
    pageId: TLPageId;
    onSubmit: (data: { story: string }) => void;
}) => {
    const { getCurrentPageData, projectState } = useProjectContext();
    const { register, handleSubmit, reset } = useForm({
        defaultValues: { 
            story: getCurrentPageData(pageId).story || '' 
        }
    });

    useEffect(() => {
        reset({ 
            story: getCurrentPageData(pageId).story || '' 
        });
    }, [pageId, projectState, getCurrentPageData, reset]);

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Textarea
                placeholder="このページで描きたいストーリーを入力してください"
                minRows={4}
                maxRows={8}
                autosize
                {...register("story")}
            />
            <Button type="submit" mt={8}>保存</Button>
        </form>
    );
});

export const PageSetting = React.memo(({ editor, shapeIds }: { editor: Editor, shapeIds: TLShapeId[] }) => {
    const { getPages, createPage, deletePage, updatePageStory, getCurrentPageData } = useProjectContext();
    const pages = getPages();

    const currentPageId = editor.getCurrentPageId();
    const currentPageIndex = pages.findIndex(page => page.id === currentPageId);
    const currentPageData = getCurrentPageData(currentPageId);

    const createNewPage = useCallback(() => {
        const pageId = createPage();
        editor.setCurrentPage(pageId);
    }, [createPage, editor]);

    const switchPage = useCallback((index: number) => {
        const page = pages[index];
        if (page) {
            editor.setCurrentPage(page.id);
        }
    }, [editor, pages]);

    const deleteCurrentPage = useCallback(() => {
        if (pages.length > 1) {
            const currentId = editor.getCurrentPageId();
            const remainingPages = pages.filter(p => p.id !== currentId);
            if (remainingPages.length > 0) {
                editor.setCurrentPage(remainingPages[0].id);
            }
            deletePage(currentId);
        }
    }, [editor, pages, deletePage]);

    const onSubmit = useCallback((data: { story: string }) => {
        updatePageStory(currentPageId, data.story);
    }, [currentPageId, updatePageStory]);

    return (
        <Box>
            <PageControls 
                pages={pages} 
                currentPageIndex={currentPageIndex} 
                onSwitchPage={switchPage} 
                onDeletePage={deleteCurrentPage} 
                onCreatePage={createNewPage} 
            />
            
            <Box py={14}>
                <Text size="sm" pb={8}>ページのストーリー</Text>
                <PageStoryForm 
                    pageId={currentPageId}
                    onSubmit={onSubmit} 
                />
            </Box>

            <Box py={14}>
                <Text py={6}>レイヤー設定</Text>
                <ShapeList editor={editor} shapeIds={shapeIds} depth={0}/>
            </Box>
        </Box>
    );
});
