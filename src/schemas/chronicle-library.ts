import { z } from "zod";
import { chronicleGraphSchema } from "@/schemas/chronicle";

export const CHRONICLE_LIBRARY_FILE_VERSION = 1 as const;

export const storedChronicleSchema = z.object({
  version: z.literal(CHRONICLE_LIBRARY_FILE_VERSION),
  id: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(160),
  graph: chronicleGraphSchema,
  createdAt: z.string().min(1).max(40),
  updatedAt: z.string().min(1).max(40),
});

export const chronicleLibrarySchema = z.object({
  version: z.literal(CHRONICLE_LIBRARY_FILE_VERSION),
  chronicles: z.array(storedChronicleSchema).max(40),
});

export type StoredChronicle = z.infer<typeof storedChronicleSchema>;
export type ChronicleLibraryParsed = z.infer<typeof chronicleLibrarySchema>;
