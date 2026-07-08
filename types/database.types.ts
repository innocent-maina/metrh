// This file matches schema.sql exactly as of the current migration.
// Once the Supabase project is live, replace it with the real generated
// output: `npm run db:types` (wraps `supabase gen types typescript`).
// Keeping it hand-written for now so the app has strict types to build
// against before a project exists.

export type AppRole =
  | "super_admin"
  | "content_editor"
  | "hr_manager"
  | "procurement_manager"
  | "front_desk";

export type PublishStatus = "draft" | "published" | "archived";
export type ContactStatus = "new" | "read" | "responded" | "archived";
export type EmploymentType = "contract" | "permanent" | "internship" | "locum";
export type JobStatus = "draft" | "open" | "closed";
export type ApplicationStatus =
  | "submitted"
  | "shortlisted"
  | "interviewing"
  | "rejected"
  | "hired";
export type TenderCategory =
  | "goods"
  | "services"
  | "works"
  | "framework_agreement"
  | "consultancy";
export type TenderStatus =
  | "draft"
  | "open"
  | "closed"
  | "awarded"
  | "cancelled";
export type MediaType = "image" | "video";
export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          phone: string | null;
          job_title: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: AppRole;
          granted_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_roles"]["Row"]> & {
          user_id: string;
          role: AppRole;
        };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Row"]>;
      };
      blog_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["blog_categories"]["Row"]
        > & { name: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["blog_categories"]["Row"]>;
      };
      blog_tags: {
        Row: { id: string; name: string; slug: string };
        Insert: Partial<Database["public"]["Tables"]["blog_tags"]["Row"]> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["blog_tags"]["Row"]>;
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string;
          cover_image_url: string | null;
          category_id: string | null;
          author_id: string | null;
          status: PublishStatus;
          published_at: string | null;
          seo_title: string | null;
          seo_description: string | null;
          seo_og_image_url: string | null;
          reading_minutes: number | null;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["blog_posts"]["Row"]> & {
          title: string;
          slug: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["blog_posts"]["Row"]>;
      };
      blog_post_tags: {
        Row: { post_id: string; tag_id: string };
        Insert: { post_id: string; tag_id: string };
        Update: Partial<Database["public"]["Tables"]["blog_post_tags"]["Row"]>;
      };
      service_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string | null;
          description: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["service_categories"]["Row"]
        > & { name: string; slug: string };
        Update: Partial<
          Database["public"]["Tables"]["service_categories"]["Row"]
        >;
      };
      services: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          summary: string | null;
          description: string | null;
          is_specialized: boolean;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["services"]["Row"]> & {
          category_id: string;
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Row"]>;
      };
      clinic_schedule: {
        Row: {
          id: string;
          service_id: string | null;
          clinic_name: string;
          day_of_week: DayOfWeek;
          start_time: string;
          is_active: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["clinic_schedule"]["Row"]
        > & { clinic_name: string; day_of_week: DayOfWeek; start_time: string };
        Update: Partial<Database["public"]["Tables"]["clinic_schedule"]["Row"]>;
      };
      team_members: {
        Row: {
          id: string;
          full_name: string;
          title: string;
          bio: string | null;
          photo_url: string | null;
          department: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["team_members"]["Row"]> & {
          full_name: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["team_members"]["Row"]>;
      };
      job_postings: {
        Row: {
          id: string;
          reference_no: string | null;
          title: string;
          slug: string;
          department: string | null;
          employment_type: EmploymentType;
          positions_count: number;
          description: string;
          requirements: string | null;
          responsibilities: string | null;
          how_to_apply: string | null;
          status: JobStatus;
          application_deadline: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["job_postings"]["Row"]> & {
          title: string;
          slug: string;
          employment_type: EmploymentType;
          description: string;
        };
        Update: Partial<Database["public"]["Tables"]["job_postings"]["Row"]>;
      };
      job_applications: {
        Row: {
          id: string;
          job_id: string;
          applicant_name: string;
          email: string;
          phone: string | null;
          cover_letter: string | null;
          resume_url: string;
          status: ApplicationStatus;
          reviewed_by: string | null;
          reviewer_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["job_applications"]["Row"]
        > & {
          job_id: string;
          applicant_name: string;
          email: string;
          resume_url: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["job_applications"]["Row"]
        >;
      };
      tenders: {
        Row: {
          id: string;
          tender_number: string;
          title: string;
          slug: string;
          category: TenderCategory;
          description: string | null;
          status: TenderStatus;
          opening_date: string | null;
          closing_date: string | null;
          awarded_to: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tenders"]["Row"]> & {
          tender_number: string;
          title: string;
          slug: string;
          category: TenderCategory;
        };
        Update: Partial<Database["public"]["Tables"]["tenders"]["Row"]>;
      };
      tender_documents: {
        Row: {
          id: string;
          tender_id: string;
          file_name: string;
          file_url: string;
          file_size_kb: number | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["tender_documents"]["Row"]
        > & { tender_id: string; file_name: string; file_url: string };
        Update: Partial<
          Database["public"]["Tables"]["tender_documents"]["Row"]
        >;
      };
      downloads: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string | null;
          file_url: string;
          file_size_kb: number | null;
          is_published: boolean;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["downloads"]["Row"]> & {
          title: string;
          file_url: string;
        };
        Update: Partial<Database["public"]["Tables"]["downloads"]["Row"]>;
      };
      media_albums: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          event_date: string | null;
          cover_image_url: string | null;
          status: PublishStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["media_albums"]["Row"]> & {
          title: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["media_albums"]["Row"]>;
      };
      media_items: {
        Row: {
          id: string;
          album_id: string;
          type: MediaType;
          file_url: string;
          caption: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["media_items"]["Row"]> & {
          album_id: string;
          file_url: string;
        };
        Update: Partial<Database["public"]["Tables"]["media_items"]["Row"]>;
      };
      contact_submissions: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          subject: string | null;
          message: string;
          status: ContactStatus;
          handled_by: string | null;
          internal_notes: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["contact_submissions"]["Row"]
        > & { name: string; email: string; message: string };
        Update: Partial<
          Database["public"]["Tables"]["contact_submissions"]["Row"]
        >;
      };
      pages: {
        Row: {
          id: string;
          slug: string;
          title: string;
          content: string;
          seo_title: string | null;
          seo_description: string | null;
          status: PublishStatus;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pages"]["Row"]> & {
          slug: string;
          title: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["pages"]["Row"]>;
      };
      site_settings: {
        Row: {
          id: boolean;
          emergency_line: string | null;
          main_phone: string | null;
          main_email: string | null;
          physical_address: string | null;
          postal_address: string | null;
          visiting_hours:
            | { label: string; start: string; end: string }[]
            | null;
          social_links: Record<string, string> | null;
          homepage_hero: {
            headline: string;
            subhead: string;
            cta_label: string;
            cta_href: string;
            image_url: string;
          } | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["site_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      has_role: { Args: { _role: AppRole }; Returns: boolean };
      is_staff: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      app_role: AppRole;
      publish_status: PublishStatus;
      contact_status: ContactStatus;
      employment_type: EmploymentType;
      job_status: JobStatus;
      application_status: ApplicationStatus;
      tender_category: TenderCategory;
      tender_status: TenderStatus;
      media_type: MediaType;
      day_of_week: DayOfWeek;
    };
  };
}
