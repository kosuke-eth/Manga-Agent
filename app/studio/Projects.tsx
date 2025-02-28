"use client";

import React, { useEffect, useState } from "react";
import { Card, Button, TextInput, Textarea, Group, Title, Grid } from "@mantine/core";
import Link from "next/link";

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [title, setTitle] = useState("");
    const [summary, setSummary] = useState("");

    useEffect(() => {
        fetch("/api/project")
            .then((res) => res.json())
            .then((data) => setProjects(data));
    }, []);

    const handleCreate = async () => {
        await fetch("/api/project", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ story: { title, summary }, characters: [] }),
        });
        setTitle("");
        setSummary("");
        const res = await fetch("/api/project");
        setProjects(await res.json());
    };

    const handleDelete = async (projectId: string) => {
        if (!confirm('本当に削除しますか？')) return;
        
        await fetch(`/api/project/${projectId}`, {
            method: 'DELETE',
        });
        
        // プロジェクト一覧を更新
        const res = await fetch("/api/project");
        setProjects(await res.json());
    };
    
    return (
        <div>
            <Title order={2}>Projects</Title>
            <Grid>
                {projects.map((proj: any) => (
                    <Grid.Col mb={4} key={proj.id}>
                        <Card shadow="sm" padding="lg">
                            <Title order={4}>{proj.title}</Title>
                            <p>{proj.summary}</p>
                            <Group>
                                <Link href={"/studio/draw/" + proj.id} passHref target="_blank">
                                    <Button>Open</Button>
                                </Link>
                                <Button 
                                    color="red" 
                                    onClick={() => handleDelete(proj.id)}
                                >
                                    Delete
                                </Button>
                            </Group>
                        </Card>
                    </Grid.Col>
                ))}
            </Grid>

            <Title order={3} mt="lg">Create New Project</Title>
            <TextInput
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
                placeholder="Summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
            />
            <Group mt="md">
                <Button onClick={handleCreate}>Create</Button>
            </Group>
        </div>
    );
};

export default Projects;
