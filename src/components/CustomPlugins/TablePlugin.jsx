import React, { useState } from "react";
import {
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
} from "@mui/material";
import TableChartIcon from "@mui/icons-material/TableChart";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createTableNodeWithDimensions } from "@lexical/table";
import { $insertNodeToNearestRoot } from "@lexical/utils";

export default function TablePlugin() {
  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState("");
  const [columns, setColumns] = useState("");
  const [editor] = useLexicalComposerContext();

  const onAddTable = () => {
    if (!rows || !columns) return;
    editor.update(() => {
      const tableNode = $createTableNodeWithDimensions(
        parseInt(rows, 10),
        parseInt(columns, 10),
        true
      );
      $insertNodeToNearestRoot(tableNode);
    });
    setRows("");
    setColumns("");
    setIsOpen(false);
  };

//   const onAddTable = () => {
//   if (!rows || !columns) return;

//   editor.update(() => {
//     const tableNode = $createTableNodeWithDimensions(
//       parseInt(rows, 10),
//       parseInt(columns, 10),
//       true
//     );

//     // Insert at cursor position
//     const selection = $getSelection();
//     if (selection) {
//       $insertNodeToNearestRoot(tableNode);
//     } else {
//       editor.insertNodes([tableNode]); // fallback
//     }
//   });

//   setRows("");
//   setColumns("");
//   setIsOpen(false);
// };

  return (
    <>
      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <DialogTitle>Add Table</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              type="number"
              label="Rows"
              value={rows}
              onChange={(e) => setRows(e.target.value)}
              autoFocus
              fullWidth
            />
            <TextField
              type="number"
              label="Columns"
              value={columns}
              onChange={(e) => setColumns(e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={onAddTable}
            disabled={!rows || !columns}
            variant="contained"
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
{/* 
      <IconButton
        aria-label="Add Table"
        size="small"
        onClick={() => setIsOpen(true)}
      >
        <TableChartIcon />
      </IconButton> */}
      <IconButton
  aria-label="Add Table"
  size="small"
  onClick={() => setIsOpen(true)}
>
  <TableChartIcon style={{ color: "black" }} />
</IconButton>

    </>
  );
}
// import React, { useState, useEffect, useRef } from "react";
// import {
//   Button,
//   IconButton,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   Box,
// } from "@mui/material";
// import TableChartIcon from "@mui/icons-material/TableChart";
// import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
// import { $createTableNodeWithDimensions } from "@lexical/table";
// import { $insertNodeToNearestRoot } from "@lexical/utils";
// import { $getSelection, $isRangeSelection, $createParagraphNode } from "lexical";

// export default function TablePlugin() {
//   const [isOpen, setIsOpen] = useState(false);
//   const [rows, setRows] = useState("");
//   const [columns, setColumns] = useState("");
//   const [editor] = useLexicalComposerContext();
//   const editorContainerRef = useRef(null);

//   // Store the editor container for focus and inert management
//   useEffect(() => {
//     const editorElement = editor.getRootElement();
//     if (editorElement) {
//       editorContainerRef.current = editorElement.parentElement;
//     }
//   }, [editor]);

//   // Manage inert attribute when dialog opens/closes
//   useEffect(() => {
//     const editorContainer = editorContainerRef.current;
//     if (editorContainer) {
//       if (isOpen) {
//         editorContainer.setAttribute("inert", "");
//       } else {
//         editorContainer.removeAttribute("inert");
//       }
//     }
//   }, [isOpen]);

//   const onAddTable = () => {
//     // Validate inputs
//     const rowCount = parseInt(rows, 10);
//     const colCount = parseInt(columns, 10);
//     if (isNaN(rowCount) || isNaN(colCount) || rowCount <= 0 || colCount <= 0) {
//       alert("Please enter valid positive numbers for rows and columns.");
//       return;
//     }

//     try {
//       console.log("onAddTable called with rows:", rows, "columns:", columns);
//       editor.update(() => {
//         const selection = $getSelection();
//         const tableNode = $createTableNodeWithDimensions(rowCount, colCount, true);

//         if ($isRangeSelection(selection)) {
//           console.log("Inserting table at cursor position:", selection);
//           $insertNodeToNearestRoot(tableNode);
//           tableNode.insertAfter($createParagraphNode());
//           // Move cursor to the first cell
//           const firstCell = tableNode.getFirstChild()?.getFirstChild();
//           if (firstCell) {
//             firstCell.selectStart();
//           }
//         } else {
//           console.log("No valid selection, appending to root");
//           const root = editor.getEditorState()._nodeMap.get("root");
//           if (root) {
//             root.append(tableNode);
//             tableNode.insertAfter($createParagraphNode());
//             const firstCell = tableNode.getFirstChild()?.getFirstChild();
//             if (firstCell) {
//               firstCell.selectStart();
//             }
//           } else {
//             console.error("Root node not found");
//           }
//         }

//         console.log("Editor state after table insertion:", editor.getEditorState().toJSON());
//       });
//     } catch (error) {
//       console.error("Error inserting table:", error);
//       alert("An error occurred while inserting the table. Please try again.");
//     }

//     setRows("");
//     setColumns("");
//     setIsOpen(false);
//   };

//   const handleOpen = () => {
//     // Store current selection before opening dialog
//     let storedSelection = null;
//     editor.update(() => {
//       storedSelection = $getSelection();
//       console.log("Selection before opening dialog:", storedSelection);
//     });
//     editor.focus(); // Ensure editor is focused
//     setIsOpen(true);
//   };

//   return (
//     <>
//       <Dialog
//         open={isOpen}
//         onClose={() => setIsOpen(false)}
//         // Prevent aria-hidden issues by disabling backdrop focus trap
//         disableEnforceFocus
//       >
//         <DialogTitle>Add Table</DialogTitle>
//         <DialogContent>
//           <Box display="flex" flexDirection="column" gap={2} mt={1}>
//             <TextField
//               type="number"
//               label="Rows"
//               value={rows}
//               onChange={(e) => setRows(e.target.value)}
//               autoFocus
//               fullWidth
//               inputProps={{ min: 1 }}
//             />
//             <TextField
//               type="number"
//               label="Columns"
//               value={columns}
//               onChange={(e) => setColumns(e.target.value)}
//               fullWidth
//               inputProps={{ min: 1 }}
//             />
//           </Box>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setIsOpen(false)}>Cancel</Button>
//           <Button
//             onClick={onAddTable}
//             disabled={!rows || !columns || isNaN(rows) || isNaN(columns) || rows <= 0 || columns <= 0}
//             variant="contained"
//           >
//             Add
//           </Button>
//         </DialogActions>
//       </Dialog>

//       <IconButton
//         aria-label="Add Table"
//         size="small"
//         onClick={handleOpen}
//       >
//         <TableChartIcon />
//       </IconButton>
//     </>
//   );
// }