import { NextResponse } from "next/server"
import { fireStoreDb, bucket } from "@/lib/storage"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { story, characters, tldrawState } = await request.json()
    const projectId = (await params).id

    // Save tldrawState to Cloud Storage
    const file = bucket.file(`projects/${projectId}/tldrawState.json`);
    await file.save(JSON.stringify(tldrawState), {
      contentType: 'application/json',
    });

    // Update project without tldrawState
    await fireStoreDb.collection("projects").doc(projectId).set({
      title: story?.title || "",
      summary: story?.summary || "",
    })

    // Delete existing characters
    const charactersSnapshot = await fireStoreDb.collection("characters")
      .where("projectId", "==", projectId)
      .get()
    
    for (const char of charactersSnapshot.docs) {
      const imagesSnapshot = await fireStoreDb.collection("characterImages")
        .where("characterId", "==", char.id)
        .get()
      
      for (const img of imagesSnapshot.docs) {
        await img.ref.delete()
      }
      await char.ref.delete()
    }

    // Create new characters with images
    for (const char of characters) {
      const characterRef = await fireStoreDb.collection("characters").add({
        name: char.name,
        traits: char.traits,
        projectId: projectId,
      })

      if (char.images?.length > 0) {
        for (const img of char.images) {
          await fireStoreDb.collection("characterImages").add({
            url: img.url,
            isSelected: img.isSelected,
            prompt: img.prompt,
            negative_prompt: img.negative_prompt,
            characterId: characterRef.id,
          })
        }
      }
    }

    return NextResponse.json({ result: "OK" })
  } catch (error) {
    console.error("APIエラー:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const projectId = (await params).id
    const projectDoc = await fireStoreDb.collection("projects").doc(projectId).get()
    
    if (!projectDoc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const project: any = { id: projectDoc.id, ...projectDoc.data() }
    
    // Load tldrawState from Cloud Storage with error handling
    let tldrawState = null;
    try {
      const file = bucket.file(`projects/${projectId}/tldrawState.json`);
      const [exists] = await file.exists();
      
      if (exists) {
        const [content] = await file.download();
        tldrawState = JSON.parse(content.toString());
      }
    } catch (error) {
      console.error("Failed to load tldrawState:", error);
      tldrawState = {}; // フォールバック値を設定
    }

    project.tldrawState = tldrawState;

    const charactersSnapshot = await fireStoreDb.collection("characters")
      .where("projectId", "==", projectId)
      .get()
    
    const characters = await Promise.all(charactersSnapshot.docs.map(async (charDoc) => {
      const imagesSnapshot = await fireStoreDb.collection("characterImages")
        .where("characterId", "==", charDoc.id)
        .get()
      
      const images = imagesSnapshot.docs.map(img => ({
        id: img.id,
        url: img.data().url,
        isSelected: img.data().isSelected,
        prompt: img.data().prompt || '',  // 既存データの後方互換性のため
        negative_prompt: img.data().negative_prompt || ''  // 既存データの後方互換性のため
      }))
      
      return { 
        id: charDoc.id, 
        ...charDoc.data(), 
        images 
      }
    }))

    project.characters = characters

    return NextResponse.json(project)
  } catch (error) {
    console.error("APIエラー:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const projectId = (await params).id
    
    // Delete tldrawState from Cloud Storage
    const file = bucket.file(`projects/${projectId}/tldrawState.json`);
    try {
      await file.delete();
    } catch (error) {
      console.error("Failed to delete tldrawState:", error);
      // Continue with deletion even if tldrawState deletion fails
    }

    // Delete characters and their images
    const charactersSnapshot = await fireStoreDb.collection("characters")
      .where("projectId", "==", projectId)
      .get()
    
    for (const char of charactersSnapshot.docs) {
      const imagesSnapshot = await fireStoreDb.collection("characterImages")
        .where("characterId", "==", char.id)
        .get()
      
      // Delete all images for the character
      for (const img of imagesSnapshot.docs) {
        await img.ref.delete()
      }
      // Delete the character
      await char.ref.delete()
    }

    // Delete the project
    await fireStoreDb.collection("projects").doc(projectId).delete()

    return NextResponse.json({ result: "OK" })
  } catch (error) {
    console.error("APIエラー:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}