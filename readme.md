# Stax

### Declarative Widgets for Scriptable

Stax is a (very thin) abstraction over Scriptable's built-in widget API. It aims to provide a more declarative API, and allows you to create reusable components.

## Example

### Here's a simple widget written with the raw Scriptable API:

(assume `font`, `mainImage`, etc, are defined above)

```js
const widget = new ListWidget();

const mainStack = widget.addStack();
mainStack.layoutVertically();
mainStack.spacing = 2;

const titleStack = mainStack.addStack();
titleStack.layoutHorizontally();
titleStack.addSpacer();
const text = titleStack.addText("A Really Cool Widget!");
titleStack.addSpacer();
line.font = font;
line.textColor = fontColor;
line.centerAlignText();

const imageStack = mainStack.addStack();
imageStack.layoutVertically();
const image = imageStack.addImage(mainImage);
image.centerAlignImage();

Script.setWidget(widget);
Script.complete();
```

### Here's the same widget written with Stax:

```js
const { Widget, HorizontalStack, VerticalStack, Spacer, Text, Picture } = importModule("Stax");

const title = HorizontalStack({}, [
    Spacer(),
    Text("A Really Cool Widget!", { font: font, color: fontColor, align: "center" }),
    Spacer(),
]);

const content = VerticalStack({}, [Picture(mainImage, { align: "center" })]);

const widget = new Widget({ spacing: 2 }, [VerticalStack({}, [title, content])]);

widget.render();
Script.complete();
```

## Installation

Add `Stax.js` to your Scriptable library, and then just import what you need:

```js
const { Widget, HorizontalStack, Picture } = importModule("Stax");
```

If you store your Scriptable scripts in iCloud, you can clone this repo and run `./install.sh`, which will try to copy `Stax.js` to the Scriptable folder in your iCloud drive. You might need to edit `install.sh` if your Scriptable directory is different from mine.

## API

Stax exposes a number of constructors for various types of Widget elements.

In general, the arguments for containers (Stacks, Widgets) are `(params, children)`, while for content elements (Text, Picture, etc) it's `(content, params)`. Generally, all keys in `params` are optional, unless otherwise specified.

### Components:

-   `Widget({ bgType: 'gradient', bgGradient: new LinearGradient(), spacing: 2 }, [...children])`
    -   Currently only gradient backgrounds are supported. If `bgType` is `"gradient"`, `bgGradient` must be present and must be a Scriptable `LinearGradient` object. `Widget.render()` will render the entire content tree, and call `Script.setWidget` with itself as an argument.
-   `Stack({ layout: "horizontal" | "vertical", align: "top" | "center" | "bottom", spacing: 2 }, [...children])`
    -   Creates a Scriptable `Stack` object.
-   `HorizontalStack({ align: "top" | "center" | "bottom", spacing: 2 }, [...children])`
    -   This is just shorthand for `Stack({ layout: "horizontal", ...params }, [...children]`, to make layouts a little easier to read.
-   `VerticalStack({ align: "top" | "center" | "bottom", spacing: 2 }, [...children])`
    -   This is just shorthand for `Stack({ layout: "vertical", ...params }, [...children]`, to make layouts a little easier to read.
-   `Spacer({ size: 2 | null })`
    -   Creates a `Spacer` object. `{ size: null }` will let the Spacer flex to fill the available space; you can also pass a number to set an absolute value. `Spacer()` is shorthand for `Spacer({size: null})`.
-   `Text(content, { font: new Font(), color: new Color(), align: "left" | "center" | "right" })`
    -   Creates a line of text with `content`. If present, `font` must be a Scriptable `Font` object. Likewise, if present, `color` must be a Scriptable `Color` object.
-   `Picture(content, { align: "left" | "center" | "right", mode: "fit" | "fill" })`
    -   Creates a picture with `content`.

### Component Class

Stax exposes a single class, `Component` that can be used to create your own reusable components, like so:

```js
class Title extends Component {
    constructor(content, params) {
        super(content, params);
    }

    build() {
        const { font } = this.params;

        return HorizontalStack({}, [Spacer({ size: 5 }), Text(this.content, { font })]);
    }
}

const title = new Title("This is a title", { font: new Font() });
```

Another way to build reusable components is just by creating simple functions:

```js
const Title = (content, params) => HorizontalStack({}, [
    Spacer({ size: 5 }),
    Text(content, { params.font })
]);

const title = new Title("This is a title", { font: new Font() });
```

