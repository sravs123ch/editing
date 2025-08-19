// // import { Button, Divider, Grid,Box } from "@mui/material";
// // import toolbarIconsList from "./toolbarIconsList";
// // import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
// // import useOnClickListener from "./useOnClickListener";
// // import { createPortal } from "react-dom";
// // import FloatingLinkEditor from "./FloatingLinkEditor";
// // import { InsertImageDialog } from "../CustomPlugins/ImagePlugin";

// // const LexicalEditorTopBar = ({onDownloadDocx}) => {
// //   const { onClick, selectedEventTypes, blockType, isLink, editor, modal } =
// //     useOnClickListener();

// //   const isIconSelected = (plugin) =>
// //     selectedEventTypes.includes(plugin.event) ||
// //     blockType.includes(plugin.event);

// //   return (
// //     <Grid
// //       container
// //       justifyContent="space-between"
// //       spacing={2}
// //       alignItems="center"
// //       sx={{ background: "white", py: 1.5, px: 0.5 }}
// //     >
// //       {toolbarIconsList.map((plugin) => (
// //         <Grid
// //           key={plugin.id}
// //           sx={{
// //             cursor: "pointer",
// //           }}
// //           item
// //         >
// //           {
// //             <plugin.Icon
// //               sx={plugin.iconSx}
// //               onClick={() => onClick(plugin.event)}
// //               color={isIconSelected(plugin) ? "secondary" : undefined}
// //             />
// //           }
// //         </Grid>
// //       ))}
// //       {modal}
// //       {isLink &&
// //         createPortal(<FloatingLinkEditor editor={editor} />, document.body)}
// //         <Box sx={{ display: "flex", gap: 1, p: 1, background: "#f5f5f5" }}>
// //       {/* <Button
// //         variant="contained"
// //         onClick={() => onDownloadDocx(editor.getEditorState())}
// //       >
// //         Download DOCX
// //       </Button> */}
// //     </Box>
// //     </Grid>
// //   );
// // };

// // export default LexicalEditorTopBar;
// import { Button, Divider, Grid, Box, Popover } from "@mui/material";
// import toolbarIconsList from "./toolbarIconsList";
// import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
// import useOnClickListener from "./useOnClickListener";
// import { createPortal } from "react-dom";
// import FloatingLinkEditor from "./FloatingLinkEditor";
// import { InsertImageDialog } from "../CustomPlugins/ImagePlugin";
// import { useState } from "react";
// import { TwitterPicker } from "react-color";
// import { eventTypes } from "./toolbarIconsList";

// const LexicalEditorTopBar = ({ onDownloadDocx }) => {
//   const { onClick, selectedEventTypes, blockType, isLink, editor, modal } =
//     useOnClickListener();
//   const [textColorAnchorEl, setTextColorAnchorEl] = useState(null);
//   const [bgColorAnchorEl, setBgColorAnchorEl] = useState(null);
//   const [selectedTextColor, setSelectedTextColor] = useState("");
//   const [selectedBgColor, setSelectedBgColor] = useState("");

//   const isIconSelected = (plugin) =>
//     selectedEventTypes.includes(plugin.event) ||
//     blockType.includes(plugin.event);

//   const handleTextColorClick = (event) => {
//     setTextColorAnchorEl(event.currentTarget);
//   };

//   const handleBgColorClick = (event) => {
//     setBgColorAnchorEl(event.currentTarget);
//   };

//   const handleTextColorChange = (color) => {
//     setSelectedTextColor(color.hex);
//     onClick(eventTypes.textColor, color.hex);
//     setTextColorAnchorEl(null);
//   };

//   const handleBgColorChange = (color) => {
//     setSelectedBgColor(color.hex);
//     onClick(eventTypes.backgroundColor, color.hex);
//     setBgColorAnchorEl(null);
//   };

//   return (
//     <Grid
//       container
//       justifyContent="space-between"
//       spacing={2}
//       alignItems="center"
//       sx={{ background: "white", py: 1.5, px: 0.5 }}
//     >
//       {toolbarIconsList.map((plugin) => (
//         <Grid
//           key={plugin.id}
//           sx={{
//             cursor: "pointer",
//           }}
//           item
//         >
//           {plugin.event === eventTypes.textColor ? (
//             <>
//               <plugin.Icon
//                 sx={{ fontSize: 24 }}
//                 onClick={handleTextColorClick}
//                 color={isIconSelected(plugin) ? "secondary" : undefined}
//               />
//               <Popover
//                 open={Boolean(textColorAnchorEl)}
//                 anchorEl={textColorAnchorEl}
//                 onClose={() => setTextColorAnchorEl(null)}
//                 anchorOrigin={{
//                   vertical: "bottom",
//                   horizontal: "left",
//                 }}
//               >
//                 <TwitterPicker
//                   color={selectedTextColor}
//                   onChangeComplete={handleTextColorChange}
//                 />
//               </Popover>
//             </>
//           ) : plugin.event === eventTypes.backgroundColor ? (
//             <>
//               <plugin.Icon
//                 sx={{ fontSize: 24 }}
//                 onClick={handleBgColorClick}
//                 color={isIconSelected(plugin) ? "secondary" : undefined}
//               />
//               <Popover
//                 open={Boolean(bgColorAnchorEl)}
//                 anchorEl={bgColorAnchorEl}
//                 onClose={() => setBgColorAnchorEl(null)}
//                 anchorOrigin={{
//                   vertical: "bottom",
//                   horizontal: "left",
//                 }}
//               >
//                 <TwitterPicker
//                   color={selectedBgColor}
//                   onChangeComplete={handleBgColorChange}
//                 />
//               </Popover>
//             </>
//           ) : (
//             <plugin.Icon
//               sx={{ fontSize: 24 }}
//               onClick={() => onClick(plugin.event)}
//               color={isIconSelected(plugin) ? "secondary" : undefined}
//             />
//           )}
//         </Grid>
//       ))}
//       {modal}
//       {isLink && createPortal(<FloatingLinkEditor editor={editor} />, document.body)}
//       <Box sx={{ display: "flex", gap: 1, p: 1, background: "#f5f5f5" }}>
//         <Button
//           variant="contained"
//           onClick={() => onDownloadDocx(editor.getEditorState())}
//         >
//           Download DOCX
//         </Button>
//       </Box>
//     </Grid>
//   );
// };

