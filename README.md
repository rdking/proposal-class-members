# proposal-class-members
This is a fork of the rejected js-classes-1.1 proposal aimed to pick up development where the previous proposal left off. Since the original was shot down due to the absense of a syntax for declaring public data members, that is one of the first things remedied by this fork. Along with a few syntax improvements for readability, the main goal is to provide TC39 with a proposal capable of providing everything demanded by the board without negatively impacting any features or natural integration expectations currently in the language.

## Motivation

This is a new proposal for extending ECMAScript's class definition syntax and semantics. It is intended to be a replacement for the  set of proposals currently under development within TC39. For the motivation behind developing a new proposal, see *[why a new proposal](docs/motivation.md)*.

## Philosophy

Elements of a `class` definition should only appear on direct products of the `class` keyword. This means that if it's not on the prototype, on the constructor, or (as of this proposal) in the instance-closure, it's not a part of the `class` definition, and therefore, not a member of the class. A class "member" is therefore anything defined or produced within the lexical scope of the `class` definition and represented in or on one of the products of `class`.

## Primary Goals

The max-min class design, as implemented in ECMAScript 2015, has successfully balanced the need for a declarative class syntax with the desire to keep semantics lightweight and expressible in terms of the existing JavaScript object model. Although there are currently several proposals for extending class definitions with additional features, we believe that existing class definitions are only missing the following fundamental capabilities:

1. **Per-instance encapsulated state.** There should be a way for a class author to specify per-instance state that is not accessible outside of the class definition.
2. **Secure method decomposition.** There should be a way for the user to refactor common code into methods that are not accessible outside of the class definition.
3. **Customized data initialization.** There should be a way to initialize the class prototype, for instance by adding arbitrary data properties, within the class definition.

### Additional Goal
Due in no small part to the lack of support for data in ES6 classes out-of-the-box, and also to both the prototype foot-gun, and the "best practice" that arose as a result, one additional capability must be added:

4. **Instance data initialization.** There should be a way for the initialization code assigned inside the class definition to be executed against the instance, setting an appropriate value for each non-public function, non-public accessor property.

While the values visible from the prototype take on an advisory role, it is the resut of running the initialization code (the source code of each initialization value) on each instance that will be the value available in instances. This opens the possibility that a property of each instance may be iniitalized to a unique value. It also cleanly avoids issues with the prototype foot-gun.

## Mental Model

The only thing in ES that is capable of providing the primary goals above is a closure. However, it is virtually impossible to use a closure to provide for per-instance state without the use of one or more WeakMaps. This proposal offers an approach to applying the closure concept on class definitions to contain private data.

Normally, when a function returns another function defined during the run of the former, the entire execution environment of the former function is retained as a "closure" on the latter. With this proposal, a `class` definition behaves in a similar fashion to a function. Where a function closure is formed by running a function that returns 1 or more functions, an instance-closure is formed by instantiating a `class`. Likewise, a class-closure is created by evaluating a `class` definition.

As a result, the member functions of the `class` instance all carry a closure associated with that instance and class. The instance-closure is associated with all non-static member functions at the time of instantiation. The class-closure is associated with all static member functions at the time of `class` evaluation and all non-static member functions at the time of instantiation. Unlike with normal closures, all member functions of a given `class` have access to all instance-closures and the class-closure for the given `class`.

So basically, we've been able to do this:
```js
function X(v) {
  if (!new.target) throw new TypeError(`Constructor X requires new`);
  let x = v;
  this.print() {
    console.log(`x = ${x}`);
  };
}
```
Now we'll be able to do this:
```js
class X {
  let x;
  constructor(v) {
    x = v;
  }
  print() {
    console.log(`x = ${x}`);
  }
}
```
...and reasonably expect that regardless of which one we use:
```js
var a = new X(2);
var b = new X(3);
a.print(); //"x = 2"
b.print(); //"x = 3"
```
because each instance gets it's own closure.

Just as the closure of a function provides for lexically scoped variables, the public and private members of the instance become available as lexically scope variables, as if the "with" keyword had automatically been applied at the beginning of the function. It's possible for locally scoped variable to shadow these property-variables. However, the properties are always available via `obj.member` for public members and `obj::member` for private members. Equivalent array notation is also available via `obj['member']` and `obj::['member']`, respectively.

