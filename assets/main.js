document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const header = document.querySelector('[data-header]');
  const mobileToggle = document.querySelector('[data-mobile-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const cartCountEls = document.querySelectorAll('[data-cart-count]');
  const splash = document.querySelector('[data-splash]');
  const typingTarget = document.querySelector('[data-typing]');
  const parallaxCard = document.querySelector('[data-parallax-card]');
  const parallaxSection = document.querySelector('[data-parallax-section]');

  const getCartElements = () => ({
    drawer: document.querySelector('[data-cart-drawer]'),
    overlay: document.querySelector('[data-cart-overlay]')
  });

  const setHeaderState = () => {
    if (!header) return;
    if (window.scrollY > 20) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };

  const openMobileMenu = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
  };

  const closeMobileMenu = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
  };

  const openCart = () => {
    const { drawer, overlay } = getCartElements();
    if (!drawer || !overlay) return;
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
  };

  const closeCart = () => {
    const { drawer, overlay } = getCartElements();
    if (!drawer || !overlay) return;
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
  };

  const updateCartCount = (count) => {
    cartCountEls.forEach((el) => {
      el.textContent = count;
    });
  };

  const refreshCartDrawer = async () => {
    try {
      const previousDrawer = document.querySelector('[data-cart-drawer]');
      const wasOpen = previousDrawer && previousDrawer.classList.contains('is-open');
      const response = await fetch('/?sections=cart-drawer');
      const data = await response.json();
      const sectionHtml = data['cart-drawer'];
      const container = document.querySelector('[data-cart-section]');
      if (container && sectionHtml) {
        container.innerHTML = sectionHtml;
      }
      if (wasOpen) {
        openCart();
      }
      const cartResponse = await fetch('/cart.js');
      const cartData = await cartResponse.json();
      updateCartCount(cartData.item_count || 0);
    } catch (error) {
      console.error('Cart refresh failed', error);
    }
  };

  const changeCartLine = async (line, quantity) => {
    try {
      await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ line, quantity })
      });
      await refreshCartDrawer();
    } catch (error) {
      console.error('Cart change failed', error);
    }
  };

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      if (mobileMenu && mobileMenu.classList.contains('is-open')) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-mobile-close]')) {
      closeMobileMenu();
    }
    if (event.target.closest('[data-cart-close]')) {
      closeCart();
    }
    if (event.target.matches('[data-cart-overlay]')) {
      closeCart();
    }
    if (event.target.closest('[data-cart-toggle]')) {
      event.preventDefault();
      openCart();
    }
    if (event.target.closest('[data-remove-item]')) {
      const item = event.target.closest('[data-line]');
      if (item) {
        changeCartLine(Number(item.dataset.line), 0);
      }
    }
    if (event.target.closest('[data-qty-change]')) {
      const button = event.target.closest('[data-qty-change]');
      const item = event.target.closest('[data-line]');
      const input = item ? item.querySelector('[data-qty-input]') : null;
      if (item && input) {
        const delta = Number(button.dataset.qtyChange || 0);
        const nextValue = Math.max(0, Number(input.value || 0) + delta);
        input.value = nextValue;
        changeCartLine(Number(item.dataset.line), nextValue);
      }
    }
    if (event.target.closest('[data-qty-step]')) {
      const button = event.target.closest('[data-qty-step]');
      const controls = button.closest('.qty-controls');
      const input = controls ? controls.querySelector('[data-qty-input-generic]') : null;
      if (input) {
        const delta = Number(button.dataset.qtyStep || 0);
        const minValue = Number(input.getAttribute('min') || 0);
        const nextValue = Math.max(minValue, Number(input.value || minValue) + delta);
        input.value = nextValue;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    const link = event.target.closest('a');
    if (link && !link.matches('[data-cart-toggle]')) {
      closeCart();
      closeMobileMenu();
    }
  });

  document.addEventListener('change', (event) => {
    const input = event.target.closest('[data-qty-input]');
    const item = event.target.closest('[data-line]');
    if (input && item) {
      const quantity = Math.max(0, Number(input.value || 0));
      changeCartLine(Number(item.dataset.line), quantity);
    }
  });

  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-ajax-add]');
    if (!form) return;
    event.preventDefault();
    const formData = new FormData(form);
    try {
      await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      });
      await refreshCartDrawer();
      openCart();
    } catch (error) {
      console.error('Add to cart failed', error);
    }
  });

  window.addEventListener('scroll', setHeaderState);
  window.addEventListener('resize', setHeaderState);
  setHeaderState();

  if (splash) {
    const isHome = body.dataset.template === 'index';
    if (!isHome) {
      splash.remove();
    } else {
      const hasSeen = sessionStorage.getItem('nw_splash_seen');
      if (hasSeen) {
        splash.remove();
      } else {
        sessionStorage.setItem('nw_splash_seen', '1');
        setTimeout(() => {
          splash.classList.add('is-hide');
          splash.addEventListener('transitionend', () => {
            splash.remove();
          }, { once: true });
        }, 1000);
      }
    }
  }

  if (typingTarget) {
    const text = typingTarget.getAttribute('data-text') || '';
    const typingSection = typingTarget.closest('[data-typing-section]') || typingTarget;
    const startTyping = () => {
      if (typingTarget.dataset.typed === 'true') return;
      typingTarget.dataset.typed = 'true';
      let index = 0;
      const tick = () => {
        typingTarget.textContent = text.slice(0, index);
        index += 1;
        if (index <= text.length) {
          setTimeout(tick, 35);
        }
      };
      tick();
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startTyping();
            observer.disconnect();
          }
        });
      }, { threshold: 0.4 });
      observer.observe(typingSection);
    } else {
      startTyping();
    }
  }

  if (parallaxCard && parallaxSection) {
    let rafId = null;
    const setTransform = (x, y) => {
      parallaxCard.style.transform = `rotateX(${y}deg) rotateY(${x}deg)`;
    };
    const onMouseMove = (event) => {
      if (window.innerWidth < 1024) return;
      const bounds = parallaxSection.getBoundingClientRect();
      const relX = (event.clientX - bounds.left) / bounds.width - 0.5;
      const relY = (event.clientY - bounds.top) / bounds.height - 0.5;
      const rotateX = (-relY * 8).toFixed(2);
      const rotateY = (relX * 12).toFixed(2);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setTransform(rotateY, rotateX));
    };
    const onScroll = () => {
      if (window.innerWidth >= 1024) return;
      const bounds = parallaxSection.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, 1 - bounds.top / window.innerHeight));
      const translateY = (progress * 10).toFixed(2);
      parallaxCard.style.transform = `translateY(${translateY}px)`;
    };
    parallaxSection.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const normalizeUrl = (url) => (url ? url.split('?')[0] : '');

  document.querySelectorAll('[data-gallery]').forEach((gallery) => {
    const mainGalleryImage = gallery.querySelector('[data-gallery-main]');
    const galleryThumbs = Array.from(gallery.querySelectorAll('[data-gallery-thumb]'));
    const prevButton = gallery.querySelector('[data-gallery-prev]');
    const nextButton = gallery.querySelector('[data-gallery-next]');
    const variantSelect = gallery.closest('.product-layout')?.querySelector('[data-variant-select]');
    if (!mainGalleryImage || !galleryThumbs.length) return;

    let currentIndex = 0;
    const mainSrc = normalizeUrl(mainGalleryImage.getAttribute('src'));
    const foundIndex = galleryThumbs.findIndex((thumb) => normalizeUrl(thumb.dataset.src || thumb.dataset.full) === mainSrc);
    if (foundIndex >= 0) currentIndex = foundIndex;

    const applyImage = (index) => {
      const item = galleryThumbs[index];
      if (!item) return;
      const src = item.dataset.src || item.dataset.full;
      const srcset = item.dataset.srcset;
      const alt = item.dataset.alt;
      if (src) {
        mainGalleryImage.setAttribute('src', src);
      }
      if (srcset) {
        mainGalleryImage.setAttribute('srcset', srcset);
      }
      if (alt) {
        mainGalleryImage.setAttribute('alt', alt);
      }
      currentIndex = index;
    };

    galleryThumbs.forEach((thumb, index) => {
      thumb.addEventListener('click', () => applyImage(index));
    });

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        const nextIndex = (currentIndex - 1 + galleryThumbs.length) % galleryThumbs.length;
        applyImage(nextIndex);
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        const nextIndex = (currentIndex + 1) % galleryThumbs.length;
        applyImage(nextIndex);
      });
    }

    if (variantSelect) {
      const syncVariantImage = () => {
        const selectedOption = variantSelect.selectedOptions[0];
        if (!selectedOption) return;
        const mediaId = selectedOption.dataset.mediaId;
        const imageSrc = selectedOption.dataset.imageSrc;
        let matchIndex = -1;

        if (mediaId) {
          matchIndex = galleryThumbs.findIndex((thumb) => thumb.dataset.mediaId === mediaId);
        }

        if (matchIndex < 0 && imageSrc) {
          const normalizedVariantSrc = normalizeUrl(imageSrc);
          matchIndex = galleryThumbs.findIndex((thumb) => {
            const thumbSrc = normalizeUrl(thumb.dataset.src || thumb.dataset.full || '');
            return thumbSrc === normalizedVariantSrc;
          });
        }

        if (matchIndex >= 0) {
          applyImage(matchIndex);
          if (window.innerWidth <= 768) {
            const galleryMain = gallery.querySelector('.gallery-main');
            if (galleryMain) {
              galleryMain.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        }
      };
      variantSelect.addEventListener('change', syncVariantImage);
      syncVariantImage();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMobileMenu();
      closeCart();
    }
  });
});