Both methods are more or less equal to each other; it mostly comes down to a stylistic choice.

### wrapComponent

Stax also exposes a single utility function, `wrapComponent` which can be used to allow you to omit the `new` keyword on custom components:

```js
const Title = wrapComponent(
    class TitleComponent extends Component {
        constructor(content, params) {
            super(params);
        }

        render() {
            const { font } = this.params;

            return HorizontalStack({}, [Spacer({ size: 5 }), Text(this.content, { font })]);
        }
    }
);

const title = Title("This is a title", { font: new Font() });
```

## Under the Hood

The code is pretty simple, 90% of the magic happens at the top of the file in the `UIElement` class, which everything else extends.
`UIElement` has the following properties and methods:

-   `content` - Whatever the component will be rendering - text, a picture - nothing in the case of `Stack` components.
-   `children` - Any other components this component contains. Only used by `Stack` components and `Widget`s.
-   `parent` - The parent Component - every component except the top-level `Widget` needs this.
-   `config` - An object storing whatever is passed in the `params` argument.
-   `element` - A reference to the underlying Scriptable UI object. `null` until `createElement()` is called.
-   `createElement()` - This is the most important piece. This method calls the Scriptable API method on `this.parent` and returns the result. For example, `return this.parent.addStack();`.
-   `render()` - Calls `createElement()`, sets `this.element` to the result, calls `render()` on each of the components children, and then calls `this.configure()`.
-   `configure()` - Sets up any configuration on the underlying UI object. For example, `this.element.font = this.config.font;`
-   `addContent(...children)` - Given a list of other components, this adds those components to `this.children` and (importantly) sets `this.parent` on each of them.

Everything else in Stax is built on top of this, in some cases extremely simply:

```js
class Spacer extends UIElement {
    createElement() {
        return this.parent.element.addSpacer(this.config.size);
    }
}
```

This means that the whole UI is represented by a tree of `UIElement` objects related via their `parent` and `children` properties. The actual underlying Scriptable objects are purely theoretical, until `Widget.render()` is called - which then creates the Scriptable `ListWidget` object, and continues down the tree calling `render()` on each child, adding the Scriptable objects to their parents.
For example:

```js
const widget = new Widget({}, [HorizontalStack({}, [Text("Widget!", {})])]);

// Nothing exists at this point except three UIElements - a Widget, a HorizontalStack and a Text.
// The Text's `parent` is the HorizontalStack, and the HorizontalStack's `parent` is the Widget.

widget.render();
// Widget.render() runs `this.element = new ListWidget()`, and then calls HorizontalStack.render()
//      HorizontalStack.render() runs `this.element = this.parent.addStack()`, and then calls Text.render()
//          Text.render() runs `this.element = this.parent.addText(this.content), and then calls this.configure() (which does nothing here, since we haven't passed any configuration properties to the Text component).
//      HorizontalStack.configure() is called, which runs `this.element.layoutHorizontally()`
// Widget.configure() is called, which runs `Script.setWidget(this.element)`
```

The `Component` class adds another method, `build()`. This should be overridden by custom components that extend `Component`. It should return a single `UIElement` class (eg. `Stack`, `Text`, etc). The return value of `build()` is passed to the custom component's `createElement()` method, which handles creating the underlying UI elements and attaching them to their parents, etc.

Supporting new components is very easy - just create a new class that extends `UIElement` and give it the corrent `createElement` method.
Supporting new configurations is also pretty straightforward - just add the relevant Scriptable code to the `configure` method:

```js
class Text extends UIElement {
    configure() {
        const { opacity } = this.config;
        this.element.textOpacity = opacity;
    }

    createElement() {
        return this.parent.element.addText(this.content);
    }
}
```

## Notes

One nice thing about the thinness of Stax is that it's not hard to reach in to the Scriptable API if you need to for some reason. All Stax components have an `element` property that references the underlying Scriptable object:

```js
const title = Text("This is a title", {});
title.createElement(); // Note that you must call this method first; usually the underlying objects are not created until the final call to `render()` on the Widget.
title.element.textOpacity = 0.5;
```

This is mostly useful for access properties that haven't been implemented by Stax yet, like above.

That's it! The library is under "active" development, in that I add features as I encounter a need for them 😅 - so as you'll notice, there is plenty of the built in widget API that is not implemented yet. (This project was originally started at around 2am while I was working on a custom widget and was wishing there was a cleaner way to lay them out).

Feel free to add stuff and submit PRs!