## Overview
* To declare a private data member, use `let`.
* To declare a constant private data member, use `const`.
    * All constants must be initialized.
* To declare a public data property, use `prop`.
    * This is a prototype data property. Beware the object value foot-gun.
* All data properties can be initialized using operator `=`.
* There is no unique form for defining private member functions.
    * Private member functions are created by declaring a private data member initialized with a function defined within the lexical scope of the class.
* The initializer of all private data members and public instance data members are resolved at the time of `class` instantiation.
    * All other data member initializers are resolved at the time of `class` evaluation.
* A new operator (`::`) is defined for accessing private members.
    * If the private member's name is in a variable, you can use `obj::[variable]` to access it.

#### Example
##### New Syntax Version
```js
class X {
  let a;                  //Private data member, initialized to undefined
  let static b = {};      //Class-private data member, initialized to an object
  let c = () => {};       //Private member function, bound to this
  let d = function() {};  //Private member function, unbound
  const e = 0;            //Private constant member, initialize to 0
  prop f = Math.E;        //Prototype-based public data property
  static g = Math.sqrt(2);//Static public data property

  constructor(a, f) {
    this::a = a;          //If your private member variable gets shadowed,
    this.f = f;           //just use the property notation
  }

  copy(other) {
    a = other::a;         //Access to members on siblings always uses property notation
    f = other.f;
  }

  print() {
    //Class-private member access
    console.log(`this.constructor::b = ${this.constructor::b}`);
    
    this.constructor::printStatic();

    //You can iterate through private members!
    for (let key of ['a', 'c', 'd', 'e']) {
      console.log(`this::${key} = ${this::[key]}`);
    }
    //No private members in this loop at all.
    for (let key of Object.keys(this)) {
      console.log(`this.${key} = ${this[key]}`);
    }
  }

  let static printStatic = () => {
    console.log(`X::b = ${b}`);
    console.log(`X.g = ${g}`);
  }
}
```
##### Sugar-free Version
```js
const X = (function() {
  let pvt = new WeakMap();

  function privateInit() {
    return Object.seal(Object.create(null, {
      a: {
        writable: true,
        value: void 0
      },
      c: {
        writable: true,
        value: () => {}
      },
      d: {
        writable: true,
        value: function() {}
      },
      e: { value: 0 }
    }));
  }

  function getPrivateValue(obj, field) {
    'use strict';
    if (!pvt.has(obj)) throw new ReferenceError("Closure not found");
    let p = pvt.get(obj);
    return p[field];
  }

  function setPrivateValue(obj, field, value) {
    'use strict';
    if (!pvt.has(obj)) throw new ReferenceError("Closure not found");
    let p = pvt.get(obj);
    p[field] = value;
  }
  
  class X {
    constructor(a, f) {
      pvt.set(this, privateInit.call(this));
      setPrivateValue(this, "a", a);
      this.f = f;
    }
  
    copy(other) {
      setPrivateValue(this, "a", getPrivateValue(other, "a"));
      f = other.f;
    }
  
    print() {
      console.log(`this.constructor::b = ${getPrivateValue(this.constructor, 'b')}`);
      getPrivateValue(this.constructor, "printStatic")();

      for (let key in ['a', 'c', 'd', 'e']) {
        console.log(`this::${key} = ${getPrivateValue(this, key)}`);
      }

      for (let key in Object.keys(this)) {
        console.log(`this.${key} = ${this[key]}`);
      }
    }

    let static printStatic = () => {
      console.log(`X::b = ${getPrivateValue(this, 'b')}`);
      console.log(`X.g = ${this.g})`);
    }
  }

  X.prototype.f = Math.E;
  pvt.set(X, Object.seal(Object.create(null, {
    b: {
      writable: true,
      value: {}
    }
  })));
  Object.defineProperty(X, "b")

  return X;
})();
```

## Links

- [Implementation Overview](docs/implementation-overview.md)
- [Code examples](https://github.com/rdking/proposal-class-members/tree/master/examples)
- [Definitions & Technical Notes](docs/definitions.md)
- [Assumptions and constraints](docs/assumptions-and-constraints.md)
- [A refactoring example](docs/refactoring.md)
- [Why not fields?](docs/why-not-fields.md)
- [Specification text](https://rdking.github.io/proposal-class-members/)
- [Private Symbols Specification](https://github.com/zenparsing/proposal-private-symbols)