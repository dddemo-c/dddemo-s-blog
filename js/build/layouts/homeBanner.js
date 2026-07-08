const setScrollToMain = () => {
  window["scrollToMain"] = () => {
    const target = document.querySelector(".main-content-container");
    if (!target) return;
    const start = window.scrollY;
    const end = target.getBoundingClientRect().top + window.scrollY - 60;
    const duration = 600;
    const startTime = performance.now();
    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      window.scrollTo(0, start + (end - start) * ease);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  };
};

export default function initHomeBanner({ signal } = {}) {
  setScrollToMain();

  const qrToggleItems = document.querySelectorAll(".qr-toggle-item");
  if (!qrToggleItems.length) {
    return;
  }

  let activeItem = null;

  const closeOtherItems = (currentItem) => {
    qrToggleItems.forEach((item) => {
      if (item !== currentItem) {
        item.classList.remove("qr-active");
      }
    });
  };

  qrToggleItems.forEach((item) => {
    const trigger = item.querySelector(".qr-trigger");
    if (!trigger) {
      return;
    }

    const handleClick = (event) => {
      event.preventDefault();

      closeOtherItems(item);

      const isActive = item.classList.contains("qr-active");
      if (isActive) {
        item.classList.remove("qr-active");
        activeItem = null;
      } else {
        item.classList.add("qr-active");
        activeItem = item;
      }
    };

    const handleBlur = () => {
      setTimeout(() => {
        if (activeItem !== item) {
          item.classList.remove("qr-active");
        }
      }, 100);
    };

    if (signal) {
      trigger.addEventListener("click", handleClick, { signal });
      trigger.addEventListener("blur", handleBlur, { signal });
    } else {
      trigger.addEventListener("click", handleClick);
      trigger.addEventListener("blur", handleBlur);
    }
  });

  const handleDocClick = (event) => {
    const isQrElement = event.target.closest(".qr-toggle-item");
    if (!isQrElement && activeItem) {
      activeItem.classList.remove("qr-active");
      activeItem = null;
    }
  };

  if (signal) {
    document.addEventListener("click", handleDocClick, { signal });
  } else {
    document.addEventListener("click", handleDocClick);
  }
}
