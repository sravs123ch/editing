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
import { $getRoot } from "lexical";
import { $generateNodesFromDOM } from "@lexical/html";
import { renderAsync } from "docx-preview";

const LexicalEditorTopBar = ({ onDownloadDocx, onImportDocx }) => {
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

  // const handleImportDocx = async (event) => {
  //   const file = event.target.files[0];
  //   if (!file) return;

  //   try {
  //     const arrayBuffer = await file.arrayBuffer();
  //     const container = document.createElement("div");
  //     await renderAsync(arrayBuffer, container, undefined, { inWrapper: false, useBase64URL: true });

  //     // Inline computed styles so $generateNodesFromDOM preserves fonts/sizes/spacing/colors
  //     // Attach to DOM to compute styles accurately, then detach
  //     container.style.position = "absolute";
  //     container.style.left = "-99999px";
  //     container.style.top = "-99999px";
  //     document.body.appendChild(container);
  //     const inlineProps = [
  //       "fontFamily",
  //       "fontSize",
  //       "lineHeight",
  //       "color",
  //       "backgroundColor",
  //       "textAlign",
  //       "fontWeight",
  //       "fontStyle",
  //       "textDecorationLine",
  //       "marginTop",
  //       "marginBottom",
  //       "marginLeft",
  //       "marginRight",
  //       "textIndent",
  //     ];
  //     const targets = container.querySelectorAll("p, span, div, li, td, th, h1, h2, h3, h4, h5, h6");
  //     targets.forEach((el) => {
  //       const cs = window.getComputedStyle(el);
  //       inlineProps.forEach((prop) => {
  //         const cssVal = cs[prop];
  //         if (!cssVal) return;
  //         const styleProp = prop.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
  //         if (!el.style[prop]) {
  //           // Special-case textDecorationLine -> text-decoration
  //           const finalProp = prop === "textDecorationLine" ? "text-decoration" : styleProp;
  //           el.style.setProperty(finalProp, cssVal);
  //         }
  //       });
  //     });
  //     document.body.removeChild(container);

  //     const html = container.innerHTML;
  //     editor.update(() => {
  //       const parser = new DOMParser();
  //       const dom = parser.parseFromString(html, "text/html");
  //       const nodes = $generateNodesFromDOM(editor, dom);
  //       const root = $getRoot();
  //       root.clear();
  //       if (Array.isArray(nodes) && nodes.length > 0) {
  //         root.append(...nodes);
  //       }
  //     });
  //   } catch (error) {
  //     console.error("Error importing DOCX:", error);
  //     alert("Error importing DOCX file. Please try again.");
  //   }

  //   event.target.value = "";
  // };

  const handleImportDocx = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    try {
      const arrayBuffer = await file.arrayBuffer();
      const container = document.createElement("div");
      await renderAsync(arrayBuffer, container, undefined, {
        inWrapper: false,
        useBase64URL: true,
      });
  
      // Inline computed styles and set image width to match content/tables
      container.style.position = "absolute";
      container.style.left = "-99999px";
      container.style.top = "-99999px";
      document.body.appendChild(container);
  
      const inlineProps = [
        "fontFamily",
        "fontSize",
        "lineHeight",
        "color",
        "backgroundColor",
        "textAlign",
        "fontWeight",
        "fontStyle",
        "textDecorationLine",
        "marginTop",
        "marginBottom",
        "marginLeft",
        "marginRight",
        "textIndent",
        // Add width for content elements if needed
        "width",
      ];
  
      const targets = container.querySelectorAll(
        "p, span, div, li, td, th, h1, h2, h3, h4, h5, h6, img"
      );
  
      // Define the target width for images (same as tables/content)
      const CONTENT_WIDTH = "600px"; // Replace with actual width from TablePlugin or editor CSS
  
      targets.forEach((el) => {
        const cs = window.getComputedStyle(el);
        inlineProps.forEach((prop) => {
          const cssVal = cs[prop];
          if (!cssVal) return;
          const styleProp = prop.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
          if (!el.style[prop]) {
            const finalProp = prop === "textDecorationLine" ? "text-decoration" : styleProp;
            el.style.setProperty(finalProp, cssVal);
          }
        });
  
        // Handle images specifically
        if (el.tagName.toLowerCase() === "img") {
          // Set width to match content/tables
          el.style.width = CONTENT_WIDTH; // e.g., "600px" or "100%"
          // Preserve aspect ratio by setting height to auto
          el.style.height = "auto";
          // Prevent CSS interference
          el.style.maxWidth = "none";
          el.style.maxHeight = "none";
          el.style.display = "inline-block";
        }
  
        // Optionally, set width for tables to ensure consistency
        if (el.tagName.toLowerCase() === "table") {
          el.style.width = CONTENT_WIDTH; // Ensure tables match the same width
          el.style.maxWidth = "none";
        }
      });
  
      document.body.removeChild(container);
  
      const html = container.innerHTML;
      editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(html, "text/html");
        const nodes = $generateNodesFromDOM(editor, dom);
        const root = $getRoot();
        root.clear();
        if (Array.isArray(nodes) && nodes.length > 0) {
          root.append(...nodes);
        }
      });
    } catch (error) {
      console.error("Error importing DOCX:", error);
      alert("Error importing DOCX file. Please try again.");
    }
  
    event.target.value = "";
  };
  return (
    <Grid
      container
      justifyContent="space-between"
      spacing={2}
      alignItems="center"
      sx={{ background: "white", py: 1.5, px: 0.5 }}
    >
      {/* Import/Export buttons on the left side */}
      <Grid item sx={{ display: "flex", gap: 1, justifyContent: "flex-end", ml: "auto" }}>
        <Button
          variant="outlined"
          component="label"
        >
          Import DOCX
          <input
            type="file"
            accept=".docx"
            hidden
            onChange={handleImportDocx}
          />
        </Button>
        <Button
          variant="contained"
          onClick={() => onDownloadDocx(editor)}
        >
          Export DOCX
        </Button>
      </Grid>
      <Grid item sx={{ display: "flex", gap: 1 }}>
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
      </Grid>
      {modal}
      {isLink && createPortal(<FloatingLinkEditor editor={editor} />, document.body)}
      <Grid item sx={{ display: "flex", gap: 1, justifyContent: "flex-end", ml: "auto" }}>
      <Box sx={{ display: "flex", gap: 1, p: 1, background: "#fff" }}>
        <ColorPlugin />
        <TablePlugin />
      </Box>
      </Grid>
    </Grid>
  );
};

export default LexicalEditorTopBar;
