const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
const topbar = document.querySelector(".topbar");
const moreMenu = document.querySelector("[data-more-menu]");
const moreMenuToggle = document.querySelector("[data-more-toggle]");
const moreMenuPanel = moreMenu?.querySelector(".more-menu-panel");

if (topbar) {
  const updateTopbarState = () => {
    topbar.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  updateTopbarState();
  window.addEventListener("scroll", updateTopbarState, { passive: true });
}

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

if (nav) {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = Array.from(nav.querySelectorAll("a[href]"));

  navLinks.forEach((link) => {
    const linkTarget = link.getAttribute("href");
    const isCurrent =
      linkTarget === currentPage ||
      (currentPage === "" && linkTarget === "index.html");

    if (isCurrent) {
      link.classList.add("is-active");

      if (moreMenu?.contains(link)) {
        moreMenuToggle?.classList.add("is-active");
      }
    } else {
      link.classList.remove("is-active");
    }
  });
}

if (moreMenu && moreMenuToggle && moreMenuPanel) {
  const closeMoreMenu = () => {
    moreMenu.classList.remove("is-open");
    moreMenuToggle.setAttribute("aria-expanded", "false");
  };

  moreMenuToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = moreMenu.classList.toggle("is-open");
    moreMenuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!moreMenu.contains(event.target)) {
      closeMoreMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMoreMenu();
    }
  });

  moreMenuPanel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMoreMenu();
    });
  });
}

const heroSlides = document.querySelectorAll("[data-hero-slide]");
const heroTabs = document.querySelectorAll("[data-hero-target]");

if (heroSlides.length > 0 && heroTabs.length === heroSlides.length) {
  let activeHeroIndex = 0;
  let heroIntervalId;

  const showHeroSlide = (index) => {
    activeHeroIndex = index;

    heroSlides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === index);
    });

    heroTabs.forEach((tab, tabIndex) => {
      tab.classList.toggle("is-active", tabIndex === index);
    });
  };

  const startHeroRotation = () => {
    if (heroSlides.length < 2) {
      return;
    }

    clearInterval(heroIntervalId);
    heroIntervalId = window.setInterval(() => {
      const nextIndex = (activeHeroIndex + 1) % heroSlides.length;
      showHeroSlide(nextIndex);
    }, 6000);
  };

  heroTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      showHeroSlide(index);
      startHeroRotation();
    });
  });

  showHeroSlide(0);
  startHeroRotation();
}

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && revealItems.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxTitle = document.getElementById("lightbox-title");
const lightboxClose = document.getElementById("lightbox-close");
const galleryTriggers = document.querySelectorAll("[data-full]");

if (lightbox && lightboxImage && lightboxTitle && lightboxClose) {
  galleryTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      lightboxImage.src = trigger.dataset.full;
      lightboxImage.alt = trigger.dataset.title || "";
      lightboxTitle.textContent = trigger.dataset.title || "";
      lightbox.showModal();
    });
  });

  lightboxClose.addEventListener("click", () => {
    lightbox.close();
  });

  lightbox.addEventListener("click", (event) => {
    const bounds = lightbox.getBoundingClientRect();
    const clickedOutside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (clickedOutside) {
      lightbox.close();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.open) {
      lightbox.close();
    }
  });
}

const filterButtons = document.querySelectorAll(".filter-button");
const galleryCards = document.querySelectorAll(".gallery-card");

if (filterButtons.length > 0 && galleryCards.length > 0) {
  const setGalleryFilter = (filter) => {
    const activeFilter = Array.from(filterButtons).some(
      (button) => button.dataset.filter === filter
    )
      ? filter
      : "all";

    filterButtons.forEach((button) => {
      const isActive = button.dataset.filter === activeFilter;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    galleryCards.forEach((card) => {
      const categories = card.dataset.category || "";
      const matches = activeFilter === "all" || categories.includes(activeFilter);
      card.hidden = !matches;
    });

    const url = new URL(window.location.href);

    if (activeFilter === "all") {
      url.searchParams.delete("filter");
    } else {
      url.searchParams.set("filter", activeFilter);
    }

    window.history.replaceState({}, "", url);
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setGalleryFilter(button.dataset.filter || "all");
    });
  });

  const initialFilter = new URLSearchParams(window.location.search).get("filter") || "all";
  setGalleryFilter(initialFilter);
}

const faqTriggers = document.querySelectorAll("[data-faq-trigger]");

if (faqTriggers.length > 0) {
  faqTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const item = trigger.closest("[data-faq-item]");
      const panel = item?.querySelector("[data-faq-panel]");

      if (!item || !panel) {
        return;
      }

      const isOpen = item.classList.toggle("is-open");
      trigger.setAttribute("aria-expanded", String(isOpen));
      panel.hidden = !isOpen;
    });
  });
}

const mailtoForm = document.querySelector("[data-mailto-form]");
const formStatus = document.querySelector("[data-form-status]");
const MAX_ATTACHMENT_SIZE = 3 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

if (mailtoForm instanceof HTMLFormElement) {
  const formStartedAt = mailtoForm.querySelector("[data-form-started-at]");

  if (formStartedAt instanceof HTMLInputElement) {
    formStartedAt.value = String(Date.now());
  }

  mailtoForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(mailtoForm);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const project = String(formData.get("project") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const details = String(formData.get("details") || "").trim();
    const companyWebsite = String(formData.get("companyWebsite") || "").trim();
    const projectConfirm = String(formData.get("projectConfirm") || "").trim();
    const startedAt = String(formData.get("formStartedAt") || Date.now()).trim();
    const attachmentFile = formData.get("attachment");

    if (formStatus) {
      formStatus.textContent = "Sending your request...";
    }

    const submitButton = mailtoForm.querySelector('button[type="submit"]');

    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    try {
      const attachment =
        attachmentFile instanceof File && attachmentFile.size > 0
          ? await prepareAttachment(attachmentFile)
          : null;

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          project,
          location,
          details,
          companyWebsite,
          projectConfirm,
          startedAt,
          attachment
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Email delivery failed.");
      }

      mailtoForm.reset();

      if (formStatus) {
        formStatus.textContent = "Thanks. Redirecting you to the confirmation page...";
      }

      window.location.assign("thank-you.html");
    } catch (error) {
      if (formStatus) {
        formStatus.textContent =
          error instanceof Error && error.message
            ? error.message
            : "We could not send the form just yet. Please call or email us directly at profence@caprofence.com.";
      }
    } finally {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
        submitButton.textContent = "Request Estimate";
      }
    }
  });
}

async function prepareAttachment(file) {
  const isAllowedType = ALLOWED_ATTACHMENT_TYPES.has(file.type) || /\.pdf$/i.test(file.name);

  if (!isAllowedType) {
    throw new Error("Please attach a photo or PDF file.");
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error("Please keep the attachment under 3 MB.");
  }

  const dataUrl = await readFileAsDataUrl(file);
  const content = String(dataUrl).split(",")[1] || "";

  return {
    filename: file.name,
    content,
    contentType: file.type || "application/octet-stream",
    size: file.size
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("Could not read the attachment.")));
    reader.readAsDataURL(file);
  });
}