// export default LexicalEditorTopBar;
import { Button, Divider, Grid, Box, Popover } from "@mui/material";
import toolbarIconsList from "./toolbarIconsList";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useOnClickListener from "./useOnClickListener";
import { createPortal } from "react-dom";
import FloatingLinkEditor from "./FloatingLinkEditor";
import { InsertImageDialog } from "../CustomPlugins/ImagePlugin";
import { useState } from "react";
import { TwitterPicker } from "react-color";
import { eventTypes } from "./toolbarIconsList";
import ColorPlugin from "../CustomPlugins/ColorPlugin";
import TablePlugin from "../CustomPlugins/TablePlugin";

const LexicalEditorTopBar = ({ onDownloadDocx }) => {
  const { onClick, selectedEventTypes, blockType, isLink, editor, modal } =
    useOnClickListener();
  const [textColorAnchorEl, setTextColorAnchorEl] = useState(null);
  const [bgColorAnchorEl, setBgColorAnchorEl] = useState(null);
  const [selectedTextColor, setSelectedTextColor] = useState("");
  const [selectedBgColor, setSelectedBgColor] = useState("");

  const isIconSelected = (plugin) =>
    selectedEventTypes.includes(plugin.event) ||
    blockType.includes(plugin.event);

  const handleTextColorClick = (event) => {
    setTextColorAnchorEl(event.currentTarget);
  };

  const handleBgColorClick = (event) => {
    setBgColorAnchorEl(event.currentTarget);
  };

  const handleTextColorChange = (color) => {
    setSelectedTextColor(color.hex);
    onClick(eventTypes.textColor, color.hex);
    setTextColorAnchorEl(null);
  };

  const handleBgColorChange = (color) => {
    setSelectedBgColor(color.hex);
    onClick(eventTypes.backgroundColor, color.hex);
    setBgColorAnchorEl(null);
  };

  return (
    <Grid
      container
      justifyContent="space-between"
      spacing={2}
      alignItems="center"
      sx={{ background: "white", py: 1.5, px: 0.5 }}
    >
      {toolbarIconsList.map((plugin) => (
        <Grid
          key={plugin.id}
          sx={{
            cursor: "pointer",
          }}
          item
        >
          {plugin.event === eventTypes.textColor ? (
            <>
              <plugin.Icon
                sx={{ fontSize: 24 }}
                onClick={handleTextColorClick}
                color={isIconSelected(plugin) ? "secondary" : undefined}
              />
              <Popover
                open={Boolean(textColorAnchorEl)}
                anchorEl={textColorAnchorEl}
                onClose={() => setTextColorAnchorEl(null)}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
              >
                <TwitterPicker
                  color={selectedTextColor}
                  onChangeComplete={handleTextColorChange}
                />
              </Popover>
            </>
          ) : plugin.event === eventTypes.backgroundColor ? (
            <>
              <plugin.Icon
                sx={{ fontSize: 24 }}
                onClick={handleBgColorClick}
                color={isIconSelected(plugin) ? "secondary" : undefined}
              />
              <Popover
                open={Boolean(bgColorAnchorEl)}
                anchorEl={bgColorAnchorEl}
                onClose={() => setBgColorAnchorEl(null)}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
              >
                <TwitterPicker
                  color={selectedBgColor}
                  onChangeComplete={handleBgColorChange}
                />
              </Popover>
            </>
          ) : (
            <plugin.Icon
              sx={{ fontSize: 24 }}
              onClick={() => onClick(plugin.event)}
              color={isIconSelected(plugin) ? "secondary" : undefined}
            />
          )}
        </Grid>
      ))}
      {modal}
      {isLink && createPortal(<FloatingLinkEditor editor={editor} />, document.body)}
      <Box sx={{ display: "flex", gap: 1, p: 1, background: "#fff" }}>
      <ColorPlugin/>
      <TablePlugin/>
        <Button
          variant="contained"
          onClick={() => onDownloadDocx(editor.getEditorState())}
        >
          Download DOCX
        </Button>
      </Box>
    </Grid>
  );
};

export default LexicalEditorTopBar;