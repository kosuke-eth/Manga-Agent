import { ProjectState, StorySuggestion, SuggestionApplier } from "@/types/project";
import { Editor, TLPageId } from "tldraw";
import { createB5Frame } from "../_objects/mangaPage";

export class StorySuggestionApplier implements SuggestionApplier {
    apply(suggestion: StorySuggestion, currentState: ProjectState): Partial<ProjectState> {
        if (!suggestion.story) return {};

        let updatedCharacters = [...currentState.characters];

        if (suggestion.story.characters) {
            if (suggestion.story.characters.remove) {
                updatedCharacters = updatedCharacters.filter(c => 
                    !suggestion.story!.characters.remove?.map(r => r.name).includes(c.name)
                );
            }

            if (suggestion.story.characters.update) {
                suggestion.story.characters.update.forEach(update => {
                    const index = updatedCharacters.findIndex(c => c.name === update.name);
                    if (index !== -1) {
                        updatedCharacters[index] = { ...updatedCharacters[index], traits: update.traits };
                    }
                });
            }

            if (suggestion.story.characters.add) {
                suggestion.story.characters.add.forEach(newChar => {
                    if (!updatedCharacters.some(c => c.name === newChar.name)) {
                        updatedCharacters.push(newChar);
                    }
                });
            }
        }

        return {
            story: {
                title: suggestion.story.title || currentState.story.title,
                summary: suggestion.story.summary || currentState.story.summary
            },
            characters: updatedCharacters
        };
    }
}

export class PageSuggestionApplier implements SuggestionApplier {
    constructor(
        private editor: Editor,
        private createPage: () => TLPageId
    ) {}

    apply(suggestion: StorySuggestion, currentState: ProjectState): Partial<ProjectState> {
        if (!suggestion.pages) return {};

        // Delete all existing pages except the first one
        this.editor.getPages().slice(1).forEach(page => {
            this.editor.deletePage(page.id);
        });

        // Clear the first page
        const firstPage = this.editor.getPages()[0];

        // 更新されるときになんか変？
        const shapes = this.editor.getPageShapeIds(firstPage.id);
        shapes.forEach(shapeId => {
            this.editor.deleteShape(shapeId);
        });

        this.editor.updatePage({
            id: firstPage.id,
            name: 'Page 1',
            meta: { story: suggestion.pages[0].content }
        });
        createB5Frame(this.editor, firstPage.id, 'Page 1');

        // Create new pages for remaining content
        suggestion.pages.slice(1).forEach((page) => {
            const pageId = this.createPage(); // Now returns TLPageId
            this.editor.updatePage({
                id: pageId,
                name: `Page ${page.pageNumber}`,
                meta: { story: page.content }
            });
        });

        return {};
    }
}

/**
 * Creates a suggestion applier based on the type of suggestion.
 * 
 * @param {StorySuggestion} suggestion - The suggestion to apply.
 * @param {Editor | null} editor - The editor instance, if applicable.
 * @param {() => TLPageId} createPage - Function to create a new page.
 * @returns {SuggestionApplier} The appropriate suggestion applier.
 */
export function createSuggestionApplier(
    suggestion: StorySuggestion,
    editor: Editor | null,
    createPage: () => TLPageId
): SuggestionApplier {
    if (suggestion.type === 'pages' && editor) {
        return new PageSuggestionApplier(editor, createPage);
    }
    return new StorySuggestionApplier();
}