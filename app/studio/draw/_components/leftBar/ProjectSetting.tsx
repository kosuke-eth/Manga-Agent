import React, { useCallback, useMemo, useEffect, useState } from "react";
import { Accordion, Button, Card, Grid, Group, Image, Modal, Textarea, TextInput, Title, Text, Table, Tooltip } from "@mantine/core";
import { useProjectContext } from "@/app/studio/draw/ProjectProvider";
import { useForm } from "react-hook-form";
import { CharacterForm, CharacterCard } from "./CharacterSetting";


const ProjectSettingForm = React.memo(() => {
    const { projectState, setProjectState } = useProjectContext();
    const { register, handleSubmit, reset, setValue } = useForm({
        defaultValues: {
            title: "",
            summary: ""
        }
    });

    // 初期値とプロジェクトの状態変更を監視
    useEffect(() => {
        setValue("title", projectState.story.title);
        setValue("summary", projectState.story.summary);
    }, [projectState.story, setValue]);

    const onSubmit = useCallback((data: { title: string; summary: string }) => {        
        setProjectState({
            story: {
                ...projectState.story,
                title: data.title,
                summary: data.summary
            }
        });
    }, [projectState.story, setProjectState]);
    

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <TextInput
                label="タイトル"
                {...register("title")}
            />
            <Textarea
                label="概要"
                autosize
                minRows={5}
                maxRows={10}
                {...register("summary")}
                mt="sm"
            />
            <Button type="submit" mt="md">保存</Button>
        </form>
    );
});

const PageList = () => {
    const { getPages } = useProjectContext();
    const pages = getPages();

    return (
        <Accordion defaultValue="Page List">
            <Accordion.Item key={"pages"} value={"Page List"}>
                <Accordion.Control>
                    ページ一覧
                </Accordion.Control>
                <Accordion.Panel>
                    <Accordion multiple defaultValue={pages.map(page => page.id).filter(id => id !== 'story')}>
                        {pages.map(page => (
                            <Accordion.Item key={page.id} value={page.id}>
                                <Accordion.Control>
                                    {page.name}
                                </Accordion.Control>
                                <Accordion.Panel>
                                        <Text size="sm" c="dimmed">
                                            {page.story || '概要未設定'}
                                        </Text>

                                    {/* <Card shadow="xs" p="sm">
                                    </Card> */}
                                </Accordion.Panel>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    );
};

export const ProjectSetting = () => {
    const { 
        projectState, 
        addCharacter,
        setProjectState,
    } = useProjectContext();

    const characterCards = useMemo(() => projectState.characters.map((char, index) => (
        <Grid.Col key={index} span={12}>
            <CharacterCard
                character={char}
                setProjectState={setProjectState}
                characters={projectState.characters}
                isLoading={projectState.loadingImages?.[char.name] || false}
                projectState={projectState}
            />
        </Grid.Col>
    )), [projectState, setProjectState]);

    return (
        <>
            <Accordion defaultValue="Story Setting">
                <Accordion.Item key="story" value="Story Setting">
                    <Accordion.Control>プロジェクト設定</Accordion.Control>
                    <Accordion.Panel>
                        <ProjectSettingForm />
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>

            <Accordion defaultValue="Character Setting">
                <Accordion.Item key="character" value="Character Setting">
                    <Accordion.Control>キャラクター設定</Accordion.Control>
                    <Accordion.Panel>
                        <Grid>
                            <Grid.Col span={12}>
                                <CharacterForm onAddCharacter={addCharacter} />
                            </Grid.Col>
                            {characterCards}
                        </Grid>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>

            <PageList />
        </>
    );
};
