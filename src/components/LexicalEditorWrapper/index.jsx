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
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  HeadingLevel,
  ExternalHyperlink,
  ShadingType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  TableLayoutType,
} from "docx";
import { saveAs } from "file-saver";
import ColorPlugin from "../CustomPlugins/ColorPlugin";
import {
  $patchStyleText,
  $getSelectionStyleValueForProperty,
} from "@lexical/selection";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";

function LexicalEditorWrapper(props) {
  const handleDownloadDocx = async (editorState) => {
    const blocks = [];

    // Measure table column widths directly from the DOM so DOCX matches the editor UI
    const measureTablesFromDOM = () => {
      const results = [];
      const rootEl = document.querySelector(".ContentEditable__root");
      if (!rootEl) return results;
      const tableEls = rootEl.querySelectorAll("table");
      tableEls.forEach((table) => {
        try {
          const firstRow = table.rows && table.rows[0];
          if (!firstRow) {
            results.push(null);
            return;
          }
          const colWidthsPx = [];
          for (let ci = 0; ci < firstRow.cells.length; ci++) {
            const rect = firstRow.cells[ci].getBoundingClientRect();
            colWidthsPx.push(Math.max(0, Math.round(rect.width)));
          }
          const totalPx = colWidthsPx.reduce((a, b) => a + b, 0);
          const pxToTwips = (px) => Math.max(0, Math.round(px * 15)); // 1px≈1/96in; 1in=1440 twips => 1440/96=15
          const colsTwips = colWidthsPx.map(pxToTwips);
          const totalTwips = pxToTwips(totalPx);
          results.push({ colsTwips, totalTwips });
        } catch (e) {
          results.push(null);
        }
      });
      return results;
    };

    const measuredTables = measureTablesFromDOM();
    let measuredTableIndex = 0;

    editorState.read(() => {
      const root = $getRoot();

      const parseStyleToObject = (styleString) => {
        const style = {};
        if (!styleString) return style;
        styleString.split(";").forEach((decl) => {
          const [prop, val] = decl.split(":");
          if (prop && val) {
            style[prop.trim()] = val.trim();
          }
        });
        return style;
      };

      const normalizeFontFamily = (family) => {
        if (!family) return undefined;
        const first = family.split(",")[0] || "";
        return first.replace(/['"]/g, "").trim() || undefined;
      };

      const cssSizeToHalfPoints = (size) => {
        if (!size) return undefined;
        const s = String(size).trim().toLowerCase();
        if (s.endsWith("pt")) {
          const pt = parseFloat(s);
          return Number.isFinite(pt) ? Math.round(pt * 2) : undefined;
        }
        if (s.endsWith("px")) {
          const px = parseFloat(s);
          if (!Number.isFinite(px)) return undefined;
          const pt = px * 0.75; // 1pt = 1.333px => pt = px * 0.75
          return Math.round(pt * 2);
        }
        return undefined;
      };

      const colorToHexNoHash = (c) => {
        if (!c) return undefined;
        const m = c.trim();
        if (m.startsWith("#")) return m.slice(1).toUpperCase();
        return m.toUpperCase();
      };

      const collectRunsFromNode = (node, linkMeta) => {
        const runs = [];
        const type = node.getType();
        if (type === "text") {
          const text = node.getTextContent();
          if (text && text.length > 0) {
            const styleObj = parseStyleToObject(
              node.getStyle && node.getStyle()
            );
            const color = colorToHexNoHash(styleObj.color);
            const bgColor = colorToHexNoHash(styleObj["background-color"]);
            const fontFamily = normalizeFontFamily(styleObj["font-family"]);
            const fontSize = cssSizeToHalfPoints(styleObj["font-size"]);
            runs.push({
              kind: "text",
              text,
              bold: node.hasFormat("bold"),
              italics: node.hasFormat("italic"),
              underline: node.hasFormat("underline"),
              strike: node.hasFormat("strikethrough"),
              code: node.hasFormat("code"),
              color,
              bgColor,
              fontFamily,
              fontSize,
              isLink: linkMeta?.isLink || false,
              url: linkMeta?.url,
            });
          }
        } else if (type === "linebreak") {
          runs.push({ kind: "break" });
        } else if (type === "link") {
          const url = node.getURL && node.getURL();
          node.getChildren().forEach((child) => {
            runs.push(...collectRunsFromNode(child, { isLink: true, url }));
          });
        } else if (type === "image") {
          runs.push({ kind: "image", src: node.getSrc && node.getSrc() });
        } else {
          if (node.getChildren) {
            node.getChildren().forEach((child) => {
              runs.push(...collectRunsFromNode(child, linkMeta));
            });
          }
        }
        return runs;
      };

      root.getChildren().forEach((node) => {
        const nodeType = node.getType();

        if (nodeType === "heading") {
          const tag = node.getTag && node.getTag();
          const runs = collectRunsFromNode(node);
          blocks.push({
            kind: "heading",
            tag,
            runs,
            align: node.getFormatType && node.getFormatType(),
          });
        } else if (nodeType === "quote") {
          const runs = collectRunsFromNode(node);
          blocks.push({
            kind: "quote",
            runs,
            align: node.getFormatType && node.getFormatType(),
          });
        } else if (nodeType === "list") {
          const listTag = node.getTag && node.getTag();
          const items = node.getChildren();
          items.forEach((listItem, idx) => {
            const runs = collectRunsFromNode(listItem);
            blocks.push({
              kind: "list-item",
              ordered: listTag === "ol",
              index: idx,
              runs,
              align: node.getFormatType && node.getFormatType(),
            });
          });
        } else if (nodeType === "table") {
          const tableRows = [];
          const rowNodes = node.getChildren();
          rowNodes.forEach((rowNode) => {
            const rowCells = [];
            const cellNodes = rowNode.getChildren();
            cellNodes.forEach((cellNode) => {
              const paraNodes = cellNode.getChildren();
              const paragraphs = [];
              if (Array.isArray(paraNodes) && paraNodes.length > 0) {
                paraNodes.forEach((p) => {
                  const runs = collectRunsFromNode(p);
                  paragraphs.push({
                    runs,
                    align: p.getFormatType && p.getFormatType(),
                  });
                });
              } else {
                const runs = collectRunsFromNode(cellNode);
                paragraphs.push({
                  runs,
                  align: cellNode.getFormatType && cellNode.getFormatType(),
                });
              }
              rowCells.push({ paragraphs });
            });
            tableRows.push(rowCells);
          });
          const dims = measuredTables[measuredTableIndex++] || null;
          blocks.push({ kind: "table", rows: tableRows, dims });
        } else if (nodeType === "paragraph") {
          const runs = collectRunsFromNode(node);
          blocks.push({
            kind: "paragraph",
            runs,
            align: node.getFormatType && node.getFormatType(),
          });
        } else if (nodeType === "image") {
          blocks.push({
            kind: "paragraph",
            runs: [{ kind: "image", src: node.getSrc && node.getSrc() }],
            align: node.getFormatType && node.getFormatType(),
          });
        } else {
          const runs = collectRunsFromNode(node);
          if (runs.length > 0) {
            blocks.push({
              kind: "paragraph",
              runs,
              align: node.getFormatType && node.getFormatType(),
            });
          }
        }
      });
    });

    const dataUrlToUint8Array = async (dataUrl) => {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const ab = await blob.arrayBuffer();
      return new Uint8Array(ab);
    };

    const loadImageElement = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
      });
    };

    const convertImageToPngBytes = async (img) => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 1;
        canvas.height = img.naturalHeight || img.height || 1;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/png")
        );
        if (!blob) return null;
        const ab = await blob.arrayBuffer();
        return new Uint8Array(ab);
      } catch (e) {
        console.warn("PNG conversion failed", e);
        return null;
      }
    };

    const sniffImageType = (bytes) => {
      if (!bytes || bytes.length < 12) return null;
      // PNG signature
      if (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47 &&
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a
      ) {
        return "png";
      }
      // JPEG SOI
      if (bytes[0] === 0xff && bytes[1] === 0xd8) return "jpeg";
      // GIF
      if (
        bytes[0] === 0x47 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x38 &&
        (bytes[4] === 0x39 || bytes[4] === 0x37) &&
        bytes[5] === 0x61
      ) {
        return "gif";
      }
      return null;
    };

    const tryBitmapToPng = async (blob) => {
      try {
        if (typeof createImageBitmap === "function") {
          const bitmap = await createImageBitmap(blob);
          const canvas = document.createElement("canvas");
          canvas.width = bitmap.width || 1;
          canvas.height = bitmap.height || 1;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(bitmap, 0, 0);
          const out = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/png")
          );
          if (!out) return null;
          const ab = await out.arrayBuffer();
          return new Uint8Array(ab);
        }
      } catch (e) {
        console.warn("Bitmap conversion failed", e);
      }
      return null;
    };

    const resolveImage = async (src) => {
      if (!src) return null;
      let data;
      let width;
      let height;
      let type;

      if (src.startsWith("data:")) {
        try {
          const img = await loadImageElement(src);
          width = img.naturalWidth || 300;
          height = img.naturalHeight || 300;
          const png = await convertImageToPngBytes(img);
          if (png) {
            data = png;
            type = "png";
          } else {
            // fallback to original bytes
            data = await dataUrlToUint8Array(src);
            type = sniffImageType(data) || "png";
          }
        } catch (e) {
          console.warn("Failed to load data URL image for DOCX:", e);
          data = await dataUrlToUint8Array(src);
          type = sniffImageType(data) || "png";
          width = 300;
          height = 300;
        }
      } else {
        const res = await fetch(src, { mode: "cors" }).catch((e) => {
          console.warn("Image fetch failed due to CORS or network:", src, e);
          return null;
        });
        if (!res || !res.ok) return null;
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        try {
          const img = await loadImageElement(objectUrl);
          width = img.naturalWidth || 300;
          height = img.naturalHeight || 300;
          const png = await convertImageToPngBytes(img);
          if (png) {
            data = png;
            type = "png";
          } else {
            const ab = await blob.arrayBuffer();
            data = new Uint8Array(ab);
            type = sniffImageType(data);
            if (!type) {
              const conv = await tryBitmapToPng(blob);
              if (conv) {
                data = conv;
                type = "png";
              }
            }
          }
        } catch (e) {
          console.warn(
            "Failed to load remote image into canvas, falling back to raw bytes",
            e
          );
          const ab = await blob.arrayBuffer();
          data = new Uint8Array(ab);
          type = sniffImageType(data);
          if (!type) {
            const conv = await tryBitmapToPng(blob);
            if (conv) {
              data = conv;
              type = "png";
            }
          }
          width = 300;
          height = 300;
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      }

      if (!data) return null;
      return { data, width, height, type: type || "png" };
    };

    const mapAlign = (align) => {
      switch (align) {
        case "center":
          return AlignmentType.CENTER;
        case "right":
          return AlignmentType.RIGHT;
        case "justify":
          return AlignmentType.JUSTIFIED;
        default:
          return AlignmentType.LEFT;
      }
    };

    const sectionChildren = [];

    const buildParagraphFromRuns = async (runs, align) => {
      const paraChildren = [];

      const pushTextSegments = (run) => {
        const baseOpts = {
          bold: !!run.bold,
          italics: !!run.italics,
          underline: run.underline || run.isLink ? {} : undefined,
          strike: !!run.strike,
          color: run.isLink ? "0000FF" : run.color,
          font: run.code ? "Courier New" : run.fontFamily,
          size: run.fontSize,
          shading: run.bgColor
            ? { type: ShadingType.CLEAR, color: "auto", fill: run.bgColor }
            : undefined,
        };
        const text = run.text || "";
        // Preserve multiple spaces by converting to NBSP for all but one
        const normalizeSpaces = (s) =>
          s.replace(/ {2,}/g, (m) => " " + "\u00A0".repeat(m.length - 1));
        const lines = text.split("\n");
        lines.forEach((line, li) => {
          const parts = line.split("\t");
          parts.forEach((part, pi) => {
            const t = normalizeSpaces(part);
            const tr = new TextRun({ text: t, ...baseOpts });
            if (run.isLink && run.url) {
              paraChildren.push(
                new ExternalHyperlink({ link: run.url, children: [tr] })
              );
            } else {
              paraChildren.push(tr);
            }
            if (pi < parts.length - 1) {
              // insert a tab between parts
              paraChildren.push(new TextRun({ text: "\t" }));
            }
          });
          if (li < lines.length - 1) {
            // explicit line break
            paraChildren.push(new TextRun({ break: 1 }));
          }
        });
      };

      if (Array.isArray(runs)) {
        for (const run of runs) {
          if (run.kind === "image") {
            const img = await resolveImage(run.src);
            if (img) {
              paraChildren.push(
                new ImageRun({
                  data: img.data,
                  transformation: {
                    width: Math.min(500, img.width || 500),
                    height: Math.min(500, img.height || 500),
                  },
                  type: img.type,
                })
              );
            }
          } else if (run.kind === "break") {
            paraChildren.push(new TextRun({ break: 1 }));
          } else {
            pushTextSegments(run);
          }
        }
      }

      return new Paragraph({
        alignment: mapAlign(align),
        spacing: { before: 0, after: 0 },
        children: paraChildren,
      });
    };

    for (const block of blocks) {
      if (block.kind === "list-item") {
        const childrenRuns = [];
        if (block.ordered) {
          childrenRuns.push(
            new TextRun({ text: `${(block.index || 0) + 1}. ` })
          );
        } else {
          childrenRuns.push(new TextRun({ text: "• " }));
        }
        for (const run of block.runs) {
          if (run.kind === "image") {
            const img = await resolveImage(run.src);
            if (img) {
              childrenRuns.push(
                new ImageRun({
                  data: img.data,
                  transformation: {
                    width: Math.min(500, img.width || 500),
                    height: Math.min(500, img.height || 500),
                  },
                  type: img.type,
                })
              );
            }
          } else if (run.kind === "break") {
            childrenRuns.push(new TextRun({ break: 1 }));
          } else {
            // Reuse the same logic as in buildParagraphFromRuns
            const paragraph = await buildParagraphFromRuns([run], block.align);
            // Extract its children to keep within the same paragraph
            // Note: paragraph.children is internal; we rebuild runs to avoid complexity
            const baseOpts = {
              bold: !!run.bold,
              italics: !!run.italics,
              underline: run.underline ? {} : undefined,
              strike: !!run.strike,
              color: run.isLink ? "0000FF" : run.color,
              font: run.code ? "Courier New" : run.fontFamily,
              size: run.fontSize,
              shading: run.bgColor
                ? { type: ShadingType.CLEAR, color: "auto", fill: run.bgColor }
                : undefined,
            };
            const normalizeSpaces = (s) =>
              s.replace(/ {2,}/g, (m) => " " + "\u00A0".repeat(m.length - 1));
            const lines = (run.text || "").split("\n");
            lines.forEach((line, li) => {
              const parts = line.split("\t");
              parts.forEach((part, pi) => {
                const t = normalizeSpaces(part);
                const tr = new TextRun({ text: t, ...baseOpts });
                if (run.isLink && run.url) {
                  childrenRuns.push(
                    new ExternalHyperlink({ link: run.url, children: [tr] })
                  );
                } else {
                  childrenRuns.push(tr);
                }
                if (pi < parts.length - 1) {
                  childrenRuns.push(new TextRun({ text: "\t" }));
                }
              });
              if (li < lines.length - 1) {
                childrenRuns.push(new TextRun({ break: 1 }));
              }
            });
          }
        }
        sectionChildren.push(
          new Paragraph({
            alignment: mapAlign(block.align),
            spacing: { before: 0, after: 0 },
            children: childrenRuns,
          })
        );
        continue;
      }

      if (block.kind === "table") {
        const rows = [];
        const pageContentWidthTwips = 9360; // ~6.5 inches (8.5in page with 1in margins)

        let columnWidths = [];
        let tableWidthTwips = pageContentWidthTwips;
        if (block.dims && Array.isArray(block.dims.colsTwips)) {
          const sum = block.dims.colsTwips.reduce((a, b) => a + b, 0) || 0;
          if (sum > 0) {
            // Clamp to page width while preserving proportions
            const scale =
              sum > pageContentWidthTwips ? pageContentWidthTwips / sum : 1;
            columnWidths = block.dims.colsTwips.map((w) =>
              Math.max(0, Math.floor(w * scale))
            );
            tableWidthTwips = Math.min(
              pageContentWidthTwips,
              Math.max(0, Math.floor(sum * scale))
            );
          }
        }

        if (!columnWidths.length) {
          const colsCount =
            (block.rows && block.rows[0] ? block.rows[0].length : 0) || 0;
          if (colsCount === 3) {
            columnWidths = [2200, 2200, pageContentWidthTwips - 2200 - 2200];
          } else if (colsCount > 0) {
            const each = Math.floor(pageContentWidthTwips / colsCount);
            columnWidths = new Array(colsCount).fill(each);
          }
        }

        for (const rowCells of block.rows) {
          const cells = [];
          for (let ci = 0; ci < rowCells.length; ci++) {
            const cell = rowCells[ci];
            const cellParagraphs = [];
            for (const p of cell.paragraphs) {
              cellParagraphs.push(
                await buildParagraphFromRuns(p.runs, p.align)
              );
            }
            cells.push(
              new TableCell({
                children: cellParagraphs,
                width: columnWidths.length
                  ? {
                      size: columnWidths[ci] || columnWidths[0],
                      type: WidthType.DXA,
                    }
                  : undefined,
                margins: { top: 120, bottom: 120, left: 120, right: 120 },
              })
            );
          }
          rows.push(new TableRow({ children: cells }));
        }
        sectionChildren.push(
          new Table({
            width: { size: tableWidthTwips, type: WidthType.DXA },
            columnWidths: columnWidths.length ? columnWidths : undefined,
            alignment: AlignmentType.CENTER,
            layout: TableLayoutType.FIXED,
            rows,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideHorizontal: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: "000000",
              },
              insideVertical: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: "000000",
              },
            },
          })
        );
        continue;
      }

      const paraChildren = [];
      if (Array.isArray(block.runs)) {
        for (const run of block.runs) {
          if (run.kind === "image") {
            const img = await resolveImage(run.src);
            if (img) {
              paraChildren.push(
                new ImageRun({
                  data: img.data,
                  transformation: {
                    width: Math.min(500, img.width || 500),
                    height: Math.min(500, img.height || 500),
                  },
                  type: img.type,
                })
              );
            }
          } else if (run.kind === "break") {
            paraChildren.push(new TextRun({ break: 1 }));
          } else {
            // delegate to shared helper
            const paragraph = await buildParagraphFromRuns([run], block.align);
            // We need just the runs; reconstruct here similarly to keep consistency
            const baseOpts = {
              bold: !!run.bold,
              italics: !!run.italics,
              underline: run.underline || run.isLink ? {} : undefined,
              strike: !!run.strike,
              color: run.isLink ? "0000FF" : run.color,
              font: run.code ? "Courier New" : run.fontFamily,
              size: run.fontSize,
              shading: run.bgColor
                ? { type: ShadingType.CLEAR, color: "auto", fill: run.bgColor }
                : undefined,
            };
            const normalizeSpaces = (s) =>
              s.replace(/ {2,}/g, (m) => " " + "\u00A0".repeat(m.length - 1));
            const lines = (run.text || "").split("\n");
            lines.forEach((line, li) => {
              const parts = line.split("\t");
              parts.forEach((part, pi) => {
                const t = normalizeSpaces(part);
                const tr = new TextRun({ text: t, ...baseOpts });
                if (run.isLink && run.url) {
                  paraChildren.push(
                    new ExternalHyperlink({ link: run.url, children: [tr] })
                  );
                } else {
                  paraChildren.push(tr);
                }
                if (pi < parts.length - 1) {
                  paraChildren.push(new TextRun({ text: "\t" }));
                }
              });
              if (li < lines.length - 1) {
                paraChildren.push(new TextRun({ break: 1 }));
              }
            });
          }
        }
      }

      if (block.kind === "heading") {
        const headingLevel =
          block.tag === "h1"
            ? HeadingLevel.HEADING_1
            : block.tag === "h2"
            ? HeadingLevel.HEADING_2
            : HeadingLevel.HEADING_3;
        sectionChildren.push(
          new Paragraph({
            heading: headingLevel,
            alignment: mapAlign(block.align),
            spacing: { before: 0, after: 0 },
            children: paraChildren,
          })
        );
      } else if (block.kind === "quote") {
        sectionChildren.push(
          new Paragraph({
            alignment: mapAlign(block.align),
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({ text: "“" }),
              ...paraChildren,
              new TextRun({ text: "”" }),
            ],
          })
        );
      } else {
        sectionChildren.push(
          new Paragraph({
            alignment: mapAlign(block.align),
            spacing: { before: 0, after: 0 },
            children: paraChildren,
          })
        );
      }
    }

    const doc = new Document({
      styles: {
        default: {
          run: { font: "Calibri", size: 22 },
          paragraph: { spacing: { before: 0, after: 0, line: 240 } },
        },
      },
      sections: [
        {
          properties: {},
          children: sectionChildren,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "document.docx");
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
              console.log(
                `      Formats: Bold=${child.hasFormat(
                  "bold"
                )}, Italic=${child.hasFormat(
                  "italic"
                )}, Underline=${child.hasFormat("underline")}`
              );
            } else if (child.getType() === "link") {
              console.log(
                `      Link Text: ${child.getTextContent()}, URL: ${child.getURL()}`
              );
            }
          });
        } else if (node.getType() === "list") {
          console.log("  List content:");
          node.getChildren().forEach((listItem, itemIndex) => {
            console.log(
              `    Item ${itemIndex + 1}: ${listItem.getTextContent()}`
            );
          });
        }
      });
    });
  }

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
              console.log(
                `      Formats: Bold=${child.hasFormat(
                  "bold"
                )}, Italic=${child.hasFormat(
                  "italic"
                )}, Underline=${child.hasFormat("underline")}`
              );
            } else if (child.getType() === "link") {
              console.log(
                `      Link Text: ${child.getTextContent()}, URL: ${child.getURL()}`
              );
            } else if (child.getType() === "image") {
              console.log(
                `      Image: Src=${child.getSrc()}, Alt=${child.getAltText()}`
              );
            }
          });
        } else if (node.getType() === "list") {
          console.log("  List content:");
          node.getChildren().forEach((listItem, itemIndex) => {
            console.log(
              `    Item ${itemIndex + 1}: ${listItem.getTextContent()}`
            );
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
          console.log(styles, "styles");
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
        {/* <TablePlugin/> */}
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
