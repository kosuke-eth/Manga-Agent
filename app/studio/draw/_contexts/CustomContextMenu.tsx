import {DefaultContextMenu, TldrawUiMenuGroup, TldrawUiMenuItem, TLUiContextMenuProps} from "tldraw";
import React from "react";

export function CustomContextMenu(props: TLUiContextMenuProps) {
    return (
        <DefaultContextMenu {...props}>
            {/*<TldrawUiMenuGroup id="example">*/}
            {/*    <div style={{ backgroundColor: 'thistle' }}>*/}
            {/*        <TldrawUiMenuItem*/}
            {/*            id="like"*/}
            {/*            label="Like my posts"*/}
            {/*            icon="external-link"*/}
            {/*            readonlyOk*/}
            {/*            onSelect={() => {*/}
            {/*                window.open('https://x.com/tldraw', '_blank')*/}
            {/*            }}*/}
            {/*        />*/}
            {/*    </div>*/}
            {/*</TldrawUiMenuGroup>*/}
        </DefaultContextMenu>
    )
}
