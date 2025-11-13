/**
 * Exprora SDK - A/B Testing JavaScript Library
 * 
 * Usage:
 * <script src="https://cdn.exprora.com/sdk.js"></script>
 * <script>
 *   Exprora.init('YOUR_API_KEY');
 * </script>
 */

interface ExproraConfig {
  apiKey: string;
  apiUrl?: string;
  visitorId?: string;
  sessionId?: string;
}

interface Experiment {
  experiment_id: number;
  experiment_name: string;
  variant_id: number;
  variant_name: string;
  changes: any;
  custom_code?: string; // Keep for backward compatibility
  css_code?: string;
  js_code?: string;
  is_control: boolean;
}

class ExproraSDK {
  private apiKey: string;
  private apiUrl: string;
  private visitorId: string;
  private sessionId: string;
  private experiments: Map<number, Experiment> = new Map();
  private initialized: boolean = false;
  private heatmapTracker?: HeatmapTracker;
  private sessionRecorder?: SessionRecorder;

  constructor(config: ExproraConfig) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || 'https://api.exprora.com';
    this.visitorId = config.visitorId || this.generateVisitorId();
    this.sessionId = config.sessionId || this.generateSessionId();
  }

  /**
   * Initialize the SDK
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize visitor
      await this.initializeVisitor();

      // Get active experiments
      await this.loadExperiments();

      // Apply experiments
      this.applyExperiments();

      // Initialize optional features
      this.initializeOptionalFeatures();

      this.initialized = true;
    } catch (error) {
      console.error('Exprora SDK initialization error:', error);
    }
  }

  /**
   * Generate or retrieve visitor ID
   */
  private generateVisitorId(): string {
    let visitorId = this.getCookie('exprora_visitor_id');
    if (!visitorId) {
      visitorId = 'expr_' + this.generateUUID();
      this.setCookie('exprora_visitor_id', visitorId, 365);
    }
    return visitorId;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return 'expr_session_' + this.generateUUID();
  }

  /**
   * Generate UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Cookie helpers
   */
  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  private setCookie(name: string, value: string, days: number): void {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
  }

  /**
   * Initialize visitor on server
   */
  private async initializeVisitor(): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/api/v1/visitor/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          visitor_id: this.visitorId,
          session_id: this.sessionId,
          user_agent: navigator.userAgent,
          ip_address: '', // Will be determined server-side
        }),
      });
    } catch (error) {
      console.error('Failed to initialize visitor:', error);
    }
  }

  /**
   * Load active experiments
   */
  private async loadExperiments(): Promise<void> {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/v1/experiments/active?visitor_id=${this.visitorId}&url=${encodeURIComponent(window.location.href)}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
          },
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      if (data.experiments) {
        data.experiments.forEach((exp: Experiment) => {
          this.experiments.set(exp.experiment_id, exp);
        });
      }
    } catch (error) {
      console.error('Failed to load experiments:', error);
    }
  }

  /**
   * Apply experiments to the page
   */
  private applyExperiments(): void {
    this.experiments.forEach((experiment) => {
      if (experiment.is_control) return; // Don't apply control variant

      // Apply visual changes (from visual editor)
      if (experiment.changes) {
        this.applyChanges(experiment.changes);
      }

      // Apply CSS code (from code editor)
      if (experiment.css_code) {
        this.applyCSSCode(experiment.css_code);
      }

      // Apply JavaScript code (from code editor)
      if (experiment.js_code) {
        this.applyJSCode(experiment.js_code);
      }

      // Apply custom code (backward compatibility - treat as CSS if it looks like CSS)
      if (experiment.custom_code && !experiment.css_code && !experiment.js_code) {
        this.applyCustomCode(experiment.custom_code);
      }
    });

    // Track pageview
    this.trackEvent('pageview', {
      url: window.location.href,
    });
  }

  /**
   * Apply visual changes (CSS/HTML modifications)
   */
  private applyChanges(changes: any): void {
    if (!changes || typeof changes !== 'object') return;

    // Apply CSS changes
    if (changes.css) {
      const style = document.createElement('style');
      style.textContent = changes.css;
      document.head.appendChild(style);
    }

    // Apply HTML/DOM changes
    if (changes.dom) {
      this.applyDOMChanges(changes.dom);
    }
  }

  /**
   * Apply DOM changes
   */
  private applyDOMChanges(domChanges: any): void {
    if (Array.isArray(domChanges)) {
      domChanges.forEach((change) => {
        this.applySingleDOMChange(change);
      });
    } else {
      this.applySingleDOMChange(domChanges);
    }
  }

  /**
   * Apply single DOM change
   */
  private applySingleDOMChange(change: any): void {
    if (!change.selector || !change.action) return;

    const elements = document.querySelectorAll(change.selector);
    elements.forEach((element) => {
      switch (change.action) {
        case 'replace':
          if (change.content) {
            element.innerHTML = change.content;
          }
          break;
        case 'append':
          if (change.content) {
            element.innerHTML += change.content;
          }
          break;
        case 'prepend':
          if (change.content) {
            element.innerHTML = change.content + element.innerHTML;
          }
          break;
        case 'hide':
          (element as HTMLElement).style.display = 'none';
          break;
        case 'show':
          (element as HTMLElement).style.display = '';
          break;
        case 'addClass':
          if (change.className) {
            element.classList.add(change.className);
          }
          break;
        case 'removeClass':
          if (change.className) {
            element.classList.remove(change.className);
          }
          break;
        case 'setAttribute':
          if (change.attribute && change.value !== undefined) {
            element.setAttribute(change.attribute, change.value);
          }
          break;
      }
    });
  }

  /**
   * Apply CSS code
   */
  private applyCSSCode(cssCode: string): void {
    try {
      if (!cssCode || typeof cssCode !== 'string') return;

      // Remove any script tags for safety
      const cleanCSS = cssCode.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      
      // Remove style tags if present (we'll add our own)
      const cssContent = cleanCSS.replace(/<\/?style[^>]*>/gi, '').trim();
      
      if (cssContent) {
        const style = document.createElement('style');
        style.setAttribute('data-exprora-variant', 'true');
        style.textContent = cssContent;
        document.head.appendChild(style);
      }
    } catch (error) {
      console.error('Error applying CSS code:', error);
    }
  }

  /**
   * Apply JavaScript code
   * WARNING: This executes user-provided JavaScript code.
   * In production, consider additional security measures like:
   * - Content Security Policy (CSP)
   * - Code validation/sanitization
   * - Sandboxing with iframes or Web Workers
   */
  private applyJSCode(jsCode: string): void {
    try {
      if (!jsCode || typeof jsCode !== 'string') return;

      // Basic safety: Remove script tags (code should be raw JS, not wrapped in tags)
      const cleanJS = jsCode.replace(/<\/?script[^>]*>/gi, '').trim();
      
      if (cleanJS) {
        // Execute JavaScript in a try-catch to prevent errors from breaking the page
        // Wrap in IIFE to avoid polluting global scope
        const wrappedCode = `(function() {
          try {
            ${cleanJS}
          } catch (error) {
            console.error('Exprora: Error executing variant JavaScript:', error);
          }
        })();`;
        
        // Use Function constructor as a safer alternative to eval
        // Still executes code, but in a controlled manner
        const func = new Function(wrappedCode);
        func();
      }
    } catch (error) {
      console.error('Error applying JavaScript code:', error);
    }
  }

  /**
   * Apply custom code (backward compatibility)
   * Treats custom_code as CSS if it looks like CSS
   */
  private applyCustomCode(code: string): void {
    try {
      if (!code || typeof code !== 'string') return;

      // If it looks like CSS (contains { and } or starts with <style>)
      if (code.trim().includes('{') && code.trim().includes('}') || code.trim().startsWith('<style>')) {
        this.applyCSSCode(code);
      } else {
        // Otherwise, try as JavaScript (with warning)
        console.warn('Exprora: custom_code field is deprecated. Use css_code and js_code instead.');
        this.applyJSCode(code);
      }
    } catch (error) {
      console.error('Error applying custom code:', error);
    }
  }

  /**
   * Track an event
   */
  async trackEvent(
    eventType: string,
    data?: {
      experiment_id?: number;
      variant_id?: number;
      event_name?: string;
      event_value?: number;
      url?: string;
      metadata?: any;
    }
  ): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/api/v1/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          visitor_id: this.visitorId,
          event_type: eventType,
          ...data,
        }),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track conversion
   */
  async trackConversion(
    goalName: string,
    value?: number,
    metadata?: any
  ): Promise<void> {
    const experiment = Array.from(this.experiments.values())[0];
    await this.trackEvent('conversion', {
      experiment_id: experiment?.experiment_id,
      variant_id: experiment?.variant_id,
      event_name: goalName,
      event_value: value,
      metadata,
    });
  }

  /**
   * Get current visitor ID
   */
  getVisitorId(): string {
    return this.visitorId;
  }

  /**
   * Get active experiments
   */
  getExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Initialize optional features (heatmaps, recordings)
   */
  private initializeOptionalFeatures() {
    // Initialize heatmap tracking
    try {
      const { HeatmapTracker } = require('./heatmaps');
      this.heatmapTracker = new HeatmapTracker(
        this.apiKey,
        this.apiUrl,
        parseInt(this.visitorId.replace('expr_', '')) || 0
      );
      this.heatmapTracker.startTracking();
    } catch (error) {
      // Heatmaps not available
    }

    // Initialize session recording
    try {
      const { SessionRecorder } = require('./recordings');
      this.sessionRecorder = new SessionRecorder(
        this.apiKey,
        this.apiUrl,
        this.visitorId,
        this.sessionId
      );
      this.sessionRecorder.startRecording();
    } catch (error) {
      // Recordings not available
    }
  }

  /**
   * Enable/disable heatmap tracking
   */
  enableHeatmaps(enabled: boolean = true) {
    if (this.heatmapTracker) {
      if (enabled) {
        this.heatmapTracker.startTracking();
      } else {
        this.heatmapTracker.stopTracking();
      }
    }
  }

  /**
   * Enable/disable session recording
   */
  enableRecordings(enabled: boolean = true) {
    if (this.sessionRecorder) {
      if (enabled) {
        this.sessionRecorder.startRecording();
      } else {
        this.sessionRecorder.stopRecording();
      }
    }
  }
}

// Global instance
let exproraInstance: ExproraSDK | null = null;

// Global Exprora object
const Exprora = {
  init: (apiKey: string, config?: Partial<ExproraConfig>) => {
    exproraInstance = new ExproraSDK({
      apiKey,
      ...config,
    });
    exproraInstance.init();
    return exproraInstance;
  },

  track: (eventType: string, data?: any) => {
    if (exproraInstance) {
      exproraInstance.trackEvent(eventType, data);
    }
  },

  conversion: (goalName: string, value?: number, metadata?: any) => {
    if (exproraInstance) {
      exproraInstance.trackConversion(goalName, value, metadata);
    }
  },

  getVisitorId: () => {
    return exproraInstance?.getVisitorId() || null;
  },

  getExperiments: () => {
    return exproraInstance?.getExperiments() || [];
  },
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Exprora;
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).Exprora = Exprora;
}

export default Exprora;

