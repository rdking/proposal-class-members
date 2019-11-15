# Implementation Overview

This proposal borrows the concept of closures with 2 major differences:
* they're attached to objects (the instances)
* functions not created in them have access to them (the member functions)
* sibling instances have access to them (via `::`)

These differences allow these "instance closures" to accomodate the requirements of a class. Since anything that can be placed on the instance can also be placed on the class itself, the static equivalent of the "instance closure" (the "class closure") also contains these differences.

This approach has the additional advantage of leaving open the possibility of an "ancestor closure" to facilitate so-called "protected" members. While the name of such members is unfortunate, they are none-the-less a very useful and anticipated feature that must eventually follow any reasonable implementation of full encapsulation. However, this is a subject for a follow-up proposal.

## New products of `class`
Both the constructor, and prototype can have additional properties as result of this proposal:

#### Constructor -
* Every constructor of a class containing `let static` and/or `const static` declarations will carry a "class closure" which is accessible from every lexically declared method in the class, regardless of whether or not the method is static. For methods that are not static, the "class closure" can be accessed via the `::` operator. If shorthand notation (`x` means `this::x`) is supported, then shorthand for bindings in the "class closure" will be superceeded by bindings in the "instance closure" for non-static methods.

#### Instances - 
* Each instance of a class containing `let` and/or `const` declarations (not including their `static` equivalents) will carry an "instance closure" which is accessible from every lexically declared method in the class, regardless of whether or not the method is static. For methods that are static, the "instance closure" can be accessed via the `::` operator. If shorthand notation is supported, then shorthand bindings in the "instance closure" will only be available to the non-static class methods.
* Instances will carry one such "instance closure" for every class constructor used to initialize it, as appropriate.

#### Functions and Closures
* Every class will have an internal class signature. This signature is applied to all lexically defined methods and each class/instance closure. This signature is used to determine which class/instance closures will be attached to a class method at runtime. It is also used as part of the access check when using operator `::`. Only the closures in the signature list of the current function will be used to locate the targeted member.

## Private Data Members

A private data member declaration defines one or more lexical variables that exist in one of the closures on an instance of the `class`. Within a `class` body, private data members are accessed via the `::` operator. Private data members are declared with the `let` keyword.

```js
class Point {
  // Instance-Private property definition
  let x = 0;
  let y;

  constructor(x, y) {
    // Instance-private properties are accessed
    // with the "::" operator
    this::x = x;
    this::y = y;
  }
}
```

Attempting to access a private data member using `::` produces a runtime `ReferenceError` if the class signature of the current execution context does not exist as a property of the instance object that is the left operand. In other words, a reference to a private data member only works when the object has been initialized by the constructor of the class that defines the function making the access.

Private data member definitions may have initializers. The absense of an initializer is equivalent to being initialized with `undefined`. The value of a private data member's initializer is determined at the time an instance is initialized.

## Private Constant Data Members

There are only 2 significant differences between private data members and private constant data members. Private constant data members are declared with the `const` keyword. Also, they must be initialized in their declaration.

## Class-Private Members

The static equivalent of a private data member is a class-private data member. Class-private data members are defined by placing the `static` keyword as the 2<sup>nd</sup> term of the definition.

```js
class A {
  let static field1 = Symbol('field1');
  const static field2 = 0;
  ...
}
```

Class-private data members are placed in a class-closure on the constructor function. Such members can be accessed via the `::` operator with the constructor function itself as the target object. Initializers for class-private data members are resolved during class evaluation.

## Private Member Functions

No direct syntax support will be available for creating private member functions. However, since a private data member can hold anything, using a function expression as an initializer creates a private member function. If the function expression is an arrow function, it is automatically bound to the context object of the instance-closure. Otherwise, the function will operate in accordance with the existing rules for all nested functions declared using the function keyword. Such functions, as lexical members, also receive appropriate class signatures.

## Public Data Members

A public data member is declared in almost the same fashion as a private data member, but with either `prop`, or `prop static` as the prefix. Public data members declared with `prop` are placed on the prototype, while those declared with `prop static` are placed on the constructor. If shortcut notation is allowed, public function and data members also become bindings within the closures.

```js
class A {
  prop prop3 = 42;          //Lives on the prototype
  prop static prop4;        //Lives on the constructor
  
  foo() { console.log(`prop3 = ${prop3}`); }
}
```

Members defined with `prop` are initialized twice:
* once during the evaluation of the `class` definition, and
* once during class instantiation while those defined with `inst` are initialized,

while those defined with `prop static` are only initialized during class evaluation. This double initialization of public data members ensures that the prototype remains the primary definition of what is publicly part of the object, while allowing each instance to maintain a unique copy of any objects that may exist on the prototype. 

## `class` Products

Beyond the constructor and the prototype, the `class` keyword will, depending on the definition, produce up to 3 more products.
* If the class contains no private data member definitions, no additional products will be produced.
* If private data members exist, `class` will produce at minimum a class signature applied to all functions of the class, including the constructor.
* If there are any class-private data members, the `class` keyword will also produce a class-closure on the constructor.
* If there are any private data members that are not class-private:
    * The `class` keyword will produce a private initializer function.
    * The private initializer function will produce a instance-closure on all instances.

Upon instantiation of the `class`, immediately following the return of the new instance from the base class, the private initializer will be executed.

When a function that accesses a private member of the context object is called, a map of accessible closures is created by matching the signatures of the context's closures to the signature list of the function. A similar map is generated for each object used as the target of operator `::` on first access. All member bindings are accessed via these maps. These maps guarantee that no access to private members can be performed from an inappropriate execution context, or using an inappropriate context object. This is _brand-checking_ as defined by this proposal.

## Additional Notes

It is an early error if left hand argument (LHA) of a `::` operator is not an object with private members.

It is an early error if the class signature of the current execution context is not a property of the LHA of the `::` operator.

It is an early error if duplicate member names are defined within a single class definition and the names do not reference a get/set accessor pair.

Reflection is not externally supported for any private member. It is not a goal of this proposal to support internal reflection, but it is likewise not precluded.

Private member names do not shadow public member names.
