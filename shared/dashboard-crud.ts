import type {
  AppRole,
  ApplicationStatus,
  ContactStatus,
  DayOfWeek,
  EmploymentType,
  JobStatus,
  MediaType,
  PublishStatus,
  TenderCategory,
  TenderStatus,
} from "~~/types/database.types";

export type CrudFieldKind =
  | "text"
  | "textarea"
  | "richtext"
  | "select"
  | "number"
  | "checkbox"
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

function selectRoles(resource: CrudResourceConfig): AppRole[] {
  return resource.writeRoles ?? resource.readRoles;
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

const mediaTypes: CrudOption[] = [
  { label: "Image", value: "image" },
  { label: "Video", value: "video" },
];

const appRoles: CrudOption[] = [
  { label: "Super admin", value: "super_admin" },
  { label: "Content editor", value: "content_editor" },
  { label: "HR manager", value: "hr_manager" },
  { label: "Procurement manager", value: "procurement_manager" },
  { label: "Front desk", value: "front_desk" },
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
            label: "Content",
            kind: "richtext",
            required: true,
            placeholder: "Write the full story here.",
            helpText: "Use the toolbar to add headings, lists, quotes, links, bold, and italic text.",
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
          { key: "status", label: "Status", kind: "select", options: publishStatuses },
          { key: "published_at", label: "Published on", kind: "date" },
          { key: "seo_title", label: "SEO title", kind: "text" },
          { key: "seo_description", label: "SEO description", kind: "textarea", rows: 3 },
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
          { key: "description", label: "Description", kind: "textarea", rows: 4 },
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
          { key: "icon", label: "Icon", kind: "text" },
          { key: "description", label: "Description", kind: "textarea", rows: 4 },
          { key: "display_order", label: "Display order", kind: "number" },
        ]),
      },
      {
        id: "services",
        label: "Services",
        description: "Maintain the public service catalog.",
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
          { key: "summary", label: "Summary", kind: "textarea", rows: 3 },
          { key: "description", label: "Description", kind: "textarea", rows: 10 },
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
          { key: "clinic_name", label: "Clinic name", kind: "text", required: true },
          { key: "day_of_week", label: "Day of week", kind: "select", options: daysOfWeek, required: true },
          { key: "start_time", label: "Start time", kind: "time", required: true },
          { key: "is_active", label: "Active", kind: "checkbox" },
          { key: "notes", label: "Notes", kind: "textarea", rows: 4 },
        ]),
      },
    ],
  },
  {
    id: "contact",
    label: "Contact inbox",
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
          { key: "message", label: "Message", kind: "textarea", rows: 8, required: true },
          { key: "status", label: "Status", kind: "select", options: contactStatuses },
          { key: "internal_notes", label: "Internal notes", kind: "textarea", rows: 5 },
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
          { key: "employment_type", label: "Employment type", kind: "select", options: employmentTypes, required: true },
          { key: "positions_count", label: "Positions", kind: "number" },
          { key: "description", label: "Description", kind: "textarea", rows: 8, required: true },
          { key: "requirements", label: "Requirements", kind: "textarea", rows: 6 },
          { key: "responsibilities", label: "Responsibilities", kind: "textarea", rows: 6 },
          { key: "how_to_apply", label: "How to apply", kind: "textarea", rows: 6 },
          { key: "status", label: "Status", kind: "select", options: jobStatuses },
          { key: "application_deadline", label: "Application deadline", kind: "date" },
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
          { key: "applicant_name", label: "Applicant name", kind: "text", required: true },
          { key: "email", label: "Email", kind: "text", required: true },
          { key: "phone", label: "Phone", kind: "text" },
          { key: "cover_letter", label: "Cover letter", kind: "textarea", rows: 8 },
          {
            key: "resume_url",
            label: "Resume",
            kind: "upload",
            required: true,
            accept: ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            uploadBucket: "documents",
            uploadFolder: "jobs/applications/resumes",
          },
          { key: "status", label: "Status", kind: "select", options: applicationStatuses },
          { key: "reviewer_notes", label: "Reviewer notes", kind: "textarea", rows: 5 },
        ]),
      },
    ],
  },
  {
    id: "tenders",
    label: "Tenders",
    to: "/dashboard/tenders",
    description: "Manage tender notices and supporting documents.",
    roles: ["procurement_manager"],
    icon: "lucide:file-text",
    resources: [
      {
        id: "tenders",
        label: "Tenders",
        description: "Publish notices and award decisions.",
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
          { key: "tender_number", label: "Tender number", kind: "text", required: true },
          { key: "title", label: "Title", kind: "text", required: true },
          { key: "slug", label: "Slug", kind: "text", required: true },
          { key: "category", label: "Category", kind: "select", options: tenderCategories, required: true },
          { key: "description", label: "Description", kind: "textarea", rows: 8 },
          { key: "status", label: "Status", kind: "select", options: tenderStatuses },
          { key: "opening_date", label: "Opening date", kind: "date" },
          { key: "closing_date", label: "Closing date", kind: "date" },
          { key: "awarded_to", label: "Awarded to", kind: "text" },
        ]),
        stampFields: { create: ["created_by"] },
      },
      {
        id: "tender_documents",
        label: "Tender documents",
        description: "Attach files to live or awarded tenders.",
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
          { key: "file_name", label: "File name", kind: "text", required: true },
          {
            key: "file_url",
            label: "Document",
            kind: "upload",
            required: true,
            accept: ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            uploadBucket: "documents",
            uploadFolder: "tenders/documents",
          },
          { key: "file_size_kb", label: "File size (KB)", kind: "number" },
        ]),
      },
      {
        id: "downloads",
        label: "Downloads",
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
          { key: "description", label: "Description", kind: "textarea", rows: 4 },
          { key: "category", label: "Category", kind: "text" },
          {
            key: "file_url",
            label: "Document",
            kind: "upload",
            required: true,
            accept: ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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
    id: "media",
    label: "Media",
    to: "/dashboard/media",
    description: "Publish albums and media items.",
    roles: ["content_editor"],
    icon: "lucide:image",
    resources: [
      {
        id: "media_albums",
        label: "Albums",
        description: "Manage event and story albums.",
        table: "media_albums",
        readRoles: ["content_editor"],
        writeRoles: ["content_editor"],
        rowLabelKey: "title",
        defaultSort: { key: "created_at", ascending: false },
        columns: baseColumns([
          { key: "title", label: "Title" },
          { key: "slug", label: "Slug" },
          { key: "status", label: "Status", kind: "status" },
          { key: "event_date", label: "Event date", kind: "date" },
        ]),
        fields: fields([
          { key: "title", label: "Title", kind: "text", required: true },
          { key: "slug", label: "Slug", kind: "text", required: true },
          { key: "description", label: "Description", kind: "textarea", rows: 5 },
          { key: "event_date", label: "Event date", kind: "date" },
          {
            key: "cover_image_url",
            label: "Cover image",
            kind: "upload",
            accept: "image/*",
            uploadBucket: "media",
            uploadFolder: "media/albums/covers",
            uploadPreview: "image",
          },
          { key: "status", label: "Status", kind: "select", options: publishStatuses },
        ]),
        stampFields: { create: ["created_by"] },
      },
      {
        id: "media_items",
        label: "Media items",
        description: "Attach images or videos to published albums.",
        table: "media_items",
        readRoles: ["content_editor"],
        writeRoles: ["content_editor"],
        rowLabelKey: "file_url",
        defaultSort: { key: "display_order", ascending: true },
        columns: baseColumns([
          { key: "type", label: "Type" },
          { key: "file_url", label: "Media file" },
          { key: "display_order", label: "Order", kind: "number" },
        ]),
        fields: fields([
          {
            key: "album_id",
            label: "Album",
            kind: "select",
            optionsFromResourceId: "media_albums",
            optionLabelKey: "title",
            required: true,
          },
          { key: "type", label: "Type", kind: "select", options: mediaTypes, required: true },
          {
            key: "file_url",
            label: "Media file",
            kind: "upload",
            required: true,
            accept: "image/*,video/*",
            uploadBucket: "media",
            uploadFolder: "media/items",
          },
          { key: "caption", label: "Caption", kind: "textarea", rows: 3 },
          { key: "display_order", label: "Display order", kind: "number" },
        ]),
      },
    ],
  },
  {
    id: "team",
    label: "Team",
    to: "/dashboard/team",
    description: "Maintain leadership and board profiles.",
    roles: ["content_editor"],
    icon: "lucide:users",
    resources: [
      {
        id: "team_members",
        label: "Team members",
        description: "Edit leadership and board profile cards.",
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
          { key: "full_name", label: "Full name", kind: "text", required: true },
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
    ],
  },
  {
    id: "pages",
    label: "Pages",
    to: "/dashboard/pages",
    description: "Edit legal pages and other static content.",
    roles: ["content_editor"],
    icon: "lucide:file-pen-line",
    resources: [
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
          { key: "content", label: "Content", kind: "textarea", rows: 14, required: true },
          { key: "seo_title", label: "SEO title", kind: "text" },
          { key: "seo_description", label: "SEO description", kind: "textarea", rows: 3 },
          { key: "status", label: "Status", kind: "select", options: publishStatuses },
        ]),
        stampFields: { update: ["updated_by"] },
      },
    ],
  },
  {
    id: "users",
    label: "Users",
    to: "/dashboard/users",
    description: "Invite staff and manage roles.",
    roles: ["super_admin"],
    icon: "lucide:shield-user",
    resources: [
      {
        id: "profiles",
        label: "Profiles",
        description: "Edit staff profile details.",
        table: "profiles",
        readRoles: ["super_admin"],
        writeRoles: ["super_admin"],
        rowLabelKey: "full_name",
        defaultSort: { key: "created_at", ascending: false },
        columns: baseColumns([
          { key: "full_name", label: "Full name" },
          { key: "job_title", label: "Job title" },
          { key: "phone", label: "Phone" },
          { key: "is_active", label: "Active", kind: "boolean" },
        ]),
        fields: fields([
          { key: "id", label: "User ID", kind: "text", required: true },
          { key: "full_name", label: "Full name", kind: "text", required: true },
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
          { key: "is_active", label: "Active", kind: "checkbox" },
        ]),
      },
      {
        id: "user_roles",
        label: "Roles",
        description: "Assign staff permissions.",
        table: "user_roles",
        readRoles: ["super_admin"],
        writeRoles: ["super_admin"],
        rowLabelKey: "role",
        defaultSort: { key: "created_at", ascending: false },
        columns: baseColumns([
          { key: "user_id", label: "User ID" },
          { key: "role", label: "Role", kind: "status" },
          { key: "granted_by", label: "Granted by" },
        ]),
        fields: fields([
          {
            key: "user_id",
            label: "User",
            kind: "select",
            optionsFromResourceId: "profiles",
            optionLabelKey: "full_name",
            required: true,
          },
          { key: "role", label: "Role", kind: "select", options: appRoles, required: true },
        ]),
        stampFields: { create: ["granted_by"] },
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
          { key: "updated_at", label: "Updated", kind: "date" },
        ]),
        fields: fields([
          { key: "emergency_line", label: "Emergency line", kind: "text" },
          { key: "main_phone", label: "Main phone", kind: "text" },
          { key: "main_email", label: "Main email", kind: "text" },
          { key: "physical_address", label: "Physical address", kind: "textarea", rows: 3 },
          { key: "postal_address", label: "Postal address", kind: "textarea", rows: 3 },
          {
            key: "visiting_hours",
            label: "Visiting hours JSON",
            kind: "json",
            helpText: "Example: [{\"label\":\"Weekdays\",\"start\":\"08:00\",\"end\":\"17:00\"}]",
          },
          {
            key: "social_links",
            label: "Social links JSON",
            kind: "json",
            helpText: "Example: {\"facebook\":\"https://...\"}",
          },
          {
            key: "homepage_hero",
            label: "Homepage hero JSON",
            kind: "json",
            helpText: "Keeps the homepage hero content editable in one place.",
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

export function getResourceStampFields(resourceId: string, mode: "create" | "update") {
  return getDashboardResource(resourceId)?.resource.stampFields?.[mode] ?? [];
}

export function getResourceFieldLookup(field: CrudField): ResourceLookup | null {
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
  MediaType,
  PublishStatus,
  TenderCategory,
  TenderStatus,
};
