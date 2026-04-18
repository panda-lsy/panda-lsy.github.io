export class RiveController {
  constructor({ container, file, stateMachine, runtime } = {}) {
    this.container = container;
    this.file = file;
    this.stateMachine = stateMachine;
    this.runtime = runtime;
    this.instance = null;
  }

  init() {
    if (!this.container || !this.runtime || !this.file) {
      return null;
    }

    this.instance = this.runtime({
      src: this.file,
      canvas: this.container,
      stateMachines: this.stateMachine ? [this.stateMachine] : undefined,
      autoplay: true,
    });

    return this.instance;
  }

  destroy() {
    if (this.instance?.cleanup) {
      this.instance.cleanup();
    }

    this.instance = null;
  }
}
