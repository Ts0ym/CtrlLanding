const API_BASE =
  process.env.NEXT_PUBLIC_ADMIN_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api";

export function getProjectsApiBase() {
  return API_BASE;
}

export function getProjectsApiOrigin() {
  return API_BASE.replace(/\/api$/, "");
}

export function mapBackendProjectToCard(project) {
  return {
    id: project.id,
    sortOrder: project.sortOrder ?? 0,
    date: project.date ?? "",
    title: project.title ?? "",
    imageSrc: project.imageSrc ?? "",
    videoEmbedCode: project.videoEmbedCode ?? "",
    description: project.description ?? "",
    desc: {
      ru: project.description ?? "",
      en: "",
      cn: "",
    },
  };
}
