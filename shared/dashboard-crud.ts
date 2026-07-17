import type {
  AppRole,
  ApplicationStatus,
  ContactStatus,
  DayOfWeek,
  EmploymentType,
  JobStatus,
  PublishStatus,
  TenderCategory,
  TenderStatus,
} from "~~/types/database.types";

export type CrudFieldKind =
  | "text"
  | "textarea"
  | "richtext"
  | "select"
  | "multiselect"
  | "number"
  | "checkbox"
  | "icon"
  | "date"
  | "time"
  | "json"
  | "upload";

export interface CrudOption {
  label: string;
  value: string;
}

export interface CrudField {
  key: string;
  label: string;
  kind: CrudFieldKind;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  rows?: number;
  options?: CrudOption[];
  optionsFromResourceId?: string;
  optionLabelKey?: string;
  optionValueKey?: string;
  serverOnly?: boolean;
  disabled?: boolean;
  defaultValue?: unknown;
  accept?: string;
  uploadBucket?: "media" | "documents";
  uploadFolder?: string;
  uploadPreview?: "image";
}

export interface CrudColumn {
  key: string;
  label: string;
  kind?: "text" | "number" | "date" | "time" | "status" | "boolean";
  class?: string;
}

export interface CrudResourceConfig {
  id: string;
  label: string;
  description: string;
  table: string;
  primaryKey?: string | string[];
  readRoles: AppRole[];
  writeRoles?: AppRole[];
  columns: CrudColumn[];
  fields: CrudField[];
  rowLabelKey?: string;
  defaultSort?: {
    key: string;
    ascending?: boolean;
  };
  allowCreate?: boolean;
  allowUpdate?: boolean;
  allowDelete?: boolean;
  singleton?: boolean;
  createLabel?: string;
  submitLabel?: string;
  stampFields?: {
    create?: string[];
    update?: string[];
  };
}

export interface CrudSectionConfig {
  id: string;
  label: string;
  to: string;
  description: string;
  roles: AppRole[];
  icon: string;
  resources: CrudResourceConfig[];
  children?: Array<{
    id: string;
    label: string;
    to: string;
    description: string;
  }>;
}

type ResourceLookup = {
  resourceId: string;
  labelKey?: string;
  valueKey?: string;
};

export interface CrudRowContext {
  optionsByResourceId: Record<string, CrudOption[]>;
}

export interface DashboardResourceMeta extends CrudResourceConfig {
  sectionId: string;
  sectionLabel: string;
}

export type CrudEditorMode = "create" | "edit" | "view";

function selectRoles(resource: CrudResourceConfig): AppRole[] {
  return resource.writeRoles ?? resource.readRoles;
}

export function getResourcePrimaryKeyFields(resource: CrudResourceConfig) {
  if (!resource.primaryKey) return ["id"];
  return Array.isArray(resource.primaryKey)
    ? resource.primaryKey
    : [resource.primaryKey];
}

export function buildResourceIdentifier(
  resource: CrudResourceConfig,
  row: Record<string, unknown>,
) {
  const keyFields = getResourcePrimaryKeyFields(resource);

  if (keyFields.length === 1) {
    const key = keyFields[0] ?? "id";
    const value = row[key];
    return { id: value == null ? "" : String(value) };
  }

  const identifier: Record<string, string> = {};
  for (const key of keyFields) {
    identifier[key] = String(row[key] ?? "");
  }

  return { identifier };
}

export function parseResourceIdentifierQuery(
  resource: CrudResourceConfig,
  query: Record<string, unknown>,
) {
  const keyFields = getResourcePrimaryKeyFields(resource);

  if (keyFields.length === 1) {
    const key = keyFields[0] ?? "id";
    const value = query.id ?? query[key];
    return value == null || value === "" ? null : { id: String(value) };
  }

  const rawIdentifier = query.identifier;
  if (typeof rawIdentifier === "string" && rawIdentifier.trim()) {
    try {
      const parsed = JSON.parse(rawIdentifier) as Record<string, unknown>;
      const identifier: Record<string, string> = {};
      for (const key of keyFields) {
        const value = parsed[key];
        if (value == null || value === "") {
          return null;
        }
        identifier[key] = String(value);
      }
      return { identifier };
    } catch {
      return null;
    }
  }

  const identifier: Record<string, string> = {};
  for (const key of keyFields) {
    const value = query[key];
    if (value == null || value === "") {
      return null;
    }
    identifier[key] = String(value);
  }

  return { identifier };
}

export function buildDashboardEditorRoute(
  resource: CrudResourceConfig,
  options: {
    mode: CrudEditorMode;
    row?: Record<string, unknown>;
    defaults?: Record<string, unknown>;
    backTo?: string;
  },
) {
  const query: Record<string, string> = { mode: options.mode };

  if (options.row) {
    const identifier = buildResourceIdentifier(resource, options.row);
    if ("id" in identifier) {
      query.id = String(identifier.id);
    } else {
      query.identifier = JSON.stringify(identifier.identifier);
    }
  }

  if (options.defaults && Object.keys(options.defaults).length > 0) {
    query.defaults = JSON.stringify(options.defaults);
  }

  if (options.backTo) {
    query.backTo = options.backTo;
  }

  return { path: `/dashboard/editor/${resource.id}`, query };
}

function baseColumns(
  keys: Array<{
    key: string;
    label: string;
    kind?: CrudColumn["kind"];
    class?: string;
  }>,
): CrudColumn[] {
  return keys;
}

function fields(
  entries: Array<
    Omit<CrudField, "key" | "label" | "kind"> & {
      key: string;
      label: string;
      kind: CrudFieldKind;
    }
  >,
): CrudField[] {
  return entries;
}

const publishStatuses: CrudOption[] = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

const contactStatuses: CrudOption[] = [
  { label: "New", value: "new" },
  { label: "Read", value: "read" },
  { label: "Responded", value: "responded" },
  { label: "Archived", value: "archived" },
];

const jobStatuses: CrudOption[] = [
  { label: "Draft", value: "draft" },
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
];

const employmentTypes: CrudOption[] = [
  { label: "Contract", value: "contract" },
  { label: "Permanent", value: "permanent" },
  { label: "Internship", value: "internship" },
  { label: "Locum", value: "locum" },
];

const applicationStatuses: CrudOption[] = [
  { label: "Submitted", value: "submitted" },
  { label: "Shortlisted", value: "shortlisted" },
  { label: "Interviewing", value: "interviewing" },
  { label: "Rejected", value: "rejected" },
  { label: "Hired", value: "hired" },
];

