/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { User } from "@supabase/supabase-js";
import type { AppRole } from "./middleware";

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      profile: {
        role: AppRole;
        full_name: string | null;
        avatar_url: string | null;
        status?: "activo" | "suspendido";
        profile_completed?: boolean;
      } | null;
      role: AppRole | null;
    }
  }
}
