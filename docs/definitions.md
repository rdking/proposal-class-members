# Defintions and Technical Notes

## Brand Checking
- A brand check is the process by which a function verifies that it has the right to access the private container of an instance object.
- A brand check cannot verify that the target object was constructed by the associated constructor, only that it was initialized by the constructor. 

## Class Signatures

- A closure signature is a unique internal value generated whenever an instance closure definition or a class closure is generated.
- The closure signature is attached to every function and accessor declaration lexically scoped in the class definition. 
- The closure signature of the instance closure definition is attached to every instance closure created by instantiating the class.
- The closure signature is used to quickly check if a given function has access to a particular instance or class closure.

## Class Members

- A class member is an element of the set of all declarations lexically scoped witin a class definition.
- All class members become part of one of the products of a class definition: constructor, prototype, instance closures.

## Operator `::`

- Operator `::` is a "scope access operator" whose sole purpose is to provide access to the instance or class closure of an object from within a function sharing the same closure signature.
- Since operator `::` does not access a property of the instance, ECMAScript Proxies cannot trap this operation.

## Instance & Class Closures

- Instance & class closures are execution scopes containing the non-property declarations in a class definition.
- Instance closures contain non-static members and are attached to their target object immediately prior to the instance object becomming available as the context object of the constructor function.
- Class closures contain static members and are attached to the constructor during the evaluation of the class definition.
- Both instance and class closures are only generated if the set of members to include is not empty.
- Instance & class closures are added to the execution scope chain of member functions just before that function's own local scope.
- The instance or class closure added to a called member function is provided by the target instance.
- If the instance or class closure and the called member function do not share the same closure signature, the closure is not added to the scope chain.
- A Proxy is incapable of having an instance or class closure of its own. All operations against a Proxy involving instance or class closure access are immediately forwarded to the Proxy target. 

## Private Initializers

- Private initializers are internal functions used to construct and populate instance closures  when `new` is used on a constructor posessing one.
- Private initializers are created during the evaluation of a class definition and attached to the class prototype.
- Private initializers are only generated if the set of instance and private data members is not empty.

## Private Data Members

- Private data members provide per-instance state that is only accessible to code that is defined within the body of a class definition.
- Private data members are not accessible via prototype lookup. They generally<sup>1</sup> may not be dynamically added after their construction is completed. They may not be deleted.
- Private data members are declared via a distinct class body element (a `let` definition), and accessed via either a lexically scoped name to align them more closely with the concept of closure variables.
- Private data members can also be accessed via a distinct access operator (`::`) in order to ensure they are properly distanced from public object properties.
- Private data members can have initializers. The value of an initializer is determined at the time of execution of the private initializer function. As such, all initializations are instance specific.
- Private data members can hold functions. If the function is an arrow function, the function will be bound to the instance object that the instance closure is attached.
- Private data members are not visible to any existing reflection mechanisms.
- Private data member access cannot be trapped by ECMAScript Proxies.
- `let` is repurposed to declare instance variables because its semantic conceptually limits the declaration to within the outermost `{}` of the class definition.
- The `let` declarations of a class definition not followed by `static`, as well as the `inst` declarations collectively and statically defined the body of the private initializer function introduced by that class definition.
- Immediately before the execution of a member function, the function is checked for the presence of a class-signature. If found, the context object is checked for the presence of a property with that name. If there is no context object, an error is thrown. If the property is found not, an error is thrown. Otherwise, the corresponding object is used as a `with` context. If no signature is found on the function, execution continues as normal.
- When code attempts to access a private data member of an object other than `this` via operator `::`, the object is checked for a property matching the class signature of the current execution context. An error is thrown if the property is not found. Otherwise, a normal property lookup occurs between the object in the found property and the righ-hand side parameter.
- A subclass that declares private data members adds an additional instance-closure to the object returned from its `super` constructor call. The member functions of a class can only access the instance-closure its private initializer added.

## Private Constant Data Members

- Private constant data members are declared via a distinct class body element (a `const` definition).
- Private constant data members must have an initializer as their values cannot be changed by any code.
- Beyond the first 2 points, everything that applies to a private data member, also applies to a private constant data member.

## Class-Private Constant and Non-constant Data Members

- Class-private data members are declared via the `static` keyword placed immediately after the `let` or `const` token.
- Class-private data members are added to the class-closure of the constructor during `class` evaluation.
- If there are no class-private data members, there will be no class-closure.
- The initializer of a class-private data member is resolved at the time of `class` evaluation.
- Beyond the first 4 points, everything that applies to private data members and private constant data members also applies to their class-private equivalents.

## Public Data Members

- Public data members are declared via a distinct class body element (a `prop` definition). This is to prevent ASI issues due to combinations of destructuring assignment and calculated property names.
- Public data members are properties of the prototype.
- Public data members may not be initialized with a function expression in the class definition.
- The names of all non-Symbol public data members will be available in the lexical scope of all non-static member functions. This includes the names of inherited public data members.
- The initializer of a public data member is resolved at the time of `class` evaluation.

## Public Instance Data Members

- Public instance data members are declared via a distinct class body element (an `inst` definition). This is to prevent ASI hazard issues as with `prop` as well as to make clear the destination of this property.
- Public instance data members are added to the private initializer body and applied to instance object on `class` instantiation.
- Public instance data members initialized using operator `=` will use a `this.prop = val` assignment in the private initializer.
- Public instance data members initialized using operator `:=` will use `Object.defineProperty` on the instance object in the private initializer.
- Public instance data members must be initialized within the class definition.
- The initializer of a public instance data member is resolved during the execution of the private initializer.

## Class-Public Data Members

- Class-public data members are declared via a distinct class body element (a `static` definition).
- Class-public data members are properties of the constructor
- The names of all class-public data members will be available in the lexical scope of all static member functions.
- Beyond these 3 points, all that applies to public data members also applies to class-public data members.


<sup>1</sup>Kevin's apparatus is a way to use class definitions to add an instance-closure to an already constructed object:

```js
function IdentityConstructor(o) {
  // new IdentifyConstructor(o) just returns o
  return function () {
    return o;
  }
}

let addSlot = x => new class extends IdentityConstructor(x) {
  let slot;
  constructor() {
    super();
    return {
       get slot() { return x::slot },
       set slot(v) { x::slot = v }
    };
  }
}
```
