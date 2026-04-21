"use client";

import { useEffect, useState } from "react";
import styles from "./admineditor.module.scss";

const API_BASE =
  process.env.NEXT_PUBLIC_ADMIN_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api";
const API_ORIGIN = API_BASE.replace(/\/api$/, "");
const STORAGE_TOKEN_KEY = "admin-editor-token";
const STATIC_USERNAME = "admin";

const EMPTY_FORM = {
  id: null,
  sortOrder: 0,
  date: "",
  title: "",
  imageSrc: "",
  videoEmbedCode: "",
  description: "",
};

function projectToForm(project) {
  if (!project) return EMPTY_FORM;

  return {
    id: project.id,
    sortOrder: project.sortOrder ?? 0,
    date: project.date ?? "",
    title: project.title ?? "",
    imageSrc: project.imageSrc ?? "",
    videoEmbedCode: project.videoEmbedCode ?? "",
    description: project.description ?? "",
  };
}

function getPreviewUrl(imageSrc) {
  if (!imageSrc) return "";

  if (/^(https?:)?\/\//.test(imageSrc) || imageSrc.startsWith("data:")) {
    return imageSrc;
  }

  return `${API_ORIGIN}${imageSrc.startsWith("/") ? imageSrc : `/${imageSrc}`}`;
}

function reorderProjectsList(projects, draggedId, targetId) {
  const draggedIndex = projects.findIndex((project) => project.id === draggedId);
  const targetIndex = projects.findIndex((project) => project.id === targetId);

  if (
    draggedIndex === -1 ||
    targetIndex === -1 ||
    draggedIndex === targetIndex
  ) {
    return projects;
  }

  const nextProjects = [...projects];
  const [draggedProject] = nextProjects.splice(draggedIndex, 1);
  nextProjects.splice(targetIndex, 0, draggedProject);

  return nextProjects.map((project, index) => ({
    ...project,
    sortOrder: index,
  }));
}

