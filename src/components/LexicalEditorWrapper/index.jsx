// import { $getRoot, $getSelection } from "lexical";
// import { useEffect } from "react";

// import { LexicalComposer } from "@lexical/react/LexicalComposer";
// import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
// import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
// import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
// import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
// import { MuiContentEditable, placeHolderSx } from "./styles";
// import { Box, Divider } from "@mui/material";
// import { lexicalEditorConfig } from "../../config/lexicalEditorConfig";
// import LexicalEditorTopBar from "../LexicalEditorTopBar";
// import TreeViewPlugin from "../CustomPlugins/TreeViewPlugin";
// import { ListPlugin } from "@lexical/react/LexicalListPlugin";
// import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
// import ImagesPlugin from "../CustomPlugins/ImagePlugin";
// import FloatingTextFormatToolbarPlugin from "../CustomPlugins/FloatingTextFormatPlugin";
// import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";

// function LexicalEditorWrapper(props) {
//   return (
//     <LexicalComposer initialConfig={lexicalEditorConfig}>
//       <LexicalEditorTopBar />
//       <Divider />
//       <Box sx={{ position: "relative", background: "white" }}>
//         <RichTextPlugin
//           contentEditable={<MuiContentEditable />}
//           placeholder={<Box sx={placeHolderSx}>Enter some text...</Box>}
//           ErrorBoundary={LexicalErrorBoundary}
//         />
//         <OnChangePlugin onChange={onChange} />
//         <HistoryPlugin />
//         {/* <TreeViewPlugin /> */}
//         <ListPlugin />
//         <LinkPlugin />
//         <ImagesPlugin captionsEnabled={false} />
//         <FloatingTextFormatToolbarPlugin />
//       </Box>
//     </LexicalComposer>
//   );
// }

// // When the editor changes, you can get notified via the
// // LexicalOnChangePlugin!
// function onChange(editorState) {
//   editorState.read(() => {
//     // Read the contents of the EditorState here.
//     const root = $getRoot();
//     const selection = $getSelection();

//     console.log(root, selection);
//   });
// }

// // Lexical React plugins are React components, which makes them
// // highly composable. Furthermore, you can lazy load plugins if
// // desired, so you don't pay the cost for plugins until you
// // actually use them.
// function MyCustomAutoFocusPlugin() {
//   const [editor] = useLexicalComposerContext();

//   useEffect(() => {
//     // Focus the editor when the effect fires!
//     editor.focus();
//   }, [editor]);

//   return null;
// }

// export default LexicalEditorWrapper;
import { $getRoot, $getSelection, $isRangeSelection } from "lexical";
import { useEffect, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { MuiContentEditable, placeHolderSx } from "./styles";
import { Box, Divider } from "@mui/material";
import { lexicalEditorConfig } from "../../config/lexicalEditorConfig";
import LexicalEditorTopBar from "../LexicalEditorTopBar";
import TreeViewPlugin from "../CustomPlugins/TreeViewPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import ImagesPlugin from "../CustomPlugins/ImagePlugin";
import FloatingTextFormatToolbarPlugin from "../CustomPlugins/FloatingTextFormatPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { Document, Packer, Paragraph, TextRun, ImageRun } from "docx";
import { saveAs } from "file-saver";
import ColorPlugin from "../CustomPlugins/ColorPlugin";
import {
  $patchStyleText,
  $getSelectionStyleValueForProperty,
} from "@lexical/selection";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";


function LexicalEditorWrapper(props) {
  // Function to handle DOCX download
  const handleDownloadDocx = (editorState) => {
    editorState.read(() => {
      const root = $getRoot();
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: root.getChildren().map((node) => {
              if (node.getType() === "paragraph") {
                return new Paragraph({
                  children: node.getChildren().map((child) => {
                    if (child.getType() === "text") {
                      return new TextRun({
                        text: child.getTextContent(),
                        bold: child.hasFormat("bold"),
                        italics: child.hasFormat("italic"),
                        underline: child.hasFormat("underline") ? {} : undefined,
                      });
                    } else if (child.getType() === "link") {
                      return new TextRun({
                        text: child.getTextContent(),
                        underline: {}, // Links are typically underlined
                        color: "0000FF", // Blue color for links
                      });
                    }
                    return new TextRun({ text: "" });
                  }),
                });
              } else if (node.getType() === "list") {
                return new Paragraph({
                  children: node.getChildren().map((listItem) => {
                    return new TextRun({
                      text: `- ${listItem.getTextContent()}`,
                    });
                  }),
                  bullet: { level: 0 },
                });
              }
              return new Paragraph({ text: "" });
            }),
          },
        ],
      });

      Packer.toBlob(doc).then((blob) => {
        saveAs(blob, "document.docx");
      });
    });
  };

  // Enhanced onChange to log editor state content
  function onChange(editorState) {
    editorState.read(() => {
      const root = $getRoot();
      console.log("Editor State Content:");
      root.getChildren().forEach((node, index) => {
        console.log(`Node ${index + 1}: Type=${node.getType()}`);
        if (node.getType() === "paragraph") {
          console.log("  Paragraph content:");
          node.getChildren().forEach((child, childIndex) => {
            console.log(`    Child ${childIndex + 1}: Type=${child.getType()}`);
            if (child.getType() === "text") {
              console.log(`      Text: ${child.getTextContent()}`);
              console.log(`      Formats: Bold=${child.hasFormat("bold")}, Italic=${child.hasFormat("italic")}, Underline=${child.hasFormat("underline")}`);
            } else if (child.getType() === "link") {
              console.log(`      Link Text: ${child.getTextContent()}, URL: ${child.getURL()}`);
            } else if (child.getType() === "image") {
              console.log(`      Image: Src=${child.getSrc()}, Alt=${child.getAltText()}`);
            }
          });
        } else if (node.getType() === "list") {
          console.log("  List content:");
          node.getChildren().forEach((listItem, itemIndex) => {
            console.log(`    Item ${itemIndex + 1}: ${listItem.getTextContent()}`);
          });
        }
      });
    });
  }

  function ColorToolbar() {
  const [editor] = useLexicalComposerContext();
  const [fontColor, setFontColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
 
  // Apply color styles to current selection
  const applyStyle = (style) => {
    editor.update(() => {
      $patchStyleText(style);
    });
  };
 
  // Listen to selection changes and update toolbar
  const updateToolbar = () => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const styles = $getSelection(); // Get inline styles
        console.log(styles,'styles')
        setFontColor(styles.color || "#000000");
        setBgColor(styles["background-color"] || "#ffffff");
      }
    });
  };
 
  return (
    <>
      {/* Sync toolbar with editor selection */}
      <OnChangePlugin
        onChange={() => {
          updateToolbar();
        }}
      />
 
      <div className="flex space-x-4 p-2 border-b bg-gray-50">
        {/* Font Color Picker */}
        <label className="flex items-center space-x-1">
          <span>Font:</span>
          <input
            type="color"
            value={fontColor}
            onChange={(e) => {
setFontColor(e.target.value);
applyStyle({ color: e.target.value });
            }}
          />
        </label>
 
        {/* Background Color Picker */}
        <label className="flex items-center space-x-1">
          <span>Bg:</span>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => {
setBgColor(e.target.value);
applyStyle({ "background-color": e.target.value });
            }}
          />
        </label>
      </div>
    </>
  );
}

  return (
    <LexicalComposer initialConfig={lexicalEditorConfig}>
      <LexicalEditorTopBar onDownloadDocx={handleDownloadDocx} />
      <Divider />
      {/* <ColorToolbar/> */}
      {/* <div className="toolbar flex items-center space-x-4 p-2 border-b">
        <ColorPlugin />
      </div> */}
      <Box sx={{ position: "relative", background: "white" }}>
        <RichTextPlugin
          contentEditable={<MuiContentEditable />}
          placeholder={<Box sx={placeHolderSx}>Enter some text...</Box>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        {/* <OnChangePlugin onChange={onChange} /> */}
        <HistoryPlugin />
          {/* <OnChangePlugin
        onChange={() => {
          updateToolbar();
        }}
      /> */}
        {/* <TreeViewPlugin /> */}
        <ListPlugin />
        <LinkPlugin />
        <ImagesPlugin captionsEnabled={false} />
        <FloatingTextFormatToolbarPlugin />
        <TablePlugin/>
      </Box>
    </LexicalComposer>
  );
}

function MyCustomAutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.focus();
  }, [editor]);

  return null;
}

export default LexicalEditorWrapper;


// import React, { useState } from "react";
// import { LexicalComposer } from "@lexical/react/LexicalComposer";
// import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
// import { ContentEditable } from "@lexical/react/LexicalContentEditable";
// import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
// import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
// import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
// import { $getSelection, $isRangeSelection } from "lexical";
//  import {
//   $patchStyleText,
//   $getSelectionStyleValueForProperty,
// } from "@lexical/selection";
// const theme = {
//   // you can style text with CSS if needed
// };
 
// const editorConfig = {
//   namespace: "MyEditor",
//   theme,
//   onError(error) {
//     console.error(error);
//   },
// };
 
// // ✅ Toolbar with font + background color pickers
// function ColorToolbar() {
//   const [editor] = useLexicalComposerContext();
//   const [fontColor, setFontColor] = useState("#000000");
//   const [bgColor, setBgColor] = useState("#ffffff");

//   const applyStyle = (style) => {
//     editor.update(() => {
//       $patchStyleText(style);
//     });
//   };

//   const updateToolbar = () => {
//     editor.getEditorState().read(() => {
//       const selection = $getSelection();
//       if ($isRangeSelection(selection)) {
//         const color = $getSelectionStyleValueForProperty(selection, "color", "#000000");
//         const bg = $getSelectionStyleValueForProperty(selection, "background-color", "#ffffff");

//         setFontColor(color);
//         setBgColor(bg);
//       }
//     });
//   };

//   return (
//     <>
//       <OnChangePlugin onChange={updateToolbar} />

//       <div className="flex space-x-4 p-2 border-b bg-gray-50">
//         <label className="flex items-center space-x-1">
//           <span>Font:</span>
//           <input
//             type="color"
//             value={fontColor}
//             onChange={(e) => {
//               setFontColor(e.target.value);
//               applyStyle({ color: e.target.value });
//             }}
//           />
//         </label>

//         <label className="flex items-center space-x-1">
//           <span>Bg:</span>
//           <input
//             type="color"
//             value={bgColor}
//             onChange={(e) => {
//               setBgColor(e.target.value);
//               applyStyle({ "background-color": e.target.value });
//             }}
//           />
//         </label>
//       </div>
//     </>
//   );
// }
 
// export default function Editor() {
//   return (
//     <LexicalComposer initialConfig={editorConfig}>
//       <ColorToolbar />
 
//       <div className="border rounded p-2 mt-2">
//         <RichTextPlugin
//           contentEditable={<ContentEditable className="editor p-2 outline-none min-h-[150px]" />}
//           placeholder={<div className="text-gray-400">Enter text...</div>}
//         />
//       </div>
 
//       <HistoryPlugin />
//     </LexicalComposer>
//   );
// }