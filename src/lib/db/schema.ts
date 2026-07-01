import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("users_email_idx").on(table.email)]
);

export const soundboards = sqliteTable(
  "soundboards",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    visibility: text("visibility", { enum: ["private", "unlisted", "public"] })
      .notNull()
      .default("private"),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("soundboards_slug_idx").on(table.slug),
    index("soundboards_visibility_idx").on(table.visibility),
    index("soundboards_user_id_idx").on(table.userId),
  ]
);

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    soundboardId: text("soundboard_id")
      .notNull()
      .references(() => soundboards.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("categories_soundboard_id_idx").on(table.soundboardId)]
);

export const clips = sqliteTable(
  "clips",
  {
    id: text("id").primaryKey(),
    soundboardId: text("soundboard_id")
      .notNull()
      .references(() => soundboards.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    filePath: text("file_path").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSize: integer("file_size").notNull(),
    durationSec: real("duration_sec"),
    volume: real("volume").notNull().default(1),
    hotkey: text("hotkey"),
    sortOrder: integer("sort_order").notNull().default(0),
    loop: integer("loop", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("clips_soundboard_id_idx").on(table.soundboardId)]
);

export type User = typeof users.$inferSelect;
export type Soundboard = typeof soundboards.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Clip = typeof clips.$inferSelect;
