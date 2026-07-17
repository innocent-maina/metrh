import { describe, expect, it } from "vitest";
import {
  buildFormValues,
  serializeFormValues,
  type CrudResourceConfig,
} from "../../../shared/dashboard-crud";

const resource = {
  id: "demo",
  label: "Demo items",
  description: "",
  table: "demo_items",
  readRoles: ["content_editor"],
  columns: [],
  fields: [
    { key: "title", label: "Title", kind: "text" },
    { key: "is_active", label: "Active", kind: "checkbox", defaultValue: true },
    { key: "tags", label: "Tags", kind: "multiselect", defaultValue: ["one"] },
    { key: "rank", label: "Rank", kind: "number" },
    { key: "meta", label: "Meta", kind: "json" },
  ],
} satisfies CrudResourceConfig;

describe("shared/dashboard-crud/form-values", () => {
  it("builds and serializes form values", () => {
    expect(
      buildFormValues(resource, {
        title: "Alpha",
        is_active: 0,
        tags: "two",
        rank: "4",
        meta: { visible: true },
      }),
    ).toEqual({
      title: "Alpha",
      is_active: false,
      tags: ["two"],
      rank: 4,
      meta: JSON.stringify({ visible: true }, null, 2),
    });

    expect(
      serializeFormValues(resource, {
        title: "Alpha",
        is_active: "",
        tags: ["two", "", null],
        rank: "4",
        meta: JSON.stringify({ visible: true }),
      }),
    ).toEqual({
      title: "Alpha",
      is_active: false,
      tags: ["two"],
      rank: 4,
      meta: { visible: true },
    });
  });
});
