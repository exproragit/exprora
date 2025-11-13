/**
 * Heatmap tracking functionality for SDK
 */

export class HeatmapTracker {
  private apiKey: string;
  private apiUrl: string;
  private accountId: number;
  private clickData: Map<string, number> = new Map();
  private scrollData: number[] = [];
  private isTracking: boolean = false;

  constructor(apiKey: string, apiUrl: string, accountId: number) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.accountId = accountId;
  }

  startTracking() {
    if (this.isTracking) return;
    this.isTracking = true;

    // Track clicks
    document.addEventListener('click', this.handleClick.bind(this), true);

    // Track scrolls
    let lastScrollTime = Date.now();
    window.addEventListener('scroll', () => {
      const now = Date.now();
      if (now - lastScrollTime > 100) { // Throttle to once per 100ms
        this.trackScroll();
        lastScrollTime = now;
      }
    }, { passive: true });

    // Track mouse movements (heatmap)
    let lastMoveTime = Date.now();
    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - lastMoveTime > 500) { // Throttle to once per 500ms
        this.trackMouseMove(e);
        lastMoveTime = now;
      }
    }, { passive: true });
  }

  stopTracking() {
    this.isTracking = false;
    document.removeEventListener('click', this.handleClick.bind(this), true);
  }

  private handleClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left + window.scrollX);
    const y = Math.round(e.clientY - rect.top + window.scrollY);

    const key = `${x},${y}`;
    const count = (this.clickData.get(key) || 0) + 1;
    this.clickData.set(key, count);

    // Send click data
    this.sendHeatmapData({
      x_coordinate: x,
      y_coordinate: y,
      event_type: 'click',
      element_selector: this.getElementSelector(target),
    });

    // Batch send every 10 clicks
    if (this.clickData.size >= 10) {
      this.flushClickData();
    }
  }

  private trackScroll() {
    const scrollDepth = Math.round(
      ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
    );

    this.scrollData.push(scrollDepth);

    // Send scroll data (throttled)
    if (this.scrollData.length % 5 === 0) {
      this.sendHeatmapData({
        x_coordinate: 0,
        y_coordinate: window.scrollY,
        scroll_depth: scrollDepth,
        event_type: 'scroll',
      });
    }
  }

  private trackMouseMove(e: MouseEvent) {
    // Only track occasionally for heatmap
    if (Math.random() > 0.1) return; // 10% of movements

    this.sendHeatmapData({
      x_coordinate: e.clientX,
      y_coordinate: e.clientY,
      event_type: 'move',
    });
  }

  private flushClickData() {
    this.clickData.clear();
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c).join('.');
      if (classes) return `.${classes}`;
    }
    return element.tagName.toLowerCase();
  }

  private async sendHeatmapData(data: any) {
    try {
      await fetch(`${this.apiUrl}/api/v1/heatmaps/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          ...data,
          page_url: window.location.href,
          experiment_id: (window as any).__exprora_experiment_id || null,
        }),
      });
    } catch (error) {
      // Silently fail - don't interrupt user experience
      console.debug('Heatmap tracking error:', error);
    }
  }
}