const tenderCategories: CrudOption[] = [
  { label: "Goods", value: "goods" },
  { label: "Services", value: "services" },
  { label: "Works", value: "works" },
  { label: "Framework agreement", value: "framework_agreement" },
  { label: "Consultancy", value: "consultancy" },
];

const tenderStatuses: CrudOption[] = [
  { label: "Draft", value: "draft" },
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
  { label: "Awarded", value: "awarded" },
  { label: "Cancelled", value: "cancelled" },
];

const daysOfWeek: CrudOption[] = [
  { label: "Monday", value: "monday" },
  { label: "Tuesday", value: "tuesday" },
  { label: "Wednesday", value: "wednesday" },
  { label: "Thursday", value: "thursday" },
  { label: "Friday", value: "friday" },
  { label: "Saturday", value: "saturday" },
  { label: "Sunday", value: "sunday" },
];

const appRoles: CrudOption[] = [
  { label: "Super admin", value: "super_admin" },
  { label: "Content editor", value: "content_editor" },
  { label: "HR manager", value: "hr_manager" },
  { label: "Procurement manager", value: "procurement_manager" },
  { label: "Front desk", value: "front_desk" },
];

const contentPageOptions: CrudOption[] = [
  { label: "Home", value: "home" },
  { label: "About", value: "about" },
  { label: "Services", value: "services" },
  { label: "Blog", value: "blog" },
  { label: "Careers", value: "careers" },
  { label: "Tenders", value: "tenders" },
  { label: "Contact", value: "contact" },
  { label: "Legal", value: "legal" },
];

const contentSectionTypes: CrudOption[] = [
  { label: "Content", value: "content" },
  { label: "Hero", value: "hero" },
  { label: "Feature list", value: "feature-list" },
  { label: "Card grid", value: "card-grid" },
  { label: "Dual card", value: "dual-card" },
  { label: "Copy", value: "copy" },
  { label: "List", value: "list" },
  { label: "Ordered list", value: "ordered-list" },
  { label: "Callout", value: "callout" },
];

