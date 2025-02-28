import {ReactNode} from "react";
import {ProjectProvider} from "@/app/studio/draw/ProjectProvider";

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ id: string }>;
}>) {
  const projectId = (await params).id;
  return (
      <ProjectProvider projectId={projectId}>
        {children}
      </ProjectProvider>
  );
}
