# Refactoring With Hidden Elements

In this document we will take a simple ECMAScript 2015 class definition for a DOM custom element and progressively refactor it to take advantage of the class extensions defined in this proposal.

## A Starting Point

We start with a plain ECMAScript 2015 class definition. It stores internal state in a publicly accessible data property named `xValue` and uses a few publicly accessible methods for internal code organization. The custom element constructor is registered with the DOM by calling `customElements.define` immediately after the class definition.

```js
class Counter extends HTMLElement {
  get x() { return this.xValue; }
  set x(value) {
    this.xValue = value;
    window.requestAnimationFrame(this.render.bind(this));
  }

  clicked() {
    this.x++;
  }

  constructor() {
    super();
    this.onclick = this.clicked.bind(this);
    this.xValue = 0;
  }

  connectedCallback() { this.render(); }

  render() {
    this.textContent = this.x.toString();
  }
}
window.customElements.define('num-counter', Counter);
```

## 1. Instance Variables

As the first step in our refactoring process, we will update the class definition so that internal state is stored in an *private data member*. We add a private data member to the class using the `let` keyword and update references to this value via direct access or using the "scope access operator" `::`.

```js
class Counter extends HTMLElement {
  let xValue;

  get x() { return xValue; }

  set x(value) {
    xValue = value;
    window.requestAnimationFrame(render.bind(this));
  }

  clicked() {
    x++;
    window.requestAnimationFrame(render.bind(this));
  }

  constructor() {
    super();
    onclick = clicked.bind(this);
    xValue = 0;
  }

  connectedCallback() { render(); }

  render() {
    textContent = x.toString();
  }
}
window.customElements.define('num-counter', Counter);
```

## 2. Internal Methods

Finally, we will convert our internal helper methods into private data members and assign the function to them using arrow function notation. This saves us from needing to bind the function to the current instance. Since `window.requestAnimationFrame` is called whenever `xValue` is incremented, we can convert our getter/setter pair into a private member function.

```js
class Counter extends HTMLElement {
  let xValue = 0;

  let incX = () => {
    ++xValue;
    window.requestAnimationFrame(render);
  }

  let clicked = () => {
    incX();
  }

  connectedCallback() { render(); }

  let render = () => {
    textContent = xValue.toString();
  }
}
window.customElements.define('num-counter', Counter);
```