export const dashboardSections: CrudSectionConfig[] = [
  {
    id: "blog",
    label: "Blog",
    to: "/dashboard/blog",
    description: "Manage milestone stories, categories, and tags.",
    roles: ["content_editor"],
    icon: "lucide:newspaper",
    resources: [
      {
        id: "blog_posts",
        label: "Posts",
        description: "Publish stories and announcements.",
        table: "blog_posts",
        readRoles: ["content_editor"],
        writeRoles: ["content_editor"],
        rowLabelKey: "title",
        defaultSort: { key: "created_at", ascending: false },
        columns: baseColumns([
          { key: "title", label: "Title" },
          { key: "slug", label: "Slug" },
          { key: "status", label: "Status", kind: "status" },
          { key: "published_at", label: "Published", kind: "date" },
          { key: "view_count", label: "Views", kind: "number" },
        ]),
        fields: fields([
          { key: "title", label: "Title", kind: "text", required: true },
          { key: "slug", label: "Slug", kind: "text", required: true },
          { key: "excerpt", label: "Excerpt", kind: "textarea", rows: 3 },
          {
            key: "content",
            label: "Main body",
            kind: "richtext",
            required: true,
            placeholder: "Write the blog post body here.",
            helpText:
              "This is the WYSIWYG article body. Use the toolbar to add headings, lists, quotes, links, bold, and italic text.",
          },
          {
            key: "cover_image_url",
            label: "Cover image",
            kind: "upload",
            accept: "image/*",
            uploadBucket: "media",
            uploadFolder: "blog/posts/covers",
            uploadPreview: "image",
          },
          {
            key: "category_id",
            label: "Category",
            kind: "select",
            optionsFromResourceId: "blog_categories",
            optionLabelKey: "name",
          },
          {
            key: "status",
            label: "Status",
            kind: "select",
            options: publishStatuses,
          },
          { key: "published_at", label: "Published on", kind: "date" },
          { key: "seo_title", label: "SEO title", kind: "text" },
          {
            key: "seo_description",
            label: "SEO description",
            kind: "textarea",
            rows: 3,
          },
          {
            key: "seo_og_image_url",
            label: "SEO image",
            kind: "upload",
            accept: "image/*",
            uploadBucket: "media",
            uploadFolder: "blog/posts/seo",
            uploadPreview: "image",
          },
          { key: "reading_minutes", label: "Reading minutes", kind: "number" },
        ]),
        stampFields: { create: ["author_id"] },
      },
      {
        id: "blog_categories",
        label: "Categories",
        description: "Organize posts into editorial buckets.",
        table: "blog_categories",
        readRoles: ["content_editor"],
        writeRoles: ["content_editor"],
        rowLabelKey: "name",
        defaultSort: { key: "created_at", ascending: false },
        columns: baseColumns([
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug" },
          { key: "description", label: "Description" },
        ]),
        fields: fields([
          { key: "name", label: "Name", kind: "text", required: true },
          { key: "slug", label: "Slug", kind: "text", required: true },
          {
            key: "description",
            label: "Description",
            kind: "textarea",
            rows: 4,
          },
        ]),
      },
      {
        id: "blog_tags",
        label: "Tags",
        description: "Reuse tags across stories.",
        table: "blog_tags",
        readRoles: ["content_editor"],
        writeRoles: ["content_editor"],
        rowLabelKey: "name",
        defaultSort: { key: "name", ascending: true },
        columns: baseColumns([
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug" },
        ]),
        fields: fields([
          { key: "name", label: "Name", kind: "text", required: true },
          { key: "slug", label: "Slug", kind: "text", required: true },
        ]),
      },
      {
        id: "blog_post_tags",
        label: "Post tags",
        description: "Assign tags to published posts.",
        table: "blog_post_tags",
        primaryKey: ["post_id", "tag_id"],
        readRoles: ["content_editor"],
        writeRoles: ["content_editor"],
        rowLabelKey: "post_id",
        defaultSort: { key: "post_id", ascending: true },
        columns: baseColumns([
          { key: "post_id", label: "Post" },
          { key: "tag_id", label: "Tag" },
        ]),
        fields: fields([
          {
            key: "post_id",
            label: "Post",
            kind: "select",
            optionsFromResourceId: "blog_posts",
            optionLabelKey: "title",
            required: true,
          },
          {
            key: "tag_id",
            label: "Tag",
            kind: "select",
            optionsFromResourceId: "blog_tags",
            optionLabelKey: "name",
            required: true,
          },
        ]),
      },
    ],
  },
  {
    id: "services",
    label: "Services",
    to: "/dashboard/services",
    description: "Edit service categories, services, and clinic schedule.",
    roles: ["content_editor"],
    icon: "lucide:stethoscope",
    resources: [
      {
        id: "service_categories",
        label: "Service categories",
        description: "Organize clinic and department services.",
        table: "service_categories",
        readRoles: ["content_editor"],
        writeRoles: ["content_editor"],
        rowLabelKey: "name",
        defaultSort: { key: "display_order", ascending: true },
        columns: baseColumns([
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug" },
          { key: "icon", label: "Icon" },
          { key: "display_order", label: "Order", kind: "number" },
        ]),
        fields: fields([
          { key: "name", label: "Name", kind: "text", required: true },
          { key: "slug", label: "Slug", kind: "text", required: true },
          {
            key: "icon",
            label: "Icon",
            kind: "icon",
            helpText: "Pick an icon for the service category card.",
          },
          {
            key: "description",
            label: "Description",
            kind: "textarea",
            rows: 4,
          },
          { key: "display_order", label: "Display order", kind: "number" },
        ]),
      },
      {
        id: "services",
        label: "Services",
        description:
          "Maintain the public service catalog and service detail pages.",
        table: "services",
        readRoles: ["content_editor"],
        writeRoles: ["content_editor"],
        rowLabelKey: "name",
        defaultSort: { key: "display_order", ascending: true },
        columns: baseColumns([
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug" },
          { key: "is_specialized", label: "Specialized", kind: "boolean" },
          { key: "is_active", label: "Active", kind: "boolean" },
          { key: "display_order", label: "Order", kind: "number" },
        ]),
        fields: fields([
          {
            key: "category_id",
            label: "Category",
            kind: "select",
            optionsFromResourceId: "service_categories",
            optionLabelKey: "name",
            required: true,
          },
          { key: "name", label: "Name", kind: "text", required: true },
          { key: "slug", label: "Slug", kind: "text", required: true },
          {
            key: "summary",
            label: "Summary",
            kind: "textarea",
            rows: 3,
            helpText: "Short preview text shown in the services list.",
          },
          {
            key: "cover_image_url",
            label: "Cover image",
            kind: "upload",
            helpText: "Use a wide image that works as the service hero.",
            accept: "image/*",
            uploadBucket: "media",
            uploadFolder: "services/cover-images",
            uploadPreview: "image",
          },
          {
            key: "cover_image_alt",
            label: "Cover image alt text",
            kind: "text",
            helpText:
              "Describe the image for screen readers and search engines.",
          },
          {
            key: "description",
            label: "Description",
            kind: "richtext",
            rows: 12,
            helpText:
              "Write the full service page here using headings, links, and lists.",
          },
          {
            key: "cta_label",
            label: "Call-to-action label",
            kind: "text",
            helpText: "Optional button text shown on the service page.",
          },
          {
            key: "cta_href",
            label: "Call-to-action link",
            kind: "text",
            helpText: "Use an internal path like /contact or a full URL.",
          },
          { key: "is_specialized", label: "Specialized", kind: "checkbox" },
          { key: "display_order", label: "Display order", kind: "number" },
          { key: "is_active", label: "Active", kind: "checkbox" },
        ]),
      },
      {
        id: "clinic_schedule",
        label: "Clinic schedule",
        description: "Weekly schedule for specialist outpatient care.",
        table: "clinic_schedule",
        readRoles: ["content_editor"],
        writeRoles: ["content_editor"],
        rowLabelKey: "clinic_name",
        defaultSort: { key: "day_of_week", ascending: true },
        columns: baseColumns([
          { key: "clinic_name", label: "Clinic" },
          { key: "day_of_week", label: "Day", kind: "text" },
          { key: "start_time", label: "Start time", kind: "time" },
          { key: "is_active", label: "Active", kind: "boolean" },
        ]),
        fields: fields([
          {
            key: "service_id",
            label: "Service",
            kind: "select",
            optionsFromResourceId: "services",
            optionLabelKey: "name",
          },
          {
            key: "clinic_name",
            label: "Clinic name",
            kind: "text",
            required: true,
          },
          {
            key: "day_of_week",
            label: "Day of week",
            kind: "select",
            options: daysOfWeek,
            required: true,
          },
          {
            key: "start_time",
            label: "Start time",
            kind: "time",
            required: true,
          },
          { key: "is_active", label: "Active", kind: "checkbox" },
          { key: "notes", label: "Notes", kind: "textarea", rows: 4 },
        ]),
      },
    ],
  },
  {
    id: "contact",
    label: "Contact Inbox",
    to: "/dashboard/contact",
    description: "Review enquiries and internal notes.",
    roles: ["front_desk", "content_editor"],
    icon: "lucide:inbox",
    resources: [
      {
        id: "contact_submissions",
        label: "Contact submissions",
        description: "Track enquiries from the public contact form.",
        table: "contact_submissions",
        readRoles: ["front_desk", "content_editor"],
        writeRoles: ["front_desk"],
        rowLabelKey: "subject",
        defaultSort: { key: "created_at", ascending: false },
        columns: baseColumns([
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "subject", label: "Subject" },
          { key: "status", label: "Status", kind: "status" },
          { key: "created_at", label: "Received", kind: "date" },
        ]),
        fields: fields([
          { key: "name", label: "Name", kind: "text", required: true },
          { key: "email", label: "Email", kind: "text", required: true },
          { key: "phone", label: "Phone", kind: "text" },
          { key: "subject", label: "Subject", kind: "text" },
          {
            key: "message",
            label: "Message",
            kind: "textarea",
            rows: 8,
            required: true,
          },
          {
            key: "status",
            label: "Status",
            kind: "select",
            options: contactStatuses,
          },
          {
            key: "internal_notes",
            label: "Internal notes",
            kind: "textarea",
            rows: 5,
          },
        ]),
        stampFields: { update: ["handled_by"] },
      },
    ],
  },
  {
    id: "careers",
    label: "Careers",
    to: "/dashboard/careers",
    description: "Publish jobs and review applications.",
    roles: ["hr_manager"],
    icon: "lucide:briefcase",
    resources: [
      {
        id: "job_postings",
        label: "Job postings",
        description: "Manage live and draft vacancies.",
        table: "job_postings",
        readRoles: ["hr_manager"],
        writeRoles: ["hr_manager"],
        rowLabelKey: "title",
        defaultSort: { key: "created_at", ascending: false },
        columns: baseColumns([
          { key: "title", label: "Title" },
          { key: "department", label: "Department" },
          { key: "employment_type", label: "Employment type" },
          { key: "status", label: "Status", kind: "status" },
          { key: "application_deadline", label: "Deadline", kind: "date" },
        ]),
        fields: fields([
          { key: "reference_no", label: "Reference no.", kind: "text" },
          { key: "title", label: "Title", kind: "text", required: true },
          { key: "slug", label: "Slug", kind: "text", required: true },
          { key: "department", label: "Department", kind: "text" },
          {
            key: "employment_type",
            label: "Employment type",
            kind: "select",
            options: employmentTypes,
            required: true,
          },
          { key: "positions_count", label: "Positions", kind: "number" },
          {
            key: "description",
            label: "Description",
            kind: "textarea",
            rows: 8,
            required: true,
          },
          {
            key: "requirements",
            label: "Requirements",
            kind: "textarea",
            rows: 6,
          },
          {
            key: "responsibilities",
            label: "Responsibilities",
            kind: "textarea",
            rows: 6,
          },
          {
            key: "how_to_apply",
            label: "How to apply",
            kind: "textarea",
            rows: 6,
          },
          {
            key: "attachment_url",
            label: "Attachment document",
            kind: "upload",
            helpText:
              "Upload the job notice, PDF brief, or supporting document for this opening.",
            accept:
              ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            uploadBucket: "documents",
            uploadFolder: "jobs/postings/attachments",
          },
          {
            key: "status",
            label: "Status",
            kind: "select",
            options: jobStatuses,
          },
          {
            key: "application_deadline",
            label: "Application deadline",
            kind: "date",
          },
        ]),
        stampFields: { create: ["created_by"] },
      },
      {
        id: "job_applications",
        label: "Applications",
        description: "Review submissions against live vacancies.",
        table: "job_applications",
        readRoles: ["hr_manager"],
        writeRoles: ["hr_manager"],
        rowLabelKey: "applicant_name",
        defaultSort: { key: "created_at", ascending: false },
        columns: baseColumns([
          { key: "applicant_name", label: "Applicant" },
          { key: "email", label: "Email" },
          { key: "status", label: "Status", kind: "status" },
          { key: "created_at", label: "Submitted", kind: "date" },
        ]),
        fields: fields([
          {
            key: "job_id",
            label: "Job",
            kind: "select",
            optionsFromResourceId: "job_postings",
            optionLabelKey: "title",
            required: true,
          },
          {
            key: "applicant_name",
            label: "Applicant name",
            kind: "text",
            required: true,
          },
          { key: "email", label: "Email", kind: "text", required: true },
          { key: "phone", label: "Phone", kind: "text" },
          {
            key: "cover_letter",
            label: "Cover letter",
            kind: "textarea",
            rows: 8,
          },
          {
            key: "resume_url",
            label: "Resume",
            kind: "upload",
            required: true,
            accept:
              ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            uploadBucket: "documents",
            uploadFolder: "jobs/applications/resumes",
          },
          {
            key: "supporting_document_url",
            label: "Supporting document",
            kind: "upload",
            helpText:
              "Optional certificates, portfolio files, or additional supporting documents.",
            accept:
              ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            uploadBucket: "documents",
            uploadFolder: "jobs/applications/supporting-documents",
          },
          {
            key: "status",
            label: "Status",
            kind: "select",
            options: applicationStatuses,
          },
          {
            key: "reviewer_notes",
            label: "Reviewer notes",
            kind: "textarea",
            rows: 5,
          },
        ]),
      },
    ],
  },
  {
    id: "tenders",
    label: "Tenders",
    to: "/dashboard/tenders",
    description: "Manage tender notices, attachments, and procurement files.",
    roles: ["procurement_manager"],
    icon: "lucide:file-text",
    resources: [
      {
        id: "tenders",
        label: "Tender notices",
        description: "Publish tender notices and award decisions.",
        table: "tenders",
        readRoles: ["procurement_manager"],
        writeRoles: ["procurement_manager"],
        rowLabelKey: "title",
        defaultSort: { key: "created_at", ascending: false },
        columns: baseColumns([
          { key: "tender_number", label: "Tender number" },
          { key: "title", label: "Title" },
          { key: "category", label: "Category" },
          { key: "status", label: "Status", kind: "status" },
          { key: "closing_date", label: "Closing", kind: "date" },
        ]),
        fields: fields([
          {
            key: "tender_number",
            label: "Tender number",
            kind: "text",
            required: true,
          },
          { key: "title", label: "Title", kind: "text", required: true },
          { key: "slug", label: "Slug", kind: "text", required: true },
          {
            key: "category",
            label: "Category",
            kind: "select",
            options: tenderCategories,
            required: true,
          },
          {
            key: "description",
            label: "Description",
            kind: "textarea",
            rows: 8,
          },
          {
            key: "status",
            label: "Status",
            kind: "select",
            options: tenderStatuses,
          },
          { key: "opening_date", label: "Opening date", kind: "date" },
          { key: "closing_date", label: "Closing date", kind: "date" },
          { key: "awarded_to", label: "Awarded to", kind: "text" },
        ]),
        stampFields: { create: ["created_by"] },
      },
      {
        id: "tender_documents",
        label: "Attachments",
        description: "Attach files to a tender notice.",
        table: "tender_documents",
        readRoles: ["procurement_manager"],
        writeRoles: ["procurement_manager"],
        rowLabelKey: "file_name",
        defaultSort: { key: "created_at", ascending: false },
        columns: baseColumns([
          { key: "file_name", label: "File name" },
          { key: "file_url", label: "Document" },
          { key: "file_size_kb", label: "Size", kind: "number" },
        ]),
        fields: fields([
          {
            key: "tender_id",
            label: "Tender",
            kind: "select",
            optionsFromResourceId: "tenders",
            optionLabelKey: "title",
            required: true,
          },
          {
            key: "file_name",
            label: "File name",
            kind: "text",
            required: true,
          },
          {
            key: "file_url",
            label: "Document",
            kind: "upload",
            required: true,
            accept:
              ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            uploadBucket: "documents",
            uploadFolder: "tenders/documents",
          },
          { key: "file_size_kb", label: "File size (KB)", kind: "number" },
        ]),
      },
      {
        id: "downloads",
        label: "Supporting files",
        description: "Manage public supplier lists and policy files.",
        table: "downloads",
        readRoles: ["procurement_manager"],
        writeRoles: ["procurement_manager"],
        rowLabelKey: "title",
        defaultSort: { key: "created_at", ascending: false },
        columns: baseColumns([
          { key: "title", label: "Title" },
          { key: "category", label: "Category" },
          { key: "is_published", label: "Published", kind: "boolean" },
        ]),
        fields: fields([
          { key: "title", label: "Title", kind: "text", required: true },
          {
            key: "description",
            label: "Description",
            kind: "textarea",
            rows: 4,
          },
          { key: "category", label: "Category", kind: "text" },
          {
            key: "file_url",
            label: "Document",
            kind: "upload",
            required: true,
            accept:
              ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            uploadBucket: "documents",
            uploadFolder: "tenders/downloads",
          },
          { key: "file_size_kb", label: "File size (KB)", kind: "number" },
          { key: "is_published", label: "Published", kind: "checkbox" },
        ]),
      },
    ],
  },
  {
    id: "team",
    label: "Team",
    to: "/dashboard/team",
    description: "Maintain leadership cards and staff auth accounts.",
    roles: ["content_editor"],
    icon: "lucide:users",
    resources: [
      {
        id: "team_members",
        label: "Leadership profiles",
        description: "Edit public leadership and board profile cards.",
        table: "team_members",
        readRoles: ["content_editor"],
        writeRoles: ["content_editor"],
        rowLabelKey: "full_name",
        defaultSort: { key: "display_order", ascending: true },
        columns: baseColumns([
          { key: "full_name", label: "Name" },
          { key: "title", label: "Title" },
          { key: "department", label: "Department" },
          { key: "is_active", label: "Active", kind: "boolean" },
          { key: "display_order", label: "Order", kind: "number" },
        ]),
        fields: fields([
          {
            key: "full_name",
            label: "Full name",
            kind: "text",
            required: true,
          },
          { key: "title", label: "Title", kind: "text", required: true },
          { key: "bio", label: "Bio", kind: "textarea", rows: 7 },
          {
            key: "photo_url",
            label: "Photo",
            kind: "upload",
            accept: "image/*",
            uploadBucket: "media",
            uploadFolder: "team/members",
            uploadPreview: "image",
          },
          { key: "department", label: "Department", kind: "text" },
          { key: "display_order", label: "Display order", kind: "number" },
          { key: "is_active", label: "Active", kind: "checkbox" },
        ]),
      },
      {
        id: "profiles",
        label: "Team members",
        description:
          "Create auth users, assign roles, manage access, deactivate accounts, and reset passwords.",
        table: "profiles",
        readRoles: ["super_admin"],
        writeRoles: ["super_admin"],
        rowLabelKey: "full_name",
        defaultSort: { key: "created_at", ascending: false },
        columns: baseColumns([
          { key: "full_name", label: "Full name" },
          { key: "email", label: "Email" },
          { key: "job_title", label: "Job title" },
          { key: "roles", label: "Roles" },
          { key: "is_active", label: "Active", kind: "boolean" },
        ]),
        fields: fields([
          {
            key: "full_name",
            label: "Full name",
            kind: "text",
            required: true,
          },
          { key: "email", label: "Email", kind: "text", required: true },
          {
            key: "avatar_url",
            label: "Avatar",
            kind: "upload",
            accept: "image/*",
            uploadBucket: "media",
            uploadFolder: "profiles/avatars",
            uploadPreview: "image",
          },
          { key: "phone", label: "Phone", kind: "text" },
          { key: "job_title", label: "Job title", kind: "text" },
          {
            key: "roles",
            label: "Roles",
            kind: "multiselect",
            options: appRoles,
            required: true,
            helpText: "Every team member needs at least one role.",
          },
          {
            key: "is_active",
            label: "Active",
            kind: "checkbox",
            defaultValue: true,
          },
        ]),
        submitLabel: "Save team member",
      },
    ],
  },
  {
    id: "pages-and-content",
    label: "Pages & Content",
    to: "/dashboard/pages-and-content",
    description:
      "Edit homepage slides, page sections, legal pages, and global site settings.",
    roles: ["content_editor"],
    icon: "lucide:layout-template",
    children: [
      {
        id: "pages-and-content-home",
        label: "Home",
        to: "/dashboard/pages-and-content/home",
        description:
          "Edit hero slides, at-a-glance stats, and homepage blocks.",
      },
      {
        id: "pages-and-content-about",
        label: "About",
        to: "/dashboard/pages-and-content/about",
        description: "Edit vision, mission, values, and growth sections.",
      },
      {
        id: "pages-and-content-services",
        label: "Services",
        to: "/dashboard/pages-and-content/services",
        description: "Edit the services intro and supporting callouts.",
      },
      {
        id: "pages-and-content-careers",
        label: "Careers",
        to: "/dashboard/pages-and-content/careers",
        description: "Edit the careers intro and recruitment highlights.",
      },
      {
        id: "pages-and-content-blog",
        label: "Blog",
        to: "/dashboard/pages-and-content/blog",
        description: "Edit the blog intro and editorial framing.",
      },
      {
        id: "pages-and-content-contact",
        label: "Contact",
        to: "/dashboard/pages-and-content/contact",
        description: "Edit the contact intro and enquiry framing.",
      },
      {
        id: "pages-and-content-tenders",
        label: "Tenders",
        to: "/dashboard/pages-and-content/tenders",
        description: "Edit tender page copy and procurement notes.",
      },
      {
        id: "pages-and-content-privacy-policy",
        label: "Privacy Policy",
        to: "/dashboard/pages-and-content/privacy-policy",
        description: "Edit the privacy policy content.",
      },
      {
        id: "pages-and-content-terms-of-use",
        label: "Terms of Use",
        to: "/dashboard/pages-and-content/terms-of-use",
        description: "Edit the terms of use content.",
      },
      {
        id: "pages-and-content-terms-of-service",
        label: "Terms of Service",
        to: "/dashboard/pages-and-content/terms-of-service",
        description: "Edit the terms of service content.",
      },
      {
        id: "pages-and-content-cookie-policy",
        label: "Cookie Policy",
        to: "/dashboard/pages-and-content/cookie-policy",
        description: "Edit the cookie policy content.",
      },
    ],
    resources: [
      {
        id: "site_settings_editor",
        label: "Site settings",
        description:
          "Update emergency details, visiting hours, buttons, and homepage hero copy.",
        table: "site_settings",
        readRoles: ["content_editor"],
        writeRoles: ["content_editor"],
        rowLabelKey: "id",
        singleton: true,
        allowCreate: false,
        allowDelete: false,
        defaultSort: { key: "updated_at", ascending: false },
        columns: baseColumns([
          { key: "emergency_line", label: "Emergency line" },
          { key: "whatsapp_label", label: "WhatsApp label" },
          { key: "whatsapp_href", label: "WhatsApp link" },
          { key: "updated_at", label: "Updated", kind: "date" },
        ]),
        fields: fields([
          { key: "emergency_line", label: "Emergency line", kind: "text" },
          { key: "main_phone", label: "Main phone", kind: "text" },
          { key: "main_email", label: "Main email", kind: "text" },
          {
            key: "physical_address",
            label: "Physical address",
            kind: "textarea",
            rows: 3,
          },
          {
            key: "postal_address",
            label: "Postal address",
            kind: "textarea",
            rows: 3,
          },
          {
            key: "visiting_hours",
            label: "Visiting hours JSON",
            kind: "json",
            helpText:
              'Example: [{"label":"Weekdays","start":"08:00","end":"17:00"}]',
          },
          {
            key: "social_links",
            label: "Social links JSON",
            kind: "json",
            helpText: 'Example: {"facebook":"https://..."}',
          },
          {
            key: "homepage_hero",
            label: "Homepage hero JSON",
            kind: "json",
            helpText:
              "Controls the fallback hero content used on the homepage.",
          },
          {
            key: "whatsapp_label",
            label: "WhatsApp button label",
            kind: "text",
          },
          { key: "whatsapp_href", label: "WhatsApp button link", kind: "text" },
          {
            key: "emergency_label",
            label: "Emergency button label",
            kind: "text",
          },
          {
            key: "emergency_href",
            label: "Emergency button link",
            kind: "text",
          },
        ]),
        stampFields: { update: ["updated_by"] },
      },
      {
        id: "pages",
        label: "Pages",
        description: "Maintain legal and informational static pages.",
        table: "pages",
        readRoles: ["content_editor"],
        writeRoles: ["content_editor"],
        rowLabelKey: "title",
        defaultSort: { key: "updated_at", ascending: false },
        columns: baseColumns([
          { key: "slug", label: "Slug" },
          { key: "title", label: "Title" },
          { key: "status", label: "Status", kind: "status" },
          { key: "updated_at", label: "Updated", kind: "date" },
        ]),
        fields: fields([
          { key: "slug", label: "Slug", kind: "text", required: true },
          { key: "title", label: "Title", kind: "text", required: true },
          {
            key: "content",
            label: "Content",
            kind: "richtext",
            required: true,
            placeholder: "Write the page body here.",
            helpText:
              "Use the toolbar to format headings, lists, quotes, and links.",
          },
          { key: "seo_title", label: "SEO title", kind: "text" },
          {
            key: "seo_description",
            label: "SEO description",
            kind: "textarea",
            rows: 3,
          },
          {
            key: "status",
            label: "Status",
            kind: "select",
            options: publishStatuses,
          },
        ]),
        stampFields: { update: ["updated_by"] },
      },
      {
        id: "page_sections",
        label: "Page sections",
        description:
          "Manage the editable section blocks shown across the public site.",
        table: "page_sections",
        readRoles: ["content_editor"],
        writeRoles: ["content_editor"],
        rowLabelKey: "title",
        defaultSort: { key: "page_slug", ascending: true },
        columns: baseColumns([
          { key: "page_slug", label: "Page" },
          { key: "section_key", label: "Section key" },
          { key: "section_type", label: "Type" },
          { key: "is_active", label: "Active", kind: "boolean" },
        ]),
        fields: fields([
          {
            key: "page_slug",
            label: "Page",
            kind: "select",
            options: contentPageOptions,
            required: true,
          },
          {
            key: "section_key",
            label: "Section key",
            kind: "text",
            required: true,
            helpText:
              "Use a stable key like hero, mission-values, community-impact.",
          },
          {
            key: "section_type",
            label: "Section type",
            kind: "select",
            options: contentSectionTypes,
            required: true,
          },
          { key: "eyebrow", label: "Eyebrow", kind: "text" },
          { key: "title", label: "Title", kind: "text", required: true },
          { key: "summary", label: "Summary", kind: "textarea", rows: 3 },
          {
            key: "body",
            label: "Body",
            kind: "richtext",
            placeholder: "Write the section body here.",
          },
          {
            key: "image_url",
            label: "Image",
            kind: "upload",
            accept: "image/*",
            uploadBucket: "media",
            uploadFolder: "content/sections",
            uploadPreview: "image",
          },
          { key: "image_alt", label: "Image alt text", kind: "text" },
          { key: "cta_label", label: "Button label", kind: "text" },
          { key: "cta_href", label: "Button link", kind: "text" },
          { key: "display_order", label: "Display order", kind: "number" },
          {
            key: "is_active",
            label: "Active",
            kind: "checkbox",
            defaultValue: true,
          },
        ]),
      },
      {
        id: "page_section_items",
        label: "Section items",
        description:
          "Manage repeatable cards, bullets, and affiliation items for page sections.",
        table: "page_section_items",
        readRoles: ["content_editor"],
        writeRoles: ["content_editor"],
        rowLabelKey: "title",
        defaultSort: { key: "display_order", ascending: true },
        columns: baseColumns([
          { key: "title", label: "Title" },
          { key: "section_id", label: "Section" },
          { key: "display_order", label: "Order", kind: "number" },
          { key: "is_active", label: "Active", kind: "boolean" },
        ]),
        fields: fields([
          {
            key: "section_id",
            label: "Section",
            kind: "select",
            optionsFromResourceId: "page_sections",
            optionLabelKey: "title",
            required: true,
          },
          { key: "title", label: "Title", kind: "text", required: true },
          {
            key: "description",
            label: "Description",
            kind: "textarea",
            rows: 4,
          },
          {
            key: "icon",
            label: "Icon",
            kind: "icon",
            helpText: "Choose a Lucide icon or enter a custom Iconify name.",
          },
          {
            key: "image_url",
            label: "Image",
            kind: "upload",
            accept: "image/*",
            uploadBucket: "media",
            uploadFolder: "content/section-items",
            uploadPreview: "image",
          },
          { key: "image_alt", label: "Image alt text", kind: "text" },
          { key: "cta_label", label: "Button label", kind: "text" },
          { key: "cta_href", label: "Button link", kind: "text" },
          { key: "display_order", label: "Display order", kind: "number" },
          {
            key: "is_active",
            label: "Active",
            kind: "checkbox",
            defaultValue: true,
          },
        ]),
      },
      {
        id: "page_slides",
        label: "Page slides",
        description: "Edit the rotating hero slides and other page carousels.",
        table: "page_slides",
        readRoles: ["content_editor"],
        writeRoles: ["content_editor"],
        rowLabelKey: "title",
        defaultSort: { key: "display_order", ascending: true },
        columns: baseColumns([
          { key: "page_slug", label: "Page" },
          { key: "title", label: "Title" },
          { key: "display_order", label: "Order", kind: "number" },
          { key: "is_active", label: "Active", kind: "boolean" },
        ]),
        fields: fields([
          {
            key: "page_slug",
            label: "Page",
            kind: "select",
            options: contentPageOptions,
            required: true,
          },
          {
            key: "section_key",
            label: "Section key",
            kind: "text",
            required: true,
            defaultValue: "hero",
          },
          { key: "eyebrow", label: "Eyebrow", kind: "text" },
          { key: "title", label: "Title", kind: "text", required: true },
          {
            key: "body",
            label: "Body",
            kind: "textarea",
            rows: 4,
            required: true,
          },
          { key: "cta_label", label: "Button label", kind: "text" },
          { key: "cta_href", label: "Button link", kind: "text" },
          {
            key: "image_url",
            label: "Image",
            kind: "upload",
            accept: "image/*",
            uploadBucket: "media",
            uploadFolder: "content/slides",
            uploadPreview: "image",
            required: true,
          },
          { key: "image_alt", label: "Image alt text", kind: "text" },
          { key: "caption", label: "Caption", kind: "textarea", rows: 3 },
          { key: "display_order", label: "Display order", kind: "number" },
          {
            key: "is_active",
            label: "Active",
            kind: "checkbox",
            defaultValue: true,
          },
        ]),
      },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    to: "/dashboard/analytics",
    description: "Review visitor activity and page pulse records.",
    roles: ["super_admin"],
    icon: "lucide:activity",
    resources: [
      {
        id: "page_pulses",
        label: "Page pulses",
        description:
          "Inspect lightweight page activity captured from the public site.",
        table: "page_pulses",
        readRoles: ["super_admin"],
        writeRoles: [],
        rowLabelKey: "path",
        allowCreate: false,
        allowUpdate: false,
        allowDelete: false,
        defaultSort: { key: "created_at", ascending: false },
        columns: baseColumns([
          { key: "created_at", label: "Captured", kind: "date" },
          { key: "path", label: "Path" },
          { key: "page_title", label: "Page title" },
          { key: "referrer", label: "Referrer" },
        ]),
        fields: fields([
          {
            key: "session_id",
            label: "Session ID",
            kind: "text",
            disabled: true,
          },
          { key: "path", label: "Path", kind: "text", disabled: true },
          {
            key: "page_title",
            label: "Page title",
            kind: "text",
            disabled: true,
          },
          { key: "referrer", label: "Referrer", kind: "text", disabled: true },
          { key: "language", label: "Language", kind: "text", disabled: true },
          {
            key: "user_agent",
            label: "User agent",
            kind: "textarea",
            rows: 4,
            disabled: true,
          },
          {
            key: "ip_address",
            label: "IP address",
            kind: "text",
            disabled: true,
          },
          {
            key: "screen_width",
            label: "Screen width",
            kind: "number",
            disabled: true,
          },
          {
            key: "screen_height",
            label: "Screen height",
            kind: "number",
            disabled: true,
          },
          {
            key: "viewport_width",
            label: "Viewport width",
            kind: "number",
            disabled: true,
          },
          {
            key: "viewport_height",
            label: "Viewport height",
            kind: "number",
            disabled: true,
          },
          {
            key: "created_at",
            label: "Captured at",
            kind: "text",
            disabled: true,
          },
        ]),
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    to: "/dashboard/settings",
    description: "Update the hospital site settings singleton.",
    roles: ["super_admin"],
    icon: "lucide:settings-2",
    resources: [
      {
        id: "site_settings",
        label: "Site settings",
        description: "Update contact details and the homepage hero copy.",
        table: "site_settings",
        readRoles: ["super_admin"],
        writeRoles: ["super_admin"],
        rowLabelKey: "id",
        singleton: true,
        allowCreate: false,
        allowDelete: false,
        defaultSort: { key: "updated_at", ascending: false },
        columns: baseColumns([
          { key: "main_phone", label: "Main phone" },
          { key: "main_email", label: "Main email" },
          { key: "whatsapp_label", label: "WhatsApp label" },
          { key: "updated_at", label: "Updated", kind: "date" },
        ]),
        fields: fields([
          { key: "emergency_line", label: "Emergency line", kind: "text" },
          { key: "main_phone", label: "Main phone", kind: "text" },
          { key: "main_email", label: "Main email", kind: "text" },
          {
            key: "physical_address",
            label: "Physical address",
            kind: "textarea",
            rows: 3,
          },
          {
            key: "postal_address",
            label: "Postal address",
            kind: "textarea",
            rows: 3,
          },
          {
            key: "visiting_hours",
            label: "Visiting hours JSON",
            kind: "json",
            helpText:
              'Example: [{"label":"Weekdays","start":"08:00","end":"17:00"}]',
          },
          {
            key: "social_links",
            label: "Social links JSON",
            kind: "json",
            helpText: 'Example: {"facebook":"https://..."}',
          },
          {
            key: "homepage_hero",
            label: "Homepage hero JSON",
            kind: "json",
            helpText: "Keeps the homepage hero content editable in one place.",
          },
          {
            key: "whatsapp_label",
            label: "WhatsApp button label",
            kind: "text",
          },
          { key: "whatsapp_href", label: "WhatsApp button link", kind: "text" },
          {
            key: "emergency_label",
            label: "Emergency button label",
            kind: "text",
          },
          {
            key: "emergency_href",
            label: "Emergency button link",
            kind: "text",
          },
        ]),
        stampFields: { update: ["updated_by"] },
      },
    ],
  },
];

export const dashboardSectionMap = new Map(
  dashboardSections.map((section) => [section.id, section]),
);

export function getDashboardSection(sectionId: string) {
  return dashboardSectionMap.get(sectionId) ?? null;
}

export function getDashboardResource(resourceId: string) {
  for (const section of dashboardSections) {
    const resource = section.resources.find((entry) => entry.id === resourceId);
    if (resource) {
      return { section, resource };
    }
  }
  return null;
}

export function getDashboardResourcesForSection(sectionId: string) {
  return getDashboardSection(sectionId)?.resources ?? [];
}

export function getDashboardSections() {
  return dashboardSections;
}

export function getResourceWriteRoles(resourceId: string) {
  return getDashboardResource(resourceId)?.resource.writeRoles ?? null;
}

export function getResourceReadRoles(resourceId: string) {
  return getDashboardResource(resourceId)?.resource.readRoles ?? null;
}

function singularizeLabel(label: string) {
  const parts = label.trim().split(/\s+/);
  if (parts.length === 0) return label.trim();

  const lastIndex = parts.length - 1;
  const lastWord = parts[lastIndex] ?? "";
  const lowerLastWord = lastWord.toLowerCase();

  let singularLastWord = lastWord;
  if (lowerLastWord.endsWith("ies") && lastWord.length > 3) {
    singularLastWord = `${lastWord.slice(0, -3)}y`;
  } else if (
    lowerLastWord.endsWith("ses") ||
    lowerLastWord.endsWith("xes") ||
    lowerLastWord.endsWith("zes") ||
    lowerLastWord.endsWith("ches") ||
    lowerLastWord.endsWith("shes")
  ) {
    singularLastWord = lastWord.slice(0, -2);
  } else if (lowerLastWord.endsWith("s") && !lowerLastWord.endsWith("ss")) {
    singularLastWord = lastWord.slice(0, -1);
  }

  parts[lastIndex] = singularLastWord;
  return parts.join(" ");
}

export function getResourceCreateLabel(resource: CrudResourceConfig) {
  return resource.createLabel ?? `New ${singularizeLabel(resource.label)}`;
}

export function getResourceStampFields(
  resourceId: string,
  mode: "create" | "update",
) {
  return getDashboardResource(resourceId)?.resource.stampFields?.[mode] ?? [];
}

export function getResourceFieldLookup(
  field: CrudField,
): ResourceLookup | null {
  if (!field.optionsFromResourceId) return null;

  return {
    resourceId: field.optionsFromResourceId,
    labelKey: field.optionLabelKey,
    valueKey: field.optionValueKey,
  };
}

export function buildFormValues(
  resource: CrudResourceConfig,
  row?: Record<string, unknown> | null,
) {
  const values: Record<string, unknown> = {};

  for (const field of resource.fields) {
    if (field.serverOnly) continue;

    const current = row?.[field.key];
    if (current == null) {
      if (field.kind === "checkbox") {
        values[field.key] = Boolean(field.defaultValue ?? false);
      } else if (field.kind === "multiselect") {
        values[field.key] = Array.isArray(field.defaultValue)
          ? [...field.defaultValue]
          : [];
      } else if (field.kind === "json") {
        values[field.key] = "";
      } else if (field.kind === "number") {
        values[field.key] = field.defaultValue ?? "";
      } else {
        values[field.key] = field.defaultValue ?? "";
      }
      continue;
    }

    if (field.kind === "checkbox") {
      values[field.key] = Boolean(current);
      continue;
    }

    if (field.kind === "multiselect") {
      values[field.key] = Array.isArray(current)
        ? current.map((entry) => String(entry))
        : current == null || current === ""
          ? []
          : [String(current)];
      continue;
    }

    if (field.kind === "number") {
      values[field.key] = Number(current);
      continue;
    }

    if (field.kind === "json") {
      values[field.key] =
        typeof current === "string"
          ? current
          : JSON.stringify(current, null, 2);
      continue;
    }

    values[field.key] = String(current);
  }

  return values;
}

export function serializeFormValues(
  resource: CrudResourceConfig,
  formValues: Record<string, unknown>,
) {
  const payload: Record<string, unknown> = {};

  for (const field of resource.fields) {
    if (field.serverOnly) continue;

    const raw = formValues[field.key];
    if (field.kind === "checkbox") {
      payload[field.key] = Boolean(raw);
      continue;
    }

    if (field.kind === "multiselect") {
      payload[field.key] = Array.isArray(raw)
        ? raw
            .filter((entry) => entry != null && String(entry).trim() !== "")
            .map((entry) => String(entry))
        : raw == null || raw === ""
          ? []
          : [String(raw)];
      continue;
    }

    if (field.kind === "number") {
      if (raw === "" || raw == null) {
        payload[field.key] = null;
      } else {
        const parsed = Number(raw);
        payload[field.key] = Number.isNaN(parsed) ? null : parsed;
      }
      continue;
    }

    if (field.kind === "json") {
      if (raw == null || raw === "") {
        payload[field.key] = null;
      } else if (typeof raw === "string") {
        payload[field.key] = JSON.parse(raw);
      } else {
        payload[field.key] = raw;
      }
      continue;
    }

    const value = raw == null ? "" : String(raw);
    payload[field.key] = value === "" ? null : value;
  }

  return payload;
}

export function getFieldOptions(
  field: CrudField,
  rowsByResourceId: Record<string, Record<string, unknown>[]>,
) {
  if (field.options) return field.options;

  if (!field.optionsFromResourceId) return [];
  const rows = rowsByResourceId[field.optionsFromResourceId] ?? [];

  return rows
    .map((row) => {
      const valueKey = field.optionValueKey ?? "id";
      const labelKey = field.optionLabelKey ?? "name";
      const value = row[valueKey];
      const label = row[labelKey];

      if (value == null || label == null) return null;

      return {
        value: String(value),
        label: String(label),
      };
    })
    .filter((entry): entry is CrudOption => Boolean(entry));
}

export function roleListForResource(resource: CrudResourceConfig) {
  return selectRoles(resource);
}

export type {
  AppRole,
  ApplicationStatus,
  ContactStatus,
  DayOfWeek,
  EmploymentType,
  JobStatus,
  PublishStatus,
  TenderCategory,
  TenderStatus,
};
