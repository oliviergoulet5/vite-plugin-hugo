import "./counter.scss";

class Counter {
  private count = 0;
  private element: HTMLElement;

  constructor(container: HTMLElement) {
    this.element = container;
    this.render();
  }

  private render() {
    this.element.innerHTML = `
      <div class="counter">
        <button class="counter__btn" data-action="decrement">−</button>
        <span class="counter__value">${this.count}</span>
        <button class="counter__btn" data-action="increment">+</button>
      </div>
    `;

    this.element.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const action = (e.target as HTMLElement).dataset.action;
        if (action === "increment") this.count++;
        if (action === "decrement") this.count--;
        this.updateDisplay();
      });
    });
  }

  private updateDisplay() {
    const valueEl = this.element.querySelector(".counter__value");
    if (valueEl) valueEl.textContent = String(this.count);
  }
}

document.querySelectorAll("[data-counter]").forEach((el) => {
  new Counter(el as HTMLElement);
});

