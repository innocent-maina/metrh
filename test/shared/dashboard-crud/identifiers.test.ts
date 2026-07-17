import { describe, expect, it } from "vitest";
import {
  buildDashboardEditorRoute,
  buildResourceIdentifier,
  getResourcePrimaryKeyFields,
  parseResourceIdentifierQuery,
  type CrudResourceConfig,
} from "../../../shared/dashboard-crud";

const singleResource = {
  id: "demo",
  label: "Demo items",
  description: "",
  table: "demo_items",
  readRoles: ["content_editor"],
  columns: [],
  fields: [],
} satisfies CrudResourceConfig;

const compositeResource = {
  ...singleResource,
  primaryKey: ["slug", "locale"],
} satisfies CrudResourceConfig;

describe("shared/dashboard-crud/identifiers", () => {
  it("handles single and composite keys", () => {
    expect(getResourcePrimaryKeyFields(singleResource)).toEqual(["id"]);
    expect(getResourcePrimaryKeyFields(compositeResource)).toEqual(["slug", "locale"]);
    expect(buildResourceIdentifier(singleResource, { id: 42 })).toEqual({ id: "42" });
    expect(buildResourceIdentifier(compositeResource, { slug: "home", locale: "en" })).toEqual({
      identifier: { slug: "home", locale: "en" },
    });
  });

  it("parses resource identifiers and builds editor routes", () => {
    expect(parseResourceIdentifierQuery(singleResource, { id: 42 })).toEqual({ id: "42" });
    expect(
      parseResourceIdentifierQuery(compositeResource, {
        identifier: JSON.stringify({ slug: "home", locale: "en" }),
      }),
    ).toEqual({ identifier: { slug: "home", locale: "en" } });

    const route = buildDashboardEditorRoute(singleResource, {
      mode: "edit",
      row: { id: 7 },
      defaults: { activeTab: "profile" },
      backTo: "/dashboard/team",
    });

    expect(route).toEqual({
      path: "/dashboard/editor/demo",
      query: {
        mode: "edit",
        id: "7",
        defaults: JSON.stringify({ activeTab: "profile" }),
        backTo: "/dashboard/team",
      },
    });
  });
});
