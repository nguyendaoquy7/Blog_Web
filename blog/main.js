const POSTS_URL = "posts.json";

function select(selector) {
  return document.querySelector(selector);
}

function selectAll(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function getPageId() {
  const el = document.body;
  return el ? el.getAttribute("data-page") : "";
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(d);
  } catch {
    return iso;
  }
}

function estimateReadingMinutes(html) {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

async function loadPosts() {
  const res = await fetch(POSTS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Không tải được dữ liệu bài viết");
  const posts = await res.json();
  return posts.map(p => ({ ...p, dateObj: new Date(p.date) })).sort((a, b) => b.dateObj - a.dateObj);
}

function toSlug(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getQueryParam(name) {
  const params = new URLSearchParams(location.search);
  return params.get(name);
}

function setYear() {
  const y = new Date().getFullYear();
  const el = select("#year");
  if (el) el.textContent = String(y);
}

function restoreTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") {
    document.body.setAttribute("data-theme", saved);
  } else {
    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    document.body.setAttribute("data-theme", prefersLight ? "light" : "dark");
  }
}

function setupThemeToggle() {
  const btn = select("#themeToggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const current = document.body.getAttribute("data-theme") === "light" ? "dark" : "light";
    document.body.setAttribute("data-theme", current);
    localStorage.setItem("theme", current);
  });
}

function renderTagFilters(posts) {
  const container = select("#tagFilters");
  if (!container) return;
  const allTags = new Set();
  posts.forEach(p => (p.tags || []).forEach(t => allTags.add(t)));
  const tagList = ["Tất cả", ...Array.from(allTags).sort((a, b) => a.localeCompare(b, "vi"))];
  container.innerHTML = tagList
    .map((tag, i) => `<button class="tag${i === 0 ? " is-active" : ""}" data-tag="${tag}">${tag}</button>`) 
    .join("");
}

function filterPosts(posts, query, tag) {
  const q = (query || "").trim().toLowerCase();
  const t = (tag || "Tất cả").trim();
  return posts.filter(p => {
    const inTag = t === "Tất cả" || (p.tags || []).includes(t);
    if (!inTag) return false;
    if (!q) return true;
    const haystack = [p.title, p.excerpt, (p.tags || []).join(" ")].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}

function renderPostsList(posts) {
  const container = select("#postsContainer");
  if (!container) return;
  container.innerHTML = posts.map(p => {
    const minutes = estimateReadingMinutes(p.content);
    const coverHtml = `<div class="thumb" style="background-image: url('${p.coverImage || ""}"); background-size: cover; background-position: center;"></div>`;
    const tags = (p.tags || []).map(t => `<span class="tag">${t}</span>`).join(" ");
    return `
      <article class="card post-card">
        ${coverHtml}
        <div class="content">
          <div class="meta">
            <span>${formatDate(p.date)}</span>
            <span>•</span>
            <span>${minutes} phút đọc</span>
          </div>
          <h3><a href="post.html?slug=${encodeURIComponent(p.slug)}">${p.title}</a></h3>
          <p>${p.excerpt}</p>
          <div class="meta" style="margin-top:10px">${tags}</div>
        </div>
      </article>`;
  }).join("");
}

function setupHomeInteractions(allPosts) {
  const tagContainer = select("#tagFilters");
  const searchInput = select("#searchInput");
  let activeTag = "Tất cả";

  function sync() {
    const q = searchInput ? searchInput.value : "";
    const filtered = filterPosts(allPosts, q, activeTag);
    renderPostsList(filtered);
  }

  if (tagContainer) {
    tagContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".tag");
      if (!btn) return;
      selectAll(".tag").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      activeTag = btn.getAttribute("data-tag") || "Tất cả";
      sync();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => sync());
  }

  sync();
}

function renderRecentPosts(posts, currentSlug) {
  const list = select("#recentPosts");
  if (!list) return;
  const items = posts.filter(p => p.slug !== currentSlug).slice(0, 5).map(p => `<li><a href="post.html?slug=${encodeURIComponent(p.slug)}">${p.title}</a></li>`).join("");
  list.innerHTML = items || "<li>Chưa có bài viết khác</li>";
}

function saveComment(slug, comment) {
  const key = `comments:${slug}`;
  const list = JSON.parse(localStorage.getItem(key) || "[]");
  list.push(comment);
  localStorage.setItem(key, JSON.stringify(list));
}

function loadComments(slug) {
  const key = `comments:${slug}`;
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function renderComments(slug) {
  const ul = select("#commentsList");
  if (!ul) return;
  const comments = loadComments(slug);
  ul.innerHTML = comments.map(c => {
    return `<li>
      <div class="c-meta">${c.name} • ${formatDate(c.date)}</div>
      <div>${c.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    </li>`;
  }).join("") || "<li>Hãy là người đầu tiên bình luận.</li>";
}

function setupComments(slug) {
  const form = select("#commentForm");
  const nameEl = select("#commentName");
  const contentEl = select("#commentContent");
  if (!form || !nameEl || !contentEl) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameEl.value.trim();
    const content = contentEl.value.trim();
    if (!name || !content) return;
    saveComment(slug, { name, content, date: new Date().toISOString() });
    contentEl.value = "";
    renderComments(slug);
  });
}

function setupCopyLink() {
  const btn = select("#copyLinkBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      btn.textContent = "Đã sao chép!";
      setTimeout(() => (btn.textContent = "Sao chép liên kết"), 1500);
    } catch {
      alert("Không thể sao chép liên kết");
    }
  });
}

async function initHome() {
  const posts = await loadPosts();
  renderTagFilters(posts);
  setupHomeInteractions(posts);
}

async function initPost() {
  const slug = getQueryParam("slug");
  if (!slug) {
    const container = select("#postContainer");
    if (container) container.innerHTML = `<p>Không tìm thấy bài viết.</p>`;
    return;
  }
  const posts = await loadPosts();
  const post = posts.find(p => p.slug === slug);
  const container = select("#postContainer");
  if (!post || !container) {
    if (container) container.innerHTML = `<p>Không tìm thấy bài viết.</p>`;
    return;
  }

  document.title = `${post.title} — MyBlog`;

  const minutes = estimateReadingMinutes(post.content);
  container.innerHTML = `
    <header>
      <div class="meta">
        <span>${formatDate(post.date)}</span>
        <span>•</span>
        <span>${minutes} phút đọc</span>
      </div>
      <h1>${post.title}</h1>
      <div class="meta">Tác giả: ${post.author}</div>
      ${post.coverImage ? `<img src="${post.coverImage}" alt="${post.title}">` : ""}
    </header>
    <section class="content">${post.content}</section>
  `;

  renderRecentPosts(posts, slug);
  renderComments(slug);
  setupComments(slug);
  setupCopyLink();
}

async function init() {
  setYear();
  restoreTheme();
  setupThemeToggle();

  const page = getPageId();
  try {
    if (page === "home") await initHome();
    if (page === "post") await initPost();
  } catch (err) {
    console.error(err);
    const container = select("#postsContainer") || select("#postContainer");
    if (container) container.innerHTML = `<p>Đã xảy ra lỗi khi tải dữ liệu.</p>`;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
