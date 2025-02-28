import { NextResponse } from "next/server"
import { fireStoreDb } from "@/lib/storage"

// POST /api/project
export async function POST(request: Request) {
    try {
        const { story } = await request.json()
        const docRef = await fireStoreDb.collection("projects").add({
            title: story.title,
            summary: story.summary,
            tldrawState: "{}",
        })

        return NextResponse.json({ project: { id: docRef.id, ...story } })
    } catch (error) {
        console.error("APIエラー:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

// GET /api/project
export async function GET() {
    try {
        const projectsRef = fireStoreDb.collection("projects")
        if (!projectsRef) {
            return NextResponse.json([])
        }
        
        const snapshot = await projectsRef.get().catch(() => null)
        if (!snapshot) {
            return NextResponse.json([])
        }

        const allProjects = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
        return NextResponse.json(allProjects)
    } catch (error) {
        console.error("APIエラー:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}