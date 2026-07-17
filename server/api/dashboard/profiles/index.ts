import { defineEventHandler } from "h3";
import { handleDashboardResource } from "~~/server/utils/dashboard-resource-handler";

export default defineEventHandler((event) =>
  handleDashboardResource(event, "profiles"),
);
