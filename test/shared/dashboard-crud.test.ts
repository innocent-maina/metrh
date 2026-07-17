import { describe, expect, it } from "vitest";
import {
  buildDashboardEditorRoute,
  buildFormValues,
  buildResourceIdentifier,
  getDashboardResource,
  getFieldOptions,
  getResourceCreateLabel,
  getResourcePrimaryKeyFields,
  getResourceStampFields,
  parseResourceIdentifierQuery,
  roleListForResource,
  serializeFormValues,
  type CrudResourceConfig,
} from "../../shared/dashboard-crud";

describe("shared/dashboard-crud", () => {
  it("handles single and composite primary keys", () => {
    const single = {
      id: "demo",
      label: "Demo items",
      description: "",
      table: "demo_items",
      readRoles: ["content_editor"],
      columns: [],
      fields: [],
    } satisfies CrudResourceConfig;

    const composite = {
      ...single,
      primaryKey: ["slug", "locale"],
    } satisfies CrudResourceConfig;

    expect(getResourcePrimaryKeyFields(single)).toEqual(["id"]);
    expect(getResourcePrimaryKeyFields(composite)).toEqual(["slug", "locale"]);
    expect(buildResourceIdentifier(single, { id: 42 })).toEqual({ id: "42" });
    expect(buildResourceIdentifier(composite, { slug: "home", locale: "en" })).toEqual({
      identifier: { slug: "home", locale: "en" },
    });
    expect(parseResourceIdentifierQuery(single, { id: 42 })).toEqual({ id: "42" });
    expect(
      parseResourceIdentifierQuery(composite, {
        identifier: JSON.stringify({ slug: "home", locale: "en" }),
      }),
    ).toEqual({ identifier: { slug: "home", locale: "en" } });
  });

  it("builds dashboard editor routes from resource rows", () => {
    const resource = getDashboardResource("profiles");
    expect(resource?.section.id).toBe("team");
    expect(resource?.resource.id).toBe("profiles");

    const route = buildDashboardEditorRoute(resource!.resource, {
      mode: "edit",
      row: { id: 7 },
      defaults: { activeTab: "profile" },
      backTo: "/dashboard/team",
    });

    expect(route).toEqual({
      path: "/dashboard/editor/profiles",
      query: {
        mode: "edit",
        id: "7",
        defaults: JSON.stringify({ activeTab: "profile" }),
        backTo: "/dashboard/team",
      },
    });
  });

  it("normalizes form values and serializes them back", () => {
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

    const formValues = buildFormValues(resource, {
      title: "Alpha",
      is_active: 0,
      tags: "two",
      rank: "4",
      meta: { visible: true },
    });

    expect(formValues).toEqual({
      title: "Alpha",
      is_active: false,
      tags: ["two"],
      rank: 4,
      meta: JSON.stringify({ visible: true }, null, 2),
    });

    const payload = serializeFormValues(resource, {
      title: "Alpha",
      is_active: "",
      tags: ["two", "", null],
      rank: "4",
      meta: JSON.stringify({ visible: true }),
    });

    expect(payload).toEqual({
      title: "Alpha",
      is_active: false,
      tags: ["two"],
      rank: 4,
      meta: { visible: true },
    });
  });

  it("exposes labels, roles, and field options for dashboard resources", () => {
    const resource = getDashboardResource("service_categories")?.resource;
    expect(resource).toBeTruthy();
    expect(getResourceCreateLabel(resource!)).toBe("New Service category");
    expect(roleListForResource(resource!)).toEqual(["content_editor"]);
    expect(getResourceStampFields("blog_posts", "create")).toEqual(["author_id"]);

    const field = {
      key: "category_id",
      label: "Category",
      kind: "select",
      optionsFromResourceId: "service_categories",
      optionLabelKey: "name",
    };

    expect(
      getFieldOptions(field, {
        service_categories: [
          { id: 1, name: "Radiology" },
          { id: 2, name: "Maternity" },
        ],
      }),
    ).toEqual([
      { value: "1", label: "Radiology" },
      { value: "2", label: "Maternity" },
    ]);
  });
});