export default function AdminEditorPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPreview, setIsUploadingPreview] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedProjectId, setDraggedProjectId] = useState(null);
  const [dropTargetProjectId, setDropTargetProjectId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const request = async (path, options = {}, sessionToken = token) => {
    const isFormData =
      typeof FormData !== "undefined" && options.body instanceof FormData;

    const headers = {
      ...(sessionToken
        ? {
            Authorization: `Bearer ${sessionToken}`,
          }
        : {}),
      ...(options.headers ?? {}),
    };

    if (!isFormData && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const responseText = response.status === 204 ? "" : await response.text();
    let payload = null;

    if (responseText) {
      try {
        payload = JSON.parse(responseText);
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      const message =
        (Array.isArray(payload?.message)
          ? payload.message.join(", ")
          : payload?.message) ||
        payload?.error ||
        responseText ||
        "Request failed";

      throw new Error(message || "Request failed");
    }

    if (!responseText) {
      return null;
    }

    return payload ?? responseText;
  };

  const loadProjects = async (sessionToken = token, preferredProjectId = null) => {
    setIsLoadingProjects(true);

    try {
      const data = await request("/projects", {}, sessionToken);
      setProjects(data);

      if (data.length === 0) {
        setSelectedId(null);
        setForm({
          ...EMPTY_FORM,
          sortOrder: 0,
        });
        return;
      }

      const nextSelectedId =
        preferredProjectId && data.some((project) => project.id === preferredProjectId)
          ? preferredProjectId
          : selectedId && data.some((project) => project.id === selectedId)
            ? selectedId
            : data[0].id;

      setSelectedId(nextSelectedId);
      setForm(projectToForm(data.find((project) => project.id === nextSelectedId)));
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    const storedToken = window.localStorage.getItem(STORAGE_TOKEN_KEY);

    if (!storedToken) {
      setIsCheckingSession(false);
      return;
    }

    request("/auth/session", {}, storedToken)
      .then(async () => {
        setToken(storedToken);
        await loadProjects(storedToken);
      })
      .catch(() => {
        window.localStorage.removeItem(STORAGE_TOKEN_KEY);
        setToken("");
      })
      .finally(() => {
        setIsCheckingSession(false);
      });
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsCheckingSession(true);

    try {
      const payload = await request(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ password }),
        },
        "",
      );

      window.localStorage.setItem(STORAGE_TOKEN_KEY, payload.token);
      setToken(payload.token);
      setPassword("");
      await loadProjects(payload.token);
      setNotice("Вход выполнен.");
    } catch (authError) {
      setError(authError.message || "Не удалось войти.");
    } finally {
      setIsCheckingSession(false);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem(STORAGE_TOKEN_KEY);
    setToken("");
    setProjects([]);
    setSelectedId(null);
    setForm(EMPTY_FORM);
    setNotice("");
    setError("");
  };

  const startCreate = () => {
    const nextSortOrder =
      projects.length > 0
        ? Math.max(...projects.map((project) => project.sortOrder ?? 0)) + 1
        : 0;

    setSelectedId(null);
    setForm({
      ...EMPTY_FORM,
      sortOrder: nextSortOrder,
    });
    setError("");
    setNotice("");
  };

  const startEdit = (project) => {
    setSelectedId(project.id);
    setForm(projectToForm(project));
    setError("");
    setNotice("");
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "sortOrder" ? Number(value) || 0 : value,
    }));
  };

  const handlePreviewUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setIsUploadingPreview(true);
    setError("");
    setNotice("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const payload = await request("/uploads/project-preview", {
        method: "POST",
        body: formData,
      });

      setForm((prev) => ({
        ...prev,
        imageSrc: payload.path,
      }));
      setNotice("Превью загружено на сервер.");
    } catch (uploadError) {
      setError(uploadError.message || "Не удалось загрузить превью.");
    } finally {
      event.target.value = "";
      setIsUploadingPreview(false);
    }
  };

  const handlePreviewRemove = () => {
    setForm((prev) => ({
      ...prev,
      imageSrc: "",
    }));
    setNotice("");
    setError("");
  };

  const handleDragStart = (projectId) => {
    setDraggedProjectId(projectId);
    setDropTargetProjectId(projectId);
    setError("");
    setNotice("");
  };

  const handleDragOver = (event, projectId) => {
    event.preventDefault();

    if (projectId !== dropTargetProjectId) {
      setDropTargetProjectId(projectId);
    }
  };

  const handleDragEnd = () => {
    setDraggedProjectId(null);
    setDropTargetProjectId(null);
  };

  const handleDrop = async (event, targetProjectId) => {
    event.preventDefault();

    if (!draggedProjectId || draggedProjectId === targetProjectId) {
      handleDragEnd();
      return;
    }

    const previousProjects = projects;
    const reorderedProjects = reorderProjectsList(
      projects,
      draggedProjectId,
      targetProjectId,
    );

    if (reorderedProjects === projects) {
      handleDragEnd();
      return;
    }

    setProjects(reorderedProjects);

    if (selectedId) {
      const reorderedSelectedProject = reorderedProjects.find(
        (project) => project.id === selectedId,
      );

      if (reorderedSelectedProject) {
        setForm((prev) =>
          prev.id === selectedId
            ? { ...prev, sortOrder: reorderedSelectedProject.sortOrder ?? prev.sortOrder }
            : prev,
        );
      }
    }

    setIsReordering(true);
    setDraggedProjectId(null);
    setDropTargetProjectId(null);
    setError("");
    setNotice("");

    try {
      const savedProjects = await request("/projects/reorder", {
        method: "PATCH",
        body: JSON.stringify({
          ids: reorderedProjects.map((project) => project.id),
        }),
      });

      setProjects(savedProjects);

      if (selectedId) {
        const selectedProject = savedProjects.find(
          (project) => project.id === selectedId,
        );

        if (selectedProject) {
          setForm((prev) =>
            prev.id === selectedId
              ? { ...prev, sortOrder: selectedProject.sortOrder ?? prev.sortOrder }
              : prev,
          );
        }
      }

      setNotice("Порядок проектов обновлен.");
    } catch (reorderError) {
      setProjects(previousProjects);
      setError(
        reorderError.message || "Не удалось сохранить новый порядок проектов.",
      );
    } finally {
      setIsReordering(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setNotice("");

    const payload = {
      sortOrder: Number(form.sortOrder) || 0,
      date: form.date,
      title: form.title,
      imageSrc: form.imageSrc,
      videoEmbedCode: form.videoEmbedCode,
      description: form.description,
    };

    try {
      if (form.id) {
        const updatedProject = await request(`/projects/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setNotice("Проект обновлен.");
        await loadProjects(token, updatedProject.id);
      } else {
        const createdProject = await request("/projects", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setNotice("Проект создан.");
        await loadProjects(token, createdProject.id);
      }
    } catch (saveError) {
      setError(saveError.message || "Не удалось сохранить проект.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form.id) return;

    const confirmed = window.confirm("Удалить этот проект?");
    if (!confirmed) return;

    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      await request(`/projects/${form.id}`, {
        method: "DELETE",
      });

      setNotice("Проект удален.");
      await loadProjects();
    } catch (deleteError) {
      setError(deleteError.message || "Не удалось удалить проект.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isCheckingSession && !token) {
    return (
      <div className={styles.page}>
        <div className={styles.loginWrap}>
          <div className={styles.status}>Проверяю сессию…</div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.loginWrap}>
          <form className={`${styles.panel} ${styles.form}`} onSubmit={handleLogin}>
            <div className={styles.field}>
              <span className={styles.label}>Имя пользователя</span>
              <div className={styles.staticValue}>{STATIC_USERNAME}</div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">
                Пароль
              </label>
              <input
                id="password"
                className={styles.input}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}

            <div className={styles.actions}>
              <button className={styles.primaryBtn} type="submit">
                Войти
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <h1 className={styles.title}>Управление проектами портфолио</h1>
          <button className={styles.logoutBtn} type="button" onClick={handleLogout}>
            Выйти
          </button>
        </section>

        {notice ? <div className={styles.status}>{notice}</div> : null}
        {error ? <div className={styles.error}>{error}</div> : null}

        <div className={styles.grid}>
          <aside className={styles.panel}>
            <h2 className={styles.panelTitle}>Проекты</h2>
            <div className={styles.toolbar}>
              <button className={styles.primaryBtn} type="button" onClick={startCreate}>
                Новый проект
              </button>
            </div>

            <div className={styles.reorderHint}>
              Перетаскивай проекты в списке, чтобы менять их порядок на лендинге.
            </div>

            {isLoadingProjects ? (
              <div className={styles.status}>Загружаю список…</div>
            ) : (
              <div className={styles.list}>
                {projects.map((project, index) => (
                  <button
                    key={project.id}
                    type="button"
                    className={`${styles.card} ${
                      selectedId === project.id ? styles.cardActive : ""
                    } ${draggedProjectId === project.id ? styles.cardDragging : ""} ${
                      dropTargetProjectId === project.id ? styles.cardDropTarget : ""
                    }`}
                    onClick={() => startEdit(project)}
                    draggable
                    onDragStart={() => handleDragStart(project.id)}
                    onDragOver={(event) => handleDragOver(event, project.id)}
                    onDrop={(event) => handleDrop(event, project.id)}
                    onDragEnd={handleDragEnd}
                    aria-grabbed={draggedProjectId === project.id}
                  >
                    <div className={styles.cardMeta}>
                      <span className={styles.dragHandle} aria-hidden="true">
                        <span className={styles.dragHandleLine} />
                        <span className={styles.dragHandleLine} />
                        <span className={styles.dragHandleLine} />
                      </span>
                      <span>{index + 1}. ID {project.id}</span>
                    </div>
                    <p className={styles.cardTitle}>{project.title}</p>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>
              {form.id ? `Редактирование проекта ID ${form.id}` : "Новый проект"}
            </h2>

            <form className={styles.form} onSubmit={handleSave}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="date">
                  Дата
                </label>
                <input
                  id="date"
                  className={styles.input}
                  name="date"
                  value={form.date}
                  onChange={handleFieldChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="title">
                  Название
                </label>
                <textarea
                  id="title"
                  className={`${styles.input} ${styles.titleTextarea}`}
                  name="title"
                  value={form.title}
                  onChange={handleFieldChange}
                  rows={3}
                  placeholder={"Первая строка названия\nВторая строка названия"}
                  required
                />
                <div className={styles.fieldHint}>
                  Используй Enter, чтобы задать перенос строки в заголовке проекта.
                </div>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>Превью</span>

                {form.imageSrc ? (
                  <div className={styles.previewBlock}>
                    <img
                      className={styles.previewImage}
                      src={getPreviewUrl(form.imageSrc)}
                      alt=""
                    />
                    <div className={styles.previewMeta}>{form.imageSrc}</div>
                  </div>
                ) : (
                  <div className={styles.previewPlaceholder}>
                    Превью еще не загружено
                  </div>
                )}

                <div className={styles.uploadRow}>
                  <label className={`${styles.secondaryBtn} ${styles.fileTrigger}`}>
                    <input
                      className={styles.fileInput}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif"
                      onChange={handlePreviewUpload}
                      disabled={isUploadingPreview}
                    />
                    {isUploadingPreview ? "Загружаю..." : "Загрузить картинку"}
                  </label>

                  {form.imageSrc ? (
                    <button
                      className={styles.dangerBtn}
                      type="button"
                      onClick={handlePreviewRemove}
                      disabled={isUploadingPreview}
                    >
                      Убрать
                    </button>
                  ) : null}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="videoEmbedCode">
                  Ссылка на видео
                </label>
                <textarea
                  id="videoEmbedCode"
                  className={styles.textarea}
                  name="videoEmbedCode"
                  value={form.videoEmbedCode}
                  onChange={handleFieldChange}
                  placeholder="https://youtube.com/... или https://vk.com/... или https://vimeo.com/... или https://kinescope.io/..."
                />
                <div className={styles.fieldHint}>
                  Поддерживаются ссылки на VK, YouTube, Vimeo и Kinescope.
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="description">
                  Описание
                </label>
                <textarea
                  id="description"
                  className={styles.textarea}
                  name="description"
                  value={form.description}
                  onChange={handleFieldChange}
                  required
                />
              </div>

              <div className={styles.actions}>
                <button className={styles.primaryBtn} type="submit" disabled={isSaving}>
                  {isSaving ? "Сохраняю…" : "Сохранить"}
                </button>
                {isReordering ? (
                  <span className={styles.inlineStatus}>
                    Сохраняю новый порядок…
                  </span>
                ) : null}
                {form.id ? (
                  <button
                    className={styles.dangerBtn}
                    type="button"
                    onClick={handleDelete}
                    disabled={isSaving}
                  >
                    Удалить
                  </button>
                ) : null}
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
