import { z } from "zod";

export const RELATIONS = ["Mamá", "Papá", "Tutor/a"] as const;
export type Relation = (typeof RELATIONS)[number];

export const linkParentSchema = z.object({
  name: z.string().min(3, "Escribí el nombre del padre/madre"),
  email: z.string().regex(/^\S+@\S+\.\S+$/, "Ingresá un email válido"),
  relation: z.enum(RELATIONS),
});

export type LinkParentValues = z.input<typeof linkParentSchema>;
