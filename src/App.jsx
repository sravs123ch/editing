// import {
//   Box,
//   CssBaseline,
//   Grid,
//   ThemeProvider,
//   Typography,
// } from "@mui/material";
// import LexicalEditorWrapper from "./components/LexicalEditorWrapper";
// import theme from "./theme";
// import "./App.css";

// function App() {
//   return (
//     <ThemeProvider theme={theme}>
//       <CssBaseline />
//       <Grid
//         container
//         sx={{ minHeight: "100vh" }}
//         flexDirection="column"
//         alignItems="center"
//       >
//         <Grid item sx={{ my: 4 }}>
//           <Typography variant="h4">Lexical Editor</Typography>
//         </Grid>
//         <Grid item sx={{ width: 750, overflow: "hidden" }}>
//           <LexicalEditorWrapper />
//         </Grid>
//       </Grid>
//     </ThemeProvider>
//   );
// }

// export default App;

// import React, { useRef } from 'react';
// import { LexicalComposer } from '@lexical/react/LexicalComposer';
// import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
// import { ContentEditable } from '@lexical/react/LexicalContentEditable';
// import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
// import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
// import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
// import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
// import mammoth from 'mammoth';

// // Custom plugin to handle file input
// function FileUploadPlugin() {
//   const [editor] = useLexicalComposerContext();
//   const fileInputRef = useRef(null);

//   // Handle file selection and content extraction
//   const handleFileChange = async (event) => {
//     const file = event.target.files[0];
//     if (!file) return;

//     // Check file type
//     if (!file.name.endsWith('.docx')) {
//       alert('Please select a .docx file.');
//       return;
//     }

//     try {
//       // Read and parse the .docx file using mammoth
//       const arrayBuffer = await file.arrayBuffer();
//       const result = await mammoth.extractRawText({ arrayBuffer });
//       const text = result.value;

//       // Update Lexical editor with the extracted text
//       editor.update(() => {
//         const root = $getRoot();
//         root.clear(); // Clear existing content
//         const paragraph = $createParagraphNode();
//         const textNode = $createTextNode(text);
//         paragraph.append(textNode);
//         root.append(paragraph);
//       });
//     } catch (error) {
//       console.error('Error parsing file:', error);
//       alert('Failed to parse the file. Please try another .docx file.');
//     }
//   };

//   return (
//     <div>
//       <button onClick={() => fileInputRef.current.click()}>
//         Upload .docx File
//       </button>
//       <input
//         type="file"
//         accept=".docx"
//         ref={fileInputRef}
//         style={{ display: 'none' }}
//         onChange={handleFileChange}
//       />
//     </div>
//   );
// }

// // Main Editor Component
// function Editor() {
//   const initialConfig = {
//     namespace: 'MyEditor',
//     onError: (error) => console.error(error),
//   };

//   return (
//     <LexicalComposer initialConfig={initialConfig}>
//       <div className="editor-container">
//         <FileUploadPlugin />
//         <RichTextPlugin
//           contentEditable={<ContentEditable className="editor-input" />}
//           placeholder={<div className="editor-placeholder">Enter some text...</div>}
//           ErrorBoundary={LexicalErrorBoundary}
//         />
//         <HistoryPlugin />
//       </div>
//     </LexicalComposer>
//   );
// }

// export default Editor;
import React, { useRef } from 'react';
import {
  Box,
  CssBaseline,
  Grid,
  ThemeProvider,
  Typography,
} from "@mui/material";
import LexicalEditorWrapper from "./components/LexicalEditorWrapper";
import theme from "./theme";
import "./App.css";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Grid
        container
        sx={{ minHeight: "250vh" }}
        flexDirection="column"
        alignItems="center"
      >
        <Grid sx={{ my: 4 }}>
          <Typography variant="h4">Lexical Editor</Typography>
        </Grid>
        <Grid sx={{ width: 750, overflow: "hidden" }}>
          <LexicalEditorWrapper />
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}

export default App;