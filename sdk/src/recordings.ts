/**
 * Session recording functionality for SDK
 */

interface RecordingEvent {
  type: string;
  timestamp: number;
  data: any;
}

export class SessionRecorder {
  private apiKey: string;
  private apiUrl: string;
  private visitorId: string;
  private sessionId: string;
  private events: RecordingEvent[] = [];
  private isRecording: boolean = false;
  private startTime: number = 0;
  private domSnapshot: string = '';

  constructor(apiKey: string, apiUrl: string, visitorId: string, sessionId: string) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.visitorId = visitorId;
    this.sessionId = sessionId;
  }

  startRecording() {
    if (this.isRecording) return;
    this.isRecording = true;
    this.startTime = Date.now();
    this.events = [];

    // Capture initial DOM snapshot
    this.captureDOMSnapshot();

    // Record DOM mutations
    this.observeDOM();

    // Record user interactions
    this.recordInteractions();

    // Record navigation
    this.recordNavigation();
  }

  stopRecording() {
    if (!this.isRecording) return;
    this.isRecording = false;
    this.saveRecording();
  }

  private captureDOMSnapshot() {
    this.domSnapshot = document.documentElement.outerHTML;
  }

  private observeDOM() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        this.addEvent({
          type: 'dom_mutation',
          timestamp: Date.now() - this.startTime,
          data: {
            type: mutation.type,
            target: this.getElementPath(mutation.target as HTMLElement),
            addedNodes: mutation.addedNodes.length,
            removedNodes: mutation.removedNodes.length,
          },
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
    });
  }

  private recordInteractions() {
    // Record clicks
    document.addEventListener('click', (e) => {
      this.addEvent({
        type: 'click',
        timestamp: Date.now() - this.startTime,
        data: {
          x: e.clientX,
          y: e.clientY,
          target: this.getElementPath(e.target as HTMLElement),
        },
      });
    }, true);

    // Record input changes
    document.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.addEvent({
        type: 'input',
        timestamp: Date.now() - this.startTime,
        data: {
          target: this.getElementPath(target),
          value: target.type === 'password' ? '***' : target.value.substring(0, 100), // Don't record full passwords
        },
      });
    }, true);

    // Record form submissions
    document.addEventListener('submit', (e) => {
      this.addEvent({
        type: 'form_submit',
        timestamp: Date.now() - this.startTime,
        data: {
          target: this.getElementPath(e.target as HTMLElement),
        },
      });
    }, true);
  }

  private recordNavigation() {
    // Record page visibility
    document.addEventListener('visibilitychange', () => {
      this.addEvent({
        type: 'visibility_change',
        timestamp: Date.now() - this.startTime,
        data: {
          hidden: document.hidden,
        },
      });
    });

    // Record before unload
    window.addEventListener('beforeunload', () => {
      this.saveRecording();
    });
  }

  private addEvent(event: RecordingEvent) {
    this.events.push(event);

    // Auto-save every 100 events or 30 seconds
    if (this.events.length >= 100 || Date.now() - this.startTime > 30000) {
      this.saveRecording(true); // Partial save
    }
  }

  private async saveRecording(partial: boolean = false) {
    if (this.events.length === 0) return;

    const duration = Date.now() - this.startTime;
    const pageViews = 1; // Could track multiple pages

    try {
      await fetch(`${this.apiUrl}/api/v1/recordings/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          visitor_id: this.visitorId,
          session_id: this.sessionId,
          page_url: window.location.href,
          recording_data: {
            dom_snapshot: this.domSnapshot,
            events: this.events,
          },
          duration: Math.round(duration / 1000),
          page_views: pageViews,
        }),
      });

      if (!partial) {
        this.events = []; // Clear after full save
      }
    } catch (error) {
      console.debug('Recording save error:', error);
    }
  }

  private getElementPath(element: HTMLElement): string {
    const path: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break;
      }
      if (current.className) {
        selector += `.${current.className.split(' ').join('.')}`;
      }
      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }
}

