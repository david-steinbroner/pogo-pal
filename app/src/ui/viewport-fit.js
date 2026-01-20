/**
 * Viewport Fit - Scale app to fit short in-app browser viewports
 * Handles Reddit/Twitter/etc in-app browsers where chrome reduces viewport height
 */

const SAFE_PADDING = 56; // px buffer for in-app browser chrome (bottom bars, etc.)

let baseHeight = null; // Cached design height (measured once at scale=1)

/**
 * Get available viewport height, preferring visualViewport for in-app browsers.
 * Subtracts offsetTop to handle shifted viewports (e.g., in-app browser address bars).
 */
function getAvailableHeight() {
  const vv = window.visualViewport;
  // offsetTop accounts for browser chrome shifting the viewport down
  return vv ? (vv.height - vv.offsetTop) : window.innerHeight;
}

/**
 * Measure base height of app frame (only when unscaled)
 */
function measureBaseHeight(app) {
  // Temporarily reset scale to measure true height
  app.style.transform = 'none';
  const rect = app.getBoundingClientRect();
  baseHeight = rect.height;
  return baseHeight;
}

/**
 * Compute and apply scale to fit app in viewport
 */
function fitToViewport() {
  const wrapper = document.getElementById('appScaleWrapper');
  const app = document.querySelector('.app');

  if (!wrapper || !app) return;

  const availableHeight = getAvailableHeight() - SAFE_PADDING;

  // Measure base height if not cached or if we have room to remeasure
  if (baseHeight === null || availableHeight >= baseHeight) {
    measureBaseHeight(app);
  }

  // Compute scale: fit design height into available space
  const scale = Math.min(1, availableHeight / baseHeight);

  if (scale < 1) {
    // Apply scaling
    app.style.setProperty('--app-scale', scale.toFixed(4));
    app.style.transform = `scale(var(--app-scale))`;
    app.style.transformOrigin = 'top center';
    wrapper.style.height = `${baseHeight * scale}px`;
    wrapper.style.overflow = 'hidden';
  } else {
    // No scaling needed - reset
    app.style.setProperty('--app-scale', '1');
    app.style.transform = '';
    app.style.transformOrigin = '';
    wrapper.style.height = '100%';
    wrapper.style.overflow = '';
  }
}

/**
 * Initialize viewport fitting
 */
export function initViewportFit() {
  // Initial fit after a short delay to ensure layout is stable
  requestAnimationFrame(() => {
    fitToViewport();
  });

  // Recompute on window resize
  window.addEventListener('resize', fitToViewport);

  // Recompute on visualViewport changes (iOS in-app browser chrome)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', fitToViewport);
    window.visualViewport.addEventListener('scroll', fitToViewport);
  }
}
