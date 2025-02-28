"use client";
import React, {useState} from "react";
import {Box, Center, rem, Tabs, Text, Title} from "@mantine/core";
import {useValue} from "tldraw";
import {ProjectSetting} from "@/app/studio/draw/_components/leftBar/ProjectSetting";
import {useProjectContext} from "@/app/studio/draw/ProjectProvider";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import {PageSetting} from "@/app/studio/draw/_components/leftBar/PageSetting";

export default function LeftCollapsibleSidebar() {
    const [opened, setOpened] = useState(true);
    const {editor} = useProjectContext();
    const toggleSidebar = () => {
        setOpened((prev) => !prev);
    };

    const shapeIds = useValue(
        'shapeIds',
        () => editor ? editor.getSortedChildIdsForParent(editor.getCurrentPageId()) : [],
        [editor]
    )

    return (
        <div>
            <Box
                style={{
                    width: opened ? rem(320) : rem(0),
                    height: "100vh",
                    backgroundColor: "white",
                    borderRight: "1px solid #ccc",
                    overflowY: "auto",
                    transition: "width 0.3s ease",
                    padding: opened ? rem(16) : 0,  // パディングを追加
                }}
            >
                {opened && (
                    <>
                        <Center>
                            <Title mb={16}>AI漫画創作 よろず</Title>
                        </Center>
                        <Box>
                            <Tabs defaultValue="page" styles={{
                                tab: {
                                    padding: rem(6),  // タブのパディングを調整
                                },
                                panel: {
                                    padding: rem(8),  // パネルのパディングを追加
                                },
                            }}>
                                <Tabs.List grow justify="center">
                                    <Tabs.Tab value="setting">物語設定</Tabs.Tab>
                                    <Tabs.Tab value="page">ページ設定</Tabs.Tab>
                                    {/*<Tabs.Tab value="third">レイヤー</Tabs.Tab>*/}
                                </Tabs.List>
                                <Tabs.Panel value="setting">
                                    {/* <Title order={2} py={12}>共通設定</Title> */}
                                    <ProjectSetting />
                                    {/*<Title order={2} py={12}>エピソード設定</Title>*/}
                                    {/*物語の設定*/}
                                </Tabs.Panel>
                                <Tabs.Panel value="page">
                                    {editor && <PageSetting editor={editor} shapeIds={shapeIds} />}
                                </Tabs.Panel>
                            </Tabs>
                        </Box>
                    </>
                )}
            </Box>

            <Box
                style={{
                    position: "absolute",
                    left: opened ? rem(320) : rem(0),
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 100,
                    cursor: "pointer",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "0 8px 8px 0",
                    border: "1px solid #ccc",
                    borderLeft: "none",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    padding: rem(8),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "left 0.3s ease",
                }}
                onClick={toggleSidebar}
            >
                {opened ? <IconChevronLeft size={24} /> : <IconChevronRight size={24} />}
            </Box>
        </div>
    );
}