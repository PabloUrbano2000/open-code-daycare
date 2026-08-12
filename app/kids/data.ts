export interface Parent {
  name: string;
  relation: "Mamá" | "Papá";
  status: "active" | "pending";
  initials: string;
  avatarBg: string;
}

export interface Kid {
  slug: string;
  name: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  age: number;
  badge?: { label: string; bg: string; color: string };
  birthDate: string;
  enrollmentDate: string;
  room: string;
  allergies?: { title: string; note: string };
  parents: Parent[];
}

const allergyBadge = { bg: "#FBD8CC", color: "#D9684A" };

export const kids: Kid[] = [
  {
    slug: "mateo-fernandez",
    name: "Mateo Fernández",
    initials: "M",
    avatarBg: "#A9D9E8",
    avatarColor: "#1F7A93",
    age: 3,
    badge: { label: "MANÍ", ...allergyBadge },
    birthDate: "12 mar 2022",
    enrollmentDate: "feb 2025",
    room: "Soles",
    allergies: {
      title: "Alergias y notas",
      note: "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    },
    parents: [
      {
        name: "Lucía Fernández",
        relation: "Mamá",
        status: "active",
        initials: "L",
        avatarBg: "#C9B6E8",
      },
      {
        name: "Diego Fernández",
        relation: "Papá",
        status: "pending",
        initials: "D",
        avatarBg: "#A9C7E8",
      },
    ],
  },
  {
    slug: "sofia-mendez",
    name: "Sofía Méndez",
    initials: "S",
    avatarBg: "#F4B8CC",
    avatarColor: "#C44A7A",
    age: 2,
    birthDate: "04 nov 2024",
    enrollmentDate: "mar 2025",
    room: "Soles",
    parents: [
      {
        name: "Paula Méndez",
        relation: "Mamá",
        status: "active",
        initials: "P",
        avatarBg: "#B9DEC4",
      },
    ],
  },
  {
    slug: "benjamin-ruiz",
    name: "Benjamín Ruiz",
    initials: "B",
    avatarBg: "#B9DEC4",
    avatarColor: "#3E8B62",
    age: 3,
    birthDate: "18 jul 2023",
    enrollmentDate: "sep 2024",
    room: "Soles",
    parents: [
      {
        name: "Carolina Ruiz",
        relation: "Mamá",
        status: "active",
        initials: "C",
        avatarBg: "#F4B8CC",
      },
      {
        name: "Fernando Ruiz",
        relation: "Papá",
        status: "pending",
        initials: "F",
        avatarBg: "#A9C7E8",
      },
    ],
  },
  {
    slug: "valentina-soto",
    name: "Valentina Soto",
    initials: "V",
    avatarBg: "#F4DC8E",
    avatarColor: "#9A7B1E",
    age: 2,
    badge: { label: "VINCULAR", bg: "#F9D2DE", color: "#C56486" },
    birthDate: "22 feb 2024",
    enrollmentDate: "ago 2024",
    room: "Soles",
    parents: [],
  },
  {
    slug: "tomas-diaz",
    name: "Tomás Díaz",
    initials: "T",
    avatarBg: "#C9B6E8",
    avatarColor: "#7B5FC0",
    age: 3,
    badge: { label: "LACTOSA", ...allergyBadge },
    birthDate: "09 sep 2022",
    enrollmentDate: "mar 2024",
    room: "Soles",
    allergies: {
      title: "Alergias y notas",
      note: "Intolerancia a la lactosa. Evitar lácteos en desayuno y merienda.",
    },
    parents: [
      {
        name: "Ana Díaz",
        relation: "Mamá",
        status: "active",
        initials: "A",
        avatarBg: "#F4DC8E",
      },
    ],
  },
  {
    slug: "emma-castro",
    name: "Emma Castro",
    initials: "E",
    avatarBg: "#F4B8CC",
    avatarColor: "#C44A7A",
    age: 2,
    birthDate: "30 jun 2024",
    enrollmentDate: "ene 2025",
    room: "Soles",
    parents: [
      {
        name: "Martina Castro",
        relation: "Mamá",
        status: "active",
        initials: "M",
        avatarBg: "#C9B6E8",
      },
    ],
  },
  {
    slug: "lucas-romero",
    name: "Lucas Romero",
    initials: "L",
    avatarBg: "#A9D9E8",
    avatarColor: "#1F7A93",
    age: 3,
    birthDate: "05 ene 2023",
    enrollmentDate: "mayo 2024",
    room: "Soles",
    parents: [
      {
        name: "Julieta Romero",
        relation: "Mamá",
        status: "active",
        initials: "J",
        avatarBg: "#F4B8CC",
      },
    ],
  },
  {
    slug: "olivia-vega",
    name: "Olivia Vega",
    initials: "O",
    avatarBg: "#B9DEC4",
    avatarColor: "#3E8B62",
    age: 2,
    birthDate: "14 dic 2023",
    enrollmentDate: "mar 2024",
    room: "Soles",
    parents: [
      {
        name: "Nicolás Vega",
        relation: "Papá",
        status: "active",
        initials: "N",
        avatarBg: "#A9C7E8",
      },
    ],
  },
];

export function getKidBySlug(slug: string): Kid | undefined {
  return kids.find((kid) => kid.slug === slug);
}
