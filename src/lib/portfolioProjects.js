import { getAdminApiBase, getAdminApiOrigin } from "./adminApi";

export function getProjectsApiBase() {
  return getAdminApiBase();
}

export function getProjectsApiOrigin() {
  return getAdminApiOrigin();
}

export function getLocalizedProjectField(item, field, language) {
  const suffix = language === "en" ? "En" : language === "cn" ? "Cn" : "";
  const localizedKey = suffix ? `${field}${suffix}` : field;

  return item?.[localizedKey] || item?.[field] || "";
}

export function getLocalizedProjectDescription(item, language) {
  const localizedDescription = getLocalizedProjectField(item, "description", language);

  if (localizedDescription) {
    return localizedDescription;
  }

  if (item?.desc && typeof item.desc === "object") {
    return item.desc[language] || item.desc.ru || "";
  }

  return "";
}

export function mapBackendProjectToCard(project) {
  return {
    id: project.id,
    sortOrder: project.sortOrder ?? 0,
    date: project.date ?? "",
    dateEn: project.dateEn ?? "",
    dateCn: project.dateCn ?? "",
    title: project.title ?? "",
    titleEn: project.titleEn ?? "",
    titleCn: project.titleCn ?? "",
    imageSrc: project.imageSrc ?? "",
    videoEmbedCode: project.videoEmbedCode ?? "",
    endVideoEmbedCode: project.endVideoEmbedCode ?? "",
    description: project.description ?? "",
    descriptionEn: project.descriptionEn ?? "",
    descriptionCn: project.descriptionCn ?? "",
    showDividerAfter: Boolean(project.showDividerAfter),
    blocks: Array.isArray(project.blocks)
      ? project.blocks.map((block) => ({
          id: block.id,
          sortOrder: block.sortOrder ?? 0,
          mediaType: block.mediaType ?? "image",
          imageSrc: block.imageSrc ?? "",
          videoSrc: block.videoSrc ?? "",
          videoEmbedCode: block.videoEmbedCode ?? "",
          description: block.description ?? "",
          descriptionEn: block.descriptionEn ?? "",
          descriptionCn: block.descriptionCn ?? "",
          showDividerAfter: Boolean(block.showDividerAfter),
        }))
      : [],
    desc: {
      ru: project.description ?? "",
      en: project.descriptionEn ?? "",
      cn: project.descriptionCn ?? "",
    },
  };
}
