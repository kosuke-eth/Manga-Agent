"use client";

import { AppShell, Burger, Title } from '@mantine/core';
import { ReactNode } from "react";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import {usePathname} from 'next/navigation';

const navLinks = [
    { href: "/studio", label: "Projects", target: "_self" },
    // { href: "/studio/draw", label: "Draw", target: "_blank" },
];

function NavItem({ href, label, target }: { href: string; label: string; target: string }) {
    const pathName = usePathname();
    return (
        <li>
            <Link href={href} passHref style={{ color: pathName === href ? "blue" : "black" }} target={target}>
                {label}
            </Link>
        </li>
    );
}

export default function CreateLayout({
                                         children,
                                     }: Readonly<{
    children: ReactNode;
}>) {
    const [opened, { toggle }] = useDisclosure();
    const path = usePathname();
    if (path.startsWith("/studio/draw")) {
        return <>{children}</>;
    }
    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 200,
                breakpoint: "sm",
                collapsed: { mobile: !opened },
            }}
            padding="md"
        >
            {/* Header */}
            <AppShell.Header>
                <Burger
                    opened={opened}
                    onClick={toggle}
                    hiddenFrom="sm"
                    size="sm"
                    mr="lg"
                />
                <Title>AI漫画創作 よろず</Title>
            </AppShell.Header>

            {/* Navbar */}
            <AppShell.Navbar p="md">
                <nav>
                    <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                        {navLinks.map((link) => (
                            <NavItem key={link.href} href={link.href} label={link.label} target={link.target} />
                        ))}
                    </ul>
                </nav>
            </AppShell.Navbar>

            {/* Main content */}
            <AppShell.Main>{children}</AppShell.Main>
        </AppShell>
    );
}