/**
 * One-off generator for anonymised PDF test fixture (no PII).
 * Run: node scripts/generate-pdf-fixture.mjs
 */
import React from "react";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { renderToBuffer, Document, Page, Text, View } from "@react-pdf/renderer";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "src/lib/budget/__tests__/fixtures/fnb-sample.pdf");

const rowStyle = { flexDirection: "row", marginTop: 6, fontSize: 10 };
const col = (w) => ({ width: w });

const doc = React.createElement(
  Document,
  null,
  React.createElement(
    Page,
    { size: "A4", style: { padding: 40, fontSize: 11 } },
    React.createElement(Text, null, "FNB First National Bank Statement"),
    React.createElement(Text, { style: { marginTop: 12 } }, "Opening balance: 10000.00"),
    React.createElement(
      View,
      { style: rowStyle },
      React.createElement(Text, { style: col(70) }, "2026-05-01"),
      React.createElement(Text, { style: col(180) }, "PICK N PAY"),
      React.createElement(Text, { style: col(70) }, "-150.00"),
      React.createElement(Text, { style: col(70) }, "9850.00")
    ),
    React.createElement(
      View,
      { style: rowStyle },
      React.createElement(Text, { style: col(70) }, "2026-05-15"),
      React.createElement(Text, { style: col(180) }, "SALARY"),
      React.createElement(Text, { style: col(70) }, "25000.00"),
      React.createElement(Text, { style: col(70) }, "34850.00")
    ),
    React.createElement(
      View,
      { style: rowStyle },
      React.createElement(Text, { style: col(70) }, "2026-05-20"),
      React.createElement(Text, { style: col(180) }, "RENT PAYMENT"),
      React.createElement(Text, { style: col(70) }, "-8500.00"),
      React.createElement(Text, { style: col(70) }, "26350.00")
    ),
    React.createElement(Text, { style: { marginTop: 12 } }, "Closing balance: 26350.00")
  )
);

const buf = await renderToBuffer(doc);
writeFileSync(out, buf);
console.log(`Wrote ${out} (${buf.length} bytes)`);
