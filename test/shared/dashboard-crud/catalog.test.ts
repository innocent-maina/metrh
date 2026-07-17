import { describe, expect, it } from "vitest";
import {
  getDashboardResource,
  getFieldOptions,
  getResourceCreateLabel,
  getResourcePrimaryKeyFields,
  getResourceStampFields,
  roleListForResource,
} from "../../../shared/dashboard-crud";

describe("shared/dashboard-crud/catalog", () => {
  it("describes dashboard resources and option lookups", () => {
    const resource = getDashboardResource("service_categories")?.resource;
    expect(resource).toBeTruthy();
    expect(getResourceCreateLabel(resource!)).toBe("New Service category");
    expect(roleListForResource(resource!)).toEqual(["content_editor"]);
    expect(getResourceStampFields("blog_posts", "create")).toEqual(["author_id"]);
    expect(resource?.fields.find((field) => field.key === "icon")).toMatchObject({
      label: "Icon",
      kind: "icon",
    });

    expect(getDashboardResource("blog_categories")?.resource).toBeTruthy();
    expect(getDashboardResource("blog_tags")?.resource).toBeTruthy();
    expect(getDashboardResource("blog_post_tags")?.resource).toBeTruthy();
    expect(
      getResourcePrimaryKeyFields(getDashboardResource("blog_post_tags")!.resource),
    ).toEqual(["post_id", "tag_id"]);

    expect(
      getFieldOptions(
        {
          key: "category_id",
          label: "Category",
          kind: "select",
          optionsFromResourceId: "service_categories",
          optionLabelKey: "name",
        },
        {
          service_categories: [
            { id: 1, name: "Radiology" },
            { id: 2, name: "Maternity" },
          ],
        },
      ),
    ).toEqual([
      { value: "1", label: "Radiology" },
      { value: "2", label: "Maternity" },
    ]);
  });
});
